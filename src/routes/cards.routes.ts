import { Router } from 'express';
import { asyncHandler, validateBody, validateQuery } from '../utils/middleware';
import { cardController } from '../controllers/card.controller';
import { cardSearchQuerySchema } from '../schemas';

const router = Router();

router.get('/search', validateQuery(cardSearchQuerySchema), asyncHandler(cardController.search));
router.get('/:id', asyncHandler(cardController.getById));

export default router;
