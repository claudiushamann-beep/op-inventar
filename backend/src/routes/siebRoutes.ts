import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  getSiebe, getSieb, createSieb, updateSieb, deleteSieb,
  addInstrumentToSieb, removeInstrumentFromSieb, updateSiebInstrument
} from '../controllers/siebController.js';
import { authMiddleware } from '../middleware/auth.js';
import { canCreateSieb, canEditSieb } from '../middleware/rbac.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/siebe/');
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

router.get('/', authMiddleware, getSiebe);
router.get('/:id', authMiddleware, getSieb);
router.post('/', authMiddleware, canCreateSieb, createSieb);
router.put('/:id', authMiddleware, canEditSieb, updateSieb);
router.delete('/:id', authMiddleware, canEditSieb, deleteSieb);

router.post('/:id/instrumente', authMiddleware, canEditSieb, addInstrumentToSieb);
router.put('/:id/instrumente/:instrumentId', authMiddleware, canEditSieb, updateSiebInstrument);
router.delete('/:id/instrumente/:instrumentId', authMiddleware, canEditSieb, removeInstrumentFromSieb);

router.post('/:id/bild', authMiddleware, canEditSieb, upload.single('bild'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  }
  res.json({ bildPfad: `/uploads/siebe/${req.file.filename}` });
});

export const siebRoutes = router;
