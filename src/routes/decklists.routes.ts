import { Router } from 'express';
import { asyncHandler, validateBody } from '../utils/middleware';
import { decklistController } from '../controllers/decklist.controller';
import { compareDecklistSchema } from '../schemas';

const router = Router();

router.post('/compare', validateBody(compareDecklistSchema), asyncHandler(decklistController.compare));

export default router;
