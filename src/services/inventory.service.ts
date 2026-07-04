import { inventoryRepository } from '../repositories/inventory.repository';
import { CreateInventoryInput, UpdateInventoryInput } from '../schemas';

export const inventoryService = {
  list() {
    return inventoryRepository.findAll();
  },

  create(input: CreateInventoryInput) {
    return inventoryRepository.create(input);
  },

  update(id: string, input: UpdateInventoryInput) {
    return inventoryRepository.update(id, input);
  },

  loan(
    inventoryItemId: string,
    copyId: string,
    locationId: string,
    note?: string
  ) {
    return inventoryRepository.loan(inventoryItemId, copyId, locationId, note);
  },

  returnCopy(inventoryItemId: string, copyId: string, locationId: string) {
    return inventoryRepository.returnCopy(inventoryItemId, copyId, locationId);
  },
};
