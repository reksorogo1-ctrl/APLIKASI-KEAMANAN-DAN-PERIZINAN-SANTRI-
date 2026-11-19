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

// Legacy localStorage key removed: Cloud Firestore (system_config/main) is the single source of truth.
export function readPengaturanSuratFromStorage(): PengaturanPejabatSurat | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(PENGATURAN_SURAT_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
  return null;
}

export function savePengaturanSuratToStorage(
  data: Partial<PengaturanPejabatSurat>
): PengaturanPejabatSurat {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(PENGATURAN_SURAT_STORAGE_KEY);
    }
  } catch {
    // ignore
  }

  return {
    namaKetua: data.namaKetua ?? '',
    jabatanKetua: data.jabatanKetua || 'Ketua Pondok Pesantren',
    ttdKetua: data.ttdKetua ?? '',
    namaSekretaris: data.namaSekretaris ?? '',
    jabatanSekretaris: data.jabatanSekretaris || 'Sekretaris Pondok',
    ttdSekretaris: data.ttdSekretaris ?? '',
    tampilkanKetua: data.tampilkanKetua ?? true,
    updatedAt: data.updatedAt ?? Date.now(),
  };
}

export function applyPengaturanSuratToConfig(
  cfg: SuratSekretarisConfig
): SuratSekretarisConfig {
  return cfg;
}

/**
 * Mengambil data pejabat & tanda tangan terbaru secara dinamis untuk seluruh 15 template surat
 * langsung dari Cloud Firestore (`systemConfig.suratSekretarisConfig`) atau arsip surat terkait.
 */
export function resolvePejabatSurat(
  cfg?: Partial<SuratSekretarisConfig>,
  suratData?: Partial<ArsipSurat>,
  _preferLiveConfig = false
): ResolvedPejabatSurat {
  return {
    namaKetua: cfg?.namaPenandatangan2 ?? suratData?.namaPenandatangan2 ?? '',
    jabatanKetua:
      cfg?.jabatanPenandatangan2 ||
      suratData?.jabatanPenandatangan2 ||
      'Ketua Pondok Pesantren',
    ttdKetua: cfg?.ttdUrl2 ?? suratData?.ttdUrl2 ?? '',
    namaSekretaris: cfg?.namaPenandatangan ?? suratData?.namaPenandatangan ?? '',
    jabatanSekretaris:
      cfg?.jabatanPenandatangan ||
      suratData?.jabatanPenandatangan ||
      'Sekretaris Pondok',
    ttdSekretaris: cfg?.ttdUrl1 ?? suratData?.ttdUrl1 ?? '',
    tampilkanKetua:
      cfg?.tampilkanPenandatangan2 ?? suratData?.tampilkanPenandatangan2 ?? true,
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
