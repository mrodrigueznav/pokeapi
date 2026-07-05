import { deckRepository } from '../repositories/deck.repository';
import { CreateDeckInput, UpdateDeckInput } from '../schemas';

export const deckService = {
  list() {
    return deckRepository.findAllWithRecalculatedStatus();
  },

  getById(id: string) {
    return deckRepository.findByIdWithRecalculatedStatus(id);
  },

  create(input: CreateDeckInput) {
    return deckRepository.create(input);
  },

  update(id: string, input: UpdateDeckInput) {
    return deckRepository.update(id, input);
  },

  delete(id: string) {
    return deckRepository.delete(id);
  },

  assignCard(deckId: string, decklistCardId: string, physicalCopyId: string) {
    return deckRepository.assignCard(deckId, decklistCardId, physicalCopyId);
  },

  removeCard(deckId: string, decklistCardId: string, physicalCopyId: string) {
    return deckRepository.removeCard(deckId, decklistCardId, physicalCopyId);
  },
};
