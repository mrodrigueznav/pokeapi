import { DeckStatus, DeckType } from '@prisma/client';

export interface DeckStatusInput {
  type: DeckType;
  cards: Array<{
    requiredQuantity: number;
    assignedPhysicalCopyIds: string[];
  }>;
}

/**
 * Calculates deck status based on type, card requirements, and assignments.
 * Never trust client-provided status.
 */
export function calculateDeckStatus(deck: DeckStatusInput): DeckStatus {
  const totalRequired = deck.cards.reduce((sum, c) => sum + c.requiredQuantity, 0);

  if (totalRequired > 60) {
    return DeckStatus.invalid;
  }

  if (deck.type === DeckType.reference) {
    if (totalRequired === 60) return DeckStatus.complete;
    return DeckStatus.incomplete;
  }

  // active deck
  if (totalRequired === 60) {
    const allSlotsFilled = deck.cards.every(
      (c) => c.assignedPhysicalCopyIds.length >= c.requiredQuantity
    );
    return allSlotsFilled ? DeckStatus.complete : DeckStatus.incomplete;
  }

  return DeckStatus.incomplete;
}
