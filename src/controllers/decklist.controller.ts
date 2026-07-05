import { Request, Response } from 'express';
import { decklistService } from '../services/decklist.service';
import { CompareDecklistInput } from '../schemas';
import { getValidatedBody } from '../utils/middleware';

export const decklistController = {
  async compare(req: Request, res: Response): Promise<void> {
    const { decklist } = getValidatedBody<CompareDecklistInput>(req);
    const result = await decklistService.compare(decklist);
    res.json(result);
  },
};
