# TCG Deck Inventory API

REST API backend for **TCG Deck Inventory** — a tool for Pokémon TCG players to manage physical card inventory, track individual copies, build active/reference decks, and compare decklists against owned cards.

## Stack

- **Node.js** + **TypeScript**
- **Express** — HTTP server
- **Prisma** — ORM & migrations (PostgreSQL)
- **Zod** — request validation
- **CORS** + **dotenv**

## Core concepts

| Concept | Description |
|---------|-------------|
| `CardCatalogItem` | Official print from a set (e.g. `sv3-125`) |
| `InventoryItem` | Group of identical physical copies (same card, variant, finish, language, condition, location) |
| `PhysicalCardCopy` | One individual physical card |
| `Deck` | Active (consumes copies) or reference (decklist only) |
| `playableCardKey` | `"<supertype>::<name lowercase>"` — matches playable identity across prints |

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### Setup

```bash
# Clone and install
npm install

# Configure environment
cp .env.example .env
# Edit DATABASE_URL, PORT, optional POKEMON_TCG_API_KEY

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed sample data
npm run prisma:seed

# Start dev server
npm run dev
```

API runs at `http://localhost:4000` by default. Versioned endpoints are mounted under `/api/v1`.

## Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `PORT` | Server port | `4000` |
| `POKEMON_TCG_API_KEY` | Optional API key for [Pokémon TCG API](https://pokemontcg.io/) | empty |

CORS is enabled for all origins.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot reload (tsx) |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Apply migrations |
| `npm run prisma:seed` | Seed database |

## API endpoints

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | `{ "ok": true }` |
| GET | `/api/v1/health` | Versioned health check |

### Catalog

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/cards/search` | Search Pokémon TCG API (`q`, `supertype`, `subtype`, `setId`, `rarity`, `page`, `pageSize`) |
| GET | `/api/v1/cards/:id` | Get card (local first, then API) |

### Inventory

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/inventory` | List inventory with catalog, copies, location |
| POST | `/api/v1/inventory` | Add inventory (creates N physical copies) |
| PATCH | `/api/v1/inventory/:id` | Update item (location change skips assigned copies) |
| POST | `/api/v1/inventory/:id/loan` | Loan an available copy |
| POST | `/api/v1/inventory/:id/return` | Return a loaned copy |

### Decks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/decks` | All decks with cards & recalculated status |
| GET | `/api/v1/decks/:id` | Deck detail |
| POST | `/api/v1/decks` | Create deck |
| PATCH | `/api/v1/decks/:id` | Update name/format/notes |
| DELETE | `/api/v1/decks/:id` | Delete deck & release copies |
| POST | `/api/v1/decks/:id/add-card-slot` | Add/merge card slot |
| POST | `/api/v1/decks/:id/remove-card-slot` | Remove slot & release copies |
| POST | `/api/v1/decks/:id/assign-card` | Assign physical copy to slot |
| POST | `/api/v1/decks/:id/remove-card` | Unassign copy from slot |

### Decklist comparator

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/decklists/compare` | Compare text decklist vs inventory |

### Locations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/locations` | List locations |
| POST | `/api/v1/locations` | Create location |
| DELETE | `/api/v1/locations/:id` | Delete (blocked if in use) |

### Movements

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/movements` | Audit log (`inventoryItemId`, `physicalCopyId`, `deckId` filters) |

### Buy List

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/buylist` | List buy list items (`status`, `sourceDeckId`, `priority` filters) |
| POST | `/api/v1/buylist` | Add item manually (deduplicates pending by `playableCardKey` + `sourceDeckId`) |
| PATCH | `/api/v1/buylist/:id` | Update quantity, priority, status, notes |
| POST | `/api/v1/buylist/:id/status` | Shortcut to change status only |
| DELETE | `/api/v1/buylist/:id` | Remove item |
| POST | `/api/v1/buylist/clear-purchased` | Delete all purchased items |
| POST | `/api/v1/decks/:deckId/buylist/add-missing` | Add missing copies from active deck |

When a deck is deleted, linked buy list items keep their record but `sourceDeckId` is set to `null`.

## Error format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": {}
  }
}
```

Codes: `VALIDATION_ERROR`, `NOT_FOUND`, `COPY_NOT_AVAILABLE`, `DECK_SLOT_FULL`, `DECK_NOT_ACTIVE`, `COPY_DOES_NOT_MATCH_SLOT`, `LOCATION_IN_USE`, `INTERNAL_ERROR`.

## Project structure

```
src/
├── server.ts
├── app.ts
├── routes/
├── controllers/
├── services/
├── repositories/
├── schemas/        # Zod validators
├── types/
└── utils/          # playableKey, deckStatus, mappers, etc.
prisma/
├── schema.prisma
└── seed.ts
```

## Deck status rules

- `totalRequired > 60` → **invalid**
- **reference**: 60 cards → **complete**, else **incomplete**
- **active**: 60 cards + all slots fully assigned → **complete**, else **incomplete**

Status is always computed server-side.

## License

MIT
