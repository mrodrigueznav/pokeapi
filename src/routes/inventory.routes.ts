import { Router } from 'express';
import { asyncHandler, validateBody } from '../utils/middleware';
import { inventoryController } from '../controllers/inventory.controller';
import {
  createInventorySchema,
  updateInventorySchema,
  loanCopySchema,
  returnCopySchema,
} from '../schemas';

const router = Router();

router.get('/', asyncHandler(inventoryController.list));
router.post('/', validateBody(createInventorySchema), asyncHandler(inventoryController.create));
router.patch('/:id', validateBody(updateInventorySchema), asyncHandler(inventoryController.update));
router.post(
  '/:inventoryItemId/loan',
  validateBody(loanCopySchema),
  asyncHandler(inventoryController.loan)
);
router.post(
  '/:inventoryItemId/return',
  validateBody(returnCopySchema),
  asyncHandler(inventoryController.returnCopy)
);

export default router;
