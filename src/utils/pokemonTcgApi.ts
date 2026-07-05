import { PokemonTcgApiCard, CardCatalogItemDto } from '../types';
import { supertypeFromDisplay } from './playableKey';
import { Supertype } from '@prisma/client';

const BASE_URL = 'https://api.pokemontcg.io/v2';

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const apiKey = process.env.POKEMON_TCG_API_KEY;
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }
  return headers;
}

export function normalizePokemonCard(card: PokemonTcgApiCard): {
  id: string;
  name: string;
  supertype: Supertype;
  subtypes: string[];
  types: string[];
  setId: string;
  setName: string;
  number: string;
  rarity: string;
  imageUrl: string;
  imageUrlLarge: string | null;
  regulationMark: string | null;
  legalities: Record<string, string> | null;
  rules: string[];
} {
  return {
    id: card.id,
    name: card.name,
    supertype: supertypeFromDisplay(card.supertype),
    subtypes: card.subtypes ?? [],
    types: card.types ?? [],
    setId: card.set.id,
    setName: card.set.name,
    number: card.number,
    rarity: card.rarity,
    imageUrl: card.images.small,
    imageUrlLarge: card.images.large ?? null,
    regulationMark: card.regulationMark ?? null,
    legalities: card.legalities ?? null,
    rules: card.rules ?? [],
  };
}

export function toCatalogDto(card: {
  id: string;
  name: string;
  supertype: Supertype;
  subtypes: string[];
  types: string[];
  setId: string;
  setName: string;
  number: string;
  rarity: string;
  imageUrl: string;
  imageUrlLarge: string | null;
  regulationMark: string | null;
  legalities: unknown;
  rules: string[];
}): CardCatalogItemDto {
  const supertypeDisplay =
    card.supertype === 'Pokemon' ? 'Pokémon' : card.supertype;

  return {
    id: card.id,
    name: card.name,
    supertype: supertypeDisplay,
    subtypes: card.subtypes,
    types: card.types,
    setId: card.setId,
    setName: card.setName,
    number: card.number,
    rarity: card.rarity,
    imageUrl: card.imageUrl,
    imageUrlLarge: card.imageUrlLarge,
    regulationMark: card.regulationMark,
    legalities: card.legalities as Record<string, string> | null,
    rules: card.rules,
  };
}

export interface CardSearchParams {
  q?: string;
  supertype?: string;
  subtype?: string;
  setId?: string;
  rarity?: string;
  page?: number;
  pageSize?: number;
}

function buildSearchQuery(params: CardSearchParams): string {
  const parts: string[] = [];

  if (params.q) {
    parts.push(`name:"${params.q}*"`);
  }
  if (params.supertype) {
    parts.push(`supertype:"${params.supertype}"`);
  }
  if (params.subtype) {
    parts.push(`subtypes:"${params.subtype}"`);
  }
  if (params.setId) {
    parts.push(`set.id:"${params.setId}"`);
  }
  if (params.rarity) {
    parts.push(`rarity:"${params.rarity}"`);
  }

  return parts.length > 0 ? parts.join(' ') : '';
}

export async function searchPokemonTcgApi(params: CardSearchParams): Promise<{
  data: CardCatalogItemDto[];
  page: number;
  pageSize: number;
  totalCount: number;
}> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;

  const query = buildSearchQuery(params);
  const url = new URL(`${BASE_URL}/cards`);
  if (query) url.searchParams.set('q', query);
  url.searchParams.set('page', String(page));
  url.searchParams.set('pageSize', String(pageSize));

  const response = await fetch(url.toString(), { headers: getHeaders() });

  if (!response.ok) {
    throw new Error(`Pokemon TCG API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as {
    data: PokemonTcgApiCard[];
    page: number;
    pageSize: number;
    totalCount: number;
  };

  return {
    data: json.data.map((c) => toCatalogDto(normalizePokemonCard(c))),
    page: json.page,
    pageSize: json.pageSize,
    totalCount: json.totalCount,
  };
}

export async function fetchPokemonCardById(id: string): Promise<CardCatalogItemDto | null> {
  const url = `${BASE_URL}/cards/${encodeURIComponent(id)}`;
  const response = await fetch(url, { headers: getHeaders() });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Pokemon TCG API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as { data: PokemonTcgApiCard };
  return toCatalogDto(normalizePokemonCard(json.data));
}

export async function searchPokemonCardBySetAndNumber(
  setCode: string,
  number: string,
  name?: string
): Promise<CardCatalogItemDto | null> {
  const queries = [
    `number:${number} set.id:${setCode.toLowerCase()}`,
    name ? `number:${number} name:"${name}"` : null,
    name ? `name:"${name}"` : null,
  ].filter((q): q is string => q !== null);

  for (const q of queries) {
    const url = new URL(`${BASE_URL}/cards`);
    url.searchParams.set('q', q);
    url.searchParams.set('pageSize', '1');

    const response = await fetch(url.toString(), { headers: getHeaders() });
    if (!response.ok) continue;

    const json = (await response.json()) as { data: PokemonTcgApiCard[] };
    if (json.data.length > 0) {
      return toCatalogDto(normalizePokemonCard(json.data[0]));
    }
  }

  return null;
}
