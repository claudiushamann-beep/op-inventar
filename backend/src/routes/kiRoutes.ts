import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import { requireMinRolle } from '../middleware/rbac.js';
import { Rolle } from '@prisma/client';
import {
  kiSearch,
  kiSave,
  kiGetSettings,
  kiUpdateSettings,
  kiTest,
  kiIdentify
} from '../controllers/kiController.js';

const router = Router();

// Multer: memory storage für Vision (kein Disk-Save nötig, base64 direkt)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nur JPEG, PNG und WebP Bilder erlaubt'));
    }
  }
});

router.post('/search', authMiddleware, requireMinRolle(Rolle.OBERARZT), kiSearch);
router.post('/save', authMiddleware, requireMinRolle(Rolle.AEMP_MITARBEITER), kiSave);
router.get('/settings', authMiddleware, kiGetSettings);
router.put('/settings', authMiddleware, kiUpdateSettings);
router.post('/test', authMiddleware, requireMinRolle(Rolle.OBERARZT), kiTest);
router.post('/identify', authMiddleware, requireMinRolle(Rolle.OBERARZT), upload.single('bild'), kiIdentify);

export const kiRoutes = router;
