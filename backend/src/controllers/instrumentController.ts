import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getInstrumente = async (req: AuthRequest, res: Response) => {
  try {
    const { herstellerId, search } = req.query;

    const where: any = {};
    
    if (herstellerId) {
      where.herstellerId = herstellerId;
    }
    if (search) {
      where.OR = [
        { artikelNr: { contains: search as string, mode: 'insensitive' } },
        { bezeichnung: { contains: search as string, mode: 'insensitive' } },
        { beschreibung: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const instrumente = await prisma.instrument.findMany({
      where,
      include: { hersteller: true },
      orderBy: [{ hersteller: { name: 'asc' } }, { bezeichnung: 'asc' }]
    });

    res.json(instrumente);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const getInstrument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const instrument = await prisma.instrument.findUnique({
      where: { id },
      include: {
        hersteller: true,
        siebInhalte: {
          include: {
            sieb: {
              include: { fachabteilung: true }
            }
          }
        }
      }
    });

    if (!instrument) {
      return res.status(404).json({ error: 'Instrument nicht gefunden' });
    }

    res.json(instrument);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const createInstrument = async (req: AuthRequest, res: Response) => {
  try {
    const { artikelNr, bezeichnung, beschreibung, herstellerId, bildPfad } = req.body;

    const instrument = await prisma.instrument.create({
      data: {
        artikelNr,
        bezeichnung,
        beschreibung,
        herstellerId,
        bildPfad
      },
      include: { hersteller: true }
    });

    res.status(201).json(instrument);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const updateInstrument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { artikelNr, bezeichnung, beschreibung, herstellerId, bildPfad } = req.body;

    const instrument = await prisma.instrument.update({
      where: { id },
      data: {
        artikelNr,
        bezeichnung,
        beschreibung,
        herstellerId,
        bildPfad
      },
      include: { hersteller: true }
    });

    res.json(instrument);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const deleteInstrument = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const usageCount = await prisma.siebInhalt.count({
      where: { instrumentId: id }
    });

    if (usageCount > 0) {
      return res.status(400).json({ 
        error: 'Instrument wird noch in Sieben verwendet und kann nicht gelöscht werden' 
      });
    }

    await prisma.instrument.delete({
      where: { id }
    });

    res.json({ message: 'Instrument gelöscht' });
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};
