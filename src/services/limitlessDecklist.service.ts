import { catalogRepository } from '../repositories/catalog.repository';
import {
  fetchPokemonCardById,
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
import { CardCatalogItemDto, LimitlessImportResult, LimitlessImportSlot } from '../types';
import { logWarn } from '../utils/logger';

async function saveCatalogDto(dto: CardCatalogItemDto) {
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

async function resolveCatalogCard(
  line: ParsedLimitlessLine
): Promise<{ catalogCard: CardCatalogItemDto | null; catalogCardId: string; resolved: boolean }> {
  const primaryId = line.catalogCardId;

  try {
    const local = await catalogRepository.findById(primaryId);
    if (local) {
      return { catalogCard: mapCatalogCard(local), catalogCardId: local.id, resolved: true };
    }

    const byId = await fetchPokemonCardById(primaryId);
    if (byId) {
      const saved = await saveCatalogDto(byId);
      return { catalogCard: saved, catalogCardId: saved.id, resolved: true };
    }

    const bySearch = await searchPokemonCardBySetAndNumber(
      line.setCode,
      line.number,
      line.name
    );
    if (bySearch) {
      const saved = await saveCatalogDto(bySearch);
      return { catalogCard: saved, catalogCardId: saved.id, resolved: true };
    }
  } catch (error) {
    logWarn('Failed to resolve Limitless TCG card', {
      line: line.raw,
      error: error instanceof Error ? error.message : error,
    });
  }

  await catalogRepository.upsertFromApiOrMinimal({
    id: primaryId,
    name: line.name,
    supertype: line.supertype,
    setId: line.setCode.toLowerCase(),
    setName: line.setCode,
    number: line.number,
  });

  const fallback = await catalogRepository.findById(primaryId);
  return {
    catalogCard: fallback ? mapCatalogCard(fallback) : null,
    catalogCardId: primaryId,
    resolved: false,
  };
}

export const limitlessDecklistService = {
  async import(decklist: string): Promise<LimitlessImportResult> {
    const parsed = parseLimitlessDecklist(decklist);
    const mergedLines = mergeLimitlessLinesByCatalog(parsed.lines);

    const slots: LimitlessImportSlot[] = [];
    let unresolved = 0;

    for (const line of mergedLines) {
      const { catalogCard, catalogCardId, resolved } = await resolveCatalogCard(line);
      if (!resolved) unresolved++;

      const cardName = catalogCard?.name ?? line.name;
      const supertype = catalogCard?.supertype ?? line.supertype;

      slots.push({
        raw: line.raw,
        quantity: line.quantity,
        name: cardName,
        supertype,
        setCode: line.setCode,
        number: line.number,
        catalogCardId,
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
};
