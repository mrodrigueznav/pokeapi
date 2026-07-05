import prisma from '../utils/prisma';
import { CreateDeckInput, UpdateDeckInput } from '../schemas';
import { calculateDeckStatus } from '../utils/deckStatus';
import { buylistRepository } from './buylist.repository';
import { decklistRepository } from './decklist.repository';
import { AppError, notFound } from '../utils/errors';

const deckInclude = {
  decklist: {
    include: {
      cards: { include: { catalogCard: true } },
    },
  },
  assignments: true,
} as const;

async function recalculateAndPersistDeckStatus(deckId: string) {
  const deck = await prisma.deck.findUniqueOrThrow({
    where: { id: deckId },
    include: deckInclude,
  });

  const assignmentsByCard = new Map<string, string[]>();
  for (const a of deck.assignments) {
    const list = assignmentsByCard.get(a.decklistCardId) ?? [];
    list.push(a.physicalCopyId);
    assignmentsByCard.set(a.decklistCardId, list);
  }

  const status = calculateDeckStatus({
    cards: deck.decklist.cards.map((c) => ({
      quantity: c.quantity,
      assignedPhysicalCopyIds: assignmentsByCard.get(c.id) ?? [],
    })),
  });

  return prisma.deck.update({
    where: { id: deckId },
    data: { status },
    include: deckInclude,
  });
}

export const deckRepository = {
  findAll() {
    return prisma.deck.findMany({
      include: deckInclude,
      orderBy: { updatedAt: 'desc' },
    });
  },

  async findAllWithRecalculatedStatus() {
    const decks = await this.findAll();
    const updated = [];
    for (const deck of decks) {
      updated.push(await recalculateAndPersistDeckStatus(deck.id));
    }
    return updated;
  },

  findById(id: string) {
    return prisma.deck.findUnique({
      where: { id },
      include: deckInclude,
    });
  },

  async findByIdWithRecalculatedStatus(id: string) {
    const deck = await this.findById(id);
    if (!deck) return null;
    return recalculateAndPersistDeckStatus(id);
  },

  async create(input: CreateDeckInput) {
    const decklist = await decklistRepository.findById(input.decklistId);
    if (!decklist) throw notFound('Decklist', input.decklistId);

    return prisma.deck.create({
      data: {
        name: input.name ?? decklist.name,
        decklistId: input.decklistId,
        status: 'incomplete',
        notes: input.notes ?? null,
      },
      include: deckInclude,
    });
  },

  async update(id: string, input: UpdateDeckInput) {
    const existing = await this.findById(id);
    if (!existing) throw notFound('Deck', id);

    return prisma.deck.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      include: deckInclude,
    });
  },

  async delete(id: string) {
    const deck = await this.findById(id);
    if (!deck) throw notFound('Deck', id);

    return prisma.$transaction(async (tx) => {
      for (const assignment of deck.assignments) {
        await tx.physicalCardCopy.update({
          where: { id: assignment.physicalCopyId },
          data: { status: 'available', assignedDeckId: null },
        });

        await tx.movement.create({
          data: {
            type: 'unassigned',
            physicalCopyId: assignment.physicalCopyId,
            deckId: id,
            note: 'Deck deleted — copy released',
          },
        });
      }

      await buylistRepository.detachFromDeck(id, tx);
      await tx.deck.delete({ where: { id } });
    });
  },

  async assignCard(deckId: string, decklistCardId: string, physicalCopyId: string) {
    const deck = await this.findById(deckId);
    if (!deck) throw notFound('Deck', deckId);

    const slot = deck.decklist.cards.find((c) => c.id === decklistCardId);
    if (!slot) throw notFound('DecklistCard', decklistCardId);

    const copy = await prisma.physicalCardCopy.findUnique({
      where: { id: physicalCopyId },
      include: { inventoryItem: true },
    });

    if (!copy) throw notFound('PhysicalCardCopy', physicalCopyId);
    if (copy.status !== 'available') {
      throw new AppError('COPY_NOT_AVAILABLE', 'Physical copy is not available for assignment', 409);
    }
    if (copy.inventoryItem.playableCardKey !== slot.playableCardKey) {
      throw new AppError(
        'COPY_DOES_NOT_MATCH_SLOT',
        'Physical copy does not match the playable card key of the slot',
        409
      );
    }

    const currentAssignments = deck.assignments.filter((a) => a.decklistCardId === decklistCardId);
    if (currentAssignments.length >= slot.quantity) {
      throw new AppError('DECK_SLOT_FULL', 'Deck slot already has all required copies assigned', 409);
    }

    await prisma.$transaction(async (tx) => {
      await tx.physicalCardCopy.update({
        where: { id: physicalCopyId },
        data: { status: 'assigned', assignedDeckId: deckId },
      });

      await tx.deckCardAssignment.create({
        data: { deckId, decklistCardId, physicalCopyId },
      });

      await tx.movement.create({
        data: {
          type: 'assigned',
          physicalCopyId,
          deckId,
          note: `Assigned to decklist slot ${decklistCardId}`,
        },
      });
    });

    return recalculateAndPersistDeckStatus(deckId);
  },

  async removeCard(deckId: string, decklistCardId: string, physicalCopyId: string) {
    const deck = await this.findById(deckId);
    if (!deck) throw notFound('Deck', deckId);

    const assignment = deck.assignments.find(
      (a) => a.decklistCardId === decklistCardId && a.physicalCopyId === physicalCopyId
    );
    if (!assignment) {
      throw new AppError('NOT_FOUND', 'Assignment not found for this slot and physical copy', 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.deckCardAssignment.delete({ where: { id: assignment.id } });

      await tx.physicalCardCopy.update({
        where: { id: physicalCopyId },
        data: { status: 'available', assignedDeckId: null },
      });

      await tx.movement.create({
        data: {
          type: 'unassigned',
          physicalCopyId,
          deckId,
          note: 'Removed from deck',
        },
      });
    });

    return recalculateAndPersistDeckStatus(deckId);
  },

  recalculateStatus: recalculateAndPersistDeckStatus,
};
