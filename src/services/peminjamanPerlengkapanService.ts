import {
  collection,
  deleteDoc,
  doc,
  getDocFromCache,
  getDocs,
  getDocsFromCache,
  onSnapshot,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  BarangPeminjamanItem,
  PeminjamanPerlengkapan,
  PengaturanSuratPerlengkapan,
  StatusPeminjamanPerlengkapan,
} from '../types';
import {
  db,
  handleFirestoreError,
  isFirestoreQuotaError,
  isFirestoreQuotaPaused,
  OperationType,
  pauseFirestoreNetworkForQuota,
  subscribeFirestoreQuotaPause,
} from './firebase';
import {
  extractSupabaseErrorMessage,
  getSupabaseClient,
  isSupabaseConfigured,
} from './supabase';
import {
  fromSupabaseRow,
  SupabaseJsonRow,
  toPeminjamanPerlengkapanRow,
  toPengaturanSuratPerlengkapanRow,
} from './supabaseMappers';

const COLLECTION_PEMINJAMAN = 'peminjaman_perlengkapan';
const COLLECTION_PENGATURAN_SURAT = 'pengaturan_surat_perlengkapan';
const DEFAULT_SURAT_DOC_ID = 'default';

let latestCachedPeminjamanList: PeminjamanPerlengkapan[] = [];
let latestCachedPengaturanSurat: PengaturanSuratPerlengkapan | null = null;

export const DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN: PengaturanSuratPerlengkapan = {
  judulSurat: 'SURAT IZIN PEMINJAMAN INVENTARIS & PERLENGKAPAN',
  teksPembuka:
    'Dengan ini menerangkan bahwa nama yang tercantum di bawah ini telah mendapatkan persetujuan resmi dari Ketua Pondok dan Bagian Perlengkapan untuk meminjam barang inventaris pondok pesantren dengan rincian sebagai berikut:',
  teksPenutup:
    'Ketentuan Tanggung Jawab: Peminjam wajib menjaga keutuhan, kebersihan, dan fungsi seluruh barang yang dipinjam. Apabila terjadi kerusakan atau kehilangan selama masa peminjaman, peminjam bertanggung jawab penuh untuk memperbaiki atau mengganti sesuai kondisi awal serta mengembalikan tepat waktu dengan memindai QR Code surat ini di Bagian Perlengkapan.',
  namaKetuaPondok: 'Ustadz H. Ahmad Fauzan, M.Pd.I',
  jabatanKetuaPondok: 'Ketua Pondok Pesantren',
  namaKetuaPerlengkapan: 'Ustadz Muhammad Ridwan',
  jabatanKetuaPerlengkapan: 'Ketua Bagian Perlengkapan',
  tampilkanTtdPeminjam: true,
  tampilkanTtdPerlengkapan: true,
  tampilkanTtdKetuaPondok: true,
  ukuranFont: 'sedang',
  tampilkanKopSurat: true,
  posisiQrCode: 'kiri_bawah',
};

function clipStr(val: string | undefined, max: number, fallback = ''): string {
  const s = typeof val === 'string' ? val.trim() : fallback;
  return s.length > max ? s.slice(0, max) : s;
}

function sanitizeOptionalFields<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}

function toRomanMonth(monthIndexZeroBased: number): string {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romans[monthIndexZeroBased] || 'I';
}

export function generateNomorSuratPerlengkapan(existingCount: number): string {
  const now = new Date();
  const seq = String(Math.max(1, existingCount + 1)).padStart(3, '0');
  const romanMonth = toRomanMonth(now.getMonth());
  const year = now.getFullYear();
  return `${seq}/PJM-PRL/PP-MALIKI/${romanMonth}/${year}`;
}

