import { Request, Response } from 'express';
import { buylistService } from '../services/buylist.service';
import { mapBuyListItem } from '../utils/mappers';
import {
  AddBuyListInput,
  BuyListQueryInput,
  UpdateBuyListInput,
  UpdateBuyListStatusInput,
} from '../schemas';
import { getParam } from '../utils/params';
import { getValidatedQuery, getValidatedBody } from '../utils/middleware';

export const buylistController = {
  async list(req: Request, res: Response): Promise<void> {
    const filters = getValidatedQuery<BuyListQueryInput>(req);
    const items = await buylistService.list(filters);
    res.json(items.map(mapBuyListItem));
  },

  async add(req: Request, res: Response): Promise<void> {
    const input = getValidatedBody<AddBuyListInput>(req);
    const item = await buylistService.add(input);
    res.status(201).json(mapBuyListItem(item));
  },

  async update(req: Request, res: Response): Promise<void> {
    const input = getValidatedBody<UpdateBuyListInput>(req);
    const item = await buylistService.update(getParam(req, 'id'), input);
    res.json(mapBuyListItem(item));
  },

  async updateStatus(req: Request, res: Response): Promise<void> {
    const input = getValidatedBody<UpdateBuyListStatusInput>(req);
    const item = await buylistService.updateStatus(getParam(req, 'id'), input);
    res.json(mapBuyListItem(item));
  },

  async delete(req: Request, res: Response): Promise<void> {
    await buylistService.delete(getParam(req, 'id'));
    res.status(204).send();
  },

  async clearPurchased(_req: Request, res: Response): Promise<void> {
    const removed = await buylistService.clearPurchased();
    res.json({ removed });
  },

  async addMissingFromDeck(req: Request, res: Response): Promise<void> {
    const result = await buylistService.addMissingFromDeck(getParam(req, 'deckId'));
    res.json({
      added: result.added,
      items: result.items.map(mapBuyListItem),
    });
  },
};
