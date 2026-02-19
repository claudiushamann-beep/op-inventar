import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { Rolle } from '@prisma/client';

const ROLLEN_HIERARCHIE: Record<Rolle, number> = {
  OP_PFLEGE: 1,
  OBERARZT: 2,
  AEMP_MITARBEITER: 2,
  CHEFARZT: 3,
  OP_MANAGER: 4
};

export const requireRolle = (...erlaubteRollen: Rolle[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    if (!erlaubteRollen.includes(req.user.rolle as Rolle)) {
      return res.status(403).json({ error: 'Keine Berechtigung für diese Aktion' });
    }

    next();
  };
};

export const requireMinRolle = (minRolle: Rolle) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const userLevel = ROLLEN_HIERARCHIE[req.user.rolle as Rolle];
    const requiredLevel = ROLLEN_HIERARCHIE[minRolle];

    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: 'Keine ausreichende Berechtigung' });
    }

    next();
  };
};

export const canApproveSiebAenderung = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }

  const { siebTyp, fachabteilungId } = req.body;

  if (req.user.rolle === 'OP_MANAGER') {
    return next();
  }

  if (req.user.rolle === 'CHEFARZT') {
    if (siebTyp === 'FACHABTEILUNGSSPEZIFISCH') {
      if (req.user.fachabteilungId === fachabteilungId) {
        return next();
      }
    }
  }

  return res.status(403).json({ error: 'Keine Berechtigung zur Freigabe' });
};

export const canCreateSieb = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }

  const erlaubt: Rolle[] = ['OBERARZT', 'CHEFARZT', 'OP_MANAGER', 'AEMP_MITARBEITER'];
  
  if (!erlaubt.includes(req.user.rolle as Rolle)) {
    return res.status(403).json({ error: 'Keine Berechtigung zum Anlegen von Sieben' });
  }

  next();
};

export const canEditSieb = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }

  const erlaubt: Rolle[] = ['OBERARZT', 'CHEFARZT', 'OP_MANAGER', 'AEMP_MITARBEITER'];
  
  if (!erlaubt.includes(req.user.rolle as Rolle)) {
    return res.status(403).json({ error: 'Keine Berechtigung zum Bearbeiten von Sieben' });
  }

  next();
};

export const canRequestAenderung = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }

  next();
};

export const canImportKatalog = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }

  const erlaubt: Rolle[] = ['CHEFARZT', 'OP_MANAGER', 'AEMP_MITARBEITER'];
  
  if (!erlaubt.includes(req.user.rolle as Rolle)) {
    return res.status(403).json({ error: 'Keine Berechtigung zum Importieren von Katalogen' });
  }

  next();
};
