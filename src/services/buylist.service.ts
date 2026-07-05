import { buylistRepository } from '../repositories/buylist.repository';
import {
  AddBuyListInput,
  BuyListQueryInput,
  UpdateBuyListInput,
  UpdateBuyListStatusInput,
} from '../schemas';

export const buylistService = {
  list(filters: BuyListQueryInput) {
    return buylistRepository.findFiltered(filters);
  },

  add(input: AddBuyListInput) {
    return buylistRepository.add(input);
  },

  update(id: string, input: UpdateBuyListInput) {
    return buylistRepository.update(id, input);
  },

  updateStatus(id: string, input: UpdateBuyListStatusInput) {
    return buylistRepository.updateStatus(id, input.status);
  },

  delete(id: string) {
    return buylistRepository.delete(id);
  },

  clearPurchased() {
    return buylistRepository.clearPurchased();
  },

  addMissingFromDeck(deckId: string) {
    return buylistRepository.addMissingFromDeck(deckId);
  },

  addMissingFromDecklist(decklistId: string) {
    return buylistRepository.addMissingFromDecklist(decklistId);
  },
};
