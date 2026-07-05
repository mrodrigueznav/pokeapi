import { Router } from 'express';
import { asyncHandler, validateBody } from '../utils/middleware';
import { decklistEntityController } from '../controllers/decklistEntity.controller';
import {
  createDecklistSchema,
  updateDecklistSchema,
  addDecklistCardSchema,
  removeDecklistCardSchema,
  compareDecklistSchema,
  importLimitlessDecklistSchema,
} from '../schemas';

const router = Router();

router.get('/', asyncHandler(decklistEntityController.list));
router.get('/:id', asyncHandler(decklistEntityController.getById));
router.post('/', validateBody(createDecklistSchema), asyncHandler(decklistEntityController.create));
router.patch('/:id', validateBody(updateDecklistSchema), asyncHandler(decklistEntityController.update));
router.delete('/:id', asyncHandler(decklistEntityController.delete));
router.post(
  '/:id/add-card',
  validateBody(addDecklistCardSchema),
  asyncHandler(decklistEntityController.addCard)
);
router.post(
  '/:id/remove-card',
  validateBody(removeDecklistCardSchema),
  asyncHandler(decklistEntityController.removeCard)
);
router.post('/compare', validateBody(compareDecklistSchema), asyncHandler(decklistEntityController.compare));
router.post(
  '/import-limitless',
  validateBody(importLimitlessDecklistSchema),
  asyncHandler(decklistEntityController.importLimitless)
);
router.post('/:id/buylist/add-missing', asyncHandler(decklistEntityController.addMissingToBuylist));

export default router;
