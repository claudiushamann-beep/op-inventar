import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  getInstrumente, getInstrument, createInstrument,
  updateInstrument, deleteInstrument
} from '../controllers/instrumentController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireMinRolle } from '../middleware/rbac.js';
import { Rolle } from '@prisma/client';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/instrumente/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bild-Dateien erlaubt'));
    }
  }
});

router.get('/', authMiddleware, getInstrumente);
router.get('/:id', authMiddleware, getInstrument);
router.post('/', authMiddleware, requireMinRolle(Rolle.OBERARZT), createInstrument);
router.put('/:id', authMiddleware, requireMinRolle(Rolle.OBERARZT), updateInstrument);
router.delete('/:id', authMiddleware, requireMinRolle(Rolle.AEMP_MITARBEITER), deleteInstrument);

router.post('/:id/bild', authMiddleware, upload.single('bild'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  }
  res.json({ bildPfad: `/uploads/instrumente/${req.file.filename}` });
});

export const instrumentRoutes = router;
