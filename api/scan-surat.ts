import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const TRANSCRIBE_SURAT_PROMPT =
  'Transkripsikan seluruh teks dalam surat ini (huruf Latin dan Arab) dengan rapi dan akurat. Tampilkan teks hasilnya saja tanpa pembuka, penutup, atau format markdown.';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

interface ServerlessRequest {
  method?: string;
  body?: unknown;
}

interface ServerlessResponse {
  status: (code: number) => ServerlessResponse;
  json: (data: unknown) => void;
  end: (body?: string) => void;
  setHeader: (name: string, value: string) => void;
}

export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(405).json({ error: `Method ${req.method || 'UNKNOWN'} Not Allowed` });
    return;
  }

  try {
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      res.status(500).json({
        error:
          'API Key Gemini belum ditemukan di environment server (GEMINI_API_KEY / VITE_GEMINI_API_KEY / NEXT_PUBLIC_GEMINI_API_KEY).',
      });
      return;
    }

    let parsedBody: { imageBase64?: string; mimeType?: string } = {};
    if (typeof req.body === 'string') {
      parsedBody = JSON.parse(req.body) as { imageBase64?: string; mimeType?: string };
    } else if (req.body && typeof req.body === 'object') {
      parsedBody = req.body as { imageBase64?: string; mimeType?: string };
    }

    const rawImage =
      typeof parsedBody?.imageBase64 === 'string' ? parsedBody.imageBase64.trim() : '';
    if (!rawImage) {
      res.status(400).json({ error: 'Data gambar surat (imageBase64) kosong atau tidak ditemukan.' });
      return;
    }

    let mimeType =
      typeof parsedBody?.mimeType === 'string' && parsedBody.mimeType.trim()
        ? parsedBody.mimeType.trim()
        : 'image/jpeg';
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

    const contents = [
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      {
        text: TRANSCRIBE_SURAT_PROMPT,
      },
    ];

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

    res.status(200).json({ text: transcribedText });
  } catch (error) {
    console.error('Error /api/scan-surat:', error);
    const message =
      error instanceof Error ? `${error.name}: ${error.message}` : JSON.stringify(error);
    res.status(500).json({ error: message });
  }
}
