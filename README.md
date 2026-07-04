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

API runs at `http://localhost:4000` by default.

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

### Catalog

| Method | Path | Description |
|--------|------|-------------|
| GET | `/cards/search` | Search Pokémon TCG API (`q`, `supertype`, `subtype`, `setId`, `rarity`, `page`, `pageSize`) |
| GET | `/cards/:id` | Get card (local first, then API) |

### Inventory

| Method | Path | Description |
|--------|------|-------------|
| GET | `/inventory` | List inventory with catalog, copies, location |
| POST | `/inventory` | Add inventory (creates N physical copies) |
| PATCH | `/inventory/:id` | Update item (location change skips assigned copies) |
| POST | `/inventory/:id/loan` | Loan an available copy |
| POST | `/inventory/:id/return` | Return a loaned copy |

### Decks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/decks` | All decks with cards & recalculated status |
| GET | `/decks/:id` | Deck detail |
| POST | `/decks` | Create deck |
| PATCH | `/decks/:id` | Update name/format/notes |
| DELETE | `/decks/:id` | Delete deck & release copies |
| POST | `/decks/:id/add-card-slot` | Add/merge card slot |
| POST | `/decks/:id/remove-card-slot` | Remove slot & release copies |
| POST | `/decks/:id/assign-card` | Assign physical copy to slot |
| POST | `/decks/:id/remove-card` | Unassign copy from slot |

### Decklist comparator

| Method | Path | Description |
|--------|------|-------------|
| POST | `/decklists/compare` | Compare text decklist vs inventory |

### Locations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/locations` | List locations |
| POST | `/locations` | Create location |
| DELETE | `/locations/:id` | Delete (blocked if in use) |

### Movements

| Method | Path | Description |
|--------|------|-------------|
| GET | `/movements` | Audit log (`inventoryItemId`, `physicalCopyId`, `deckId` filters) |

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
