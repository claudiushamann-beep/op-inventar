import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    rolle: string;
    fachabteilungId?: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Kein Token vorhanden' });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      username: string;
      rolle: string;
      fachabteilungId?: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, rolle: true, active: true, fachabteilungId: true }
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Benutzer nicht gefunden oder inaktiv' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      rolle: user.rolle,
      fachabteilungId: user.fachabteilungId || undefined
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Ungültiger Token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
        username: string;
        rolle: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, rolle: true, active: true, fachabteilungId: true }
      });

      if (user && user.active) {
        req.user = {
          id: user.id,
          username: user.username,
          rolle: user.rolle,
          fachabteilungId: user.fachabteilungId || undefined
        };
      }
    }
    next();
  } catch {
    next();
  }
};
