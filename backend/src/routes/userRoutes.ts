import { Router } from 'express';
import { getUsers, getUser, updateUser, deleteUser, changePassword } from '../controllers/userController.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { requireRolle } from '../middleware/rbac.js';
import { Rolle } from '@prisma/client';

export const userRoutes = Router();

userRoutes.get('/', authMiddleware, requireRolle(Rolle.CHEFARZT, Rolle.OP_MANAGER, Rolle.AEMP_MITARBEITER), getUsers);
userRoutes.get('/:id', authMiddleware, getUser);
userRoutes.put('/:id', authMiddleware, updateUser);
userRoutes.delete('/:id', authMiddleware, requireRolle(Rolle.OP_MANAGER), deleteUser);
userRoutes.post('/:id/change-password', authMiddleware, changePassword);
