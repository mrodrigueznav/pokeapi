import { decklistRepository } from '../repositories/decklist.repository';
import {
  CreateDecklistInput,
  UpdateDecklistInput,
  AddDecklistCardInput,
} from '../schemas';

export const decklistEntityService = {
  list() {
    return decklistRepository.findAll();
  },

  getById(id: string) {
    return decklistRepository.findByIdWithRecalculatedStatus(id);
  },

  create(input: CreateDecklistInput) {
    return decklistRepository.create(input);
  },

  update(id: string, input: UpdateDecklistInput) {
    return decklistRepository.update(id, input);
  },

  delete(id: string) {
    return decklistRepository.delete(id);
  },

  addCard(decklistId: string, input: AddDecklistCardInput) {
    return decklistRepository.addCard(decklistId, input);
  },

  removeCard(decklistId: string, decklistCardId: string) {
    return decklistRepository.removeCard(decklistId, decklistCardId);
  },
};
