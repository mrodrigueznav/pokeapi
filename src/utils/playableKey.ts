/**
 * Returns a normalized key for matching playable cards across catalog prints.
 * Example: playableKey("Charizard ex", "Pokémon") → "Pokémon::charizard ex"
 */
export function playableKey(name: string, supertype: string): string {
  return `${supertype}::${name.trim().toLowerCase()}`;
}

/**
 * Maps Prisma Supertype enum value to display string with accent.
 */
export function supertypeToDisplay(supertype: string): string {
  if (supertype === 'Pokemon') return 'Pokémon';
  return supertype;
}

/**
 * Maps display supertype string to Prisma enum value.
 */
export function supertypeFromDisplay(supertype: string): 'Pokemon' | 'Trainer' | 'Energy' {
  const normalized = supertype === 'Pokémon' ? 'Pokemon' : supertype;
  if (normalized === 'Pokemon' || normalized === 'Trainer' || normalized === 'Energy') {
    return normalized;
  }
  throw new Error(`Invalid supertype: ${supertype}`);
}
