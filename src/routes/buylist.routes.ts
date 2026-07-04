import { Router } from 'express';
import { asyncHandler, validateBody, validateQuery } from '../utils/middleware';
import { buylistController } from '../controllers/buylist.controller';
import {
  addBuyListSchema,
  buyListQuerySchema,
  updateBuyListSchema,
  updateBuyListStatusSchema,
} from '../schemas';

const router = Router();

router.get('/', validateQuery(buyListQuerySchema), asyncHandler(buylistController.list));
router.post('/', validateBody(addBuyListSchema), asyncHandler(buylistController.add));
router.post('/clear-purchased', asyncHandler(buylistController.clearPurchased));
router.patch('/:id', validateBody(updateBuyListSchema), asyncHandler(buylistController.update));
router.post(
  '/:id/status',
  validateBody(updateBuyListStatusSchema),
  asyncHandler(buylistController.updateStatus)
);
router.delete('/:id', asyncHandler(buylistController.delete));

export default router;