export function normalizePengaturanSuratPerlengkapan(
  raw?: Partial<PengaturanSuratPerlengkapan> | null
): PengaturanSuratPerlengkapan {
  const src = raw || {};
  const ukuranFont =
    src.ukuranFont === 'kecil' || src.ukuranFont === 'sedang' || src.ukuranFont === 'besar'
      ? src.ukuranFont
      : DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.ukuranFont;
  const posisiQrCode =
    src.posisiQrCode === 'kiri_bawah' || src.posisiQrCode === 'kanan_bawah'
      ? src.posisiQrCode
      : DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.posisiQrCode;

  return sanitizeOptionalFields({
    judulSurat:
      clipStr(src.judulSurat, 200, DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.judulSurat) ||
      DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.judulSurat,
    teksPembuka:
      clipStr(src.teksPembuka, 1500, DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.teksPembuka) ||
      DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.teksPembuka,
    teksPenutup:
      clipStr(src.teksPenutup, 2000, DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.teksPenutup) ||
      DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.teksPenutup,
    namaKetuaPondok:
      clipStr(
        src.namaKetuaPondok,
        150,
        DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.namaKetuaPondok
      ) || DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.namaKetuaPondok,
    jabatanKetuaPondok:
      clipStr(
        src.jabatanKetuaPondok,
        150,
        DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.jabatanKetuaPondok
      ) || DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.jabatanKetuaPondok,
    namaKetuaPerlengkapan:
      clipStr(
        src.namaKetuaPerlengkapan,
        150,
        DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.namaKetuaPerlengkapan
      ) || DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.namaKetuaPerlengkapan,
    jabatanKetuaPerlengkapan:
      clipStr(
        src.jabatanKetuaPerlengkapan,
        150,
        DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.jabatanKetuaPerlengkapan
      ) || DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.jabatanKetuaPerlengkapan,
    tampilkanTtdPeminjam:
      typeof src.tampilkanTtdPeminjam === 'boolean'
        ? src.tampilkanTtdPeminjam
        : DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.tampilkanTtdPeminjam,
    tampilkanTtdPerlengkapan:
      typeof src.tampilkanTtdPerlengkapan === 'boolean'
        ? src.tampilkanTtdPerlengkapan
        : DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.tampilkanTtdPerlengkapan,
    tampilkanTtdKetuaPondok:
      typeof src.tampilkanTtdKetuaPondok === 'boolean'
        ? src.tampilkanTtdKetuaPondok
        : DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.tampilkanTtdKetuaPondok,
    ukuranFont,
    tampilkanKopSurat:
      typeof src.tampilkanKopSurat === 'boolean'
        ? src.tampilkanKopSurat
        : DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN.tampilkanKopSurat,
    posisiQrCode,
    updatedAt: src.updatedAt ? clipStr(src.updatedAt, 60) : undefined,
  });
}

