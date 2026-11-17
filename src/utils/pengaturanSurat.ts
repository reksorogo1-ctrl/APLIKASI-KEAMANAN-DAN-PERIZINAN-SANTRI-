import { ArsipSurat, SuratSekretarisConfig } from '../types';

export const PENGATURAN_SURAT_STORAGE_KEY = 'almaliki_pengaturan_surat';

export interface PengaturanPejabatSurat {
  namaKetua: string;
  jabatanKetua: string;
  ttdKetua: string;
  namaSekretaris: string;
  jabatanSekretaris: string;
  ttdSekretaris: string;
  tampilkanKetua: boolean;
  updatedAt?: number;
}

export interface ResolvedPejabatSurat {
  namaKetua: string;
  jabatanKetua: string;
  ttdKetua: string;
  namaSekretaris: string;
  jabatanSekretaris: string;
  ttdSekretaris: string;
  tampilkanKetua: boolean;
}

export function readPengaturanSuratFromStorage(): PengaturanPejabatSurat | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(PENGATURAN_SURAT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      namaKetua: typeof parsed.namaKetua === 'string' ? parsed.namaKetua : '',
      jabatanKetua:
        typeof parsed.jabatanKetua === 'string' && parsed.jabatanKetua.trim() !== ''
          ? parsed.jabatanKetua
          : 'Ketua Pondok Pesantren',
      ttdKetua: typeof parsed.ttdKetua === 'string' ? parsed.ttdKetua : '',
      namaSekretaris: typeof parsed.namaSekretaris === 'string' ? parsed.namaSekretaris : '',
      jabatanSekretaris:
        typeof parsed.jabatanSekretaris === 'string' && parsed.jabatanSekretaris.trim() !== ''
          ? parsed.jabatanSekretaris
          : 'Sekretaris Pondok',
      ttdSekretaris: typeof parsed.ttdSekretaris === 'string' ? parsed.ttdSekretaris : '',
      tampilkanKetua: typeof parsed.tampilkanKetua === 'boolean' ? parsed.tampilkanKetua : true,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : undefined,
    };
  } catch (err) {
    console.warn('Gagal membaca almaliki_pengaturan_surat:', err);
    return null;
  }
}

export function savePengaturanSuratToStorage(
  data: Partial<PengaturanPejabatSurat>
): PengaturanPejabatSurat {
  const prev = readPengaturanSuratFromStorage();
  const payload: PengaturanPejabatSurat = {
    namaKetua: data.namaKetua ?? prev?.namaKetua ?? '',
    jabatanKetua: data.jabatanKetua ?? prev?.jabatanKetua ?? 'Ketua Pondok Pesantren',
    ttdKetua: data.ttdKetua ?? prev?.ttdKetua ?? '',
    namaSekretaris: data.namaSekretaris ?? prev?.namaSekretaris ?? '',
    jabatanSekretaris: data.jabatanSekretaris ?? prev?.jabatanSekretaris ?? 'Sekretaris Pondok',
    ttdSekretaris: data.ttdSekretaris ?? prev?.ttdSekretaris ?? '',
    tampilkanKetua: data.tampilkanKetua ?? prev?.tampilkanKetua ?? true,
    updatedAt: data.updatedAt ?? Date.now(),
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(PENGATURAN_SURAT_STORAGE_KEY, JSON.stringify(payload));
    }
  } catch (err) {
    console.error('Gagal menyimpan almaliki_pengaturan_surat ke localStorage:', err);
  }

  return payload;
}

export function applyPengaturanSuratToConfig(
  cfg: SuratSekretarisConfig
): SuratSekretarisConfig {
  const saved = readPengaturanSuratFromStorage();
  if (!saved) return cfg;

  const cloudTs = cfg.pejabatUpdatedAt ?? 0;
  const localTs = saved.updatedAt ?? 0;

  // Jika data localStorage lebih baru atau setara (atau cloud belum punya timestamp pejabat),
  // selalu prioritaskan data yang tersimpan di almaliki_pengaturan_surat.
  if (cloudTs > localTs && localTs > 0) {
    return cfg;
  }

  return {
    ...cfg,
    namaPenandatangan2: saved.namaKetua,
    jabatanPenandatangan2: saved.jabatanKetua || cfg.jabatanPenandatangan2 || 'Ketua Pondok Pesantren',
    ttdUrl2: saved.ttdKetua,
    namaPenandatangan: saved.namaSekretaris,
    jabatanPenandatangan: saved.jabatanSekretaris || cfg.jabatanPenandatangan || 'Sekretaris Pondok',
    ttdUrl1: saved.ttdSekretaris,
    tampilkanPenandatangan2: saved.tampilkanKetua,
    pejabatUpdatedAt: saved.updatedAt ?? cfg.pejabatUpdatedAt,
  };
}

