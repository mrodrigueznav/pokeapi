import { Router } from 'express';
import { asyncHandler, validateQuery } from '../utils/middleware';
import { movementController } from '../controllers/movement.controller';
import { movementQuerySchema } from '../schemas';

const router = Router();

router.get('/', validateQuery(movementQuerySchema), asyncHandler(movementController.list));

export default router;
