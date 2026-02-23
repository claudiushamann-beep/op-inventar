import { Router } from 'express';
import { login, getMe, logout, register } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRolle } from '../middleware/rbac.js';
import { Rolle } from '@prisma/client';

export const authRoutes = Router();

authRoutes.post('/login', login);
authRoutes.post('/logout', logout);
authRoutes.get('/me', authMiddleware, getMe);
authRoutes.post('/register', authMiddleware, requireRolle(Rolle.OP_MANAGER), register);
