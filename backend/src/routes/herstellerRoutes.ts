import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  getHersteller, getHerstellerById, createHersteller,
  updateHersteller, deleteHersteller
} from '../controllers/herstellerController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireMinRolle } from '../middleware/rbac.js';
import { Rolle } from '@prisma/client';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/kataloge/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

router.get('/', authMiddleware, getHersteller);
router.get('/:id', authMiddleware, getHerstellerById);
router.post('/', authMiddleware, requireMinRolle(Rolle.AEMP_MITARBEITER), createHersteller);
router.put('/:id', authMiddleware, requireMinRolle(Rolle.AEMP_MITARBEITER), updateHersteller);
router.delete('/:id', authMiddleware, requireMinRolle(Rolle.OP_MANAGER), deleteHersteller);

router.post('/:id/katalog', authMiddleware, requireMinRolle(Rolle.AEMP_MITARBEITER), upload.single('katalog'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  }
  res.json({ 
    message: 'Katalog hochgeladen',
    katalogPfad: `/uploads/kataloge/${req.file.filename}`
  });
});

export const herstellerRoutes = router;
