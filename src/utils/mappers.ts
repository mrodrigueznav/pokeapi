import {
  CardCatalogItem,
  BuyListItem,
  Deck,
  Decklist,
  DecklistCard,
  DeckCardAssignment,
  InventoryItem,
  Location,
  Movement,
  PhysicalCardCopy,
} from '@prisma/client';
import { CardCatalogItemDto } from '../types';
import { supertypeToDisplay } from './playableKey';

type DecklistWithCards = Decklist & {
  cards: (DecklistCard & { catalogCard: CardCatalogItem })[];
};

type DeckWithRelations = Deck & {
  decklist: DecklistWithCards;
  assignments: DeckCardAssignment[];
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

export function countPhysicalCopies(copies: PhysicalCardCopy[]) {
  const counts = {
    total: copies.length,
    available: 0,
    assigned: 0,
    loaned: 0,
    missing: 0,
    sold: 0,
  };

  for (const copy of copies) {
    switch (copy.status) {
      case 'available':
        counts.available++;
        break;
      case 'assigned':
        counts.assigned++;
        break;
      case 'loaned':
        counts.loaned++;
        break;
      case 'missing':
        counts.missing++;
        break;
      case 'sold':
        counts.sold++;
        break;
    }
  }

  return counts;
}

export function mapInventoryItem(item: InventoryItemWithRelations) {
  const counts = countPhysicalCopies(item.physicalCopies);

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
    counts,
    catalogCard: mapCatalogCard(item.catalogCard),
    physicalCopies: item.physicalCopies.map(mapPhysicalCopy),
    location: item.location ? mapLocation(item.location) : null,
  };
}

export function mapDecklistCard(
  card: DecklistCard & { catalogCard: CardCatalogItem },
  assignedPhysicalCopyIds: string[] = []
) {
  return {
    id: card.id,
    decklistId: card.decklistId,
    playableCardKey: card.playableCardKey,
    catalogCardId: card.catalogCardId,
    quantity: card.quantity,
    assignedPhysicalCopyIds,
    catalogCard: mapCatalogCard(card.catalogCard),
  };
}

export function mapDecklist(decklist: DecklistWithCards) {
  return {
    id: decklist.id,
    name: decklist.name,
    format: decklist.format,
    status: decklist.status,
    notes: decklist.notes,
    createdAt: decklist.createdAt.toISOString(),
    updatedAt: decklist.updatedAt.toISOString(),
    cards: decklist.cards.map((c) => mapDecklistCard(c)),
  };
}

export function mapDeck(deck: DeckWithRelations) {
  const assignmentsByCard = new Map<string, string[]>();
  for (const a of deck.assignments) {
    const list = assignmentsByCard.get(a.decklistCardId) ?? [];
    list.push(a.physicalCopyId);
    assignmentsByCard.set(a.decklistCardId, list);
  }

  return {
    id: deck.id,
    name: deck.name,
    decklistId: deck.decklistId,
    status: deck.status,
    notes: deck.notes,
    createdAt: deck.createdAt.toISOString(),
    updatedAt: deck.updatedAt.toISOString(),
    decklist: {
      ...mapDecklist(deck.decklist),
      cards: deck.decklist.cards.map((c) =>
        mapDecklistCard(c, assignmentsByCard.get(c.id) ?? [])
      ),
    },
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
    sourceDecklistId: item.sourceDecklistId,
    notes: item.notes,
    addedAt: item.addedAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}
