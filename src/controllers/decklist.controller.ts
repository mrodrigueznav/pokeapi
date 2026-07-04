import { Request, Response } from 'express';
import { decklistService } from '../services/decklist.service';
import { CompareDecklistInput } from '../schemas';

export const decklistController = {
  async compare(req: Request, res: Response): Promise<void> {
    const { decklist } = req.body as CompareDecklistInput;
    const result = await decklistService.compare(decklist);
    res.json(result);
  },
};
