import prisma from '../utils/prisma';
import {
  CreateDecklistInput,
  UpdateDecklistInput,
  AddDecklistCardInput,
} from '../schemas';
import { playableKey } from '../utils/playableKey';
import { calculateDecklistStatus } from '../utils/decklistStatus';
import { catalogRepository } from './catalog.repository';
import { notFound, AppError } from '../utils/errors';
import { Prisma } from '@prisma/client';

const decklistInclude = {
  cards: {
    include: { catalogCard: true },
    orderBy: { playableCardKey: 'asc' as const },
  },
} as const;

async function recalculateAndPersistDecklistStatus(decklistId: string) {
  const decklist = await prisma.decklist.findUniqueOrThrow({
    where: { id: decklistId },
    include: decklistInclude,
  });

  const status = calculateDecklistStatus({
    cards: decklist.cards.map((c) => ({ quantity: c.quantity })),
  });

  return prisma.decklist.update({
    where: { id: decklistId },
    data: { status },
    include: decklistInclude,
  });
}

export const decklistRepository = {
  findAll() {
    return prisma.decklist.findMany({
      include: decklistInclude,
      orderBy: { updatedAt: 'desc' },
    });
  },

  findById(id: string) {
    return prisma.decklist.findUnique({
      where: { id },
      include: decklistInclude,
    });
  },

  async findByIdWithRecalculatedStatus(id: string) {
    const decklist = await this.findById(id);
    if (!decklist) return null;
    return recalculateAndPersistDecklistStatus(id);
  },

  create(input: CreateDecklistInput) {
    return prisma.decklist.create({
      data: {
        name: input.name,
        format: input.format,
        status: 'incomplete',
        notes: input.notes ?? null,
      },
      include: decklistInclude,
    });
  },

  async update(id: string, input: UpdateDecklistInput) {
    const existing = await this.findById(id);
    if (!existing) throw notFound('Decklist', id);

    return prisma.decklist.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.format !== undefined && { format: input.format }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      include: decklistInclude,
    });
  },

  async delete(id: string) {
    const existing = await this.findById(id);
    if (!existing) throw notFound('Decklist', id);

    const deckCount = await prisma.deck.count({ where: { decklistId: id } });
    if (deckCount > 0) {
      throw new AppError(
        'DECKLIST_IN_USE',
        'Cannot delete decklist while decks are built from it',
        409
      );
    }

    await prisma.buyListItem.updateMany({
      where: { sourceDecklistId: id },
      data: { sourceDecklistId: null },
    });

    await prisma.decklist.delete({ where: { id } });
  },

  async addCard(decklistId: string, input: AddDecklistCardInput) {
    const decklist = await this.findById(decklistId);
    if (!decklist) throw notFound('Decklist', decklistId);

    const key = playableKey(input.cardName, input.supertype);

    await catalogRepository.upsertFromApiOrMinimal({
      id: input.catalogCardId,
      name: input.cardName,
      supertype: input.supertype,
    });

    const existing = decklist.cards.find((c) => c.playableCardKey === key);

    if (existing) {
      await prisma.decklistCard.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + input.quantity },
      });
    } else {
      await prisma.decklistCard.create({
        data: {
          decklistId,
          playableCardKey: key,
          catalogCardId: input.catalogCardId,
          quantity: input.quantity,
        },
      });
    }

    return recalculateAndPersistDecklistStatus(decklistId);
  },

  async removeCard(decklistId: string, decklistCardId: string) {
    const decklist = await this.findById(decklistId);
    if (!decklist) throw notFound('Decklist', decklistId);

    const card = decklist.cards.find((c) => c.id === decklistCardId);
    if (!card) throw notFound('DecklistCard', decklistCardId);

    const assignmentCount = await prisma.deckCardAssignment.count({
      where: { decklistCardId },
    });

    if (assignmentCount > 0) {
      throw new AppError(
        'DECKLIST_CARD_IN_USE',
        'Cannot remove card from decklist while copies are assigned to decks',
        409
      );
    }

    await prisma.decklistCard.delete({ where: { id: decklistCardId } });
    return recalculateAndPersistDecklistStatus(decklistId);
  },

  async createFromSlots(
    input: CreateDecklistInput,
    slots: Array<{
      catalogCardId: string;
      cardName: string;
      supertype: string;
      quantity: number;
    }>
  ) {
    return prisma.$transaction(async (tx) => {
      const decklist = await tx.decklist.create({
        data: {
          name: input.name,
          format: input.format,
          notes: input.notes ?? null,
          status: 'incomplete',
        },
      });

      for (const slot of slots) {
        const key = playableKey(slot.cardName, slot.supertype);
        await catalogRepository.upsertFromApiOrMinimal({
          id: slot.catalogCardId,
          name: slot.cardName,
          supertype: slot.supertype,
        });

        const existing = await tx.decklistCard.findUnique({
          where: { decklistId_playableCardKey: { decklistId: decklist.id, playableCardKey: key } },
        });

        if (existing) {
          await tx.decklistCard.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + slot.quantity },
          });
        } else {
          await tx.decklistCard.create({
            data: {
              decklistId: decklist.id,
              playableCardKey: key,
              catalogCardId: slot.catalogCardId,
              quantity: slot.quantity,
            },
          });
        }
      }

      const full = await tx.decklist.findUniqueOrThrow({
        where: { id: decklist.id },
        include: decklistInclude,
      });

      const status = calculateDecklistStatus({
        cards: full.cards.map((c) => ({ quantity: c.quantity })),
      });

      return tx.decklist.update({
        where: { id: decklist.id },
        data: { status },
        include: decklistInclude,
      });
    });
  },

  detachFromDecklist(decklistId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? prisma;
    return client.buyListItem.updateMany({
      where: { sourceDecklistId: decklistId },
      data: { sourceDecklistId: null },
    });
  },

  recalculateStatus: recalculateAndPersistDecklistStatus,
};
