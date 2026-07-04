import { deckRepository } from '../repositories/deck.repository';
import { CreateDeckInput, UpdateDeckInput, AddCardSlotInput } from '../schemas';

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

  addCardSlot(deckId: string, input: AddCardSlotInput) {
    return deckRepository.addCardSlot(deckId, input);
  },

  removeCardSlot(deckId: string, deckCardId: string) {
    return deckRepository.removeCardSlot(deckId, deckCardId);
  },

  assignCard(deckId: string, deckCardId: string, physicalCopyId: string) {
    return deckRepository.assignCard(deckId, deckCardId, physicalCopyId);
  },

  removeCard(deckId: string, deckCardId: string, physicalCopyId: string) {
    return deckRepository.removeCard(deckId, deckCardId, physicalCopyId);
  },
};