/**
 * Mengambil data pejabat & tanda tangan terbaru secara dinamis untuk seluruh 15 template surat.
 * - Jika `preferLiveConfig` bernilai false (default untuk Pratinjau Cetak, Cetak @media print, & PDF),
 *   selalu memprioritaskan `almaliki_pengaturan_surat` dari localStorage bila tersedia.
 * - Jika `preferLiveConfig` bernilai true (khusus Live Preview saat sedang mengetik di Editor Pengaturan),
 *   membaca state editor aktif (`cfg`) sebelum menyimpan.
 */
export function resolvePejabatSurat(
  cfg?: Partial<SuratSekretarisConfig>,
  suratData?: Partial<ArsipSurat>,
  preferLiveConfig = false
): ResolvedPejabatSurat {
  const saved = readPengaturanSuratFromStorage();

  if (!preferLiveConfig && saved) {
    return {
      namaKetua: saved.namaKetua || cfg?.namaPenandatangan2 || suratData?.namaPenandatangan2 || '',
      jabatanKetua:
        saved.jabatanKetua ||
        cfg?.jabatanPenandatangan2 ||
        suratData?.jabatanPenandatangan2 ||
        'Ketua Pondok Pesantren',
      ttdKetua: saved.ttdKetua,
      namaSekretaris:
        saved.namaSekretaris || cfg?.namaPenandatangan || suratData?.namaPenandatangan || '',
      jabatanSekretaris:
        saved.jabatanSekretaris ||
        cfg?.jabatanPenandatangan ||
        suratData?.jabatanPenandatangan ||
        'Sekretaris Pondok',
      ttdSekretaris: saved.ttdSekretaris,
      tampilkanKetua: saved.tampilkanKetua,
    };
  }

  return {
    namaKetua: cfg?.namaPenandatangan2 ?? suratData?.namaPenandatangan2 ?? saved?.namaKetua ?? '',
    jabatanKetua:
      cfg?.jabatanPenandatangan2 ||
      suratData?.jabatanPenandatangan2 ||
      saved?.jabatanKetua ||
      'Ketua Pondok Pesantren',
    ttdKetua: cfg?.ttdUrl2 ?? suratData?.ttdUrl2 ?? saved?.ttdKetua ?? '',
    namaSekretaris: cfg?.namaPenandatangan ?? suratData?.namaPenandatangan ?? saved?.namaSekretaris ?? '',
    jabatanSekretaris:
      cfg?.jabatanPenandatangan ||
      suratData?.jabatanPenandatangan ||
      saved?.jabatanSekretaris ||
      'Sekretaris Pondok',
    ttdSekretaris: cfg?.ttdUrl1 ?? suratData?.ttdUrl1 ?? saved?.ttdSekretaris ?? '',
    tampilkanKetua:
      cfg?.tampilkanPenandatangan2 ?? suratData?.tampilkanPenandatangan2 ?? saved?.tampilkanKetua ?? true,
  };
}

/**
 * Mengonversi file gambar tanda tangan (PNG/JPG) lokal menjadi string Base64 Data URL
 * yang ringan dan jernih (maksimal lebar 480px, mempertahankan transparansi PNG).
 */
export async function convertSignatureFileToBase64(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Gagal membaca file gambar tanda tangan.'));
    reader.readAsDataURL(file);
  });

  if (!dataUrl || file.type === 'image/svg+xml') {
    return dataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxWidth = 480;
      const maxHeight = 220;
      const scale = Math.min(1, maxWidth / (img.width || maxWidth), maxHeight / (img.height || maxHeight));

      // Jika gambar sudah kecil dan ringkas, pertahankan Base64 aslinya
      if (scale === 1 && dataUrl.length <= 160000) {
        resolve(dataUrl);
        return;
      }

      const targetW = Math.max(1, Math.round(img.width * scale));
      const targetH = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg';
      if (isJpeg) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
      } else {
        ctx.clearRect(0, 0, targetW, targetH);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const outputMime = isJpeg ? 'image/jpeg' : 'image/png';
      const converted = isJpeg
        ? canvas.toDataURL(outputMime, 0.85)
        : canvas.toDataURL(outputMime);
      resolve(converted || dataUrl);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
