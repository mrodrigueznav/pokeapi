import { Request, Response } from 'express';
import { inventoryService } from '../services/inventory.service';
import { mapInventoryItem } from '../utils/mappers';
import { CreateInventoryInput, UpdateInventoryInput } from '../schemas';
import { getParam } from '../utils/params';

export const inventoryController = {
  async list(_req: Request, res: Response): Promise<void> {
    const items = await inventoryService.list();
    res.json(items.map(mapInventoryItem));
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = req.body as CreateInventoryInput;
    const { item, created } = await inventoryService.create(input);
    res.status(created ? 201 : 200).json(mapInventoryItem(item));
  },

  async update(req: Request, res: Response): Promise<void> {
    const input = req.body as UpdateInventoryInput;
    const item = await inventoryService.update(getParam(req, 'id'), input);
    res.json(mapInventoryItem(item));
  },

  async loan(req: Request, res: Response): Promise<void> {
    const { copyId, locationId, note } = req.body as {
      copyId: string;
      locationId: string;
      note?: string;
    };
    const item = await inventoryService.loan(
      getParam(req, 'inventoryItemId'),
      copyId,
      locationId,
      note
    );
    res.json(mapInventoryItem(item));
  },

  async returnCopy(req: Request, res: Response): Promise<void> {
    const { copyId, locationId } = req.body as { copyId: string; locationId: string };
    const item = await inventoryService.returnCopy(
      getParam(req, 'inventoryItemId'),
      copyId,
      locationId
    );
    res.json(mapInventoryItem(item));
  },
};
