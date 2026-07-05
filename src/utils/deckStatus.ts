import { DeckStatus } from '@prisma/client';

export interface DeckStatusInput {
  cards: Array<{
    quantity: number;
    assignedPhysicalCopyIds: string[];
  }>;
}

/**
 * Deck status is based on its decklist composition + physical copy assignments.
 */
export function calculateDeckStatus(deck: DeckStatusInput): DeckStatus {
  const totalRequired = deck.cards.reduce((sum, c) => sum + c.quantity, 0);

  if (totalRequired > 60) {
    return DeckStatus.invalid;
  }

  if (totalRequired === 60) {
    const allSlotsFilled = deck.cards.every(
      (c) => c.assignedPhysicalCopyIds.length >= c.quantity
    );
    return allSlotsFilled ? DeckStatus.complete : DeckStatus.incomplete;
  }

  return DeckStatus.incomplete;
}
