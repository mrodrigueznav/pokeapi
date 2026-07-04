import { Router } from 'express';
import { asyncHandler, validateBody } from '../utils/middleware';
import { deckController } from '../controllers/deck.controller';
import {
  createDeckSchema,
  updateDeckSchema,
  addCardSlotSchema,
  removeCardSlotSchema,
  assignCardSchema,
  removeCardSchema,
} from '../schemas';
import { buylistController } from '../controllers/buylist.controller';

const router = Router();

router.get('/', asyncHandler(deckController.list));
router.post(
  '/:deckId/buylist/add-missing',
  asyncHandler(buylistController.addMissingFromDeck)
);
router.get('/:id', asyncHandler(deckController.getById));
router.post('/', validateBody(createDeckSchema), asyncHandler(deckController.create));
router.patch('/:id', validateBody(updateDeckSchema), asyncHandler(deckController.update));
router.delete('/:id', asyncHandler(deckController.delete));
router.post(
  '/:id/add-card-slot',
  validateBody(addCardSlotSchema),
  asyncHandler(deckController.addCardSlot)
);
router.post(
  '/:id/remove-card-slot',
  validateBody(removeCardSlotSchema),
  asyncHandler(deckController.removeCardSlot)
);
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

export default router;
