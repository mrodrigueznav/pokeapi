import { locationRepository } from '../repositories/catalog.repository';
import { CreateLocationInput } from '../schemas';
import { AppError, notFound } from '../utils/errors';

export const locationService = {
  list() {
    return locationRepository.findAll();
  },

  create(input: CreateLocationInput) {
    return locationRepository.create(input);
  },

  async delete(id: string) {
    const location = await locationRepository.findById(id);
    if (!location) throw notFound('Location', id);

    const inUse = await locationRepository.hasAssociations(id);
    if (inUse) {
      throw new AppError(
        'LOCATION_IN_USE',
        'Cannot delete location with associated inventory items or physical copies',
        409
      );
    }

    return locationRepository.delete(id);
  },
};
