import { catalogRepository } from '../repositories/catalog.repository';
import { inventoryRepository } from '../repositories/inventory.repository';
import { parseDecklist, inferSupertype } from '../utils/decklistParser';
import { playableKey } from '../utils/playableKey';
import { mapCatalogCard } from '../utils/mappers';
import { DecklistCompareResult } from '../types';

export const decklistService = {
  async compare(decklist: string): Promise<DecklistCompareResult> {
    const lines = parseDecklist(decklist);
    const rows: DecklistCompareResult['rows'] = [];
    let totalMissing = 0;
    let notFound = 0;

    for (const line of lines) {
      const inferredSupertype = inferSupertype(line.name);
      let match = null;
      let playableCardKey: string | null = null;

      if (inferredSupertype) {
        playableCardKey = playableKey(line.name, inferredSupertype);
        const catalogMatch = await catalogRepository.findByPlayableKey(playableCardKey);
        if (catalogMatch) match = mapCatalogCard(catalogMatch);
      }

      if (!match) {
        const byName = await catalogRepository.findByName(line.name);
        if (byName.length > 0) {
          match = mapCatalogCard(byName[0]);
          playableCardKey = playableKey(match.name, match.supertype);
        }
      }

      if (!playableCardKey && match) {
        playableCardKey = playableKey(match.name, match.supertype);
      }

      let owned = 0;
      let available = 0;
      let assigned = 0;

      if (playableCardKey) {
        const inventoryItems = await inventoryRepository.findByPlayableKey(playableCardKey);
        for (const item of inventoryItems) {
          owned += item.physicalCopies.length;
          for (const copy of item.physicalCopies) {
            if (copy.status === 'available') available++;
            if (copy.status === 'assigned') assigned++;
          }
        }
      } else {
        notFound++;
      }

      const missing = Math.max(0, line.quantity - owned);
      totalMissing += missing;

      rows.push({
        raw: line.raw,
        quantity: line.quantity,
        name: line.name,
        match,
        owned,
        available,
        assigned,
        missing,
      });
    }

    const total = rows.reduce((sum, r) => sum + r.quantity, 0);

    return {
      rows,
      total,
      missing: totalMissing,
      notFound,
    };
  },
};
