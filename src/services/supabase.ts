import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://gljacjsnutqaezxkwbbh.supabase.co/rest/v1/';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_Us_igr1F-9DjudD8Ozo7Dg_s0Uzps5C';

function normalizeEnvValue(val: string | undefined, fallback: string): string {
  const cleaned = (val || '').trim().replace(/^["']|["']$/g, '');
  if (
    !cleaned ||
    cleaned.includes('[TEMPEL_PROJECT_URL]') ||
    cleaned.includes('[TEMPEL_ANON_KEY]')
  ) {
    return fallback.trim().replace(/^["']|["']$/g, '');
  }
  return cleaned;
}

export const SUPABASE_PROJECT_URL = normalizeEnvValue(
  import.meta.env.VITE_SUPABASE_URL,
  DEFAULT_SUPABASE_URL
)
  .replace(/\/+$/, '')
  .replace(/\/rest\/v1$/i, '');

export const SUPABASE_ANON_KEY = normalizeEnvValue(
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  DEFAULT_SUPABASE_ANON_KEY
);

export const SUPABASE_BUCKET_DOKUMEN = 'almaliki-dokumen';

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const url = (SUPABASE_PROJECT_URL || '').trim();
  const key = (SUPABASE_ANON_KEY || '').trim();
  if (!url || !key) return false;
  if (url.includes('[TEMPEL_PROJECT_URL]') || key.includes('[TEMPEL_ANON_KEY]')) {
    return false;
  }
  return /^https?:\/\/.+/i.test(url) && key.length >= 20;
}

export function getSupabaseProjectHost(): string {
  if (!isSupabaseConfigured()) return 'Belum Dikonfigurasi';
  try {
    return new URL(SUPABASE_PROJECT_URL).host;
  } catch {
    return SUPABASE_PROJECT_URL;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_PROJECT_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    });
  }
  return supabaseInstance;
}

export function extractSupabaseErrorMessage(error: unknown): string {
  if (!error) return 'Unknown Supabase error';
  if (typeof error === 'string') return error;
  const errObj = error as { message?: string; details?: string; hint?: string; code?: string };
  const parts = [errObj.message, errObj.details, errObj.hint].filter(Boolean);
  if (parts.length > 0) {
    return errObj.code ? `${parts.join(' - ')} (${errObj.code})` : parts.join(' - ');
  }
  return String(error);
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; contentType: string; ext: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) {
    throw new Error('Format Data URL tidak valid.');
  }
  const contentType = match[1] || 'application/octet-stream';
  const base64 = match[2] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const ext = inferExtFromMime(contentType);
  return {
    blob: new Blob([bytes], { type: contentType }),
    contentType,
    ext,
  };
}

function inferExtFromMime(mime: string, fallbackName?: string): string {
  const m = (mime || '').toLowerCase();
  if (m.includes('pdf')) return 'pdf';
  if (m.includes('png')) return 'png';
  if (m.includes('webp')) return 'webp';
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
  if (fallbackName && fallbackName.includes('.')) {
    return fallbackName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  }
  return 'bin';
}

function sanitizeFileSegment(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'dokumen';
}

async function fileToDataUrl(blob: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Gagal membaca file'));
    reader.readAsDataURL(blob);
  });
}

export interface SupabaseUploadResult {
  publicUrl: string;
  path: string;
  fileName: string;
  uploadedToBucket: boolean;
  errorMessage?: string;
}

/**
 * Mengunggah file scan PDF surat atau gambar tanda tangan pejabat ke bucket Supabase Storage `almaliki-dokumen`.
 * Jika Supabase belum dikonfigurasi atau upload bucket gagal sementara, fallback aman ke Data URL agar file tetap tersimpan.
 */
export async function uploadFileToSupabaseStorage(
  input: File | Blob | string,
  folder: 'scan-surat' | 'ttd-pejabat' | 'stempel' | 'kop-surat' | 'lampiran-koordinasi' | string,
  fileNamePrefix = 'dokumen'
): Promise<SupabaseUploadResult> {
  let blob: Blob;
  let contentType = 'application/octet-stream';
  let ext = 'bin';
  let originalName = fileNamePrefix;

  if (typeof input === 'string') {
    if (input.startsWith('http://') || input.startsWith('https://')) {
      return {
        publicUrl: input,
        path: '',
        fileName: fileNamePrefix,
        uploadedToBucket: false,
      };
    }
    const parsed = dataUrlToBlob(input);
    blob = parsed.blob;
    contentType = parsed.contentType;
    ext = parsed.ext;
  } else {
    blob = input;
    contentType = input.type || 'application/octet-stream';
    if ('name' in input && typeof input.name === 'string' && input.name) {
      originalName = input.name;
    }
    ext = inferExtFromMime(contentType, originalName);
  }

  const safeFolder = sanitizeFileSegment(folder);
  const safePrefix = sanitizeFileSegment(fileNamePrefix);
  const uniqueName = `${safePrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
  const storagePath = `${safeFolder}/${uniqueName}`;

  const client = getSupabaseClient();
  if (!client) {
    const fallbackUrl = typeof input === 'string' ? input : await fileToDataUrl(blob);
    return {
      publicUrl: fallbackUrl,
      path: storagePath,
      fileName: originalName,
      uploadedToBucket: false,
      errorMessage: 'Supabase belum dikonfigurasi; menggunakan penyimpanan URL lokal sementara.',
    };
  }

  try {
    const { error: uploadError } = await client.storage
      .from(SUPABASE_BUCKET_DOKUMEN)
      .upload(storagePath, blob, {
        contentType,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: pubData } = client.storage
      .from(SUPABASE_BUCKET_DOKUMEN)
      .getPublicUrl(storagePath);

    if (!pubData?.publicUrl) {
      throw new Error('Gagal mendapatkan Public URL dari Supabase Storage.');
    }

    return {
      publicUrl: pubData.publicUrl,
      path: storagePath,
      fileName: originalName,
      uploadedToBucket: true,
    };
  } catch (err) {
    const errMsg = extractSupabaseErrorMessage(err);
    console.warn('Supabase Storage upload fallback:', errMsg);
    const fallbackUrl = typeof input === 'string' ? input : await fileToDataUrl(blob);
    return {
      publicUrl: fallbackUrl,
      path: storagePath,
      fileName: originalName,
      uploadedToBucket: false,
      errorMessage: errMsg,
    };
  }
}

export async function testSupabaseConnection(): Promise<{ ok: boolean; errorMessage?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      errorMessage: 'URL atau Anon Key Supabase belum diisi (masih placeholder).',
    };
  }
  try {
    const { error } = await client.from('system_config').select('id').limit(1);
    if (error) {
      return { ok: false, errorMessage: extractSupabaseErrorMessage(error) };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, errorMessage: extractSupabaseErrorMessage(err) };
  }
}
