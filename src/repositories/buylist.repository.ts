import { BuyListItem, BuyListPriority, BuyListStatus, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { playableKey, supertypeFromDisplay, supertypeToDisplay } from '../utils/playableKey';
import { catalogRepository } from './catalog.repository';
import { notFound, AppError } from '../utils/errors';
import {
  AddBuyListInput,
  BuyListQueryInput,
  UpdateBuyListInput,
} from '../schemas';

const priorityOrder: Record<BuyListPriority, number> = {
  high: 3,
  normal: 2,
  low: 1,
};

function sortByPriority(items: BuyListItem[]): BuyListItem[] {
  return [...items].sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.addedAt.getTime() - a.addedAt.getTime();
  });
}

async function findPendingDuplicate(
  playableCardKey: string,
  sourceDeckId: string | null | undefined,
  sourceDecklistId: string | null | undefined
): Promise<BuyListItem | null> {
  return prisma.buyListItem.findFirst({
    where: {
      playableCardKey,
      status: BuyListStatus.pending,
      sourceDeckId: sourceDeckId ?? null,
      sourceDecklistId: sourceDecklistId ?? null,
    },
  });
}

export const buylistRepository = {
  async findFiltered(filters: BuyListQueryInput): Promise<BuyListItem[]> {
    const items = await prisma.buyListItem.findMany({
      where: {
        ...(filters.status && { status: filters.status }),
        ...(filters.sourceDeckId && { sourceDeckId: filters.sourceDeckId }),
        ...(filters.sourceDecklistId && { sourceDecklistId: filters.sourceDecklistId }),
        ...(filters.priority && { priority: filters.priority }),
      },
    });

    return sortByPriority(items);
  },

  findById(id: string) {
    return prisma.buyListItem.findUnique({ where: { id } });
  },

  async add(input: AddBuyListInput): Promise<BuyListItem> {
    const key = playableKey(input.cardName, input.supertype);

    await catalogRepository.upsertFromApiOrMinimal({
      id: input.catalogCardId,
      name: input.cardName,
      supertype: input.supertype,
    });

    const existing = await findPendingDuplicate(key, input.sourceDeckId, input.sourceDecklistId);

    if (existing) {
      const priority =
        input.priority !== undefined ? input.priority : existing.priority;

      return prisma.buyListItem.update({
        where: { id: existing.id },
        data: {
          desiredQuantity: existing.desiredQuantity + input.quantity,
          priority,
          ...(input.notes !== undefined && { notes: input.notes }),
        },
      });
    }

    return prisma.buyListItem.create({
      data: {
        catalogCardId: input.catalogCardId,
        cardName: input.cardName.trim(),
        supertype: supertypeFromDisplay(input.supertype),
        playableCardKey: key,
        desiredQuantity: input.quantity,
        acquiredQuantity: 0,
        priority: input.priority ?? BuyListPriority.normal,
        status: BuyListStatus.pending,
        sourceDeckId: input.sourceDeckId ?? null,
        sourceDecklistId: input.sourceDecklistId ?? null,
        notes: input.notes ?? null,
      },
    });
  },

  async update(id: string, input: UpdateBuyListInput): Promise<BuyListItem> {
    const existing = await this.findById(id);
    if (!existing) throw notFound('BuyListItem', id);

    const desiredQuantity = input.desiredQuantity ?? existing.desiredQuantity;

    let acquiredQuantity = input.acquiredQuantity ?? existing.acquiredQuantity;
    if (input.status === BuyListStatus.purchased && input.acquiredQuantity === undefined) {
      acquiredQuantity = desiredQuantity;
    }

    return prisma.buyListItem.update({
      where: { id },
      data: {
        ...(input.desiredQuantity !== undefined && { desiredQuantity: input.desiredQuantity }),
        acquiredQuantity,
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
    });
  },

  async updateStatus(id: string, status: BuyListStatus): Promise<BuyListItem> {
    const existing = await this.findById(id);
    if (!existing) throw notFound('BuyListItem', id);

    return prisma.buyListItem.update({
      where: { id },
      data: {
        status,
        ...(status === BuyListStatus.purchased && {
          acquiredQuantity: existing.desiredQuantity,
        }),
      },
    });
  },

  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) throw notFound('BuyListItem', id);
    await prisma.buyListItem.delete({ where: { id } });
  },

  async clearPurchased(): Promise<number> {
    const result = await prisma.buyListItem.deleteMany({
      where: { status: BuyListStatus.purchased },
    });
    return result.count;
  },

  async countAvailableByPlayableKey(playableCardKey: string): Promise<number> {
    return prisma.physicalCardCopy.count({
      where: {
        status: 'available',
        inventoryItem: { playableCardKey },
      },
    });
  },

  async addMissingFromDeck(deckId: string): Promise<{ added: number; items: BuyListItem[] }> {
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        decklist: { include: { cards: { include: { catalogCard: true } } } },
        assignments: true,
      },
    });

    if (!deck) throw notFound('Deck', deckId);

    let added = 0;
    const items: BuyListItem[] = [];

    for (const card of deck.decklist.cards) {
      const assigned = deck.assignments.filter((a) => a.decklistCardId === card.id).length;
      const stillNeeded = card.quantity - assigned;
      if (stillNeeded <= 0) continue;

      const available = await this.countAvailableByPlayableKey(card.playableCardKey);
      const missing = stillNeeded - available;

      if (missing <= 0) continue;

      const item = await this.add({
        catalogCardId: card.catalogCardId,
        cardName: card.catalogCard.name,
        supertype: supertypeToDisplay(card.catalogCard.supertype) as 'Pokémon' | 'Trainer' | 'Energy',
        quantity: missing,
        sourceDeckId: deckId,
      });

      added += missing;
      items.push(item);
    }

    return { added, items };
  },

  async addMissingFromDecklist(decklistId: string): Promise<{ added: number; items: BuyListItem[] }> {
    const decklist = await prisma.decklist.findUnique({
      where: { id: decklistId },
      include: { cards: { include: { catalogCard: true } } },
    });

    if (!decklist) throw notFound('Decklist', decklistId);

    let added = 0;
    const items: BuyListItem[] = [];

    for (const card of decklist.cards) {
      const available = await this.countAvailableByPlayableKey(card.playableCardKey);
      const missing = card.quantity - available;

      if (missing <= 0) continue;

      const item = await this.add({
        catalogCardId: card.catalogCardId,
        cardName: card.catalogCard.name,
        supertype: supertypeToDisplay(card.catalogCard.supertype) as 'Pokémon' | 'Trainer' | 'Energy',
        quantity: missing,
        sourceDecklistId: decklistId,
      });

      added += missing;
      items.push(item);
    }

    return { added, items };
  },

  detachFromDeck(deckId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.buyListItem.updateMany({
      where: { sourceDeckId: deckId },
      data: { sourceDeckId: null },
    });
  },
};
