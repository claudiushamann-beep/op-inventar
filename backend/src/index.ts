import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRoutes } from './routes/authRoutes.js';
import { userRoutes } from './routes/userRoutes.js';
import { siebRoutes } from './routes/siebRoutes.js';
import { instrumentRoutes } from './routes/instrumentRoutes.js';
import { fachabteilungRoutes } from './routes/fachabteilungRoutes.js';
import { herstellerRoutes } from './routes/herstellerRoutes.js';
import { aenderungRoutes } from './routes/aenderungRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static('uploads'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/siebe', siebRoutes);
app.use('/api/instrumente', instrumentRoutes);
app.use('/api/fachabteilungen', fachabteilungRoutes);
app.use('/api/hersteller', herstellerRoutes);
app.use('/api/aenderungen', aenderungRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Interner Serverfehler',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});

export default app;
