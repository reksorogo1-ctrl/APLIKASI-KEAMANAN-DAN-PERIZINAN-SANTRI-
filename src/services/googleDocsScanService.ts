export class GoogleAuthExpiredError extends Error {
  constructor(message = 'Sesi akses Google Docs telah berakhir. Silakan login Google kembali.') {
    super(message);
    this.name = 'GoogleAuthExpiredError';
  }
}

export interface GoogleDocsScanResult {
  text: string;
  googleDocId: string;
  googleDocUrl: string;
  googleDocTitle: string;
}

interface DocsParagraphElement {
  textRun?: {
    content?: string;
  };
}

interface DocsStructuralElement {
  paragraph?: {
    elements?: DocsParagraphElement[];
  };
  table?: {
    tableRows?: {
      tableCells?: {
        content?: DocsStructuralElement[];
      }[];
    }[];
  };
}

interface GoogleDocResponse {
  documentId?: string;
  title?: string;
  body?: {
    content?: DocsStructuralElement[];
  };
}

function dataUrlToBlob(dataUrl: string, fallbackMime = 'image/jpeg'): { blob: Blob; mimeType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  const mimeType = match?.[1] || fallbackMime;
  const base64 = match?.[2] || dataUrl;
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return {
    blob: new Blob([bytes], { type: mimeType }),
    mimeType,
  };
}

function extractTextFromDocsElements(elements: DocsStructuralElement[] = []): string {
  const chunks: string[] = [];

  for (const el of elements) {
    if (el.paragraph?.elements) {
      let line = '';
      for (const pe of el.paragraph.elements) {
        if (pe.textRun?.content) {
          // Strip inline object replacement char (\uFFFC) so scanned image glyph never leaks into text
          line += pe.textRun.content.replace(/\uFFFC/g, '');
        }
      }
      chunks.push(line);
    }

    if (el.table?.tableRows) {
      for (const row of el.table.tableRows) {
        const cellTexts = (row.tableCells || []).map((cell) =>
          extractTextFromDocsElements(cell.content || [])
            .replace(/\s*\n\s*/g, ' ')
            .trim()
        );
        const nonEmpty = cellTexts.filter((t) => t.length > 0);
        if (nonEmpty.length > 0) {
          chunks.push(`${nonEmpty.join(' | ')}\n`);
        }
      }
    }
  }

  return chunks.join('');
}

function cleanTranscribedText(rawText: string): string {
  return rawText
    .replace(/\uFFFC/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function scanImageWithGoogleDocs(
  dataUrl: string,
  mimeType: string,
  accessToken: string
): Promise<GoogleDocsScanResult> {
  if (!accessToken) {
    throw new GoogleAuthExpiredError();
  }

  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '_',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  const docTitle = `Scan_Surat_AlMaliki_${stamp}`;

  const { blob, mimeType: resolvedMime } = dataUrlToBlob(dataUrl, mimeType);
  const boundary = `-------almaliki_gdocs_${Date.now()}`;

  const metadataPart = JSON.stringify({
    name: docTitle,
    mimeType: 'application/vnd.google-apps.document',
  });

  const multipartBody = new Blob(
    [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataPart}\r\n`,
      `--${boundary}\r\nContent-Type: ${resolvedMime}\r\n\r\n`,
      blob,
      `\r\n--${boundary}--`,
    ],
    { type: `multipart/related; boundary=${boundary}` }
  );

  // 1. Upload captured letter photo to Google Drive & convert with Google Docs OCR (Indonesian)
  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&ocrLanguage=id&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: multipartBody,
    }
  );

  if (uploadRes.status === 401) {
    throw new GoogleAuthExpiredError();
  }

  if (!uploadRes.ok) {
    const errPayload = await uploadRes.json().catch(() => ({}));
    const msg =
      (errPayload as { error?: { message?: string } })?.error?.message ||
      `Gagal mengunggah & mengonversi gambar ke Google Docs (${uploadRes.status}).`;
    throw new Error(msg);
  }

  const uploadedFile = (await uploadRes.json()) as {
    id: string;
    name?: string;
    webViewLink?: string;
  };

  if (!uploadedFile.id) {
    throw new Error('Google Drive tidak mengembalikan ID dokumen Google Docs.');
  }

  const googleDocId = uploadedFile.id;
  const googleDocUrl =
    uploadedFile.webViewLink || `https://docs.google.com/document/d/${googleDocId}/edit`;

  // 2. Read structured OCR text from Google Docs API v1
  let extractedText = '';
  const docsRes = await fetch(`https://docs.googleapis.com/v1/documents/${googleDocId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (docsRes.status === 401) {
    throw new GoogleAuthExpiredError();
  }

  if (docsRes.ok) {
    const docData = (await docsRes.json()) as GoogleDocResponse;
    extractedText = cleanTranscribedText(extractTextFromDocsElements(docData.body?.content || []));
  }

  // 3. Fallback: export plain text directly from the converted Google Docs file if needed
  if (!extractedText) {
    const exportRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${googleDocId}/export?mimeType=text/plain`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (exportRes.status === 401) {
      throw new GoogleAuthExpiredError();
    }
    if (exportRes.ok) {
      const plain = await exportRes.text();
      extractedText = cleanTranscribedText(plain);
    }
  }

  if (!extractedText) {
    throw new Error(
      'Teks surat belum terbaca oleh OCR Google Docs. Pastikan tulisan pada foto terang, tajam, dan tidak buram.'
    );
  }

  return {
    text: extractedText,
    googleDocId,
    googleDocUrl,
    googleDocTitle: uploadedFile.name || docTitle,
  };
}
