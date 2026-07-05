import { catalogRepository } from '../repositories/catalog.repository';
import {
  fetchPokemonCardsByIds,
  searchPokemonCardBySetAndNumber,
  normalizePokemonCard,
} from '../utils/pokemonTcgApi';
import { playableKey } from '../utils/playableKey';
import { mapCatalogCard } from '../utils/mappers';
import {
  parseLimitlessDecklist,
  mergeLimitlessLinesByCatalog,
  ParsedLimitlessLine,
} from '../utils/limitlessDecklistParser';
import { decklistRepository } from '../repositories/decklist.repository';
import { CreateDecklistInput } from '../schemas';
import { CardCatalogItemDto, LimitlessImportResult, LimitlessImportSlot } from '../types';
import { logWarn } from '../utils/logger';
import { mapWithConcurrency } from '../utils/async';

const API_SAVE_CONCURRENCY = 8;
const SEARCH_FALLBACK_CONCURRENCY = 4;

async function saveCatalogDto(dto: CardCatalogItemDto): Promise<CardCatalogItemDto> {
  const saved = await catalogRepository.saveFromApi(
    normalizePokemonCard({
      id: dto.id,
      name: dto.name,
      supertype: dto.supertype,
      subtypes: dto.subtypes,
      types: dto.types,
      set: { id: dto.setId, name: dto.setName },
      number: dto.number,
      rarity: dto.rarity,
      images: { small: dto.imageUrl, large: dto.imageUrlLarge ?? undefined },
      regulationMark: dto.regulationMark ?? undefined,
      legalities: dto.legalities ?? undefined,
      rules: dto.rules,
    })
  );
  return mapCatalogCard(saved);
}

async function resolveCardsBatch(lines: ParsedLimitlessLine[]): Promise<{
  cardsByLineId: Map<string, CardCatalogItemDto>;
  resolvedLineIds: Set<string>;
}> {
  const cardsByLineId = new Map<string, CardCatalogItemDto>();
  const resolvedLineIds = new Set<string>();
  const catalogIds = lines.map((line) => line.catalogCardId);

  const localCards = await catalogRepository.findByIds(catalogIds);
  for (const card of localCards) {
    const dto = mapCatalogCard(card);
    cardsByLineId.set(card.id, dto);
    resolvedLineIds.add(card.id);
  }

  const missingIds = catalogIds.filter((id) => !cardsByLineId.has(id));
  if (missingIds.length > 0) {
    try {
      const apiCards = await fetchPokemonCardsByIds(missingIds);
      const saved = await mapWithConcurrency(
        [...apiCards.values()],
        API_SAVE_CONCURRENCY,
        (dto) => saveCatalogDto(dto)
      );
      for (const dto of saved) {
        cardsByLineId.set(dto.id, dto);
        resolvedLineIds.add(dto.id);
      }
    } catch (error) {
      logWarn('Batch Pokemon TCG API lookup failed, falling back to per-card search', {
        count: missingIds.length,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  const unresolvedLines = lines.filter((line) => !cardsByLineId.has(line.catalogCardId));

  await mapWithConcurrency(unresolvedLines, SEARCH_FALLBACK_CONCURRENCY, async (line) => {
    try {
      const bySearch = await searchPokemonCardBySetAndNumber(
        line.setCode,
        line.number,
        line.name
      );
      if (!bySearch) return;

      const saved = await saveCatalogDto(bySearch);
      cardsByLineId.set(line.catalogCardId, saved);
      resolvedLineIds.add(line.catalogCardId);
      if (saved.id !== line.catalogCardId) {
        cardsByLineId.set(saved.id, saved);
        resolvedLineIds.add(saved.id);
      }
    } catch (error) {
      logWarn('Failed to resolve Limitless TCG card via search fallback', {
        line: line.raw,
        error: error instanceof Error ? error.message : error,
      });
    }
  });

  return { cardsByLineId, resolvedLineIds };
}

export const limitlessDecklistService = {
  async import(decklist: string): Promise<LimitlessImportResult> {
    const parsed = parseLimitlessDecklist(decklist);
    const mergedLines = mergeLimitlessLinesByCatalog(parsed.lines);
    const { cardsByLineId, resolvedLineIds } = await resolveCardsBatch(mergedLines);

    const slots: LimitlessImportSlot[] = [];
    let unresolved = 0;

    for (const line of mergedLines) {
      let catalogCard = cardsByLineId.get(line.catalogCardId) ?? null;
      let resolved = resolvedLineIds.has(line.catalogCardId);

      if (!catalogCard) {
        const minimal = await catalogRepository.createMinimal({
          id: line.catalogCardId,
          name: line.name,
          supertype: line.supertype,
          setId: line.setCode.toLowerCase(),
          setName: line.setCode,
          number: line.number,
        });
        catalogCard = mapCatalogCard(minimal);
        resolved = false;
        unresolved++;
      } else if (!resolved) {
        unresolved++;
      }

      const cardName = catalogCard.name;
      const supertype = catalogCard.supertype;

      slots.push({
        raw: line.raw,
        quantity: line.quantity,
        name: cardName,
        supertype,
        setCode: line.setCode,
        number: line.number,
        catalogCardId: catalogCard.id,
        playableCardKey: playableKey(cardName, supertype),
        catalogCard,
        resolved,
      });
    }

    const decklistText = slots.map((slot) => `${slot.quantity} ${slot.name}`).join('\n');

    return {
      total: parsed.total,
      sectionCounts: parsed.sectionCounts,
      parseErrors: parsed.parseErrors,
      unresolved,
      decklist: decklistText,
      slots,
    };
  },

  saveAsDecklist(slots: LimitlessImportSlot[], input: CreateDecklistInput) {
    return decklistRepository.createFromSlots(
      input,
      slots.map((s) => ({
        catalogCardId: s.catalogCardId,
        cardName: s.name,
        supertype: s.supertype,
        quantity: s.quantity,
      }))
    );
  },
};