export function formatWaktuIndonesiaNow(): string {
  const now = new Date();
  const datePart = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timePart = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart}, ${timePart} WIB`;
}

function mapPeminjamanDoc(
  id: string,
  data: Partial<PeminjamanPerlengkapan>
): PeminjamanPerlengkapan {
  return {
    id,
    nomorSurat: data.nomorSurat || id,
    namaPeminjam: data.namaPeminjam || '-',
    statusDivisiKamar: data.statusDivisiKamar || '-',
    nomorHp: data.nomorHp || '-',
    tanggalPinjam: data.tanggalPinjam || '',
    estimasiTanggalKembali: data.estimasiTanggalKembali || '',
    daftarBarang: Array.isArray(data.daftarBarang) ? data.daftarBarang : [],
    keperluan: data.keperluan,
    status: (data.status as StatusPeminjamanPerlengkapan) || 'Menunggu Verifikasi Ketua Pondok',
    catatanVerifikasi: data.catatanVerifikasi,
    diverifikasiOleh: data.diverifikasiOleh,
    waktuVerifikasi: data.waktuVerifikasi,
    waktuKembali: data.waktuKembali,
    petugasPengembalian: data.petugasPengembalian,
    dibuatOleh: data.dibuatOleh,
    createdAt: data.createdAt || '',
    updatedAt: data.updatedAt,
  };
}

/**
 * Mengambil snapshot data peminjaman perlengkapan & pengaturan surat dari cache/Firestore lama
 * untuk keperluan tombol migrasi data ke Supabase.
 */
export async function getLegacyPeminjamanPerlengkapanSnapshot(): Promise<{
  items: PeminjamanPerlengkapan[];
  pengaturanSurat: PengaturanSuratPerlengkapan | null;
}> {
  let items: PeminjamanPerlengkapan[] = [...latestCachedPeminjamanList];
  let pengaturanSurat: PengaturanSuratPerlengkapan | null = latestCachedPengaturanSurat;

  try {
    const cachedSnap = await getDocsFromCache(collection(db, COLLECTION_PEMINJAMAN));
    if (!cachedSnap.empty) {
      const fromCache = cachedSnap.docs.map((d) =>
        mapPeminjamanDoc(d.id, d.data() as Partial<PeminjamanPerlengkapan>)
      );
      const map = new Map<string, PeminjamanPerlengkapan>();
      [...items, ...fromCache].forEach((x) => map.set(x.id, x));
      items = Array.from(map.values());
    }
  } catch {
    // ignore cache miss
  }

  if (!isFirestoreQuotaPaused() && items.length === 0) {
    try {
      const serverSnap = await getDocs(collection(db, COLLECTION_PEMINJAMAN));
      if (!serverSnap.empty) {
        items = serverSnap.docs.map((d) =>
          mapPeminjamanDoc(d.id, d.data() as Partial<PeminjamanPerlengkapan>)
        );
      }
    } catch {
      // ignore if quota paused or offline
    }
  }

  if (!pengaturanSurat) {
    try {
      const cfgSnap = await getDocFromCache(
        doc(db, COLLECTION_PENGATURAN_SURAT, DEFAULT_SURAT_DOC_ID)
      );
      if (cfgSnap.exists()) {
        pengaturanSurat = normalizePengaturanSuratPerlengkapan(
          cfgSnap.data() as Partial<PengaturanSuratPerlengkapan>
        );
      }
    } catch {
      // ignore
    }
  }

  return { items, pengaturanSurat };
}

export function subscribePeminjamanPerlengkapan(
  onData: (items: PeminjamanPerlengkapan[]) => void,
  onError?: (errMsg: string) => void
): Unsubscribe {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    let active = true;

    const fetchAllFromSupabase = async () => {
      try {
        const { data, error } = await supabase.from(COLLECTION_PEMINJAMAN).select('*');
        if (error) throw error;
        const rows = (data || []).map((row) =>
          mapPeminjamanDoc(
            String((row as SupabaseJsonRow).id),
            fromSupabaseRow<PeminjamanPerlengkapan>(row as SupabaseJsonRow)
          )
        );
        rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        latestCachedPeminjamanList = rows;
        if (active) onData(rows);
      } catch (err) {
        onError?.(extractSupabaseErrorMessage(err));
      }
    };

    void fetchAllFromSupabase();

    const channel = supabase
      .channel(`rt-${COLLECTION_PEMINJAMAN}-${Math.random().toString(36).slice(2, 7)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: COLLECTION_PEMINJAMAN },
        () => {
          void fetchAllFromSupabase();
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }

  const loadFromCache = async () => {
    try {
      const cached = await getDocsFromCache(collection(db, COLLECTION_PEMINJAMAN));
      const rows = cached.docs.map((d) =>
        mapPeminjamanDoc(d.id, d.data() as Partial<PeminjamanPerlengkapan>)
      );
      rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      latestCachedPeminjamanList = rows;
      onData(rows);
    } catch {
      onData([]);
    }
  };

  if (isFirestoreQuotaPaused()) {
    void loadFromCache();
    return () => {};
  }

  let unsubSnapshot: Unsubscribe | null = null;
  let unsubQuota: (() => void) | null = null;

  unsubSnapshot = onSnapshot(
    collection(db, COLLECTION_PEMINJAMAN),
    (snapshot) => {
      const rows = snapshot.docs.map((d) =>
        mapPeminjamanDoc(d.id, d.data() as Partial<PeminjamanPerlengkapan>)
      );
      rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      latestCachedPeminjamanList = rows;
      onData(rows);
    },
    (error) => {
      if (isFirestoreQuotaError(error)) {
        void pauseFirestoreNetworkForQuota();
        void loadFromCache();
        onError?.('Kuota harian Firestore penuh (reset besok). Menampilkan data dari cache lokal.');
        return;
      }
      const info = handleFirestoreError(error, OperationType.LIST, COLLECTION_PEMINJAMAN);
      onError?.(info.error);
    }
  );

  unsubQuota = subscribeFirestoreQuotaPause((paused) => {
    if (paused) {
      if (unsubSnapshot) {
        try {
          unsubSnapshot();
        } catch {
          // ignore
        }
        unsubSnapshot = null;
      }
      void loadFromCache();
    }
  });

  return () => {
    if (unsubSnapshot) {
      try {
        unsubSnapshot();
      } catch {
        // ignore
      }
      unsubSnapshot = null;
    }
    if (unsubQuota) {
      try {
        unsubQuota();
      } catch {
        // ignore
      }
      unsubQuota = null;
    }
  };
}

