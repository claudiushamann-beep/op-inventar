import { Router } from 'express';
import {
  getFachabteilungen, getFachabteilung, createFachabteilung,
  updateFachabteilung, deleteFachabteilung
} from '../controllers/fachabteilungController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireMinRolle } from '../middleware/rbac.js';
import { Rolle } from '@prisma/client';

export const fachabteilungRoutes = Router();

fachabteilungRoutes.get('/', authMiddleware, getFachabteilungen);
fachabteilungRoutes.get('/:id', authMiddleware, getFachabteilung);
fachabteilungRoutes.post('/', authMiddleware, requireMinRolle(Rolle.OP_MANAGER), createFachabteilung);
fachabteilungRoutes.put('/:id', authMiddleware, requireMinRolle(Rolle.OP_MANAGER), updateFachabteilung);
fachabteilungRoutes.delete('/:id', authMiddleware, requireMinRolle(Rolle.OP_MANAGER), deleteFachabteilung);
