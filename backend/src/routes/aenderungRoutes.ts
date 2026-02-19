import { Router } from 'express';
import {
  getAenderungen, getPendingAenderungen, createAenderung,
  approveAenderung, rejectAenderung
} from '../controllers/aenderungController.js';
import { authMiddleware } from '../middleware/auth.js';
import { canRequestAenderung } from '../middleware/rbac.js';

export const aenderungRoutes = Router();

aenderungRoutes.get('/', authMiddleware, getAenderungen);
aenderungRoutes.get('/pending', authMiddleware, getPendingAenderungen);
aenderungRoutes.post('/', authMiddleware, canRequestAenderung, createAenderung);
aenderungRoutes.post('/:id/approve', authMiddleware, approveAenderung);
aenderungRoutes.post('/:id/reject', authMiddleware, rejectAenderung);