export async function createPeminjamanPerlengkapan(input: {
  namaPeminjam: string;
  statusDivisiKamar: string;
  nomorHp: string;
  tanggalPinjam: string;
  estimasiTanggalKembali: string;
  daftarBarang: BarangPeminjamanItem[];
  keperluan?: string;
  dibuatOleh?: string;
  existingCount: number;
}): Promise<PeminjamanPerlengkapan> {
  const id = `pjm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const nowIso = new Date().toISOString();
  const cleanItems: BarangPeminjamanItem[] = input.daftarBarang
    .filter((item) => item.namaBarang.trim() !== '')
    .slice(0, 50)
    .map((item, idx) => ({
      id: clipStr(item.id || `brg_${idx + 1}_${Date.now()}`, 64),
      namaBarang: clipStr(item.namaBarang, 150) || 'Barang Inventaris',
      jumlah: Math.max(1, Math.round(Number(item.jumlah) || 1)),
      satuan: clipStr(item.satuan, 40, 'Unit') || 'Unit',
      kondisiAwal: clipStr(item.kondisiAwal, 100, 'Baik') || 'Baik',
    }));

  const docData: PeminjamanPerlengkapan = sanitizeOptionalFields<PeminjamanPerlengkapan>({
    id,
    nomorSurat: clipStr(generateNomorSuratPerlengkapan(input.existingCount), 100),
    namaPeminjam: clipStr(input.namaPeminjam, 150),
    statusDivisiKamar: clipStr(input.statusDivisiKamar, 150),
    nomorHp: clipStr(input.nomorHp, 40),
    tanggalPinjam: clipStr(input.tanggalPinjam, 30),
    estimasiTanggalKembali: clipStr(input.estimasiTanggalKembali, 30),
    daftarBarang: cleanItems,
    keperluan: input.keperluan?.trim() ? clipStr(input.keperluan, 500) : undefined,
    status: 'Menunggu Verifikasi Ketua Pondok' as StatusPeminjamanPerlengkapan,
    dibuatOleh: input.dibuatOleh?.trim() ? clipStr(input.dibuatOleh, 150) : undefined,
    createdAt: clipStr(nowIso, 60),
    updatedAt: clipStr(nowIso, 60),
  });

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase
      .from(COLLECTION_PEMINJAMAN)
      .upsert(toPeminjamanPerlengkapanRow(docData), { onConflict: 'id' });
    if (error) {
      throw new Error(extractSupabaseErrorMessage(error));
    }
    latestCachedPeminjamanList = [
      docData,
      ...latestCachedPeminjamanList.filter((x) => x.id !== docData.id),
    ];
    return docData;
  }

  if (isFirestoreQuotaPaused()) {
    throw new Error('Kuota harian Firestore penuh (reset besok). Tidak dapat menyimpan ke server saat ini.');
  }

  try {
    await setDoc(doc(db, COLLECTION_PEMINJAMAN, id), docData);
    return docData;
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      void pauseFirestoreNetworkForQuota();
      throw new Error('Kuota harian Firestore penuh (reset besok). Tidak dapat menyimpan ke server saat ini.');
    }
    const info = handleFirestoreError(
      error,
      OperationType.CREATE,
      `${COLLECTION_PEMINJAMAN}/${id}`
    );
    throw new Error(info.error);
  }
}

export async function updateStatusPeminjamanPerlengkapan(
  id: string,
  patch: {
    status: StatusPeminjamanPerlengkapan;
    catatanVerifikasi?: string;
    diverifikasiOleh?: string;
    waktuVerifikasi?: string;
    waktuKembali?: string;
    petugasPengembalian?: string;
  }
): Promise<void> {
  const payload = sanitizeOptionalFields({
    status: patch.status,
    catatanVerifikasi:
      patch.catatanVerifikasi !== undefined
        ? clipStr(patch.catatanVerifikasi, 500)
        : undefined,
    diverifikasiOleh:
      patch.diverifikasiOleh !== undefined
        ? clipStr(patch.diverifikasiOleh, 150)
        : undefined,
    waktuVerifikasi:
      patch.waktuVerifikasi !== undefined
        ? clipStr(patch.waktuVerifikasi, 60)
        : undefined,
    waktuKembali:
      patch.waktuKembali !== undefined ? clipStr(patch.waktuKembali, 60) : undefined,
    petugasPengembalian:
      patch.petugasPengembalian !== undefined
        ? clipStr(patch.petugasPengembalian, 150)
        : undefined,
    updatedAt: clipStr(new Date().toISOString(), 60),
  });

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const { data: existingRow, error: fetchErr } = await supabase
      .from(COLLECTION_PEMINJAMAN)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      throw new Error(extractSupabaseErrorMessage(fetchErr));
    }

    const baseItem = existingRow
      ? mapPeminjamanDoc(id, fromSupabaseRow<PeminjamanPerlengkapan>(existingRow as SupabaseJsonRow))
      : latestCachedPeminjamanList.find((x) => x.id === id) || mapPeminjamanDoc(id, {});

    const merged: PeminjamanPerlengkapan = {
      ...baseItem,
      ...payload,
      id,
    };

    const { error: upsertErr } = await supabase
      .from(COLLECTION_PEMINJAMAN)
      .upsert(toPeminjamanPerlengkapanRow(merged), { onConflict: 'id' });

    if (upsertErr) {
      throw new Error(extractSupabaseErrorMessage(upsertErr));
    }

    latestCachedPeminjamanList = latestCachedPeminjamanList.map((x) =>
      x.id === id ? merged : x
    );
    return;
  }

  if (isFirestoreQuotaPaused()) {
    throw new Error('Kuota harian Firestore penuh (reset besok). Tidak dapat memperbarui status di server saat ini.');
  }

  try {
    await updateDoc(doc(db, COLLECTION_PEMINJAMAN, id), payload);
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      void pauseFirestoreNetworkForQuota();
      throw new Error('Kuota harian Firestore penuh (reset besok). Tidak dapat memperbarui status di server saat ini.');
    }
    const info = handleFirestoreError(
      error,
      OperationType.UPDATE,
      `${COLLECTION_PEMINJAMAN}/${id}`
    );
    throw new Error(info.error);
  }
}

export async function deletePeminjamanPerlengkapan(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase.from(COLLECTION_PEMINJAMAN).delete().eq('id', id);
    if (error) {
      throw new Error(extractSupabaseErrorMessage(error));
    }
    latestCachedPeminjamanList = latestCachedPeminjamanList.filter((x) => x.id !== id);
    return;
  }

  if (isFirestoreQuotaPaused()) {
    throw new Error('Kuota harian Firestore penuh (reset besok). Tidak dapat menghapus data di server saat ini.');
  }

  try {
    await deleteDoc(doc(db, COLLECTION_PEMINJAMAN, id));
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      void pauseFirestoreNetworkForQuota();
      throw new Error('Kuota harian Firestore penuh (reset besok). Tidak dapat menghapus data di server saat ini.');
    }
    const info = handleFirestoreError(
      error,
      OperationType.DELETE,
      `${COLLECTION_PEMINJAMAN}/${id}`
    );
    throw new Error(info.error);
  }
}

export function subscribePengaturanSuratPerlengkapan(
  onData: (cfg: PengaturanSuratPerlengkapan) => void,
  onError?: (errMsg: string) => void
): Unsubscribe {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    let active = true;

    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from(COLLECTION_PENGATURAN_SURAT)
          .select('*')
          .eq('id', DEFAULT_SURAT_DOC_ID)
          .maybeSingle();
        if (error) throw error;
        const normalized = data
          ? normalizePengaturanSuratPerlengkapan(
              fromSupabaseRow<PengaturanSuratPerlengkapan & { id: string }>(
                data as SupabaseJsonRow
              )
            )
          : normalizePengaturanSuratPerlengkapan(DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN);
        latestCachedPengaturanSurat = normalized;
        if (active) onData(normalized);
      } catch (err) {
        onError?.(extractSupabaseErrorMessage(err));
      }
    };

    void fetchConfig();

    const channel = supabase
      .channel(`rt-${COLLECTION_PENGATURAN_SURAT}-${Math.random().toString(36).slice(2, 7)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: COLLECTION_PENGATURAN_SURAT },
        () => {
          void fetchConfig();
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }

  const loadFromCache = async () => {
    try {
      const snap = await getDocFromCache(doc(db, COLLECTION_PENGATURAN_SURAT, DEFAULT_SURAT_DOC_ID));
      if (snap.exists()) {
        const normalized = normalizePengaturanSuratPerlengkapan(
          snap.data() as Partial<PengaturanSuratPerlengkapan>
        );
        latestCachedPengaturanSurat = normalized;
        onData(normalized);
        return;
      }
    } catch {
      // ignore cache miss
    }
    onData(normalizePengaturanSuratPerlengkapan(DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN));
  };

  if (isFirestoreQuotaPaused()) {
    void loadFromCache();
    return () => {};
  }

  let unsubSnapshot: Unsubscribe | null = null;
  let unsubQuota: (() => void) | null = null;

  unsubSnapshot = onSnapshot(
    doc(db, COLLECTION_PENGATURAN_SURAT, DEFAULT_SURAT_DOC_ID),
    (snap) => {
      if (snap.exists()) {
        const normalized = normalizePengaturanSuratPerlengkapan(
          snap.data() as Partial<PengaturanSuratPerlengkapan>
        );
        latestCachedPengaturanSurat = normalized;
        onData(normalized);
      } else {
        onData(normalizePengaturanSuratPerlengkapan(DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN));
      }
    },
    (error) => {
      if (isFirestoreQuotaError(error)) {
        void pauseFirestoreNetworkForQuota();
        void loadFromCache();
        onError?.('Kuota harian Firestore penuh (reset besok). Menggunakan format surat dari cache lokal.');
        return;
      }
      const info = handleFirestoreError(
        error,
        OperationType.GET,
        `${COLLECTION_PENGATURAN_SURAT}/${DEFAULT_SURAT_DOC_ID}`
      );
      onError?.(info.error);
    }
  );

  unsubQuota = subscribeFirestoreQuotaPause((paused) => {
    if (paused) {
      if (unsubSnapshot) {
        try {
          unsubSnapshot();
        } catch {
          // ignore
        }
        unsubSnapshot = null;
      }
      void loadFromCache();
    }
  });

  return () => {
    if (unsubSnapshot) {
      try {
        unsubSnapshot();
      } catch {
        // ignore
      }
      unsubSnapshot = null;
    }
    if (unsubQuota) {
      try {
        unsubQuota();
      } catch {
        // ignore
      }
      unsubQuota = null;
    }
  };
}

