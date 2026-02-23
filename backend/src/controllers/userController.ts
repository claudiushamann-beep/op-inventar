import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        vorname: true,
        nachname: true,
        rolle: true,
        active: true,
        fachabteilung: true,
        createdAt: true
      },
      orderBy: { nachname: 'asc' }
    });

    res.json(users);
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        vorname: true,
        nachname: true,
        rolle: true,
        active: true,
        fachabteilung: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    res.json(user);
  } catch (error) {
    console.error('getUser error:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { vorname, nachname, email, rolle, active, fachabteilungId } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        vorname,
        nachname,
        email,
        rolle,
        active,
        fachabteilungId: fachabteilungId || null
      },
      select: {
        id: true,
        username: true,
        email: true,
        vorname: true,
        nachname: true,
        rolle: true,
        active: true,
        fachabteilung: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('updateUser error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'E-Mail bereits vergeben' });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }
    }
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Eigenen Account kann nicht gelöscht werden' });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'Benutzer gelöscht' });
  } catch (error) {
    console.error('deleteUser error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }
    }
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, passwort, vorname, nachname, rolle, fachabteilungId } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Benutzername oder E-Mail bereits vergeben' });
    }

    const passwortHash = await bcrypt.hash(passwort, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwortHash,
        vorname,
        nachname,
        rolle,
        active: true,
        fachabteilungId: fachabteilungId || null
      },
      select: {
        id: true,
        username: true,
        email: true,
        vorname: true,
        nachname: true,
        rolle: true,
        active: true,
        fachabteilung: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('createUser error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'Benutzername oder E-Mail bereits vergeben' });
      }
    }
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const passwortHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { passwortHash }
    });

    res.json({ message: 'Passwort erfolgreich zurückgesetzt' });
  } catch (error) {
    console.error('resetPassword error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' });
      }
    }
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (id !== req.user!.id) {
      return res.status(403).json({ error: 'Nur eigenes Passwort kann geändert werden' });
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const bcryptLib = await import('bcryptjs');
    const isValid = await bcryptLib.compare(oldPassword, user.passwortHash);

    if (!isValid) {
      return res.status(400).json({ error: 'Altes Passwort falsch' });
    }

    const passwortHash = await bcryptLib.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { passwortHash }
    });

    res.json({ message: 'Passwort erfolgreich geändert' });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};
