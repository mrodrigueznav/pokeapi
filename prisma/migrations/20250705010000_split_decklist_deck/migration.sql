-- Split Deck into Decklist (template) + Deck (physical instance)

-- Drop old deck structure
DROP TABLE IF EXISTS "deck_card_assignments";
DROP TABLE IF EXISTS "deck_cards";

-- CreateEnum
CREATE TYPE "DecklistStatus" AS ENUM ('complete', 'incomplete', 'invalid');

-- CreateTable decklists
CREATE TABLE "decklists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "format" "DeckFormat" NOT NULL,
    "status" "DecklistStatus" NOT NULL DEFAULT 'incomplete',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "decklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable decklist_cards
CREATE TABLE "decklist_cards" (
    "id" TEXT NOT NULL,
    "decklistId" TEXT NOT NULL,
    "playableCardKey" TEXT NOT NULL,
    "catalogCardId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "decklist_cards_pkey" PRIMARY KEY ("id")
);

-- Alter decks: remove type/format, add decklistId
ALTER TABLE "decks" DROP COLUMN IF EXISTS "type";
ALTER TABLE "decks" DROP COLUMN IF EXISTS "format";
ALTER TABLE "decks" ADD COLUMN "decklistId" TEXT;

-- Note: existing deck rows need manual cleanup or reset before NOT NULL constraint
-- For fresh deploys, decks table may be empty

-- CreateIndex
CREATE UNIQUE INDEX "decklist_cards_decklistId_playableCardKey_key" ON "decklist_cards"("decklistId", "playableCardKey");

-- AddForeignKey decklist_cards
ALTER TABLE "decklist_cards" ADD CONSTRAINT "decklist_cards_decklistId_fkey" FOREIGN KEY ("decklistId") REFERENCES "decklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "decklist_cards" ADD CONSTRAINT "decklist_cards_catalogCardId_fkey" FOREIGN KEY ("catalogCardId") REFERENCES "card_catalog_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Recreate deck_card_assignments with new schema
CREATE TABLE "deck_card_assignments" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "decklistCardId" TEXT NOT NULL,
    "physicalCopyId" TEXT NOT NULL,
    CONSTRAINT "deck_card_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deck_card_assignments_physicalCopyId_key" ON "deck_card_assignments"("physicalCopyId");

ALTER TABLE "deck_card_assignments" ADD CONSTRAINT "deck_card_assignments_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "decks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deck_card_assignments" ADD CONSTRAINT "deck_card_assignments_decklistCardId_fkey" FOREIGN KEY ("decklistCardId") REFERENCES "decklist_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deck_card_assignments" ADD CONSTRAINT "deck_card_assignments_physicalCopyId_fkey" FOREIGN KEY ("physicalCopyId") REFERENCES "physical_card_copies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- decks.decklistId FK (nullable until data migrated; new code always sets it)
ALTER TABLE "decks" ADD CONSTRAINT "decks_decklistId_fkey" FOREIGN KEY ("decklistId") REFERENCES "decklists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- buy_list_items: add sourceDecklistId
ALTER TABLE "buy_list_items" ADD COLUMN IF NOT EXISTS "sourceDecklistId" TEXT;
CREATE INDEX IF NOT EXISTS "buy_list_items_sourceDecklistId_idx" ON "buy_list_items"("sourceDecklistId");
CREATE INDEX IF NOT EXISTS "buy_list_items_playableCardKey_status_sourceDecklistId_idx" ON "buy_list_items"("playableCardKey", "status", "sourceDecklistId");
ALTER TABLE "buy_list_items" ADD CONSTRAINT "buy_list_items_sourceDecklistId_fkey" FOREIGN KEY ("sourceDecklistId") REFERENCES "decklists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop unused enum
DROP TYPE IF EXISTS "DeckType";
