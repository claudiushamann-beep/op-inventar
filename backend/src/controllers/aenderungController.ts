import { Response } from 'express';
import prisma from '../utils/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getAenderungen = async (req: AuthRequest, res: Response) => {
  try {
    const { status, siebId } = req.query;

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    if (siebId) {
      where.siebId = siebId;
    }

    const aenderungen = await prisma.aenderung.findMany({
      where,
      include: {
        sieb: {
          include: { fachabteilung: true }
        },
        beantragtVon: {
          select: { id: true, vorname: true, nachname: true, rolle: true }
        },
        genehmigtVon: {
          select: { id: true, vorname: true, nachname: true, rolle: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(aenderungen);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const getPendingAenderungen = async (req: AuthRequest, res: Response) => {
  try {
    const where: any = { status: 'PENDING' };

    if (req.user!.rolle === 'CHEFARZT') {
      where.sieb = {
        typ: 'FACHABTEILUNGSSPEZIFISCH',
        fachabteilungId: req.user!.fachabteilungId
      };
    }

    const aenderungen = await prisma.aenderung.findMany({
      where,
      include: {
        sieb: {
          include: { fachabteilung: true }
        },
        beantragtVon: {
          select: { id: true, vorname: true, nachname: true, rolle: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(aenderungen);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const createAenderung = async (req: AuthRequest, res: Response) => {
  try {
    const { siebId, typ, altDaten, neuDaten, kommentar } = req.body;

    const sieb = await prisma.sieb.findUnique({
      where: { id: siebId },
      include: { fachabteilung: true }
    });

    if (!sieb) {
      return res.status(404).json({ error: 'Sieb nicht gefunden' });
    }

    const aenderung = await prisma.aenderung.create({
      data: {
        siebId,
        typ,
        altDaten,
        neuDaten,
        kommentar,
        beantragtVonId: req.user!.id
      },
      include: {
        sieb: { include: { fachabteilung: true } },
        beantragtVon: {
          select: { id: true, vorname: true, nachname: true }
        }
      }
    });

    res.status(201).json(aenderung);
  } catch (error) {
    console.error('Create aenderung error:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const approveAenderung = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { kommentar } = req.body;

    const aenderung = await prisma.aenderung.findUnique({
      where: { id },
      include: {
        sieb: { include: { fachabteilung: true } }
      }
    });

    if (!aenderung) {
      return res.status(404).json({ error: 'Änderungsantrag nicht gefunden' });
    }

    if (aenderung.status !== 'PENDING') {
      return res.status(400).json({ error: 'Änderungsantrag bereits bearbeitet' });
    }

    const canApprove = checkApprovalPermission(req.user!, aenderung.sieb);
    
    if (!canApprove) {
      return res.status(403).json({ error: 'Keine Berechtigung zur Freigabe' });
    }

    await applyAenderung(aenderung);

    const updatedAenderung = await prisma.aenderung.update({
      where: { id },
      data: {
        status: 'APPROVED',
        genehmigtVonId: req.user!.id,
        genehmigtAm: new Date(),
        kommentar: kommentar || aenderung.kommentar
      },
      include: {
        sieb: { include: { fachabteilung: true } },
        beantragtVon: {
          select: { id: true, vorname: true, nachname: true }
        },
        genehmigtVon: {
          select: { id: true, vorname: true, nachname: true }
        }
      }
    });

    res.json(updatedAenderung);
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const rejectAenderung = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { ablehnungsGrund } = req.body;

    const aenderung = await prisma.aenderung.findUnique({
      where: { id },
      include: {
        sieb: { include: { fachabteilung: true } }
      }
    });

    if (!aenderung) {
      return res.status(404).json({ error: 'Änderungsantrag nicht gefunden' });
    }

    if (aenderung.status !== 'PENDING') {
      return res.status(400).json({ error: 'Änderungsantrag bereits bearbeitet' });
    }

    const canApprove = checkApprovalPermission(req.user!, aenderung.sieb);
    
    if (!canApprove) {
      return res.status(403).json({ error: 'Keine Berechtigung zur Ablehnung' });
    }

    const updatedAenderung = await prisma.aenderung.update({
      where: { id },
      data: {
        status: 'REJECTED',
        genehmigtVonId: req.user!.id,
        genehmigtAm: new Date(),
        ablehnungsGrund
      },
      include: {
        sieb: { include: { fachabteilung: true } },
        beantragtVon: {
          select: { id: true, vorname: true, nachname: true }
        },
        genehmigtVon: {
          select: { id: true, vorname: true, nachname: true }
        }
      }
    });

    res.json(updatedAenderung);
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

function checkApprovalPermission(user: any, sieb: any): boolean {
  if (user.rolle === 'OP_MANAGER') {
    return true;
  }
  
  if (user.rolle === 'CHEFARZT') {
    if (sieb.typ === 'FACHABTEILUNGSSPEZIFISCH' && 
        sieb.fachabteilungId === user.fachabteilungId) {
      return true;
    }
  }
  
  return false;
}

async function applyAenderung(aenderung: any) {
  const { typ, neuDaten, siebId } = aenderung;

  switch (typ) {
    case 'ADD_INSTRUMENT':
      await prisma.siebInhalt.create({
        data: {
          siebId,
          instrumentId: neuDaten.instrumentId,
          anzahl: neuDaten.anzahl || 1,
          position: neuDaten.position,
          hinweis: neuDaten.hinweis
        }
      });
      break;

    case 'REMOVE_INSTRUMENT':
      await prisma.siebInhalt.delete({
        where: {
          siebId_instrumentId: {
            siebId,
            instrumentId: neuDaten.instrumentId
          }
        }
      });
      break;

    case 'MODIFY_ANZAHL':
    case 'MODIFY_POSITION':
      await prisma.siebInhalt.update({
        where: {
          siebId_instrumentId: {
            siebId,
            instrumentId: neuDaten.instrumentId
          }
        },
        data: neuDaten
      });
      break;

    case 'CREATE_SIEB':
      await prisma.sieb.update({
        where: { id: siebId },
        data: { status: 'AKTIV' }
      });
      break;

    case 'DEACTIVATE_SIEB':
      await prisma.sieb.update({
        where: { id: siebId },
        data: { status: 'INAKTIV' }
      });
      break;
  }

  await prisma.sieb.update({
    where: { id: siebId },
    data: { version: { increment: 1 } }
  });
}
