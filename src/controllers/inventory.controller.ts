import { Request, Response } from 'express';
import { inventoryService } from '../services/inventory.service';
import { mapInventoryItem } from '../utils/mappers';
import { InventoryListResponse } from '../types';
import { CreateInventoryInput, UpdateInventoryInput } from '../schemas';
import { getParam } from '../utils/params';
import { getValidatedBody } from '../utils/middleware';

export const inventoryController = {
  async list(_req: Request, res: Response): Promise<void> {
    const items = await inventoryService.list();
    const mapped = items.map(mapInventoryItem);

    const byPlayableCard = new Map<
      string,
      InventoryListResponse['byPlayableCard'][number]
    >();

    for (const item of mapped) {
      const existing = byPlayableCard.get(item.playableCardKey);
      if (existing) {
        existing.total += item.counts.total;
        existing.available += item.counts.available;
        existing.assigned += item.counts.assigned;
        existing.loaned += item.counts.loaned;
        existing.missing += item.counts.missing;
        existing.sold += item.counts.sold;
      } else {
        byPlayableCard.set(item.playableCardKey, {
          playableCardKey: item.playableCardKey,
          cardName: item.catalogCard?.name ?? item.playableCardKey,
          supertype: item.catalogCard?.supertype ?? '',
          total: item.counts.total,
          available: item.counts.available,
          assigned: item.counts.assigned,
          loaned: item.counts.loaned,
          missing: item.counts.missing,
          sold: item.counts.sold,
        });
      }
    }

    const response: InventoryListResponse = {
      items: mapped,
      byPlayableCard: [...byPlayableCard.values()].sort((a, b) =>
        a.cardName.localeCompare(b.cardName)
      ),
    };

    res.json(response);
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = getValidatedBody<CreateInventoryInput>(req);
    const { item, created } = await inventoryService.create(input);
    res.status(created ? 201 : 200).json(mapInventoryItem(item));
  },

  async update(req: Request, res: Response): Promise<void> {
    const input = getValidatedBody<UpdateInventoryInput>(req);
    const item = await inventoryService.update(getParam(req, 'id'), input);
    res.json(mapInventoryItem(item));
  },

  async loan(req: Request, res: Response): Promise<void> {
    const { copyId, locationId, note } = getValidatedBody<{
      copyId: string;
      locationId: string;
      note?: string;
    }>(req);
    const item = await inventoryService.loan(
      getParam(req, 'inventoryItemId'),
      copyId,
      locationId,
      note
    );
    res.json(mapInventoryItem(item));
  },

  async returnCopy(req: Request, res: Response): Promise<void> {
    const { copyId, locationId } = getValidatedBody<{ copyId: string; locationId: string }>(req);
    const item = await inventoryService.returnCopy(
      getParam(req, 'inventoryItemId'),
      copyId,
      locationId
    );
    res.json(mapInventoryItem(item));
  },
};
