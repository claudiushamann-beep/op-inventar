import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface KiInstrumentResult {
  artikelNr: string;
  bezeichnung: string;
  hersteller: string;
  beschreibung: string;
  bildUrl?: string;
}

interface KiProvider {
  search(query: string): Promise<KiInstrumentResult>;
}

const SYSTEM_PROMPT = `Du bist ein medizinisches Instrumenten-Datenbank-Assistent für OP-Säle.
Wenn du nach einem chirurgischen Instrument gefragt wirst, antworte NUR mit einem JSON-Objekt in diesem Format:
{
  "artikelNr": "Artikel-Nr. des Herstellers (z.B. BA123)",
  "bezeichnung": "Vollständige Bezeichnung des Instruments",
  "hersteller": "Name des Herstellers (z.B. Aesculap, Karl Storz, Stryker)",
  "beschreibung": "Kurze Beschreibung des Instruments und seiner Verwendung im OP",
  "bildUrl": null
}
Antworte AUSSCHLIESSLICH mit dem JSON, ohne weiteren Text.`;

class AnthropicProvider implements KiProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  async search(query: string): Promise<KiInstrumentResult> {
    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: `Suche nach: ${query}` }
      ]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    return parseJsonResult(text, query);
  }
}

class OpenAIProvider implements KiProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async search(query: string): Promise<KiInstrumentResult> {
    const completion = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Suche nach: ${query}` }
      ],
      max_tokens: 1024
    });

    const text = completion.choices[0]?.message?.content || '';
    return parseJsonResult(text, query);
  }
}

class GoogleProvider implements KiProvider {
  private client: GoogleGenerativeAI;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
  }

  async search(query: string): Promise<KiInstrumentResult> {
    const model = this.client.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(
      `${SYSTEM_PROMPT}\n\nSuche nach: ${query}`
    );
    const text = result.response.text();
    return parseJsonResult(text, query);
  }
}

function parseJsonResult(text: string, query: string): KiInstrumentResult {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Kein JSON in Antwort gefunden');
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      artikelNr: parsed.artikelNr || '',
      bezeichnung: parsed.bezeichnung || query,
      hersteller: parsed.hersteller || '',
      beschreibung: parsed.beschreibung || '',
      bildUrl: parsed.bildUrl || undefined
    };
  } catch {
    return {
      artikelNr: '',
      bezeichnung: query,
      hersteller: '',
      beschreibung: 'Keine Details gefunden',
      bildUrl: undefined
    };
  }
}

export function getKiProvider(): KiProvider {
  const provider = process.env.KI_PROVIDER || 'anthropic';
  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider();
    case 'google':
      return new GoogleProvider();
    default:
      return new AnthropicProvider();
  }
}
