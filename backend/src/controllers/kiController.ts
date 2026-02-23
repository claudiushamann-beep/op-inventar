import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { getProvider, getKiSettings, updateKiSettings } from '../services/kiService.js';
import prisma from '../utils/prisma.js';

export const kiSearch = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Suchbegriff erforderlich' });
    }

    const provider = getProvider();
    const result = await provider.search(query);
    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unbekannter Fehler';
    console.error('KI search error:', msg);
    res.status(500).json({ error: msg });
  }
};

export const kiSave = async (req: AuthRequest, res: Response) => {
  try {
    const { bezeichnung, artikelNr, hersteller: herstellerName, beschreibung, bildUrl } = req.body;

    let hersteller = await prisma.hersteller.findFirst({
      where: { name: { equals: herstellerName, mode: 'insensitive' } }
    });

    if (!hersteller) {
      hersteller = await prisma.hersteller.create({
        data: { name: herstellerName }
      });
    }

    const existingInstrument = await prisma.instrument.findFirst({
      where: { artikelNr }
    });

    if (existingInstrument) {
      return res.status(409).json({ error: 'Instrument mit dieser Artikel-Nr. existiert bereits' });
    }

    const instrument = await prisma.instrument.create({
      data: {
        bezeichnung,
        artikelNr,
        beschreibung,
        bildPfad: bildUrl || null,
        herstellerId: hersteller.id
      },
      include: { hersteller: true }
    });

    res.status(201).json(instrument);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unbekannter Fehler';
    console.error('KI save error:', msg);
    res.status(500).json({ error: msg });
  }
};

export const kiGetSettings = async (req: AuthRequest, res: Response) => {
  try {
    const settings = getKiSettings();
    res.json(settings);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unbekannter Fehler';
    console.error('KI getSettings error:', msg);
    res.status(500).json({ error: msg });
  }
};

export const kiUpdateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { provider, apiKey } = req.body;

    const validProviders = ['anthropic', 'openai', 'google'];
    if (!provider || !validProviders.includes(provider)) {
      return res.status(400).json({ error: 'Ungültiger Provider. Erlaubt: anthropic, openai, google' });
    }

    updateKiSettings(provider, apiKey);
    res.json({ message: 'KI-Einstellungen gespeichert', provider });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unbekannter Fehler';
    console.error('KI updateSettings error:', msg);
    res.status(500).json({ error: msg });
  }
};

export const kiTest = async (req: AuthRequest, res: Response) => {
  try {
    const provider = getProvider();
    const result = await provider.search('Skalpell');

    const currentProvider = process.env.KI_PROVIDER || 'anthropic';
    const modelMap: Record<string, string> = {
      anthropic: 'claude-sonnet-4-6',
      openai: 'gpt-4o',
      google: 'gemini-1.5-pro'
    };

    res.json({
      success: true,
      provider: currentProvider,
      model: modelMap[currentProvider] || currentProvider,
      testResult: result.bezeichnung
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unbekannter Fehler';
    console.error('KI test error:', msg);
    res.json({ success: false, error: msg });
  }
};

export const kiIdentify = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Kein Bild hochgeladen' });
    }

    const imageBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const provider = getProvider();
    const result = await provider.identifyImage(imageBase64, mimeType);
    res.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unbekannter Fehler';
    console.error('KI identify error:', msg);
    res.status(500).json({ error: msg });
  }
};
