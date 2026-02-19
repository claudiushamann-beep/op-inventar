import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { fachabteilung: true }
    });

    if (!user || !user.active) {
      await prisma.loginLog.create({
        data: {
          userId: 'unknown',
          ipAdresse: req.ip,
          erfolg: false
        }
      }).catch(() => {});
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwortHash);

    if (!isValidPassword) {
      await prisma.loginLog.create({
        data: {
          userId: user.id,
          ipAdresse: req.ip,
          erfolg: false
        }
      });
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    await prisma.loginLog.create({
      data: {
        userId: user.id,
        ipAdresse: req.ip,
        erfolg: true
      }
    });

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        rolle: user.rolle,
        fachabteilungId: user.fachabteilungId
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        vorname: user.vorname,
        nachname: user.nachname,
        rolle: user.rolle,
        fachabteilung: user.fachabteilung
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { fachabteilung: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      vorname: user.vorname,
      nachname: user.nachname,
      rolle: user.rolle,
      fachabteilung: user.fachabteilung
    });
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  res.json({ message: 'Erfolgreich abgemeldet' });
};

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password, vorname, nachname, rolle, fachabteilungId } = req.body;

    if (!username || !email || !password || !vorname || !nachname || !rolle) {
      return res.status(400).json({ error: 'Alle Pflichtfelder erforderlich' });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Benutzername oder Email bereits vergeben' });
    }

    const passwortHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwortHash,
        vorname,
        nachname,
        rolle,
        fachabteilungId: fachabteilungId || null
      },
      include: { fachabteilung: true }
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      vorname: user.vorname,
      nachname: user.nachname,
      rolle: user.rolle,
      fachabteilung: user.fachabteilung
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};
