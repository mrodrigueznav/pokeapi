import { catalogRepository } from '../repositories/catalog.repository';
import {
  searchPokemonTcgApi,
  fetchPokemonCardById,
  normalizePokemonCard,
} from '../utils/pokemonTcgApi';
import { mapCatalogCard } from '../utils/mappers';
import { CardCatalogItemDto } from '../types';
import { notFound } from '../utils/errors';
import { CardSearchParams } from '../utils/pokemonTcgApi';

export const cardService = {
  async search(params: CardSearchParams) {
    const result = await searchPokemonTcgApi(params);

    for (const card of result.data) {
      await catalogRepository.saveFromApi(
        normalizePokemonCard({
          id: card.id,
          name: card.name,
          supertype: card.supertype,
          subtypes: card.subtypes,
          types: card.types,
          set: { id: card.setId, name: card.setName },
          number: card.number,
          rarity: card.rarity,
          images: { small: card.imageUrl, large: card.imageUrlLarge ?? undefined },
          regulationMark: card.regulationMark ?? undefined,
          legalities: card.legalities ?? undefined,
          rules: card.rules,
        })
      );
    }

    return result;
  },

  async getById(id: string): Promise<CardCatalogItemDto> {
    const local = await catalogRepository.findById(id);
    if (local) return mapCatalogCard(local);

    const remote = await fetchPokemonCardById(id);
    if (!remote) throw notFound('Card', id);

    const saved = await catalogRepository.saveFromApi(
      normalizePokemonCard({
        id: remote.id,
        name: remote.name,
        supertype: remote.supertype,
        subtypes: remote.subtypes,
        types: remote.types,
        set: { id: remote.setId, name: remote.setName },
        number: remote.number,
        rarity: remote.rarity,
        images: { small: remote.imageUrl, large: remote.imageUrlLarge ?? undefined },
        regulationMark: remote.regulationMark ?? undefined,
        legalities: remote.legalities ?? undefined,
        rules: remote.rules,
      })
    );

    return mapCatalogCard(saved);
  },
};
