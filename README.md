# TCG Deck Inventory API

REST API backend for **TCG Deck Inventory** — a tool for Pokémon TCG players to manage physical card inventory, track individual copies, build decklists, assign collection copies to decks, and compare decklists against owned cards.

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
| `Decklist` | Template of cards (name, format, slots). Does **not** use collection copies |
| `DecklistCard` | One slot in a decklist (`playableCardKey`, `catalogCardId`, `quantity`) |
| `Deck` | Physical deck built from a decklist — assigns `PhysicalCardCopy` records to `DecklistCard` slots |
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
| `DATABASE_URL` | PostgreSQL connection string (pooler URL ok for runtime) | — |
| `DIRECT_DATABASE_URL` | Direct Postgres URL for migrations (`prisma migrate deploy`) | same as `DATABASE_URL` locally |
| `PORT` | Server port | `4000` |
| `POKEMON_TCG_API_KEY` | Optional API key for [Pokémon TCG API](https://pokemontcg.io/) | empty |

CORS is enabled for all origins.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot reload (tsx) |
| `npm run build` | Generate Prisma client and compile TypeScript |
| `npm start` | Run compiled server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Apply migrations (dev) |
| `npm run prisma:migrate:deploy` | Apply migrations (production) |
| `npm run prisma:seed` | Seed database |

## Deploy (Render)

Recommended settings:

| Setting | Value |
|---------|-------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run prisma:migrate:deploy && npm start` |
| **Environment** | `DATABASE_URL`, `DIRECT_DATABASE_URL`, `PORT`, optional `POKEMON_TCG_API_KEY` |

On Supabase: use the **transaction pooler** (`:6543`, `?pgbouncer=true`) for `DATABASE_URL` and the **session pooler** (`:5432`, no pgbouncer) for `DIRECT_DATABASE_URL`. Both are in Supabase → Project Settings → Database → Connection string.

**Important:** if your database password contains `@`, `#`, or `%`, URL-encode it in both connection strings (`@` → `%40`).

```bash
npm run prisma:migrate:deploy   # validates env, then applies migrations
npm run prisma:seed             # optional sample data
```

The build runs `prisma generate` before `tsc`, so TypeScript can resolve `BuyListItem` and other Prisma types.

## API endpoints

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | `{ "ok": true }` |
| GET | `/api/v1/health` | Versioned health check |

### Catalog

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/cards/search` | Search Pokémon TCG API (`q`, `supertype`, `subtype`, `setId`, `rarity`, `page`, `pageSize`) — **Standard-legal cards only** |
| GET | `/api/v1/cards/:id` | Get card (local first, then API) |

### Inventory

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/inventory` | List inventory with `counts` per item and `byPlayableCard` summary (total / available / assigned) |
| POST | `/api/v1/inventory` | Add inventory — merges into existing group when same catalog card + variant + finish + language + condition; creates N physical copies |
| PATCH | `/api/v1/inventory/:id` | Update item (location change skips assigned copies) |
| POST | `/api/v1/inventory/:id/loan` | Loan an available copy |
| POST | `/api/v1/inventory/:id/return` | Return a loaned copy |

### Decklists (template)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/decklists` | All decklists with cards & recalculated status |
| GET | `/api/v1/decklists/:id` | Decklist detail |
| POST | `/api/v1/decklists` | Create decklist `{ name, format, notes? }` |
| PATCH | `/api/v1/decklists/:id` | Update name/format/notes |
| DELETE | `/api/v1/decklists/:id` | Delete decklist (blocked if decks reference it) |
| POST | `/api/v1/decklists/:id/add-card` | Add/merge card slot `{ playableCardKey, catalogCardId, quantity }` |
| POST | `/api/v1/decklists/:id/remove-card` | Remove slot `{ decklistCardId }` |
| POST | `/api/v1/decklists/compare` | Compare text decklist vs inventory |
| POST | `/api/v1/decklists/import-limitless` | Import Limitless TCG export → decklist + slots |
| POST | `/api/v1/decklists/:id/buylist/add-missing` | Add missing cards from decklist to buy list |

### Decks (physical)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/decks` | All decks with decklist, assignments & recalculated status |
| GET | `/api/v1/decks/:id` | Deck detail |
| POST | `/api/v1/decks` | Create deck from decklist `{ decklistId, name?, notes? }` |
| PATCH | `/api/v1/decks/:id` | Update name/notes |
| DELETE | `/api/v1/decks/:id` | Delete deck & release copies |
| POST | `/api/v1/decks/:id/assign-card` | Assign copy `{ decklistCardId, physicalCopyId }` |
| POST | `/api/v1/decks/:id/remove-card` | Unassign copy `{ decklistCardId, physicalCopyId }` |
| POST | `/api/v1/decks/:id/buylist/add-missing` | Add missing copies from physical deck to buy list |

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
| GET | `/api/v1/buylist` | List buy list items (`status`, `sourceDeckId`, `sourceDecklistId`, `priority` filters) |
| POST | `/api/v1/buylist` | Add item manually (deduplicates pending by `playableCardKey` + source) |
| PATCH | `/api/v1/buylist/:id` | Update quantity, priority, status, notes |
| POST | `/api/v1/buylist/:id/status` | Shortcut to change status only |
| DELETE | `/api/v1/buylist/:id` | Remove item |
| POST | `/api/v1/buylist/clear-purchased` | Delete all purchased items |

When a deck or decklist is deleted, linked buy list items keep their record but `sourceDeckId` / `sourceDecklistId` is set to `null`.

## Error format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "hint": "Optional suggestion to fix the issue",
    "details": {}
  }
}
```

Codes: `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `COPY_NOT_AVAILABLE`, `DECK_SLOT_FULL`, `COPY_DOES_NOT_MATCH_SLOT`, `DECKLIST_IN_USE`, `LOCATION_IN_USE`, `DATABASE_ERROR`, `DATABASE_NOT_READY`, `EXTERNAL_API_ERROR`, `INTERNAL_ERROR`.

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

## Status rules

### Decklist

- `totalQuantity > 60` → **invalid**
- `totalQuantity === 60` → **complete**
- otherwise → **incomplete**

### Deck

- Based on its linked decklist composition + physical copy assignments
- `totalQuantity > 60` → **invalid**
- `totalQuantity === 60` and every slot fully assigned → **complete**
- otherwise → **incomplete**

Status is always computed server-side.

## License

MIT
