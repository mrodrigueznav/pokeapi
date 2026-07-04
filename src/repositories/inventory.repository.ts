import prisma from '../utils/prisma';
import { CreateInventoryInput, UpdateInventoryInput } from '../schemas';
import { playableKey } from '../utils/playableKey';
import { catalogRepository } from './catalog.repository';
import { movementRepository } from './catalog.repository';
import { AppError, notFound } from '../utils/errors';

const inventoryInclude = {
  catalogCard: true,
  physicalCopies: true,
  location: true,
} as const;

export const inventoryRepository = {
  findAll() {
    return prisma.inventoryItem.findMany({
      include: inventoryInclude,
      orderBy: { updatedAt: 'desc' },
    });
  },

  findById(id: string) {
    return prisma.inventoryItem.findUnique({
      where: { id },
      include: inventoryInclude,
    });
  },

  findByPlayableKey(playableCardKey: string) {
    return prisma.inventoryItem.findMany({
      where: { playableCardKey },
      include: { physicalCopies: true },
    });
  },

  async create(input: CreateInventoryInput) {
    const key = playableKey(input.cardName, input.supertype);

    const catalogCard = await catalogRepository.upsertFromApiOrMinimal({
      id: input.catalogCardId,
      name: input.cardName,
      supertype: input.supertype,
    });

    return prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          catalogCardId: catalogCard.id,
          playableCardKey: key,
          variant: input.variant,
          finish: input.finish,
          language: input.language,
          condition: input.condition,
          quantity: input.quantity,
          locationId: input.locationId ?? null,
          notes: input.notes ?? null,
          tags: input.tags,
        },
      });

      const copies = [];
      for (let i = 0; i < input.quantity; i++) {
        const copy = await tx.physicalCardCopy.create({
          data: {
            inventoryItemId: item.id,
            status: 'available',
            locationId: input.locationId ?? null,
          },
        });
        copies.push(copy);
      }

      await tx.movement.create({
        data: {
          type: 'added',
          inventoryItemId: item.id,
          to: input.locationId ?? null,
          note: `Added ${input.quantity} copy/copies`,
        },
      });

      return tx.inventoryItem.findUniqueOrThrow({
        where: { id: item.id },
        include: inventoryInclude,
      });
    });
  },

  async update(id: string, input: UpdateInventoryInput) {
    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
      include: { physicalCopies: true },
    });

    if (!existing) throw notFound('InventoryItem', id);

    const locationChanged =
      input.locationId !== undefined && input.locationId !== existing.locationId;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.inventoryItem.update({
        where: { id },
        data: {
          ...(input.locationId !== undefined && { locationId: input.locationId }),
          ...(input.notes !== undefined && { notes: input.notes }),
          ...(input.tags !== undefined && { tags: input.tags }),
          ...(input.condition !== undefined && { condition: input.condition }),
          ...(input.language !== undefined && { language: input.language }),
          ...(input.variant !== undefined && { variant: input.variant }),
          ...(input.finish !== undefined && { finish: input.finish }),
        },
      });

      if (locationChanged) {
        await tx.physicalCardCopy.updateMany({
          where: {
            inventoryItemId: id,
            status: { not: 'assigned' },
          },
          data: { locationId: input.locationId ?? null },
        });

        await tx.movement.create({
          data: {
            type: 'moved',
            inventoryItemId: id,
            from: existing.locationId,
            to: input.locationId ?? null,
            note: 'Inventory location updated (non-assigned copies only)',
          },
        });
      }

      return tx.inventoryItem.findUniqueOrThrow({
        where: { id: updated.id },
        include: inventoryInclude,
      });
    });
  },

  async loan(inventoryItemId: string, copyId: string, locationId: string, note?: string) {
    const copy = await prisma.physicalCardCopy.findFirst({
      where: { id: copyId, inventoryItemId },
    });

    if (!copy) throw notFound('PhysicalCardCopy', copyId);
    if (copy.status !== 'available') {
      throw new AppError('COPY_NOT_AVAILABLE', 'Only available copies can be loaned', 409);
    }

    return prisma.$transaction(async (tx) => {
      await tx.physicalCardCopy.update({
        where: { id: copyId },
        data: {
          status: 'loaned',
          assignedDeckId: null,
          locationId,
        },
      });

      await tx.movement.create({
        data: {
          type: 'loaned',
          inventoryItemId,
          physicalCopyId: copyId,
          to: locationId,
          note: note ?? null,
        },
      });

      return tx.inventoryItem.findUniqueOrThrow({
        where: { id: inventoryItemId },
        include: inventoryInclude,
      });
    });
  },

  async returnCopy(inventoryItemId: string, copyId: string, locationId: string) {
    const copy = await prisma.physicalCardCopy.findFirst({
      where: { id: copyId, inventoryItemId },
    });

    if (!copy) throw notFound('PhysicalCardCopy', copyId);
    if (copy.status !== 'loaned') {
      throw new AppError('COPY_NOT_AVAILABLE', 'Only loaned copies can be returned', 409);
    }

    return prisma.$transaction(async (tx) => {
      await tx.physicalCardCopy.update({
        where: { id: copyId },
        data: {
          status: 'available',
          locationId,
        },
      });

      await tx.movement.create({
        data: {
          type: 'returned',
          inventoryItemId,
          physicalCopyId: copyId,
          to: locationId,
          note: 'Copy returned from loan',
        },
      });

      return tx.inventoryItem.findUniqueOrThrow({
        where: { id: inventoryItemId },
        include: inventoryInclude,
      });
    });
  },
};

export const physicalCopyRepository = {
  findById(id: string) {
    return prisma.physicalCardCopy.findUnique({
      where: { id },
      include: { inventoryItem: true },
    });
  },
};
