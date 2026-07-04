export interface ParsedDecklistLine {
  raw: string;
  quantity: number;
  name: string;
}

/**
 * Parses decklist lines like "4 Nest Ball" or "1 Professor's Research".
 */
export function parseDecklist(decklist: string): ParsedDecklistLine[] {
  const lines = decklist
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'));

  const rows: ParsedDecklistLine[] = [];

  for (const raw of lines) {
    const match = raw.match(/^(\d+)\s+(.+)$/);
    if (!match) continue;

    const quantity = parseInt(match[1], 10);
    const name = match[2].trim();

    if (quantity > 0 && name) {
      rows.push({ raw, quantity, name });
    }
  }

  return rows;
}

/**
 * Infers supertype from card name heuristics for decklist comparison.
 */
export function inferSupertype(name: string): string | null {
  const lower = name.toLowerCase();

  if (lower.includes('energy')) return 'Energy';

  const trainerKeywords = [
    'ball',
    'research',
    'orders',
    'candy',
    'iono',
    'arven',
    'poffin',
    'switch',
    'counter',
    'belt',
    'glove',
    'tower',
    'rod',
    'communication',
    'escape',
    'nest',
    'ultra',
    'quick',
    'level',
    'rare',
    'superior',
    'rescue',
    'crushing',
    'hammer',
    'tool',
    'stadium',
    'supporter',
    'item',
  ];

  if (trainerKeywords.some((kw) => lower.includes(kw))) return 'Trainer';

  // Pokémon cards often have " ex", " V", " VMAX", etc.
  if (
    /\b(ex|v|vmax|vstar|gx|ex\b| δ|prime|break|lv\.?\s*x)/i.test(name) ||
    /^basic\s/i.test(name)
  ) {
    return 'Pokémon';
  }

  return null;
}
