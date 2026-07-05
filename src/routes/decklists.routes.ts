import { Router } from 'express';
import { asyncHandler, validateBody } from '../utils/middleware';
import { decklistController } from '../controllers/decklist.controller';
import { compareDecklistSchema, importLimitlessDecklistSchema } from '../schemas';

const router = Router();

router.post('/compare', validateBody(compareDecklistSchema), asyncHandler(decklistController.compare));
router.post(
  '/import-limitless',
  validateBody(importLimitlessDecklistSchema),
  asyncHandler(decklistController.importLimitless)
);

export default router;
