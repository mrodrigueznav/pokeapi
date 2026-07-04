import { Request, Response } from 'express';
import { deckService } from '../services/deck.service';
import { mapDeck } from '../utils/mappers';
import {
  CreateDeckInput,
  UpdateDeckInput,
  AddCardSlotInput,
  RemoveCardSlotInput,
  AssignCardInput,
  RemoveCardInput,
} from '../schemas';
import { notFound } from '../utils/errors';
import { getParam } from '../utils/params';

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
    const input = req.body as CreateDeckInput;
    const deck = await deckService.create(input);
    res.status(201).json(mapDeck(deck));
  },

  async update(req: Request, res: Response): Promise<void> {
    const input = req.body as UpdateDeckInput;
    const deck = await deckService.update(getParam(req, 'id'), input);
    res.json(mapDeck(deck));
  },

  async delete(req: Request, res: Response): Promise<void> {
    await deckService.delete(getParam(req, 'id'));
    res.status(204).send();
  },

  async addCardSlot(req: Request, res: Response): Promise<void> {
    const input = req.body as AddCardSlotInput;
    const deck = await deckService.addCardSlot(getParam(req, 'id'), input);
    res.json(mapDeck(deck));
  },

  async removeCardSlot(req: Request, res: Response): Promise<void> {
    const { deckCardId } = req.body as RemoveCardSlotInput;
    const deck = await deckService.removeCardSlot(getParam(req, 'id'), deckCardId);
    res.json(mapDeck(deck));
  },

  async assignCard(req: Request, res: Response): Promise<void> {
    const { deckCardId, physicalCopyId } = req.body as AssignCardInput;
    const deck = await deckService.assignCard(getParam(req, 'id'), deckCardId, physicalCopyId);
    res.json(mapDeck(deck));
  },

  async removeCard(req: Request, res: Response): Promise<void> {
    const { deckCardId, physicalCopyId } = req.body as RemoveCardInput;
    const deck = await deckService.removeCard(getParam(req, 'id'), deckCardId, physicalCopyId);
    res.json(mapDeck(deck));
  },
};
