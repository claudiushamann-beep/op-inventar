import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getHersteller = async (req: AuthRequest, res: Response) => {
  try {
    const hersteller = await prisma.hersteller.findMany({
      include: {
        _count: { select: { instrumente: true } }
      },
      orderBy: { name: 'asc' }
    });

    res.json(hersteller);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const getHerstellerById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const hersteller = await prisma.hersteller.findUnique({
      where: { id },
      include: {
        instrumente: {
          take: 50,
          orderBy: { bezeichnung: 'asc' }
        },
        _count: { select: { instrumente: true } }
      }
    });

    if (!hersteller) {
      return res.status(404).json({ error: 'Hersteller nicht gefunden' });
    }

    res.json(hersteller);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const createHersteller = async (req: AuthRequest, res: Response) => {
  try {
    const { name, katalogPfad, website, kontaktEmail } = req.body;

    const hersteller = await prisma.hersteller.create({
      data: {
        name,
        katalogPfad,
        website,
        kontaktEmail
      }
    });

    res.status(201).json(hersteller);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const updateHersteller = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, katalogPfad, website, kontaktEmail } = req.body;

    const hersteller = await prisma.hersteller.update({
      where: { id },
      data: {
        name,
        katalogPfad,
        website,
        kontaktEmail
      }
    });

    res.json(hersteller);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const deleteHersteller = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const instrumenteCount = await prisma.instrument.count({
      where: { herstellerId: id }
    });

    if (instrumenteCount > 0) {
      return res.status(400).json({ 
        error: 'Hersteller hat noch zugeordnete Instrumente' 
      });
    }

    await prisma.hersteller.delete({
      where: { id }
    });

    res.json({ message: 'Hersteller gelöscht' });
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};
