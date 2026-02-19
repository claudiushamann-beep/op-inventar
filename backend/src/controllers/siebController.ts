import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getSiebe = async (req: AuthRequest, res: Response) => {
  try {
    const { typ, fachabteilungId, status, search } = req.query;

    const where: any = {};
    
    if (typ) {
      where.typ = typ;
    }
    if (fachabteilungId) {
      where.fachabteilungId = fachabteilungId;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { beschreibung: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const siebe = await prisma.sieb.findMany({
      where,
      include: {
        fachabteilung: true,
        erstelltVon: {
          select: { id: true, vorname: true, nachname: true, username: true }
        },
        instrumente: {
          include: {
            instrument: {
              include: { hersteller: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(siebe);
  } catch (error) {
    console.error('Get siebe error:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const getSieb = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const sieb = await prisma.sieb.findUnique({
      where: { id },
      include: {
        fachabteilung: true,
        erstelltVon: {
          select: { id: true, vorname: true, nachname: true, username: true }
        },
        instrumente: {
          include: {
            instrument: {
              include: { hersteller: true }
            }
          },
          orderBy: { position: 'asc' }
        },
        aenderungen: {
          include: {
            beantragtVon: {
              select: { id: true, vorname: true, nachname: true }
            },
            genehmigtVon: {
              select: { id: true, vorname: true, nachname: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!sieb) {
      return res.status(404).json({ error: 'Sieb nicht gefunden' });
    }

    res.json(sieb);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const createSieb = async (req: AuthRequest, res: Response) => {
  try {
    const { name, beschreibung, typ, fachabteilungId, instrumente } = req.body;

    const sieb = await prisma.sieb.create({
      data: {
        name,
        beschreibung,
        typ,
        fachabteilungId: typ === 'FACHABTEILUNGSSPEZIFISCH' ? fachabteilungId : null,
        erstelltVonId: req.user!.id,
        status: 'ENTWURF',
        instrumente: instrumente ? {
          create: instrumente.map((inst: any) => ({
            instrumentId: inst.instrumentId,
            anzahl: inst.anzahl || 1,
            position: inst.position,
            hinweis: inst.hinweis
          }))
        } : undefined
      },
      include: {
        fachabteilung: true,
        instrumente: {
          include: { instrument: { include: { hersteller: true } } }
        }
      }
    });

    res.status(201).json(sieb);
  } catch (error) {
    console.error('Create sieb error:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const updateSieb = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, beschreibung, typ, fachabteilungId, status } = req.body;

    const sieb = await prisma.sieb.update({
      where: { id },
      data: {
        name,
        beschreibung,
        typ,
        fachabteilungId: typ === 'FACHABTEILUNGSSPEZIFISCH' ? fachabteilungId : null,
        status,
        version: { increment: 1 }
      },
      include: {
        fachabteilung: true,
        instrumente: {
          include: { instrument: { include: { hersteller: true } } }
        }
      }
    });

    res.json(sieb);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const deleteSieb = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.sieb.update({
      where: { id },
      data: { status: 'ARCHIVIERT' }
    });

    res.json({ message: 'Sieb archiviert' });
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const addInstrumentToSieb = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { instrumentId, anzahl, position, hinweis } = req.body;

    const siebInhalt = await prisma.siebInhalt.create({
      data: {
        siebId: id,
        instrumentId,
        anzahl: anzahl || 1,
        position,
        hinweis
      },
      include: {
        instrument: { include: { hersteller: true } }
      }
    });

    await prisma.sieb.update({
      where: { id },
      data: { version: { increment: 1 } }
    });

    res.status(201).json(siebInhalt);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const removeInstrumentFromSieb = async (req: AuthRequest, res: Response) => {
  try {
    const { id, instrumentId } = req.params;

    await prisma.siebInhalt.delete({
      where: {
        siebId_instrumentId: {
          siebId: id,
          instrumentId
        }
      }
    });

    await prisma.sieb.update({
      where: { id },
      data: { version: { increment: 1 } }
    });

    res.json({ message: 'Instrument entfernt' });
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const updateSiebInstrument = async (req: AuthRequest, res: Response) => {
  try {
    const { id, instrumentId } = req.params;
    const { anzahl, position, hinweis } = req.body;

    const siebInhalt = await prisma.siebInhalt.update({
      where: {
        siebId_instrumentId: {
          siebId: id,
          instrumentId
        }
      },
      data: { anzahl, position, hinweis },
      include: {
        instrument: { include: { hersteller: true } }
      }
    });

    await prisma.sieb.update({
      where: { id },
      data: { version: { increment: 1 } }
    });

    res.json(siebInhalt);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};
