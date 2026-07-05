import { Request, Response } from 'express';
import { movementService } from '../services/movement.service';
import { mapMovement } from '../utils/mappers';
import { getValidatedQuery } from '../utils/middleware';
import { MovementQueryInput } from '../schemas';

export const movementController = {
  async list(req: Request, res: Response): Promise<void> {
    const filters = getValidatedQuery<MovementQueryInput>(req);
    const movements = await movementService.list(filters);
    res.json(movements.map(mapMovement));
  },
};
