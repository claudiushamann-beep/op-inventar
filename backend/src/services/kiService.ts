import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

export interface KiInstrumentResult {
  bezeichnung: string;
  artikelNr: string;
  hersteller: string;
  beschreibung: string;
  bildUrl?: string;
}

interface KiProvider {
  search(query: string): Promise<KiInstrumentResult>;
  identifyImage(imageBase64: string, mimeType: string): Promise<KiInstrumentResult>;
}

const SEARCH_PROMPT = `Du bist ein Experte für chirurgische Instrumente und Medizintechnik.
Antworte NUR mit einem JSON-Objekt, kein anderer Text, keine Erklärungen, kein Markdown.
Liefere folgende Felder:
- bezeichnung: Vollständige Produktbezeichnung
- artikelNr: Typische Artikel-/Bestellnummer des Herstellers
- hersteller: Hersteller-Firmenname
- beschreibung: Kurze Funktionsbeschreibung (2-3 Sätze)
- bildUrl: URL zu einem Produktbild auf der offiziellen Hersteller-Website (aus deinen Trainingsdaten, z.B. https://www.aesculapusa.com/... oder https://www.karlstorz.com/...)

Wenn du keine URL kennst, lasse bildUrl weg.`;

const VISION_PROMPT = `Du bist ein Experte für chirurgische Instrumente und Medizintechnik.
Analysiere dieses Bild eines medizinischen Instruments und antworte NUR mit einem JSON-Objekt, kein anderer Text, keine Erklärungen, kein Markdown.
Liefere folgende Felder:
- bezeichnung: Vollständige Produktbezeichnung des sichtbaren Instruments
- artikelNr: Typische Artikel-/Bestellnummer (falls erkennbar oder aus Trainingsdaten bekannt)
- hersteller: Wahrscheinlicher Hersteller-Firmenname
- beschreibung: Kurze Funktionsbeschreibung (2-3 Sätze)
- bildUrl: URL zu einem Produktbild auf der offiziellen Hersteller-Website (falls bekannt)

Falls ein Feld nicht bestimmt werden kann, verwende einen leeren String.`;

function parseJsonResult(text: string): KiInstrumentResult {
  const cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const result = JSON.parse(cleaned);
  return {
    bezeichnung: result.bezeichnung || '',
    artikelNr: result.artikelNr || '',
    hersteller: result.hersteller || '',
    beschreibung: result.beschreibung || '',
    bildUrl: result.bildUrl || undefined
  };
}

class AnthropicProvider implements KiProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async search(query: string): Promise<KiInstrumentResult> {
    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `${SEARCH_PROMPT}\n\nSuche: "${query}"`
      }]
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unerwartete Antwort von Anthropic');
    return parseJsonResult(content.text);
  }

  async identifyImage(imageBase64: string, mimeType: string): Promise<KiInstrumentResult> {
    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: VISION_PROMPT
          }
        ]
      }]
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unerwartete Antwort von Anthropic');
    return parseJsonResult(content.text);
  }
}

class OpenAIProvider implements KiProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async search(query: string): Promise<KiInstrumentResult> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `${SEARCH_PROMPT}\n\nSuche: "${query}"`
      }]
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error('Keine Antwort von OpenAI');
    return parseJsonResult(text);
  }

  async identifyImage(imageBase64: string, mimeType: string): Promise<KiInstrumentResult> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`
            }
          },
          {
            type: 'text',
            text: VISION_PROMPT
          }
        ]
      }]
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error('Keine Antwort von OpenAI');
    return parseJsonResult(text);
  }
}

class GoogleProvider implements KiProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async search(query: string): Promise<KiInstrumentResult> {
    const model = this.client.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(
      `${SEARCH_PROMPT}\n\nSuche: "${query}"`
    );
    const text = result.response.text();
    return parseJsonResult(text);
  }

  async identifyImage(imageBase64: string, mimeType: string): Promise<KiInstrumentResult> {
    const model = this.client.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType
        }
      },
      VISION_PROMPT
    ]);
    const text = result.response.text();
    return parseJsonResult(text);
  }
}

export function getProvider(): KiProvider {
  const provider = process.env.KI_PROVIDER || 'anthropic';
  const apiKey = process.env.KI_API_KEY || '';

  if (!apiKey) {
    throw new Error('KI_API_KEY nicht konfiguriert. Bitte in den KI-Einstellungen hinterlegen.');
  }

  switch (provider) {
    case 'openai':
      return new OpenAIProvider(apiKey);
    case 'google':
      return new GoogleProvider(apiKey);
    default:
      return new AnthropicProvider(apiKey);
  }
}

export function getKiSettings() {
  return {
    provider: process.env.KI_PROVIDER || 'anthropic',
    hasApiKey: !!(process.env.KI_API_KEY && process.env.KI_API_KEY.length > 0)
  };
}

export function updateKiSettings(provider: string, apiKey?: string): void {
  const envPath = path.resolve(process.cwd(), '.env');

  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf-8');
  } catch {
    // .env existiert nicht, neu erstellen
  }

  const lines = envContent.split('\n').filter(l => l.trim() !== '');
  const updatedLines = lines.filter(l => !l.startsWith('KI_PROVIDER=') && !l.startsWith('KI_API_KEY='));

  updatedLines.push(`KI_PROVIDER=${provider}`);
  if (apiKey !== undefined && apiKey !== '') {
    updatedLines.push(`KI_API_KEY=${apiKey}`);
  } else {
    // Alten Key behalten falls keiner übergeben
    const existingKey = lines.find(l => l.startsWith('KI_API_KEY='));
    if (existingKey) updatedLines.push(existingKey);
  }

  fs.writeFileSync(envPath, updatedLines.join('\n') + '\n', 'utf-8');

  // Prozess-Env aktualisieren
  process.env.KI_PROVIDER = provider;
  if (apiKey !== undefined && apiKey !== '') {
    process.env.KI_API_KEY = apiKey;
  }
}
