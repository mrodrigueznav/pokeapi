import prisma from '../utils/prisma';
import { CreateDeckInput, UpdateDeckInput, AddCardSlotInput } from '../schemas';
import { playableKey } from '../utils/playableKey';
import { calculateDeckStatus } from '../utils/deckStatus';
import { catalogRepository } from './catalog.repository';
import { buylistRepository } from './buylist.repository';
import { AppError, notFound } from '../utils/errors';
import { mapDeckCard } from '../utils/mappers';

const deckInclude = {
  cards: {
    include: {
      catalogCard: true,
      assignments: true,
    },
  },
} as const;

async function recalculateAndPersistDeckStatus(deckId: string) {
  const deck = await prisma.deck.findUniqueOrThrow({
    where: { id: deckId },
    include: deckInclude,
  });

  const status = calculateDeckStatus({
    type: deck.type,
    cards: deck.cards.map((c) => ({
      requiredQuantity: c.requiredQuantity,
      assignedPhysicalCopyIds: c.assignments.map((a) => a.physicalCopyId),
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

  create(input: CreateDeckInput) {
    return prisma.deck.create({
      data: {
        name: input.name,
        type: input.type,
        format: input.format,
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
        ...(input.format !== undefined && { format: input.format }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      include: deckInclude,
    });
  },

  async delete(id: string) {
    const deck = await this.findById(id);
    if (!deck) throw notFound('Deck', id);

    return prisma.$transaction(async (tx) => {
      for (const card of deck.cards) {
        for (const assignment of card.assignments) {
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
      }

      await buylistRepository.detachFromDeck(id, tx);

      await tx.deck.delete({ where: { id } });
    });
  },

  async addCardSlot(deckId: string, input: AddCardSlotInput) {
    const deck = await this.findById(deckId);
    if (!deck) throw notFound('Deck', deckId);

    const key = playableKey(input.cardName, input.supertype);

    await catalogRepository.upsertFromApiOrMinimal({
      id: input.catalogCardId,
      name: input.cardName,
      supertype: input.supertype,
    });

    const existingSlot = deck.cards.find((c) => c.playableCardKey === key);

    if (existingSlot) {
      await prisma.deckCard.update({
        where: { id: existingSlot.id },
        data: { requiredQuantity: existingSlot.requiredQuantity + input.requiredQuantity },
      });
    } else {
      await prisma.deckCard.create({
        data: {
          deckId,
          playableCardKey: key,
          catalogCardId: input.catalogCardId,
          requiredQuantity: input.requiredQuantity,
        },
      });
    }

    return recalculateAndPersistDeckStatus(deckId);
  },

  async removeCardSlot(deckId: string, deckCardId: string) {
    const deck = await this.findById(deckId);
    if (!deck) throw notFound('Deck', deckId);

    const slot = deck.cards.find((c) => c.id === deckCardId);
    if (!slot) throw notFound('DeckCard', deckCardId);

    return prisma.$transaction(async (tx) => {
      for (const assignment of slot.assignments) {
        await tx.physicalCardCopy.update({
          where: { id: assignment.physicalCopyId },
          data: { status: 'available', assignedDeckId: null },
        });

        await tx.movement.create({
          data: {
            type: 'unassigned',
            physicalCopyId: assignment.physicalCopyId,
            deckId,
            note: 'Card slot removed from deck',
          },
        });
      }

      await tx.deckCard.delete({ where: { id: deckCardId } });
      return recalculateAndPersistDeckStatus(deckId);
    });
  },

  async assignCard(deckId: string, deckCardId: string, physicalCopyId: string) {
    const deck = await this.findById(deckId);
    if (!deck) throw notFound('Deck', deckId);

    if (deck.type !== 'active') {
      throw new AppError('DECK_NOT_ACTIVE', 'Only active decks can have physical copies assigned', 409);
    }

    const slot = deck.cards.find((c) => c.id === deckCardId);
    if (!slot) throw notFound('DeckCard', deckCardId);

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
    if (slot.assignments.length >= slot.requiredQuantity) {
      throw new AppError('DECK_SLOT_FULL', 'Deck slot already has all required copies assigned', 409);
    }

    await prisma.$transaction(async (tx) => {
      await tx.physicalCardCopy.update({
        where: { id: physicalCopyId },
        data: { status: 'assigned', assignedDeckId: deckId },
      });

      await tx.deckCardAssignment.create({
        data: { deckCardId, physicalCopyId },
      });

      await tx.movement.create({
        data: {
          type: 'assigned',
          physicalCopyId,
          deckId,
          note: `Assigned to deck slot ${deckCardId}`,
        },
      });
    });

    return recalculateAndPersistDeckStatus(deckId);
  },

  async removeCard(deckId: string, deckCardId: string, physicalCopyId: string) {
    const deck = await this.findById(deckId);
    if (!deck) throw notFound('Deck', deckId);

    const slot = deck.cards.find((c) => c.id === deckCardId);
    if (!slot) throw notFound('DeckCard', deckCardId);

    const assignment = slot.assignments.find((a) => a.physicalCopyId === physicalCopyId);
    if (!assignment) {
      throw new AppError('NOT_FOUND', 'Assignment not found for this deck card and physical copy', 404);
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
          note: 'Removed from deck slot',
        },
      });
    });

    return recalculateAndPersistDeckStatus(deckId);
  },

  recalculateStatus: recalculateAndPersistDeckStatus,
};

export { mapDeckCard };
