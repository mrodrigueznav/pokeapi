import { Request, Response } from 'express';
import { cardService } from '../services/card.service';
import { CardSearchParams } from '../utils/pokemonTcgApi';
import { getParam } from '../utils/params';

import { getValidatedQuery } from '../utils/middleware';

export const cardController = {
  async search(req: Request, res: Response): Promise<void> {
    const params = getValidatedQuery<CardSearchParams>(req);
    const result = await cardService.search(params);
    res.json(result);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const card = await cardService.getById(getParam(req, 'id'));
    res.json(card);
  },
};
