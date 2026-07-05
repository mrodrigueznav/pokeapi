import { DecklistStatus } from '@prisma/client';

export interface DecklistStatusInput {
  cards: Array<{ quantity: number }>;
}

export function calculateDecklistStatus(decklist: DecklistStatusInput): DecklistStatus {
  const total = decklist.cards.reduce((sum, c) => sum + c.quantity, 0);

  if (total > 60) return DecklistStatus.invalid;
  if (total === 60) return DecklistStatus.complete;
  return DecklistStatus.incomplete;
}
