import { Request, Response } from 'express';
import { decklistService } from '../services/decklist.service';
import { limitlessDecklistService } from '../services/limitlessDecklist.service';
import { CompareDecklistInput, ImportLimitlessDecklistInput } from '../schemas';
import { getValidatedBody } from '../utils/middleware';

export const decklistController = {
  async compare(req: Request, res: Response): Promise<void> {
    const { decklist } = getValidatedBody<CompareDecklistInput>(req);
    const result = await decklistService.compare(decklist);
    res.json(result);
  },

  async importLimitless(req: Request, res: Response): Promise<void> {
    const { decklist } = getValidatedBody<ImportLimitlessDecklistInput>(req);
    const result = await limitlessDecklistService.import(decklist);
    res.json(result);
  },
};