export async function savePengaturanSuratPerlengkapan(
  cfg: PengaturanSuratPerlengkapan
): Promise<PengaturanSuratPerlengkapan> {
  const normalized = normalizePengaturanSuratPerlengkapan({
    ...cfg,
    updatedAt: new Date().toISOString(),
  });

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    const { error } = await supabase
      .from(COLLECTION_PENGATURAN_SURAT)
      .upsert(toPengaturanSuratPerlengkapanRow(normalized), { onConflict: 'id' });
    if (error) {
      throw new Error(extractSupabaseErrorMessage(error));
    }
    latestCachedPengaturanSurat = normalized;
    return normalized;
  }

  if (isFirestoreQuotaPaused()) {
    throw new Error('Kuota harian Firestore penuh (reset besok). Pengaturan belum tersimpan ke server.');
  }

  try {
    await setDoc(doc(db, COLLECTION_PENGATURAN_SURAT, DEFAULT_SURAT_DOC_ID), normalized);
    latestCachedPengaturanSurat = normalized;
    return normalized;
  } catch (error) {
    if (isFirestoreQuotaError(error)) {
      void pauseFirestoreNetworkForQuota();
      throw new Error('Kuota harian Firestore penuh (reset besok). Pengaturan belum tersimpan ke server.');
    }
    const info = handleFirestoreError(
      error,
      OperationType.WRITE,
      `${COLLECTION_PENGATURAN_SURAT}/${DEFAULT_SURAT_DOC_ID}`
    );
    throw new Error(info.error);
  }
}
