import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRANSCRIBE_SURAT_PROMPT =
  'Transkripsikan seluruh teks dalam surat ini (huruf Latin dan Arab) dengan rapi dan akurat. Tampilkan teks hasilnya saja tanpa pembuka, penutup, atau format markdown.';

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '20mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/scan-surat', async (req: Request, res: Response) => {
    try {
      const apiKey =
        process.env.GEMINI_API_KEY ||
        process.env.VITE_GEMINI_API_KEY ||
        process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error: 'API Key Gemini belum dikonfigurasi pada environment server (Settings > Secrets).',
        });
        return;
      }

      const body = req.body as { imageBase64?: string; mimeType?: string };
      const rawImage = typeof body?.imageBase64 === 'string' ? body.imageBase64.trim() : '';
      if (!rawImage) {
        res.status(400).json({ error: 'Data gambar surat tidak ditemukan.' });
        return;
      }

      let mimeType = typeof body?.mimeType === 'string' && body.mimeType.trim() ? body.mimeType.trim() : 'image/jpeg';
      let base64Data = rawImage;

      const dataUrlMatch = rawImage.match(/^data:([^;]+);base64,(.+)$/);
      if (dataUrlMatch) {
        mimeType = dataUrlMatch[1];
        base64Data = dataUrlMatch[2];
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const contents = {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: TRANSCRIBE_SURAT_PROMPT,
          },
        ],
      };

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: {
            thinkingConfig: {
              thinkingBudget: 0,
            },
          },
        });
      } catch (primaryErr) {
        const errMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
        if (errMsg.includes('404') || errMsg.toLowerCase().includes('not found')) {
          response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents,
            config: {
              thinkingConfig: {
                thinkingLevel: ThinkingLevel.LOW,
              },
            },
          });
        } else {
          throw primaryErr;
        }
      }

      const transcribedText = (response.text || '').trim();
      if (!transcribedText) {
        res.status(422).json({
          error:
            'Gemini mengembalikan teks kosong (empty response.text): ' +
            JSON.stringify({
              candidates: response.candidates ?? null,
              promptFeedback: response.promptFeedback ?? null,
            }),
        });
        return;
      }

      res.json({ text: transcribedText });
    } catch (error) {
      console.error('Error /api/scan-surat:', error);
      const message =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : JSON.stringify(error);
      res.status(500).json({ error: message });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.get('/@vite/client', async (_req: Request, res: Response, next) => {
      try {
        const result = await vite.transformRequest('/@vite/client');
        if (!result) return next();
        const patched = result.code.replace(
          /const transport = normalizeModuleRunnerTransport\(\(\(\) => \{[\s\S]*?\}\)\(\)\);/,
          'const transport = normalizeModuleRunnerTransport({ async connect() {}, async disconnect() {}, send() {} });'
        );
        res.type('application/javascript').send(patched);
      } catch {
        next();
      }
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('/{*splat}', (_req: Request, res: Response) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
