export type LimitlessSupertype = 'Pokémon' | 'Trainer' | 'Energy';

export interface ParsedLimitlessLine {
  raw: string;
  quantity: number;
  name: string;
  supertype: LimitlessSupertype;
  setCode: string;
  number: string;
  catalogCardId: string;
}

export interface ParsedLimitlessDecklist {
  lines: ParsedLimitlessLine[];
  sectionCounts: {
    pokemon: number;
    trainer: number;
    energy: number;
  };
  total: number;
  parseErrors: string[];
}

const SECTION_HEADER =
  /^(Pok[eé]mon|Trainer|Energy)\s*:\s*(\d+)\s*$/i;

/** Card line: "{qty} {name} {SET} {number}" e.g. "4 Mega Kangaskhan ex MEG 104" */
const CARD_LINE = /^(\d+)\s+(.+?)\s+([A-Z0-9]{2,4})\s+(\d+[a-zA-Z]?)$/;

function normalizeSupertype(value: string): LimitlessSupertype {
  const lower = value.toLowerCase();
  if (lower === 'pokemon' || lower === 'pokémon') return 'Pokémon';
  if (lower === 'trainer') return 'Trainer';
  return 'Energy';
}

function toCatalogCardId(setCode: string, number: string): string {
  return `${setCode.toLowerCase()}-${number}`;
}

/**
 * Parses Limitless TCG export format with section headers and set/number suffixes.
 */
export function parseLimitlessDecklist(decklist: string): ParsedLimitlessDecklist {
  const lines: ParsedLimitlessLine[] = [];
  const parseErrors: string[] = [];
  let currentSupertype: LimitlessSupertype | null = null;

  const sectionCounts = { pokemon: 0, trainer: 0, energy: 0 };

  const rawLines = decklist
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'));

  for (const raw of rawLines) {
    const sectionMatch = raw.match(SECTION_HEADER);
    if (sectionMatch) {
      currentSupertype = normalizeSupertype(sectionMatch[1]);
      continue;
    }

    const cardMatch = raw.match(CARD_LINE);
    if (!cardMatch) {
      parseErrors.push(`Could not parse line: "${raw}"`);
      continue;
    }

    const quantity = parseInt(cardMatch[1], 10);
    const name = cardMatch[2].trim();
    const setCode = cardMatch[3];
    const number = cardMatch[4];
    const supertype = currentSupertype ?? inferSupertypeFromName(name);

    if (!supertype) {
      parseErrors.push(`No section header before line: "${raw}"`);
      continue;
    }

    if (quantity <= 0 || !name) continue;

    lines.push({
      raw,
      quantity,
      name,
      supertype,
      setCode,
      number,
      catalogCardId: toCatalogCardId(setCode, number),
    });

    switch (supertype) {
      case 'Pokémon':
        sectionCounts.pokemon += quantity;
        break;
      case 'Trainer':
        sectionCounts.trainer += quantity;
        break;
      case 'Energy':
        sectionCounts.energy += quantity;
        break;
    }
  }

  const total = lines.reduce((sum, line) => sum + line.quantity, 0);

  return { lines, sectionCounts, total, parseErrors };
}

function inferSupertypeFromName(name: string): LimitlessSupertype | null {
  const lower = name.toLowerCase();
  if (lower.includes('energy')) return 'Energy';
  if (
    /\b(ex|vstar|vmax| v\b|gx|break|prime)\b/i.test(name) ||
    /^mega\s/i.test(name)
  ) {
    return 'Pokémon';
  }
  return 'Trainer';
}

/**
 * Converts parsed lines to simple decklist text ("4 Card Name" per line).
 */
export function toSimpleDecklist(lines: ParsedLimitlessLine[]): string {
  return lines.map((line) => `${line.quantity} ${line.name}`).join('\n');
}

/**
 * Merges slots with the same catalogCardId (same print).
 */
export function mergeLimitlessLinesByCatalog(
  lines: ParsedLimitlessLine[]
): ParsedLimitlessLine[] {
  const merged = new Map<string, ParsedLimitlessLine>();

  for (const line of lines) {
    const existing = merged.get(line.catalogCardId);
    if (existing) {
      existing.quantity += line.quantity;
      existing.raw = `${existing.quantity} ${existing.name} ${existing.setCode} ${existing.number}`;
    } else {
      merged.set(line.catalogCardId, { ...line });
    }
  }

  return [...merged.values()];
}
