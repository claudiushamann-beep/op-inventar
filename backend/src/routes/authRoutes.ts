import { Router } from 'express';
import { login, getMe, logout, register } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

export const authRoutes = Router();

authRoutes.post('/login', login);
authRoutes.post('/logout', logout);
authRoutes.get('/me', authMiddleware, getMe);
authRoutes.post('/register', authMiddleware, register);
