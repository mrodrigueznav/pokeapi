import { Supertype } from '@prisma/client';

export interface CardCatalogItemDto {
  id: string;
  name: string;
  supertype: string;
  subtypes: string[];
  types: string[];
  setId: string;
  setName: string;
  number: string;
  rarity: string;
  imageUrl: string;
  imageUrlLarge: string | null;
  regulationMark: string | null;
  legalities: Record<string, string> | null;
  rules: string[];
}

export interface PhysicalCardCopyDto {
  id: string;
  inventoryItemId: string;
  status: string;
  assignedDeckId: string | null;
  locationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryCopyCounts {
  total: number;
  available: number;
  assigned: number;
  loaned: number;
  missing: number;
  sold: number;
}

export interface PlayableCardInventorySummary {
  playableCardKey: string;
  cardName: string;
  supertype: string;
  total: number;
  available: number;
  assigned: number;
  loaned: number;
  missing: number;
  sold: number;
}

export interface InventoryListResponse {
  items: InventoryItemDto[];
  byPlayableCard: PlayableCardInventorySummary[];
}

export interface InventoryItemDto {
  id: string;
  catalogCardId: string;
  playableCardKey: string;
  variant: string;
  finish: string;
  language: string;
  condition: string;
  quantity: number;
  locationId: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  counts: InventoryCopyCounts;
  catalogCard?: CardCatalogItemDto;
  physicalCopies?: PhysicalCardCopyDto[];
  location?: LocationDto | null;
}

export interface LocationDto {
  id: string;
  name: string;
  type: string;
}

export interface DecklistCardDto {
  id: string;
  decklistId: string;
  playableCardKey: string;
  catalogCardId: string;
  quantity: number;
  assignedPhysicalCopyIds?: string[];
  catalogCard?: CardCatalogItemDto;
}

export interface DecklistDto {
  id: string;
  name: string;
  format: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  cards?: DecklistCardDto[];
}

export interface DeckDto {
  id: string;
  name: string;
  decklistId: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  decklist?: DecklistDto;
}

export interface MovementDto {
  id: string;
  at: string;
  type: string;
  inventoryItemId: string | null;
  physicalCopyId: string | null;
  deckId: string | null;
  from: string | null;
  to: string | null;
  note: string | null;
}

export interface DecklistCompareRow {
  raw: string;
  quantity: number;
  name: string;
  match: CardCatalogItemDto | null;
  owned: number;
  available: number;
  assigned: number;
  missing: number;
}

export interface DecklistCompareResult {
  rows: DecklistCompareRow[];
  total: number;
  missing: number;
  notFound: number;
}

export interface LimitlessImportSlot {
  raw: string;
  quantity: number;
  name: string;
  supertype: string;
  setCode: string;
  number: string;
  catalogCardId: string;
  playableCardKey: string;
  catalogCard: CardCatalogItemDto | null;
  resolved: boolean;
}

export interface LimitlessImportResult {
  total: number;
  sectionCounts: {
    pokemon: number;
    trainer: number;
    energy: number;
  };
  parseErrors: string[];
  unresolved: number;
  /** Simple decklist text compatible with POST /decklists/compare */
  decklist: string;
  /** Slots ready for POST /decks/:id/add-card-slot */
  slots: LimitlessImportSlot[];
}

export interface PokemonTcgApiCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  types?: string[];
  set: { id: string; name: string };
  number: string;
  rarity: string;
  images: { small: string; large?: string };
  regulationMark?: string;
  legalities?: Record<string, string>;
  rules?: string[];
}

export type SupertypeEnum = Supertype;

export type BuyListPriority = 'low' | 'normal' | 'high';
export type BuyListStatus = 'pending' | 'purchased' | 'cancelled';

export interface BuyListItemDto {
  id: string;
  catalogCardId: string;
  cardName: string;
  supertype: string;
  playableCardKey: string;
  desiredQuantity: number;
  acquiredQuantity: number;
  priority: BuyListPriority;
  status: BuyListStatus;
  sourceDeckId: string | null;
  sourceDecklistId: string | null;
  notes: string | null;
  addedAt: string;
  updatedAt: string;
}

export interface AddMissingToBuyListResult {
  added: number;
  items: BuyListItemDto[];
}
