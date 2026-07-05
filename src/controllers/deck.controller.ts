import { Request, Response } from 'express';
import { deckService } from '../services/deck.service';
import { buylistService } from '../services/buylist.service';
import { mapDeck, mapBuyListItem } from '../utils/mappers';
import {
  CreateDeckInput,
  UpdateDeckInput,
  AssignCardInput,
  RemoveCardInput,
} from '../schemas';
import { notFound } from '../utils/errors';
import { getParam } from '../utils/params';
import { getValidatedBody } from '../utils/middleware';

export const deckController = {
  async list(_req: Request, res: Response): Promise<void> {
    const decks = await deckService.list();
    res.json(decks.map(mapDeck));
  },

  async getById(req: Request, res: Response): Promise<void> {
    const id = getParam(req, 'id');
    const deck = await deckService.getById(id);
    if (!deck) throw notFound('Deck', id);
    res.json(mapDeck(deck));
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = getValidatedBody<CreateDeckInput>(req);
    const deck = await deckService.create(input);
    res.status(201).json(mapDeck(deck));
  },

  async update(req: Request, res: Response): Promise<void> {
    const input = getValidatedBody<UpdateDeckInput>(req);
    const deck = await deckService.update(getParam(req, 'id'), input);
    res.json(mapDeck(deck));
  },

  async delete(req: Request, res: Response): Promise<void> {
    await deckService.delete(getParam(req, 'id'));
    res.status(204).send();
  },

  async assignCard(req: Request, res: Response): Promise<void> {
    const { decklistCardId, physicalCopyId } = getValidatedBody<AssignCardInput>(req);
    const deck = await deckService.assignCard(getParam(req, 'id'), decklistCardId, physicalCopyId);
    res.json(mapDeck(deck));
  },

  async removeCard(req: Request, res: Response): Promise<void> {
    const { decklistCardId, physicalCopyId } = getValidatedBody<RemoveCardInput>(req);
    const deck = await deckService.removeCard(getParam(req, 'id'), decklistCardId, physicalCopyId);
    res.json(mapDeck(deck));
  },

  async addMissingToBuylist(req: Request, res: Response): Promise<void> {
    const result = await buylistService.addMissingFromDeck(getParam(req, 'id'));
    res.json({
      added: result.added,
      items: result.items.map(mapBuyListItem),
    });
  },
};
