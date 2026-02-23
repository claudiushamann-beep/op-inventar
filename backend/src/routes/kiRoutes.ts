import { Router } from 'express';
import { kiSearch, getKiSettings, updateKiSettings } from '../controllers/kiController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireMinRolle, requireRolle } from '../middleware/rbac.js';
import { Rolle } from '@prisma/client';

const router = Router();

router.post('/search', authMiddleware, requireMinRolle(Rolle.OBERARZT), kiSearch);
router.get('/settings', authMiddleware, requireRolle(Rolle.OP_MANAGER), getKiSettings);
router.put('/settings', authMiddleware, requireRolle(Rolle.OP_MANAGER), updateKiSettings);

export const kiRoutes = router;
