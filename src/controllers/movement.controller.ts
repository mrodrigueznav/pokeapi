import { Request, Response } from 'express';
import { movementService } from '../services/movement.service';
import { mapMovement } from '../utils/mappers';

export const movementController = {
  async list(req: Request, res: Response): Promise<void> {
    const filters = req.query as {
      inventoryItemId?: string;
      physicalCopyId?: string;
      deckId?: string;
    };
    const movements = await movementService.list(filters);
    res.json(movements.map(mapMovement));
  },
};
