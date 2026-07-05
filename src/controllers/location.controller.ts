import { Request, Response } from 'express';
import { locationService } from '../services/location.service';
import { mapLocation } from '../utils/mappers';
import { CreateLocationInput } from '../schemas';
import { getParam } from '../utils/params';
import { getValidatedBody } from '../utils/middleware';

export const locationController = {
  async list(_req: Request, res: Response): Promise<void> {
    const locations = await locationService.list();
    res.json(locations.map(mapLocation));
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = getValidatedBody<CreateLocationInput>(req);
    const location = await locationService.create(input);
    res.status(201).json(mapLocation(location));
  },

  async delete(req: Request, res: Response): Promise<void> {
    await locationService.delete(getParam(req, 'id'));
    res.status(204).send();
  },
};
