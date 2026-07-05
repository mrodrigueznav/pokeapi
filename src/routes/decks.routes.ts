import { Router } from 'express';
import { asyncHandler, validateBody } from '../utils/middleware';
import { deckController } from '../controllers/deck.controller';
import {
  createDeckSchema,
  updateDeckSchema,
  assignCardSchema,
  removeCardSchema,
} from '../schemas';

const router = Router();

router.get('/', asyncHandler(deckController.list));
router.get('/:id', asyncHandler(deckController.getById));
router.post('/', validateBody(createDeckSchema), asyncHandler(deckController.create));
router.patch('/:id', validateBody(updateDeckSchema), asyncHandler(deckController.update));
router.delete('/:id', asyncHandler(deckController.delete));
router.post(
  '/:id/assign-card',
  validateBody(assignCardSchema),
  asyncHandler(deckController.assignCard)
);
router.post(
  '/:id/remove-card',
  validateBody(removeCardSchema),
  asyncHandler(deckController.removeCard)
);
router.post('/:id/buylist/add-missing', asyncHandler(deckController.addMissingToBuylist));

export default router;
