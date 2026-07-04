import { Router } from 'express';
import { asyncHandler, validateBody } from '../utils/middleware';
import { locationController } from '../controllers/location.controller';
import { createLocationSchema } from '../schemas';

const router = Router();

router.get('/', asyncHandler(locationController.list));
router.post('/', validateBody(createLocationSchema), asyncHandler(locationController.create));
router.delete('/:id', asyncHandler(locationController.delete));

export default router;
