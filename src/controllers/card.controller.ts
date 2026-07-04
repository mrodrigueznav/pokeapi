import { Request, Response } from 'express';
import { cardService } from '../services/card.service';
import { CardSearchParams } from '../utils/pokemonTcgApi';
import { getParam } from '../utils/params';

export const cardController = {
  async search(req: Request, res: Response): Promise<void> {
    const params = req.query as unknown as CardSearchParams;
    const result = await cardService.search(params);
    res.json(result);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const card = await cardService.getById(getParam(req, 'id'));
    res.json(card);
  },
};
