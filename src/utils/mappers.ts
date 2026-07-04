import {
  CardCatalogItem,
  BuyListItem,
  Deck,
  DeckCard,
  DeckCardAssignment,
  InventoryItem,
  Location,
  Movement,
  PhysicalCardCopy,
} from '@prisma/client';
import { CardCatalogItemDto } from '../types';
import { supertypeToDisplay } from './playableKey';

type DeckCardWithRelations = DeckCard & {
  catalogCard: CardCatalogItem;
  assignments: DeckCardAssignment[];
};

type DeckWithRelations = Deck & {
  cards: DeckCardWithRelations[];
};

type InventoryItemWithRelations = InventoryItem & {
  catalogCard: CardCatalogItem;
  physicalCopies: PhysicalCardCopy[];
  location: Location | null;
};

export function mapCatalogCard(card: CardCatalogItem): CardCatalogItemDto {
  return {
    id: card.id,
    name: card.name,
    supertype: supertypeToDisplay(card.supertype),
    subtypes: card.subtypes,
    types: card.types,
    setId: card.setId,
    setName: card.setName,
    number: card.number,
    rarity: card.rarity,
    imageUrl: card.imageUrl,
    imageUrlLarge: card.imageUrlLarge,
    regulationMark: card.regulationMark,
    legalities: card.legalities as Record<string, string> | null,
    rules: card.rules,
  };
}

export function mapPhysicalCopy(copy: PhysicalCardCopy) {
  return {
    id: copy.id,
    inventoryItemId: copy.inventoryItemId,
    status: copy.status,
    assignedDeckId: copy.assignedDeckId,
    locationId: copy.locationId,
    createdAt: copy.createdAt.toISOString(),
    updatedAt: copy.updatedAt.toISOString(),
  };
}

export function mapLocation(location: Location) {
  return {
    id: location.id,
    name: location.name,
    type: location.type,
  };
}

export function mapInventoryItem(item: InventoryItemWithRelations) {
  return {
    id: item.id,
    catalogCardId: item.catalogCardId,
    playableCardKey: item.playableCardKey,
    variant: item.variant,
    finish: item.finish,
    language: item.language,
    condition: item.condition,
    quantity: item.quantity,
    locationId: item.locationId,
    notes: item.notes,
    tags: item.tags,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    catalogCard: mapCatalogCard(item.catalogCard),
    physicalCopies: item.physicalCopies.map(mapPhysicalCopy),
    location: item.location ? mapLocation(item.location) : null,
  };
}

export function mapDeckCard(card: DeckCardWithRelations) {
  return {
    id: card.id,
    deckId: card.deckId,
    playableCardKey: card.playableCardKey,
    catalogCardId: card.catalogCardId,
    requiredQuantity: card.requiredQuantity,
    assignedPhysicalCopyIds: card.assignments.map((a) => a.physicalCopyId),
    catalogCard: mapCatalogCard(card.catalogCard),
  };
}

export function mapDeck(deck: DeckWithRelations) {
  return {
    id: deck.id,
    name: deck.name,
    type: deck.type,
    format: deck.format,
    status: deck.status,
    notes: deck.notes,
    createdAt: deck.createdAt.toISOString(),
    updatedAt: deck.updatedAt.toISOString(),
    cards: deck.cards.map(mapDeckCard),
  };
}

export function mapMovement(movement: Movement) {
  return {
    id: movement.id,
    at: movement.at.toISOString(),
    type: movement.type,
    inventoryItemId: movement.inventoryItemId,
    physicalCopyId: movement.physicalCopyId,
    deckId: movement.deckId,
    from: movement.from,
    to: movement.to,
    note: movement.note,
  };
}

export function mapBuyListItem(item: BuyListItem) {
  return {
    id: item.id,
    catalogCardId: item.catalogCardId,
    cardName: item.cardName,
    supertype: supertypeToDisplay(item.supertype),
    playableCardKey: item.playableCardKey,
    desiredQuantity: item.desiredQuantity,
    acquiredQuantity: item.acquiredQuantity,
    priority: item.priority,
    status: item.status,
    sourceDeckId: item.sourceDeckId,
    notes: item.notes,
    addedAt: item.addedAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
