-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Supertype" AS ENUM ('Pokémon', 'Trainer', 'Energy');

-- CreateEnum
CREATE TYPE "PhysicalCopyStatus" AS ENUM ('available', 'assigned', 'loaned', 'missing', 'sold');

-- CreateEnum
CREATE TYPE "DeckType" AS ENUM ('active', 'reference');

-- CreateEnum
CREATE TYPE "DeckFormat" AS ENUM ('Standard', 'Expanded', 'Casual');

-- CreateEnum
CREATE TYPE "DeckStatus" AS ENUM ('complete', 'incomplete', 'invalid');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('binder', 'deckbox', 'bulk', 'loan', 'sale', 'lost', 'other');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('added', 'moved', 'assigned', 'unassigned', 'loaned', 'returned');

-- CreateTable
CREATE TABLE "card_catalog_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supertype" "Supertype" NOT NULL,
    "subtypes" TEXT[],
    "types" TEXT[],
    "setId" TEXT NOT NULL,
    "setName" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageUrlLarge" TEXT,
    "regulationMark" TEXT,
    "legalities" JSONB,
    "rules" TEXT[],

    CONSTRAINT "card_catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "catalogCardId" TEXT NOT NULL,
    "playableCardKey" TEXT NOT NULL,
    "variant" TEXT NOT NULL DEFAULT 'normal',
    "finish" TEXT NOT NULL DEFAULT 'non-holo',
    "language" TEXT NOT NULL DEFAULT 'EN',
    "condition" TEXT NOT NULL DEFAULT 'NM',
    "quantity" INTEGER NOT NULL,
    "locationId" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physical_card_copies" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "status" "PhysicalCopyStatus" NOT NULL DEFAULT 'available',
    "assignedDeckId" TEXT,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "physical_card_copies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DeckType" NOT NULL,
    "format" "DeckFormat" NOT NULL,
    "status" "DeckStatus" NOT NULL DEFAULT 'incomplete',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deck_cards" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "playableCardKey" TEXT NOT NULL,
    "catalogCardId" TEXT NOT NULL,
    "requiredQuantity" INTEGER NOT NULL,

    CONSTRAINT "deck_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deck_card_assignments" (
    "id" TEXT NOT NULL,
    "deckCardId" TEXT NOT NULL,
    "physicalCopyId" TEXT NOT NULL,

    CONSTRAINT "deck_card_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movements" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "MovementType" NOT NULL,
    "inventoryItemId" TEXT,
    "physicalCopyId" TEXT,
    "deckId" TEXT,
    "from" TEXT,
    "to" TEXT,
    "note" TEXT,

    CONSTRAINT "movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deck_cards_deckId_playableCardKey_key" ON "deck_cards"("deckId", "playableCardKey");

-- CreateIndex
CREATE UNIQUE INDEX "deck_card_assignments_physicalCopyId_key" ON "deck_card_assignments"("physicalCopyId");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_catalogCardId_fkey" FOREIGN KEY ("catalogCardId") REFERENCES "card_catalog_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_card_copies" ADD CONSTRAINT "physical_card_copies_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_card_copies" ADD CONSTRAINT "physical_card_copies_assignedDeckId_fkey" FOREIGN KEY ("assignedDeckId") REFERENCES "decks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "physical_card_copies" ADD CONSTRAINT "physical_card_copies_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_catalogCardId_fkey" FOREIGN KEY ("catalogCardId") REFERENCES "card_catalog_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_card_assignments" ADD CONSTRAINT "deck_card_assignments_deckCardId_fkey" FOREIGN KEY ("deckCardId") REFERENCES "deck_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deck_card_assignments" ADD CONSTRAINT "deck_card_assignments_physicalCopyId_fkey" FOREIGN KEY ("physicalCopyId") REFERENCES "physical_card_copies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_physicalCopyId_fkey" FOREIGN KEY ("physicalCopyId") REFERENCES "physical_card_copies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "decks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

