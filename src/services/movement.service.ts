import { movementRepository } from '../repositories/catalog.repository';

export const movementService = {
  list(filters: {
    inventoryItemId?: string;
    physicalCopyId?: string;
    deckId?: string;
  }) {
    return movementRepository.findFiltered(filters);
  },
};
