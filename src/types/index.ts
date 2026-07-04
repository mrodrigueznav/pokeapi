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
  catalogCard?: CardCatalogItemDto;
  physicalCopies?: PhysicalCardCopyDto[];
  location?: LocationDto | null;
}

export interface LocationDto {
  id: string;
  name: string;
  type: string;
}

export interface DeckCardDto {
  id: string;
  deckId: string;
  playableCardKey: string;
  catalogCardId: string;
  requiredQuantity: number;
  assignedPhysicalCopyIds: string[];
  catalogCard?: CardCatalogItemDto;
}

export interface DeckDto {
  id: string;
  name: string;
  type: string;
  format: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  cards?: DeckCardDto[];
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
