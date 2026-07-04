-- CreateEnum
CREATE TYPE "BuyListPriority" AS ENUM ('low', 'normal', 'high');

-- CreateEnum
CREATE TYPE "BuyListStatus" AS ENUM ('pending', 'purchased', 'cancelled');

-- CreateTable
CREATE TABLE "buy_list_items" (
    "id" TEXT NOT NULL,
    "catalogCardId" TEXT NOT NULL,
    "cardName" TEXT NOT NULL,
    "supertype" "Supertype" NOT NULL,
    "playableCardKey" TEXT NOT NULL,
    "desiredQuantity" INTEGER NOT NULL,
    "acquiredQuantity" INTEGER NOT NULL DEFAULT 0,
    "priority" "BuyListPriority" NOT NULL DEFAULT 'normal',
    "status" "BuyListStatus" NOT NULL DEFAULT 'pending',
    "sourceDeckId" TEXT,
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buy_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "buy_list_items_playableCardKey_status_sourceDeckId_idx" ON "buy_list_items"("playableCardKey", "status", "sourceDeckId");

-- CreateIndex
CREATE INDEX "buy_list_items_status_idx" ON "buy_list_items"("status");

-- CreateIndex
CREATE INDEX "buy_list_items_sourceDeckId_idx" ON "buy_list_items"("sourceDeckId");

-- AddForeignKey
ALTER TABLE "buy_list_items" ADD CONSTRAINT "buy_list_items_catalogCardId_fkey" FOREIGN KEY ("catalogCardId") REFERENCES "card_catalog_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buy_list_items" ADD CONSTRAINT "buy_list_items_sourceDeckId_fkey" FOREIGN KEY ("sourceDeckId") REFERENCES "decks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
