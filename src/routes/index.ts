import { Router } from 'express';
import cardsRoutes from './cards.routes';
import inventoryRoutes from './inventory.routes';
import decksRoutes from './decks.routes';
import locationsRoutes from './locations.routes';
import movementsRoutes from './movements.routes';
import decklistsRoutes from './decklists.routes';
import buylistRoutes from './buylist.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true });
});

router.use('/cards', cardsRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/decks', decksRoutes);
router.use('/locations', locationsRoutes);
router.use('/movements', movementsRoutes);
router.use('/decklists', decklistsRoutes);
router.use('/buylist', buylistRoutes);

export default router;
