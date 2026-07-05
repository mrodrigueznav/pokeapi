import prisma from '../utils/prisma';
import { CardCatalogItem, Prisma } from '@prisma/client';
import { normalizePokemonCard } from '../utils/pokemonTcgApi';
import { supertypeFromDisplay } from '../utils/playableKey';
import { fetchPokemonCardById } from '../utils/pokemonTcgApi';
import { logWarn } from '../utils/logger';

export const catalogRepository = {
  async findById(id: string): Promise<CardCatalogItem | null> {
    return prisma.cardCatalogItem.findUnique({ where: { id } });
  },

  async findByName(name: string): Promise<CardCatalogItem[]> {
    return prisma.cardCatalogItem.findMany({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
  },

  async findByPlayableKey(playableCardKey: string): Promise<CardCatalogItem | null> {
    const items = await prisma.inventoryItem.findMany({
      where: { playableCardKey },
      include: { catalogCard: true },
      take: 1,
    });
    if (items.length > 0) return items[0].catalogCard;

    const deckCards = await prisma.deckCard.findMany({
      where: { playableCardKey },
      include: { catalogCard: true },
      take: 1,
    });
    if (deckCards.length > 0) return deckCards[0].catalogCard;

    return null;
  },

  async upsertFromApiOrMinimal(data: {
    id: string;
    name: string;
    supertype: string;
    subtypes?: string[];
    types?: string[];
    setId?: string;
    setName?: string;
    number?: string;
    rarity?: string;
    imageUrl?: string;
    imageUrlLarge?: string | null;
    regulationMark?: string | null;
    legalities?: Record<string, string> | null;
    rules?: string[];
  }): Promise<CardCatalogItem> {
    const existing = await prisma.cardCatalogItem.findUnique({ where: { id: data.id } });
    if (existing) return existing;

    let apiCard: Awaited<ReturnType<typeof fetchPokemonCardById>> = null;
    try {
      apiCard = await fetchPokemonCardById(data.id);
    } catch (error) {
      logWarn('Pokemon TCG API lookup failed, falling back to minimal catalog entry', {
        catalogCardId: data.id,
        error: error instanceof Error ? error.message : error,
      });
    }

    if (apiCard) {
      const normalized = normalizePokemonCard({
        id: apiCard.id,
        name: apiCard.name,
        supertype: apiCard.supertype,
        subtypes: apiCard.subtypes,
        types: apiCard.types,
        set: { id: apiCard.setId, name: apiCard.setName },
        number: apiCard.number,
        rarity: apiCard.rarity,
        images: { small: apiCard.imageUrl, large: apiCard.imageUrlLarge ?? undefined },
        regulationMark: apiCard.regulationMark ?? undefined,
        legalities: apiCard.legalities ?? undefined,
        rules: apiCard.rules,
      });

      return prisma.cardCatalogItem.create({
        data: {
          ...normalized,
          legalities: normalized.legalities ?? Prisma.JsonNull,
        },
      });
    }

    return prisma.cardCatalogItem.create({
      data: {
        id: data.id,
        name: data.name,
        supertype: supertypeFromDisplay(data.supertype),
        subtypes: data.subtypes ?? [],
        types: data.types ?? [],
        setId: data.setId ?? 'unknown',
        setName: data.setName ?? 'Unknown Set',
        number: data.number ?? '0',
        rarity: data.rarity ?? 'Unknown',
        imageUrl: data.imageUrl ?? '',
        imageUrlLarge: data.imageUrlLarge ?? null,
        regulationMark: data.regulationMark ?? null,
        legalities: data.legalities ?? Prisma.JsonNull,
        rules: data.rules ?? [],
      },
    });
  },

  async saveFromApi(dto: ReturnType<typeof normalizePokemonCard>): Promise<CardCatalogItem> {
    const data = {
      ...dto,
      legalities: dto.legalities ?? Prisma.JsonNull,
    };
    return prisma.cardCatalogItem.upsert({
      where: { id: dto.id },
      create: data,
      update: data,
    });
  },
};

export const locationRepository = {
  findAll() {
    return prisma.location.findMany({ orderBy: { name: 'asc' } });
  },

  findById(id: string) {
    return prisma.location.findUnique({ where: { id } });
  },

  create(data: { name: string; type: string }) {
    return prisma.location.create({
      data: { name: data.name, type: data.type as never },
    });
  },

  async hasAssociations(id: string): Promise<boolean> {
    const [inventoryCount, copyCount] = await Promise.all([
      prisma.inventoryItem.count({ where: { locationId: id } }),
      prisma.physicalCardCopy.count({ where: { locationId: id } }),
    ]);
    return inventoryCount > 0 || copyCount > 0;
  },

  delete(id: string) {
    return prisma.location.delete({ where: { id } });
  },
};

export const movementRepository = {
  create(data: {
    type: string;
    inventoryItemId?: string | null;
    physicalCopyId?: string | null;
    deckId?: string | null;
    from?: string | null;
    to?: string | null;
    note?: string | null;
  }) {
    return prisma.movement.create({
      data: {
        type: data.type as never,
        inventoryItemId: data.inventoryItemId ?? null,
        physicalCopyId: data.physicalCopyId ?? null,
        deckId: data.deckId ?? null,
        from: data.from ?? null,
        to: data.to ?? null,
        note: data.note ?? null,
      },
    });
  },

  findFiltered(filters: {
    inventoryItemId?: string;
    physicalCopyId?: string;
    deckId?: string;
  }) {
    return prisma.movement.findMany({
      where: {
        ...(filters.inventoryItemId && { inventoryItemId: filters.inventoryItemId }),
        ...(filters.physicalCopyId && { physicalCopyId: filters.physicalCopyId }),
        ...(filters.deckId && { deckId: filters.deckId }),
      },
      orderBy: { at: 'desc' },
    });
  },
};
