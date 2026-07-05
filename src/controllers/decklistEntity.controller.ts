import { Request, Response } from 'express';
import { decklistEntityService } from '../services/decklistEntity.service';
import { limitlessDecklistService } from '../services/limitlessDecklist.service';
import { decklistService } from '../services/decklist.service';
import { buylistService } from '../services/buylist.service';
import { mapDecklist, mapBuyListItem } from '../utils/mappers';
import {
  CreateDecklistInput,
  UpdateDecklistInput,
  AddDecklistCardInput,
  RemoveDecklistCardInput,
  CompareDecklistInput,
  ImportLimitlessDecklistInput,
} from '../schemas';
import { getValidatedBody, getValidatedQuery } from '../utils/middleware';
import { getParam } from '../utils/params';
import { notFound } from '../utils/errors';

export const decklistEntityController = {
  async list(_req: Request, res: Response): Promise<void> {
    const decklists = await decklistEntityService.list();
    res.json(decklists.map(mapDecklist));
  },

  async getById(req: Request, res: Response): Promise<void> {
    const id = getParam(req, 'id');
    const decklist = await decklistEntityService.getById(id);
    if (!decklist) throw notFound('Decklist', id);
    res.json(mapDecklist(decklist));
  },

  async create(req: Request, res: Response): Promise<void> {
    const input = getValidatedBody<CreateDecklistInput>(req);
    const decklist = await decklistEntityService.create(input);
    res.status(201).json(mapDecklist(decklist));
  },

  async update(req: Request, res: Response): Promise<void> {
    const input = getValidatedBody<UpdateDecklistInput>(req);
    const decklist = await decklistEntityService.update(getParam(req, 'id'), input);
    res.json(mapDecklist(decklist));
  },

  async delete(req: Request, res: Response): Promise<void> {
    await decklistEntityService.delete(getParam(req, 'id'));
    res.status(204).send();
  },

  async addCard(req: Request, res: Response): Promise<void> {
    const input = getValidatedBody<AddDecklistCardInput>(req);
    const decklist = await decklistEntityService.addCard(getParam(req, 'id'), input);
    res.json(mapDecklist(decklist));
  },

  async removeCard(req: Request, res: Response): Promise<void> {
    const { decklistCardId } = getValidatedBody<RemoveDecklistCardInput>(req);
    const decklist = await decklistEntityService.removeCard(getParam(req, 'id'), decklistCardId);
    res.json(mapDecklist(decklist));
  },

  async compare(req: Request, res: Response): Promise<void> {
    const { decklist } = getValidatedBody<CompareDecklistInput>(req);
    const result = await decklistService.compare(decklist);
    res.json(result);
  },

  async importLimitless(req: Request, res: Response): Promise<void> {
    const input = getValidatedBody<ImportLimitlessDecklistInput>(req);
    const parsed = await limitlessDecklistService.import(input.decklist);

    let savedDecklist = null;
    if (input.save) {
      savedDecklist = await limitlessDecklistService.saveAsDecklist(parsed.slots, {
        name: input.name ?? 'Imported from Limitless TCG',
        format: input.format ?? 'Standard',
        notes: input.notes ?? null,
      });
    }

    res.json({
      ...parsed,
      decklistId: savedDecklist?.id ?? null,
      savedDecklist: savedDecklist ? mapDecklist(savedDecklist) : null,
    });
  },

  async addMissingToBuylist(req: Request, res: Response): Promise<void> {
    const result = await buylistService.addMissingFromDecklist(getParam(req, 'id'));
    res.json({
      added: result.added,
      items: result.items.map(mapBuyListItem),
    });
  },
};
