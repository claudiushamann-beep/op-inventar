import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../middleware/auth.js';
import { getKiProvider } from '../services/kiService.js';

export const kiSearch = async (req: AuthRequest, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Suchbegriff erforderlich' });
    }

    const provider = getKiProvider();
    const result = await provider.search(query.trim());

    res.json(result);
  } catch (error) {
    console.error('kiSearch error:', error);
    res.status(500).json({ error: 'KI-Suche fehlgeschlagen. Bitte API-Key und Provider prüfen.' });
  }
};

export const getKiSettings = async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      provider: process.env.KI_PROVIDER || 'anthropic',
      anthropicKeySet: !!process.env.ANTHROPIC_API_KEY,
      openaiKeySet: !!process.env.OPENAI_API_KEY,
      googleKeySet: !!process.env.GOOGLE_API_KEY
    });
  } catch (error) {
    console.error('getKiSettings error:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};

export const updateKiSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { provider, apiKey } = req.body;

    const validProviders = ['anthropic', 'openai', 'google'];
    if (!provider || !validProviders.includes(provider)) {
      return res.status(400).json({ error: 'Ungültiger Provider. Erlaubt: anthropic, openai, google' });
    }

    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    const setEnvVar = (content: string, key: string, value: string): string => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${value}`);
      }
      return content + `\n${key}=${value}`;
    };

    envContent = setEnvVar(envContent, 'KI_PROVIDER', provider);

    if (apiKey) {
      const keyMap: Record<string, string> = {
        anthropic: 'ANTHROPIC_API_KEY',
        openai: 'OPENAI_API_KEY',
        google: 'GOOGLE_API_KEY'
      };
      envContent = setEnvVar(envContent, keyMap[provider], apiKey);
    }

    fs.writeFileSync(envPath, envContent, 'utf-8');

    // Update process.env for current session
    process.env.KI_PROVIDER = provider;
    if (apiKey) {
      const keyMap: Record<string, string> = {
        anthropic: 'ANTHROPIC_API_KEY',
        openai: 'OPENAI_API_KEY',
        google: 'GOOGLE_API_KEY'
      };
      process.env[keyMap[provider]] = apiKey;
    }

    res.json({ message: 'KI-Einstellungen gespeichert', provider });
  } catch (error) {
    console.error('updateKiSettings error:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
};
