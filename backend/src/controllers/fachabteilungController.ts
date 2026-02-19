import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getFachabteilungen = async (req: AuthRequest, res: Response) => {
  try {
    const fachabteilungen = await prisma.fachabteilung.findMany({
      include: {
        _count: { select: { siebe: true, user: true } },
        chefArzt: {
          select: { id: true, vorname: true, nachname: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(fachabteilungen);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const getFachabteilung = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const fachabteilung = await prisma.fachabteilung.findUnique({
      where: { id },
      include: {
        chefArzt: {
          select: { id: true, vorname: true, nachname: true, email: true }
        },
        siebe: {
          where: { typ: 'FACHABTEILUNGSSPEZIFISCH' },
          include: {
            _count: { select: { instrumente: true } }
          }
        },
        user: {
          select: { id: true, vorname: true, nachname: true, rolle: true }
        }
      }
    });

    if (!fachabteilung) {
      return res.status(404).json({ error: 'Fachabteilung nicht gefunden' });
    }

    res.json(fachabteilung);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const createFachabteilung = async (req: AuthRequest, res: Response) => {
  try {
    const { name, kuerzel, beschreibung, chefArztId } = req.body;

    const fachabteilung = await prisma.fachabteilung.create({
      data: {
        name,
        kuerzel,
        beschreibung,
        chefArztId
      },
      include: {
        chefArzt: {
          select: { id: true, vorname: true, nachname: true }
        }
      }
    });

    res.status(201).json(fachabteilung);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const updateFachabteilung = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, kuerzel, beschreibung, chefArztId } = req.body;

    const fachabteilung = await prisma.fachabteilung.update({
      where: { id },
      data: {
        name,
        kuerzel,
        beschreibung,
        chefArztId
      },
      include: {
        chefArzt: {
          select: { id: true, vorname: true, nachname: true }
        }
      }
    });

    res.json(fachabteilung);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const deleteFachabteilung = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const siebeCount = await prisma.sieb.count({
      where: { fachabteilungId: id }
    });

    if (siebeCount > 0) {
      return res.status(400).json({ 
        error: 'Fachabteilung hat noch zugeordnete Siebe' 
      });
    }

    await prisma.fachabteilung.delete({
      where: { id }
    });

    res.json({ message: 'Fachabteilung gelöscht' });
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};
