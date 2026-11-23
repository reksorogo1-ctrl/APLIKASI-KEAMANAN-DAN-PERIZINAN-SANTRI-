import { 
  Santri, 
  DewanKeamanan, 
  Perizinan, 
  TataTertib, 
  Pelanggaran, 
  Sanksi, 
  UserAccount, 
  LogAktivitas, 
  NotifikasiApp, 
  Gender, 
  SystemConfig,
  PesanKoordinasi,
  BalasanKoordinasi,
  StrukturOrganisasiNode,
  AgendaPengurus,
  EvaluasiKepengurusan,
  PengajuanDivisi,
  ArsipSurat,
  TransaksiKeuangan,
  BarangInventaris,
  PeminjamanBarang,
  DataUstadz
} from '../types';
import { 
  INITIAL_SANTRI, 
  INITIAL_DEWAN_KEAMANAN, 
  INITIAL_PERIZINAN, 
  INITIAL_PELANGGARAN, 
  INITIAL_SANKSI, 
  INITIAL_USERS, 
  INITIAL_SYSTEM_CONFIG, 
  INITIAL_LOGS, 
  INITIAL_KOORDINASI,
  INITIAL_AGENDA_PENGURUS,
  INITIAL_EVALUASI_KEPENGURUSAN,
  INITIAL_PENGAJUAN_DIVISI,
  INITIAL_ARSIP_SURAT,
  INITIAL_TRANSAKSI_KEUANGAN,
  INITIAL_BARANG_INVENTARIS,
  INITIAL_PEMINJAMAN_BARANG,
  INITIAL_BENDAHARA_CONFIG,
  INITIAL_PERLENGKAPAN_CONFIG,
  INITIAL_SURAT_SEKRETARIS_CONFIG,
  INITIAL_PUSAT_INFORMASI_LIST,
  INITIAL_MUROTIL_ABSENSI_SANTRI,
  INITIAL_MUROTIL_SETORAN,
  INITIAL_MUROTIL_ABSENSI_PJ,
  INITIAL_MUROTIL_CONFIG
} from '../data/seedData';
import {
  db,
  handleFirestoreError,
  OperationType,
  resyncFirestoreNetwork,
  isFirestoreQuotaError,
  isFirestorePermissionError,
  isFirestoreQuotaPaused,
  pauseFirestoreNetworkForQuota,
  resumeFirestoreNetworkFromQuota,
  subscribeFirestoreQuotaPause,
  testFirestoreConnection,
  extractFirebaseErrorMessage,
  FIRESTORE_DATABASE_ID,
  FIREBASE_PROJECT_ID,
} from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  getDocsFromServer,
  getDocFromServer,
  getDocsFromCache,
  getDocFromCache,
  Unsubscribe,
} from 'firebase/firestore';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  extractSupabaseErrorMessage,
  getSupabaseClient,
  getSupabaseProjectHost,
  isSupabaseConfigured,
} from './supabase';
import {
  fromSupabaseRow,
  SupabaseJsonRow,
  toAbsensiPjRow,
  toAbsensiSantriRow,
  toDewanKeamananRow,
  toEvaluasiKepengurusanRow,
  toFasilitasGedungRow,
  toJadwalAgendaFromPengurus,
  toJadwalAgendaFromPerbaikan,
  toKeuanganTransaksiRow,
  toKoordinasiRow,
  toLogsRow,
  toNotifikasiRow,
  toPelanggaranRow,
  toPengajuanDivisiRow,
  toPerizinanRow,
  toPerlengkapanInventarisRow,
  toPerlengkapanPeminjamanRow,
  toSanksiRow,
  toSantriRow,
  toStrukturOrganisasiRow,
  toSuratMenyuratRow,
  toSystemConfigRow,
  toTataTertibRow,
  toUserRow,
  toUstadzRow,
} from './supabaseMappers';

const SESSION_KEYS = {
  CURRENT_USER: 'sim_kamtib_active_session_v2',
  GENDER_SCOPE: 'sim_kamtib_gender_scope_v2',
  THEME: 'sim_kamtib_theme_v2',
};

const LEGACY_LOCAL_STORAGE_KEYS = [
  'sim_kamtib_santri_v2',
  'sim_kamtib_dewan_keamanan_v2',
  'sim_kamtib_perizinan_v2',
  'sim_kamtib_tata_tertib_v2',
  'sim_kamtib_pelanggaran_v2',
  'sim_kamtib_sanksi_v2',
  'sim_kamtib_rbac_users_v2',
  'sim_kamtib_active_session_v2',
  'sim_kamtib_system_config_v2',
  'sim_kamtib_logs_v2',
  'sim_kamtib_notifikasi_v2',
  'sim_kamtib_theme_v2',
  'sim_kamtib_gender_scope_v2',
  'sim_kamtib_koordinasi_v2',
  'sim_maliki_struktur_v1',
  'sim_maliki_agenda_v1',
  'sim_maliki_evaluasi_v1',
  'sim_maliki_pengajuan_v1',
  'sim_maliki_surat_v1',
  'sim_maliki_keuangan_v1',
  'sim_maliki_inventaris_v1',
  'sim_maliki_peminjaman_v1',
  'almaliki_data_santri',
  'almaliki_data_ustadzah',
  'almaliki_master_initialized',
  'almaliki_sample_cleared',
  'almaliki_pengaturan_surat',
];

const OFFICIAL_LOGO = 'https://cdn.phototourl.com/member/2026-11-14-03361e24-6ae4-4db0-bdad-b98af1797f52.png';
const OFFICIAL_KEAMANAN_LOGO = 'https://cdn.phototourl.com/member/2026-11-11-7ffd46ad-6406-4c9c-8043-01c37a880156.png';
const OFFICIAL_KOP_KIRI_LOGO = 'https://cdn.phototourl.com/member/2026-11-14-49a0f8f3-f2e5-443e-8c1e-36ccad7a6009.png';
const OFFICIAL_KOP_KANAN_LOGO = 'https://cdn.phototourl.com/member/2026-11-14-6e57abdd-4666-430d-911c-7e8281c86140.jpg';

function buildCleanSystemConfig(cloudData?: Partial<SystemConfig>): SystemConfig {
  const data = cloudData || {};
  const resolvedUstadz: DataUstadz[] = Array.isArray(data.ustadzList)
    ? data.ustadzList
    : Array.isArray(data.dataUstadzList)
      ? data.dataUstadzList
      : [];

  const isValidWebsiteLogo = (u?: string) =>
    Boolean(
      u &&
      !u.includes('logo_pesantren_almaliki') &&
      !u.includes('2026-11-11-7ffd46ad') &&
      (u.startsWith('http') || u.startsWith('data:') || u.startsWith('/'))
    );
  const isValidKeamananLogo = (u?: string) =>
    Boolean(
      u &&
      !u.includes('logo_pesantren_almaliki') &&
      !u.includes('2026-11-14-03361e24') &&
      (u.startsWith('http') || u.startsWith('data:') || u.startsWith('/'))
    );

  const rawSurat = data.suratSekretarisConfig;

  return {
    ...INITIAL_SYSTEM_CONFIG,
    ...data,
    initialSeedCompleted: true,
    sampleCleared: Boolean(data.sampleCleared),
    logoUrl: isValidWebsiteLogo(data.logoUrl) ? data.logoUrl! : OFFICIAL_LOGO,
    logoDashboardKeamananUrl: isValidKeamananLogo(data.logoDashboardKeamananUrl)
      ? data.logoDashboardKeamananUrl!
      : OFFICIAL_KEAMANAN_LOGO,
    logoSuratPerizinanUrl: isValidKeamananLogo(data.logoSuratPerizinanUrl)
      ? data.logoSuratPerizinanUrl!
      : OFFICIAL_KEAMANAN_LOGO,
    appIconUrl:
      data.appIconUrl &&
      data.appIconUrl !== '/icon.svg' &&
      !data.appIconUrl.includes('2026-11-11-7ffd46ad')
        ? data.appIconUrl
        : OFFICIAL_LOGO,
    ustadzList: resolvedUstadz,
    dataUstadzList: resolvedUstadz,
    beritaTerkini: Array.isArray(data.beritaTerkini) ? data.beritaTerkini : [],
    programKerjaList: Array.isArray(data.programKerjaList) ? data.programKerjaList : [],
    izinPengurusList: Array.isArray(data.izinPengurusList) ? data.izinPengurusList : [],
    notulenRapatList: Array.isArray(data.notulenRapatList) ? data.notulenRapatList : [],
    syahriyahList: Array.isArray(data.syahriyahList) ? data.syahriyahList : [],
    uangSakuList: Array.isArray(data.uangSakuList) ? data.uangSakuList : [],
    anggaranList: Array.isArray(data.anggaranList) ? data.anggaranList : [],
    mutasiBarangList: Array.isArray(data.mutasiBarangList) ? data.mutasiBarangList : [],
    jadwalPerbaikanList: Array.isArray(data.jadwalPerbaikanList) ? data.jadwalPerbaikanList : [],
    kamarSantriList: Array.isArray(data.kamarSantriList) ? data.kamarSantriList : [],
    fasilitasGedungList: Array.isArray(data.fasilitasGedungList) ? data.fasilitasGedungList : [],
    pusatInformasiList: Array.isArray(data.pusatInformasiList) ? data.pusatInformasiList : [],
    murotilTingkatanList: Array.isArray(data.murotilTingkatanList) ? data.murotilTingkatanList : [],
    murotilKelompokList: Array.isArray(data.murotilKelompokList) ? data.murotilKelompokList : [],
    murotilAbsensiSantriList: Array.isArray(data.murotilAbsensiSantriList) ? data.murotilAbsensiSantriList : [],
    murotilSetoranList: Array.isArray(data.murotilSetoranList) ? data.murotilSetoranList : [],
    murotilAbsensiPjList: Array.isArray(data.murotilAbsensiPjList) ? data.murotilAbsensiPjList : [],
    bendaharaConfig: {
      ...INITIAL_BENDAHARA_CONFIG,
      ...(data.bendaharaConfig || {}),
      kategoriPemasukan: Array.isArray(data.bendaharaConfig?.kategoriPemasukan)
        ? data.bendaharaConfig.kategoriPemasukan
        : INITIAL_BENDAHARA_CONFIG.kategoriPemasukan,
      kategoriPengeluaran: Array.isArray(data.bendaharaConfig?.kategoriPengeluaran)
        ? data.bendaharaConfig.kategoriPengeluaran
        : INITIAL_BENDAHARA_CONFIG.kategoriPengeluaran,
    },
    perlengkapanConfig: {
      ...INITIAL_PERLENGKAPAN_CONFIG,
      ...(data.perlengkapanConfig || {}),
    },
    murotilConfig: {
      ...INITIAL_MUROTIL_CONFIG,
      ...(data.murotilConfig || {}),
      sesiList: Array.isArray(data.murotilConfig?.sesiList)
        ? data.murotilConfig.sesiList
        : INITIAL_MUROTIL_CONFIG.sesiList,
    },
    suratSekretarisConfig: {
      ...INITIAL_SURAT_SEKRETARIS_CONFIG,
      ...(rawSurat || {}),
      kopLogoUrl:
        rawSurat?.kopLogoUrl && !rawSurat.kopLogoUrl.includes('2026-11-11-7ffd46ad')
          ? rawSurat.kopLogoUrl
          : OFFICIAL_KOP_KIRI_LOGO,
      kopLogoKananUrl:
        rawSurat?.kopLogoKananUrl &&
        rawSurat.kopLogoKananUrl.trim() !== '' &&
        !rawSurat.kopLogoKananUrl.includes('2026-11-11-7ffd46ad')
          ? rawSurat.kopLogoKananUrl
          : OFFICIAL_KOP_KANAN_LOGO,
      ttdUrl1: rawSurat?.ttdUrl1 ?? INITIAL_SURAT_SEKRETARIS_CONFIG.ttdUrl1 ?? '',
      ttdUrl2: rawSurat?.ttdUrl2 ?? INITIAL_SURAT_SEKRETARIS_CONFIG.ttdUrl2 ?? '',
      templates: {
        ...INITIAL_SURAT_SEKRETARIS_CONFIG.templates,
        ...(rawSurat?.templates || {}),
      },
    },
  };
}

// Firestore collections naming mapping
const CLOUD_COLLECTIONS = {
  USERS: 'users',
  SANTRI: 'santri',
  DEWAN_KEAMANAN: 'dewan_keamanan',
  PERIZINAN: 'perizinan',
  TATA_TERTIB: 'tata_tertib',
  PELANGGARAN: 'pelanggaran',
  SANKSI: 'sanksi',
  SYSTEM_CONFIG: 'system_config',
  LOGS: 'logs',
  NOTIFIKASI: 'notifikasi',
  KOORDINASI: 'koordinasi',
  STRUKTUR_ORGANISASI: 'struktur_organisasi',
  AGENDA_PENGURUS: 'agenda_pengurus',
  EVALUASI_KEPENGURUSAN: 'evaluasi_kepengurusan',
  PENGAJUAN_DIVISI: 'pengajuan_divisi',
  SURAT_MENYURAT: 'surat_menyurat',
  KEUANGAN_TRANSAKSI: 'keuangan_transaksi',
  PERLENGKAPAN_INVENTARIS: 'perlengkapan_inventaris',
  PERLENGKAPAN_PEMINJAMAN: 'perlengkapan_peminjaman',
};

/**
 * Sanitizes an object before writing to Firestore.
 * Removes undefined fields to prevent Firestore serialization errors.
 */
function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean as T;
}

export interface CloudSyncTelemetry {
  provider: 'supabase' | 'firebase';
  supabaseConfigured: boolean;
  status: 'connected' | 'syncing' | 'offline' | 'error';
  lastSyncTime: string;
  cloudConnected: boolean;
  quotaExceeded?: boolean;
  errorMessage?: string;
  migrationNotification?: string | null;
  databaseId: string;
  projectId: string;
  activeListenersCount: number;
  totalSyncedItems: number;
}

class StorageService {
  private listeners: (() => void)[] = [];
  private unsubscribers: Unsubscribe[] = [];
  private supabaseChannels: RealtimeChannel[] = [];
  private supabaseRefetchTimers: Record<string, ReturnType<typeof setTimeout>> = {};
  private cloudConnected: boolean = false;
  private serverConfirmed: boolean = false;
  private cloudError: string | null = null;
  private isNavigatorOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private lastSyncTime: string = 'Menghubungkan Cloud...';
  private activeSessionUser: UserAccount | null = null;
  private lastResumeSyncAt: number = 0;
  private currentGenderScope: 'all' | 'putra' | 'putri' = 'all';
  private currentTheme: 'dark' | 'light' = 'dark';
  private quotaExceeded: boolean = false;
  private migrationDone: boolean = false;
  private migrationInProgress: boolean = false;
  private migrationNotification: string | null = null;
  private detectedAgendaNotifKeys = new Set<string>();

  // In-memory live snapshot mirror of Firestore Cloud Database
  private cache = {
    santri: [] as Santri[],
    dewan: [] as DewanKeamanan[],
    perizinan: [] as Perizinan[],
    tataTertib: [] as TataTertib[],
    pelanggaran: [] as Pelanggaran[],
    sanksi: [] as Sanksi[],
    users: [] as UserAccount[],
    systemConfig: buildCleanSystemConfig(),
    logs: [] as LogAktivitas[],
    notifikasi: [] as NotifikasiApp[],
    koordinasi: [] as PesanKoordinasi[],
    strukturOrganisasi: [] as StrukturOrganisasiNode[],
    agendaPengurus: [] as AgendaPengurus[],
    evaluasiKepengurusan: [] as EvaluasiKepengurusan[],
    pengajuanDivisi: [] as PengajuanDivisi[],
    arsipSurat: [] as ArsipSurat[],
    transaksiKeuangan: [] as TransaksiKeuangan[],
    barangInventaris: [] as BarangInventaris[],
    peminjamanBarang: [] as PeminjamanBarang[],
  };

  constructor() {
    // 1. Keamanan Autentikasi: Sesi baru diawali dari Layar Login
    try {
      sessionStorage.removeItem(SESSION_KEYS.CURRENT_USER);
    } catch {
      // ignore
    }

    // 2. Pantau status jaringan perangkat secara real-time (PC, Laptop, Android, iOS)
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isNavigatorOnline = true;
        if (!this.quotaExceeded && !isFirestoreQuotaPaused()) {
          this.resyncOnResume(false).catch(() => {});
        }
      });
      window.addEventListener('offline', () => {
        this.isNavigatorOnline = false;
        this.cloudConnected = false;
        this.serverConfirmed = false;
        this.lastSyncTime = 'Perangkat Offline';
        this.notify();
      });
    }

    if (!isSupabaseConfigured() && isFirestoreQuotaPaused()) {
      this.quotaExceeded = true;
      this.cloudConnected = false;
      this.serverConfirmed = false;
      this.cloudError = 'Kuota harian Firestore penuh (reset besok). Mode cache aktif.';
      this.lastSyncTime = 'Kuota Harian Firestore Penuh (Mode Cache Aktif)';
    }

    subscribeFirestoreQuotaPause((paused) => {
      if (paused && !this.quotaExceeded) {
        this.enterQuotaCacheMode('Kuota harian Firestore penuh (reset besok). Mode cache aktif.');
      }
    });

    // 3. Hydrate cache lokal terlebih dahulu lalu verifikasi kuota/koneksi server sebelum membuka 19 listener onSnapshot
    void this.bootstrapCloudSync();
  }

  private purgeLegacyLocalStorage() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      LEGACY_LOCAL_STORAGE_KEYS.forEach(key => {
        try {
          window.localStorage.removeItem(key);
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }
  }

  private readLocalJsonArray<T>(key: string): T[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return [];
      const raw = window.localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  private readLocalJsonObject<T>(key: string): Partial<T> | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Partial<T>) : null;
    } catch {
      return null;
    }
  }

  public getMigrationNotification(): string | null {
    return this.migrationNotification;
  }

  public dismissMigrationNotification(): void {
    if (this.migrationNotification !== null) {
      this.migrationNotification = null;
      this.notify();
    }
  }

  private async bootstrapCloudSync(): Promise<void> {
    await this.hydrateAllFromLocalCache();

    if (isSupabaseConfigured()) {
      const ok = await this.reloadFromSupabase();
      this.initSupabaseRealtime();
      if (ok) {
        this.cloudConnected = true;
        this.serverConfirmed = true;
        this.quotaExceeded = false;
        this.cloudError = null;
        this.lastSyncTime =
          new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }) + ' WIB';
        this.notify();
      }
      return;
    }

    if (this.isFirestorePaused()) {
      this.enterQuotaCacheMode('Kuota harian Firestore penuh (reset besok). Mode cache aktif.');
      return;
    }

    const conn = await testFirestoreConnection();
    if (conn.quotaExceeded) {
      this.enterQuotaCacheMode(conn.errorMessage);
      return;
    }

    if (conn.permissionDenied) {
      this.cloudConnected = false;
      this.serverConfirmed = false;
      this.cloudError = conn.errorMessage || 'Akses Firebase ditolak security rules.';
      this.lastSyncTime = 'Akses Firebase Ditolak Rules';
      this.notify();
      return;
    }

    this.initRealtimeCloudSync();

    if (!conn.ok) {
      this.cloudConnected = false;
      this.serverConfirmed = false;
      this.cloudError = conn.errorMessage || 'Gagal terhubung ke server Firebase.';
      this.lastSyncTime = 'Gagal Koneksi Firebase';
      this.notify();
      return;
    }

    this.cloudConnected = true;
    this.serverConfirmed = true;
    this.quotaExceeded = false;
    this.cloudError = null;
    this.lastSyncTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB';
    this.notify();

    await this.migrateLocalDataToCloudIfNeeded();
  }

  private enterQuotaCacheMode(rawMessage?: string): void {
    this.unsubscribers.forEach(unsub => {
      try { unsub(); } catch { /* ignore */ }
    });
    this.unsubscribers = [];
    this.quotaExceeded = true;
    this.cloudConnected = false;
    this.serverConfirmed = false;
    this.cloudError = rawMessage || 'Kuota harian Firestore penuh. Kuota akan reset otomatis besok.';
    this.lastSyncTime = 'Kuota Harian Firestore Penuh (Mode Cache Aktif)';
    void pauseFirestoreNetworkForQuota();
    this.notify();
  }

  private async hydrateAllFromLocalCache(): Promise<void> {
    const readCacheCol = async <T extends { id: string }>(colName: string): Promise<T[] | null> => {
      try {
        const snap = await getDocsFromCache(collection(db, colName));
        if (snap.empty) return [];
        return snap.docs.map(d => ({ ...d.data(), id: d.id } as T));
      } catch {
        return null;
      }
    };

    try {
      const [
        cfgSnap,
        santri,
        dewan,
        perizinan,
        pelanggaran,
        sanksi,
        tataTertib,
        users,
        logs,
        notifikasi,
        koordinasi,
        strukturOrganisasi,
        agendaPengurus,
        evaluasiKepengurusan,
        pengajuanDivisi,
        arsipSurat,
        transaksiKeuangan,
        barangInventaris,
        peminjamanBarang,
      ] = await Promise.all([
        getDocFromCache(doc(db, CLOUD_COLLECTIONS.SYSTEM_CONFIG, 'main')).catch(() => null),
        readCacheCol<Santri>(CLOUD_COLLECTIONS.SANTRI),
        readCacheCol<DewanKeamanan>(CLOUD_COLLECTIONS.DEWAN_KEAMANAN),
        readCacheCol<Perizinan>(CLOUD_COLLECTIONS.PERIZINAN),
        readCacheCol<Pelanggaran>(CLOUD_COLLECTIONS.PELANGGARAN),
        readCacheCol<Sanksi>(CLOUD_COLLECTIONS.SANKSI),
        readCacheCol<TataTertib>(CLOUD_COLLECTIONS.TATA_TERTIB),
        readCacheCol<UserAccount>(CLOUD_COLLECTIONS.USERS),
        readCacheCol<LogAktivitas>(CLOUD_COLLECTIONS.LOGS),
        readCacheCol<NotifikasiApp>(CLOUD_COLLECTIONS.NOTIFIKASI),
        readCacheCol<PesanKoordinasi>(CLOUD_COLLECTIONS.KOORDINASI),
        readCacheCol<StrukturOrganisasiNode>(CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI),
        readCacheCol<AgendaPengurus>(CLOUD_COLLECTIONS.AGENDA_PENGURUS),
        readCacheCol<EvaluasiKepengurusan>(CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN),
        readCacheCol<PengajuanDivisi>(CLOUD_COLLECTIONS.PENGAJUAN_DIVISI),
        readCacheCol<ArsipSurat>(CLOUD_COLLECTIONS.SURAT_MENYURAT),
        readCacheCol<TransaksiKeuangan>(CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI),
        readCacheCol<BarangInventaris>(CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS),
        readCacheCol<PeminjamanBarang>(CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN),
      ]);

      if (cfgSnap && cfgSnap.exists()) {
        this.cache.systemConfig = buildCleanSystemConfig(cfgSnap.data() as Partial<SystemConfig>);
      }
      if (santri) this.cache.santri = santri;
      if (dewan) this.cache.dewan = dewan;
      if (perizinan) this.cache.perizinan = perizinan.sort((a, b) => (b.id > a.id ? 1 : -1));
      if (pelanggaran) this.cache.pelanggaran = pelanggaran.sort((a, b) => (b.id > a.id ? 1 : -1));
      if (sanksi) this.cache.sanksi = sanksi.sort((a, b) => (b.id > a.id ? 1 : -1));
      if (tataTertib) this.cache.tataTertib = tataTertib;
      if (users && users.length > 0) this.cache.users = users;
      if (logs) this.cache.logs = logs.sort((a, b) => ((b.timestamp || 0) > (a.timestamp || 0) ? 1 : -1)).slice(0, 300);
      if (notifikasi) this.cache.notifikasi = notifikasi.sort((a, b) => (b.id > a.id ? 1 : -1)).slice(0, 50);
      if (koordinasi) this.cache.koordinasi = koordinasi.sort((a, b) => (b.id > a.id ? 1 : -1));
      if (strukturOrganisasi) this.cache.strukturOrganisasi = strukturOrganisasi.sort((a, b) => (a.level - b.level) || (a.urutan - b.urutan));
      if (agendaPengurus) this.cache.agendaPengurus = agendaPengurus.sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
      if (evaluasiKepengurusan) this.cache.evaluasiKepengurusan = evaluasiKepengurusan.sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
      if (pengajuanDivisi) this.cache.pengajuanDivisi = pengajuanDivisi.sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
      if (arsipSurat) this.cache.arsipSurat = arsipSurat.sort((a, b) => (b.tanggalSurat > a.tanggalSurat ? 1 : -1));
      if (transaksiKeuangan) this.cache.transaksiKeuangan = transaksiKeuangan.sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
      if (barangInventaris) this.cache.barangInventaris = barangInventaris.sort((a, b) => (a.kodeBarang > b.kodeBarang ? 1 : -1));
      if (peminjamanBarang) this.cache.peminjamanBarang = peminjamanBarang.sort((a, b) => (b.tanggalPinjam > a.tanggalPinjam ? 1 : -1));
      this.notify();
    } catch {
      // ignore initial cache errors
    }
  }

  private async verifyCloudConnectionAndMigrate(): Promise<void> {
    const conn = await testFirestoreConnection();
    if (!conn.ok) {
      if (conn.quotaExceeded) {
        this.enterQuotaCacheMode(conn.errorMessage);
        return;
      }
      this.cloudConnected = false;
      this.serverConfirmed = false;
      this.cloudError = conn.errorMessage || 'Gagal terhubung ke server Firebase.';
      this.lastSyncTime = 'Gagal Koneksi Firebase';
      this.notify();
      return;
    }

    this.cloudConnected = true;
    this.serverConfirmed = true;
    this.quotaExceeded = false;
    this.cloudError = null;
    this.lastSyncTime = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WIB';
    this.notify();

    await this.migrateLocalDataToCloudIfNeeded();
  }

  /**
   * Pengecekan cerdas saat aplikasi dibuka:
   * Jika terdeteksi data Santri, Ustadzah, atau operasional lain di localStorage yang belum ada
   * di server Firebase Cloud, unggah otomatis ke Firestore lalu bersihkan penyimpanan lokal duplikat.
   */
  public async migrateLocalDataToCloudIfNeeded(): Promise<number> {
    if (this.migrationDone || this.migrationInProgress) return 0;
    if (typeof window === 'undefined' || !window.localStorage) {
      this.migrationDone = true;
      return 0;
    }
    if (!this.isNavigatorOnline || this.quotaExceeded) return 0;

    this.migrationInProgress = true;
    try {
      const localSantriDirect = this.readLocalJsonArray<Santri>('almaliki_data_santri');
      const localSantriLegacy = this.readLocalJsonArray<Santri>('sim_kamtib_santri_v2');
      const localUstadzDirect = this.readLocalJsonArray<DataUstadz>('almaliki_data_ustadzah');
      const localConfigLegacy = this.readLocalJsonObject<SystemConfig>('sim_kamtib_system_config_v2');
      const localPerizinanLegacy = this.readLocalJsonArray<Perizinan>('sim_kamtib_perizinan_v2');
      const localSuratLegacy = this.readLocalJsonArray<ArsipSurat>('sim_maliki_surat_v1');
      const localAgendaLegacy = this.readLocalJsonArray<AgendaPengurus>('sim_maliki_agenda_v1');
      const localDewanLegacy = this.readLocalJsonArray<DewanKeamanan>('sim_kamtib_dewan_keamanan_v2');
      const localPelanggaranLegacy = this.readLocalJsonArray<Pelanggaran>('sim_kamtib_pelanggaran_v2');
      const localSanksiLegacy = this.readLocalJsonArray<Sanksi>('sim_kamtib_sanksi_v2');
      const localKeuanganLegacy = this.readLocalJsonArray<TransaksiKeuangan>('sim_maliki_keuangan_v1');
      const localInventarisLegacy = this.readLocalJsonArray<BarangInventaris>('sim_maliki_inventaris_v1');
      const localPeminjamanLegacy = this.readLocalJsonArray<PeminjamanBarang>('sim_maliki_peminjaman_v1');

      const localUstadzFromConfig = Array.isArray(localConfigLegacy?.ustadzList)
        ? localConfigLegacy.ustadzList
        : Array.isArray(localConfigLegacy?.dataUstadzList)
          ? localConfigLegacy.dataUstadzList
          : [];

      const hasAnyOperationalLocalData =
        localSantriDirect.length > 0 ||
        localSantriLegacy.length > 0 ||
        localUstadzDirect.length > 0 ||
        localUstadzFromConfig.length > 0 ||
        localPerizinanLegacy.length > 0 ||
        localSuratLegacy.length > 0 ||
        localAgendaLegacy.length > 0 ||
        localDewanLegacy.length > 0 ||
        localPelanggaranLegacy.length > 0 ||
        localSanksiLegacy.length > 0 ||
        localKeuanganLegacy.length > 0 ||
        localInventarisLegacy.length > 0 ||
        localPeminjamanLegacy.length > 0 ||
        Boolean(localConfigLegacy?.murotilAbsensiSantriList?.length) ||
        Boolean(localConfigLegacy?.murotilAbsensiPjList?.length);

      if (!hasAnyOperationalLocalData) {
        this.purgeLegacyLocalStorage();
        this.migrationDone = true;
        return 0;
      }

      // Ambil kondisi aktual dari server Firebase terlebih dahulu agar data tidak duplikat atau tertimpa
      const [cloudSantriSnap, cloudConfigSnap] = await Promise.all([
        getDocsFromServer(collection(db, CLOUD_COLLECTIONS.SANTRI)),
        getDocFromServer(doc(db, CLOUD_COLLECTIONS.SYSTEM_CONFIG, 'main')),
      ]);

      const cloudConfigData = cloudConfigSnap.exists()
        ? (cloudConfigSnap.data() as Partial<SystemConfig>)
        : {};
      const localSampleCleared = window.localStorage.getItem('almaliki_sample_cleared') === 'true';
      const isSampleCleared = Boolean(cloudConfigData.sampleCleared) || localSampleCleared;

      const sampleSantriIds = new Set(INITIAL_SANTRI.map(s => s.id));
      const sampleUstadzIds = new Set((INITIAL_SYSTEM_CONFIG.ustadzList || []).map(u => u.id));

      let migratedCount = 0;

      // A. Migrasi Data Santri (gabungkan almaliki_data_santri + sim_kamtib_santri_v2)
      const cloudSantriList = cloudSantriSnap.docs.map(d => ({ ...d.data(), id: d.id } as Santri));
      const existingSantriIds = new Set(cloudSantriList.map(s => s.id));
      const existingSantriNis = new Set(
        cloudSantriList.map(s => (s.nis || '').trim().toLowerCase()).filter(Boolean)
      );

      const candidateSantriMap = new Map<string, Santri>();
      for (const raw of [...localSantriDirect, ...localSantriLegacy]) {
        if (!raw || !raw.nama) continue;
        const normalizedId = (raw.id || `s_mig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`).trim();
        const normalizedNis = (raw.nis || '').trim().toLowerCase();
        if (isSampleCleared && sampleSantriIds.has(normalizedId)) continue;
        if (existingSantriIds.has(normalizedId)) continue;
        if (normalizedNis && existingSantriNis.has(normalizedNis)) continue;
        if (!candidateSantriMap.has(normalizedId)) {
          candidateSantriMap.set(normalizedId, {
            ...raw,
            id: normalizedId,
          });
          if (normalizedNis) existingSantriNis.add(normalizedNis);
        }
      }

      for (const santri of candidateSantriMap.values()) {
        await setDoc(doc(db, CLOUD_COLLECTIONS.SANTRI, santri.id), sanitizeForFirestore(santri), { merge: true });
        migratedCount++;
      }

      // B. Migrasi Data Ustadz & Ustadzah + Absensi / Jadwal dari localStorage config
      const cloudUstadzList: DataUstadz[] = Array.isArray(cloudConfigData.ustadzList)
        ? cloudConfigData.ustadzList
        : Array.isArray(cloudConfigData.dataUstadzList)
          ? cloudConfigData.dataUstadzList
          : [];
      const existingUstadzIds = new Set(cloudUstadzList.map(u => u.id));
      const existingUstadzKeys = new Set(
        cloudUstadzList.map(u => `${(u.nip || '').trim().toLowerCase()}::${(u.nama || '').trim().toLowerCase()}`)
      );

      const newUstadzToUpload: DataUstadz[] = [];
      for (const raw of [...localUstadzDirect, ...localUstadzFromConfig]) {
        if (!raw || !raw.nama) continue;
        const normalizedId = (raw.id || `ust_mig_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`).trim();
        const dedupKey = `${(raw.nip || '').trim().toLowerCase()}::${raw.nama.trim().toLowerCase()}`;
        if (isSampleCleared && sampleUstadzIds.has(normalizedId)) continue;
        if (existingUstadzIds.has(normalizedId) || existingUstadzKeys.has(dedupKey)) continue;
        existingUstadzIds.add(normalizedId);
        existingUstadzKeys.add(dedupKey);
        newUstadzToUpload.push({ ...raw, id: normalizedId });
      }

      const configPatch: Partial<SystemConfig> = {};
      if (newUstadzToUpload.length > 0) {
        const mergedUstadz = [...newUstadzToUpload, ...cloudUstadzList];
        configPatch.ustadzList = mergedUstadz;
        configPatch.dataUstadzList = mergedUstadz;
        migratedCount += newUstadzToUpload.length;
      }

      if (localConfigLegacy) {
        const mergeConfigArray = <T extends { id: string }>(
          localArr: T[] | undefined,
          cloudArr: T[] | undefined
        ): T[] | null => {
          if (!Array.isArray(localArr) || localArr.length === 0) return null;
          const existing = Array.isArray(cloudArr) ? cloudArr : [];
          const idSet = new Set(existing.map(x => x.id));
          const additions = localArr.filter(x => x && x.id && !idSet.has(x.id));
          if (additions.length === 0) return null;
          migratedCount += additions.length;
          return [...additions, ...existing];
        };

        const mergedAbsensiSantri = mergeConfigArray(
          localConfigLegacy.murotilAbsensiSantriList,
          cloudConfigData.murotilAbsensiSantriList
        );
        if (mergedAbsensiSantri) configPatch.murotilAbsensiSantriList = mergedAbsensiSantri;

        const mergedAbsensiPj = mergeConfigArray(
          localConfigLegacy.murotilAbsensiPjList,
          cloudConfigData.murotilAbsensiPjList
        );
        if (mergedAbsensiPj) configPatch.murotilAbsensiPjList = mergedAbsensiPj;

        const mergedSetoran = mergeConfigArray(
          localConfigLegacy.murotilSetoranList,
          cloudConfigData.murotilSetoranList
        );
        if (mergedSetoran) configPatch.murotilSetoranList = mergedSetoran;

        const mergedJadwalPerbaikan = mergeConfigArray(
          localConfigLegacy.jadwalPerbaikanList,
          cloudConfigData.jadwalPerbaikanList
        );
        if (mergedJadwalPerbaikan) configPatch.jadwalPerbaikanList = mergedJadwalPerbaikan;
      }

      if (Object.keys(configPatch).length > 0) {
        await setDoc(
          doc(db, CLOUD_COLLECTIONS.SYSTEM_CONFIG, 'main'),
          sanitizeForFirestore({ ...configPatch, initialSeedCompleted: true }),
          { merge: true }
        );
      }

      // C. Migrasi koleksi lain yang mungkin tersimpan di localStorage (Perizinan, Surat, Jadwal/Agenda, dll.)
      const migrateCollectionMissing = async <T extends { id: string }>(
        colName: string,
        localItems: T[]
      ) => {
        if (!localItems.length) return;
        const snap = await getDocsFromServer(collection(db, colName));
        const existingIds = new Set(snap.docs.map(d => d.id));
        for (const item of localItems) {
          if (item && item.id && !existingIds.has(item.id)) {
            await setDoc(doc(db, colName, item.id), sanitizeForFirestore(item), { merge: true });
            existingIds.add(item.id);
            migratedCount++;
          }
        }
      };

      await Promise.all([
        migrateCollectionMissing(CLOUD_COLLECTIONS.PERIZINAN, localPerizinanLegacy),
        migrateCollectionMissing(CLOUD_COLLECTIONS.SURAT_MENYURAT, localSuratLegacy),
        migrateCollectionMissing(CLOUD_COLLECTIONS.AGENDA_PENGURUS, localAgendaLegacy),
        migrateCollectionMissing(CLOUD_COLLECTIONS.DEWAN_KEAMANAN, localDewanLegacy),
        migrateCollectionMissing(CLOUD_COLLECTIONS.PELANGGARAN, localPelanggaranLegacy),
        migrateCollectionMissing(CLOUD_COLLECTIONS.SANKSI, localSanksiLegacy),
        migrateCollectionMissing(CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI, localKeuanganLegacy),
        migrateCollectionMissing(CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS, localInventarisLegacy),
        migrateCollectionMissing(CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN, localPeminjamanLegacy),
      ]);

      // Bersihkan penyimpanan lokal yang duplikat hanya setelah migrasi Cloud sukses
      this.purgeLegacyLocalStorage();
      this.migrationDone = true;

      if (migratedCount > 0) {
        this.migrationNotification = 'Data lokal berhasil disinkronkan ke Cloud';
        this.addLog(
          'Migrasi Otomatis Cloud',
          `Berhasil menyinkronkan ${migratedCount} data lokal perangkat ke Firebase Cloud.`,
          'admin'
        );
        this.notify();
      }
      return migratedCount;
    } catch (error) {
      // Jangan hapus localStorage jika gagal terhubung / permission denied agar data lokal tidak pernah hilang
      const msg = extractFirebaseErrorMessage(error);
      if (isFirestorePermissionError(error)) {
        this.cloudConnected = false;
        this.serverConfirmed = false;
        this.cloudError = msg;
        this.notify();
      }
      console.warn('Auto migration deferred:', msg);
      return 0;
    } finally {
      this.migrationInProgress = false;
    }
  }

  private isFirestorePaused(): boolean {
    return this.quotaExceeded || isFirestoreQuotaPaused();
  }

  private fireFirestoreSetDoc(
    colName: string,
    id: string,
    data: Record<string, unknown>,
    operationType: OperationType = OperationType.WRITE,
    merge = true
  ): void {
    if (this.isFirestorePaused()) return;
    this.trackCloudWrite(
      setDoc(doc(db, colName, id), sanitizeForFirestore(data), { merge }),
      operationType,
      `${colName}/${id}`
    );
  }

  private fireFirestoreDeleteDoc(colName: string, id: string): void {
    if (this.isFirestorePaused()) return;
    this.trackCloudWrite(
      deleteDoc(doc(db, colName, id)),
      OperationType.DELETE,
      `${colName}/${id}`
    );
  }

  private trackCloudWrite(promise: Promise<void>, operationType: OperationType, path: string): void {
    if (this.isFirestorePaused()) return;
    promise
      .then(() => {
        if (this.cloudError && this.isNavigatorOnline && !this.quotaExceeded) {
          this.cloudError = null;
          this.cloudConnected = true;
          this.serverConfirmed = true;
          this.notify();
        }
      })
      .catch(err => {
        const msg = extractFirebaseErrorMessage(err);
        if (isFirestoreQuotaError(err)) {
          this.enterQuotaCacheMode(msg);
          return;
        }
        handleFirestoreError(err, operationType, path);
        if (isFirestorePermissionError(err) || !this.isNavigatorOnline) {
          this.cloudConnected = false;
          this.serverConfirmed = false;
          this.cloudError = msg;
          this.lastSyncTime = 'Gagal Sinkronisasi Cloud';
          this.notify();
        }
      });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.error('Listener notify error:', err);
      }
    });
  }

  /**
   * Initializes live Firestore onSnapshot listeners for all application collections.
   * Single Source of Truth: reflects exact cloud state across all devices with zero sample auto-seeding.
   */
  public initRealtimeCloudSync() {
    this.unsubscribers.forEach(unsub => {
      try { unsub(); } catch { /* ignore */ }
    });
    this.unsubscribers = [];

    if (this.isFirestorePaused()) {
      return;
    }

    const handleSyncUpdate = (fromCache = false) => {
      if (!fromCache && this.isNavigatorOnline) {
        this.serverConfirmed = true;
        this.cloudConnected = true;
        this.quotaExceeded = false;
        this.cloudError = null;
        this.lastSyncTime = new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB';
      } else if (!this.isNavigatorOnline) {
        this.cloudConnected = false;
        this.lastSyncTime = 'Mode Offline (Cache Lokal)';
      } else if (this.quotaExceeded) {
        this.cloudConnected = false;
        this.lastSyncTime = 'Kuota Harian Firestore Penuh (Mode Cache Aktif)';
      }
      this.notify();
    };

    const handleSnapshotError = (error: unknown, path: string) => {
      const rawMessage = extractFirebaseErrorMessage(error);
      if (isFirestoreQuotaError(error)) {
        this.enterQuotaCacheMode(rawMessage);
        return;
      }
      handleFirestoreError(error, OperationType.GET, path);
      this.cloudConnected = false;
      this.serverConfirmed = false;
      this.cloudError = rawMessage;
      this.lastSyncTime = 'Gagal Koneksi Firebase';
      this.notify();
    };

    const attachCollectionListener = <T extends { id: string }>(
      colName: string,
      setList: (items: T[]) => void,
      options?: {
        sorter?: (a: T, b: T) => number;
        transform?: (items: T[]) => T[];
        postProcess?: (items: T[]) => void;
      }
    ) => {
      try {
        const unsub = onSnapshot(
          collection(db, colName),
          snapshot => {
            const list: T[] = [];
            snapshot.forEach(docSnap => {
              list.push({ ...docSnap.data(), id: docSnap.id } as T);
            });
            let result = options?.sorter ? list.sort(options.sorter) : list;
            if (options?.transform) {
              result = options.transform(result);
            }
            setList(result);
            if (options?.postProcess) {
              options.postProcess(result);
            }
            handleSyncUpdate(snapshot.metadata.fromCache);
          },
          error => handleSnapshotError(error, colName)
        );
        this.unsubscribers.push(unsub);
      } catch (e) {
        console.warn(`Sync ${colName} listener warning:`, e);
      }
    };

    // 1. Santri Collection Realtime Listener
    attachCollectionListener<Santri>(
      CLOUD_COLLECTIONS.SANTRI,
      items => { this.cache.santri = items; },
      {
        transform: list =>
          list.map(s => ({
            ...s,
            foto: s.foto && s.foto.includes('unsplash.com') ? '' : (s.foto || ''),
          })),
      }
    );

    // 2. Dewan Keamanan Collection Realtime Listener
    attachCollectionListener<DewanKeamanan>(
      CLOUD_COLLECTIONS.DEWAN_KEAMANAN,
      items => { this.cache.dewan = items; },
      {
        transform: list =>
          list.map(d => ({
            ...d,
            foto: d.foto && d.foto.includes('unsplash.com') ? '' : (d.foto || ''),
          })),
      }
    );

    // 3. Perizinan Collection Realtime Listener
    attachCollectionListener<Perizinan>(
      CLOUD_COLLECTIONS.PERIZINAN,
      items => { this.cache.perizinan = items; },
      { sorter: (a, b) => (b.id > a.id ? 1 : -1) }
    );

    // 4. Pelanggaran Collection Realtime Listener
    attachCollectionListener<Pelanggaran>(
      CLOUD_COLLECTIONS.PELANGGARAN,
      items => { this.cache.pelanggaran = items; },
      { sorter: (a, b) => (b.id > a.id ? 1 : -1) }
    );

    // 5. Sanksi Collection Realtime Listener
    attachCollectionListener<Sanksi>(
      CLOUD_COLLECTIONS.SANKSI,
      items => { this.cache.sanksi = items; },
      { sorter: (a, b) => (b.id > a.id ? 1 : -1) }
    );

    // 6. Tata Tertib Collection Realtime Listener
    attachCollectionListener<TataTertib>(
      CLOUD_COLLECTIONS.TATA_TERTIB,
      items => { this.cache.tataTertib = items; }
    );

    // 7. Users Collection Realtime Listener (syncs RBAC & active session user seamlessly)
    try {
      const unsubUsers = onSnapshot(
        collection(db, CLOUD_COLLECTIONS.USERS),
        snapshot => {
          const list: UserAccount[] = [];
          snapshot.forEach(docSnap => {
            const raw = { ...docSnap.data(), id: docSnap.id } as UserAccount;
            list.push({
              ...raw,
              avatar: raw.avatar && raw.avatar.includes('unsplash.com') ? '' : (raw.avatar || ''),
            });
          });
          this.cache.users = list;

          const active = this.getCurrentUser();
          if (active && list.length > 0) {
            const fresh = list.find(u => u.id === active.id);
            if (fresh) {
              this.activeSessionUser = fresh;
              try {
                sessionStorage.setItem(SESSION_KEYS.CURRENT_USER, JSON.stringify(fresh));
              } catch { /* ignore */ }
            }
          }

          handleSyncUpdate(snapshot.metadata.fromCache);
        },
        error => handleSnapshotError(error, CLOUD_COLLECTIONS.USERS)
      );
      this.unsubscribers.push(unsubUsers);
    } catch (e) {
      console.warn('Sync users listener warning:', e);
    }

    // 8. System Config Document Realtime Listener
    try {
      const unsubConfig = onSnapshot(
        doc(db, CLOUD_COLLECTIONS.SYSTEM_CONFIG, 'main'),
        docSnap => {
          if (docSnap.exists()) {
            this.cache.systemConfig = buildCleanSystemConfig(docSnap.data() as Partial<SystemConfig>);
          } else {
            this.cache.systemConfig = buildCleanSystemConfig();
          }
          handleSyncUpdate(docSnap.metadata.fromCache);
        },
        error => handleSnapshotError(error, `${CLOUD_COLLECTIONS.SYSTEM_CONFIG}/main`)
      );
      this.unsubscribers.push(unsubConfig);
    } catch (e) {
      console.warn('Sync config listener warning:', e);
    }

    // 9. Logs Collection Realtime Listener
    attachCollectionListener<LogAktivitas>(
      CLOUD_COLLECTIONS.LOGS,
      items => { this.cache.logs = items; },
      {
        sorter: (a, b) => ((b.timestamp || 0) > (a.timestamp || 0) ? 1 : -1),
        transform: list => list.slice(0, 300),
      }
    );

    // 10. Notifikasi Collection Realtime Listener
    attachCollectionListener<NotifikasiApp>(
      CLOUD_COLLECTIONS.NOTIFIKASI,
      items => { this.cache.notifikasi = items; },
      {
        sorter: (a, b) => (b.id > a.id ? 1 : -1),
        transform: list => list.slice(0, 50),
      }
    );

    // 11. Koordinasi Collection Realtime Listener
    attachCollectionListener<PesanKoordinasi>(
      CLOUD_COLLECTIONS.KOORDINASI,
      items => { this.cache.koordinasi = items; },
      { sorter: (a, b) => (b.id > a.id ? 1 : -1) }
    );

    // 12-19. Management Collections Realtime Listeners
    attachCollectionListener<StrukturOrganisasiNode>(
      CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI,
      items => { this.cache.strukturOrganisasi = items; },
      { sorter: (a, b) => (a.level - b.level) || (a.urutan - b.urutan) }
    );
    attachCollectionListener<AgendaPengurus>(
      CLOUD_COLLECTIONS.AGENDA_PENGURUS,
      items => { this.cache.agendaPengurus = items; },
      {
        sorter: (a, b) => (b.tanggal > a.tanggal ? 1 : -1),
        postProcess: () => setTimeout(() => this.checkAndDetectTodayAgendas(), 50),
      }
    );
    attachCollectionListener<EvaluasiKepengurusan>(
      CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN,
      items => { this.cache.evaluasiKepengurusan = items; },
      { sorter: (a, b) => (b.tanggal > a.tanggal ? 1 : -1) }
    );
    attachCollectionListener<PengajuanDivisi>(
      CLOUD_COLLECTIONS.PENGAJUAN_DIVISI,
      items => { this.cache.pengajuanDivisi = items; },
      { sorter: (a, b) => (b.tanggal > a.tanggal ? 1 : -1) }
    );
    attachCollectionListener<ArsipSurat>(
      CLOUD_COLLECTIONS.SURAT_MENYURAT,
      items => { this.cache.arsipSurat = items; },
      { sorter: (a, b) => (b.tanggalSurat > a.tanggalSurat ? 1 : -1) }
    );
    attachCollectionListener<TransaksiKeuangan>(
      CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI,
      items => { this.cache.transaksiKeuangan = items; },
      { sorter: (a, b) => (b.tanggal > a.tanggal ? 1 : -1) }
    );
    attachCollectionListener<BarangInventaris>(
      CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS,
      items => { this.cache.barangInventaris = items; },
      { sorter: (a, b) => (a.kodeBarang > b.kodeBarang ? 1 : -1) }
    );
    attachCollectionListener<PeminjamanBarang>(
      CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN,
      items => { this.cache.peminjamanBarang = items; },
      { sorter: (a, b) => (b.tanggalPinjam > a.tanggalPinjam ? 1 : -1) }
    );
  }

  private async supabaseUpsertRow(table: string, row: Record<string, unknown>): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      const { error } = await client.from(table).upsert(row, { onConflict: 'id' });
      if (error) throw error;
      if (this.cloudError && this.isNavigatorOnline) {
        this.cloudError = null;
        this.cloudConnected = true;
        this.serverConfirmed = true;
        this.notify();
      }
    } catch (err) {
      const msg = extractSupabaseErrorMessage(err);
      console.warn(`Supabase upsert [${table}] warning:`, msg);
      this.cloudError = msg;
      this.notify();
    }
  }

  private async supabaseDeleteRow(table: string, id: string): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      const { error } = await client.from(table).delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      const msg = extractSupabaseErrorMessage(err);
      console.warn(`Supabase delete [${table}/${id}] warning:`, msg);
      this.cloudError = msg;
      this.notify();
    }
  }

  private async syncNormalizedTableDiff<T extends { id: string }>(
    table: string,
    prevItems: T[],
    nextItems: T[],
    toRow: (item: T) => Record<string, unknown>,
    idPrefix = ''
  ): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      const nextIds = new Set(nextItems.map((i) => `${idPrefix}${i.id}`));
      const removedIds = prevItems
        .map((i) => `${idPrefix}${i.id}`)
        .filter((fullId) => !nextIds.has(fullId));

      if (removedIds.length > 0) {
        const { error: delErr } = await client.from(table).delete().in('id', removedIds);
        if (delErr) throw delErr;
      }

      if (nextItems.length > 0) {
        const rows = nextItems.map(toRow);
        const { error: upErr } = await client.from(table).upsert(rows, { onConflict: 'id' });
        if (upErr) throw upErr;
      }
    } catch (err) {
      console.warn(`Supabase normalized diff sync [${table}] warning:`, extractSupabaseErrorMessage(err));
    }
  }

  private async fetchSupabaseTableRows(table: string): Promise<SupabaseJsonRow[] | null> {
    const client = getSupabaseClient();
    if (!client) return null;
    const { data, error } = await client.from(table).select('*');
    if (error) {
      throw new Error(`[${table}] ${extractSupabaseErrorMessage(error)}`);
    }
    return (data || []) as SupabaseJsonRow[];
  }

  private applySupabaseTableRows(table: string, rows: SupabaseJsonRow[]): void {
    switch (table) {
      case 'santri':
        this.cache.santri = rows
          .map((r) => fromSupabaseRow<Santri>(r))
          .map((s) => ({
            ...s,
            foto: s.foto && s.foto.includes('unsplash.com') ? '' : (s.foto || ''),
          }));
        break;
      case 'dewan_keamanan':
        this.cache.dewan = rows
          .map((r) => fromSupabaseRow<DewanKeamanan>(r))
          .map((d) => ({
            ...d,
            foto: d.foto && d.foto.includes('unsplash.com') ? '' : (d.foto || ''),
          }));
        break;
      case 'perizinan':
        this.cache.perizinan = rows
          .map((r) => fromSupabaseRow<Perizinan>(r))
          .sort((a, b) => (b.id > a.id ? 1 : -1));
        break;
      case 'pelanggaran':
        this.cache.pelanggaran = rows
          .map((r) => fromSupabaseRow<Pelanggaran>(r))
          .sort((a, b) => (b.id > a.id ? 1 : -1));
        break;
      case 'sanksi':
        this.cache.sanksi = rows
          .map((r) => fromSupabaseRow<Sanksi>(r))
          .sort((a, b) => (b.id > a.id ? 1 : -1));
        break;
      case 'tata_tertib':
        this.cache.tataTertib = rows.map((r) => fromSupabaseRow<TataTertib>(r));
        break;
      case 'users': {
        const list = rows.map((r) => {
          const raw = fromSupabaseRow<UserAccount>(r);
          return {
            ...raw,
            avatar: raw.avatar && raw.avatar.includes('unsplash.com') ? '' : (raw.avatar || ''),
          };
        });
        this.cache.users = list;
        const active = this.getCurrentUser();
        if (active && list.length > 0) {
          const fresh = list.find((u) => u.id === active.id);
          if (fresh) {
            this.activeSessionUser = fresh;
            try {
              sessionStorage.setItem(SESSION_KEYS.CURRENT_USER, JSON.stringify(fresh));
            } catch {
              // ignore
            }
          }
        }
        break;
      }
      case 'system_config': {
        const mainRow = rows.find((r) => r.id === 'main') || rows[0];
        if (mainRow) {
          const prevCfg = this.cache.systemConfig;
          const nextCfg = buildCleanSystemConfig(
            fromSupabaseRow<SystemConfig & { id: string }>(mainRow)
          );
          if ((!nextCfg.ustadzList || nextCfg.ustadzList.length === 0) && prevCfg.ustadzList?.length) {
            nextCfg.ustadzList = prevCfg.ustadzList;
            nextCfg.dataUstadzList = prevCfg.ustadzList;
          }
          if ((!nextCfg.fasilitasGedungList || nextCfg.fasilitasGedungList.length === 0) && prevCfg.fasilitasGedungList?.length) {
            nextCfg.fasilitasGedungList = prevCfg.fasilitasGedungList;
          }
          if ((!nextCfg.jadwalPerbaikanList || nextCfg.jadwalPerbaikanList.length === 0) && prevCfg.jadwalPerbaikanList?.length) {
            nextCfg.jadwalPerbaikanList = prevCfg.jadwalPerbaikanList;
          }
          if ((!nextCfg.murotilAbsensiSantriList || nextCfg.murotilAbsensiSantriList.length === 0) && prevCfg.murotilAbsensiSantriList?.length) {
            nextCfg.murotilAbsensiSantriList = prevCfg.murotilAbsensiSantriList;
          }
          if ((!nextCfg.murotilAbsensiPjList || nextCfg.murotilAbsensiPjList.length === 0) && prevCfg.murotilAbsensiPjList?.length) {
            nextCfg.murotilAbsensiPjList = prevCfg.murotilAbsensiPjList;
          }
          this.cache.systemConfig = nextCfg;
        }
        break;
      }
      case 'ustadz': {
        if (rows.length > 0) {
          const list = rows.map((r) => fromSupabaseRow<DataUstadz>(r));
          this.cache.systemConfig = {
            ...this.cache.systemConfig,
            ustadzList: list,
            dataUstadzList: list,
          };
        }
        break;
      }
      case 'fasilitas_gedung': {
        if (rows.length > 0) {
          const list = rows.map((r) =>
            fromSupabaseRow<NonNullable<SystemConfig['fasilitasGedungList']>[number]>(r)
          );
          this.cache.systemConfig = {
            ...this.cache.systemConfig,
            fasilitasGedungList: list,
          };
        }
        break;
      }
      case 'jadwal_agenda': {
        const agendaItems: AgendaPengurus[] = [];
        const perbaikanItems: NonNullable<SystemConfig['jadwalPerbaikanList']> = [];
        for (const r of rows) {
          if (r.sumber === 'perbaikan_aset' || String(r.id).startsWith('perbaikan__')) {
            const parsed = fromSupabaseRow<
              NonNullable<SystemConfig['jadwalPerbaikanList']>[number]
            >(r);
            const realId = String((r.data as { id?: string } | undefined)?.id || parsed.id).replace(
              /^perbaikan__/,
              ''
            );
            perbaikanItems.push({ ...parsed, id: realId });
          } else {
            agendaItems.push(fromSupabaseRow<AgendaPengurus>(r));
          }
        }
        this.cache.agendaPengurus = agendaItems.sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
        if (perbaikanItems.length > 0) {
          this.cache.systemConfig = {
            ...this.cache.systemConfig,
            jadwalPerbaikanList: perbaikanItems,
          };
        }
        setTimeout(() => this.checkAndDetectTodayAgendas(), 50);
        break;
      }
      case 'absensi_murotil': {
        const absSantri: NonNullable<SystemConfig['murotilAbsensiSantriList']> = [];
        const absPj: NonNullable<SystemConfig['murotilAbsensiPjList']> = [];
        for (const r of rows) {
          if (r.jenis === 'pj' || String(r.id).startsWith('abs_pj__')) {
            const parsed = fromSupabaseRow<
              NonNullable<SystemConfig['murotilAbsensiPjList']>[number]
            >(r);
            const realId = String((r.data as { id?: string } | undefined)?.id || parsed.id).replace(
              /^abs_pj__/,
              ''
            );
            absPj.push({ ...parsed, id: realId });
          } else {
            const parsed = fromSupabaseRow<
              NonNullable<SystemConfig['murotilAbsensiSantriList']>[number]
            >(r);
            const realId = String((r.data as { id?: string } | undefined)?.id || parsed.id).replace(
              /^abs_s__/,
              ''
            );
            absSantri.push({ ...parsed, id: realId });
          }
        }
        if (absSantri.length > 0 || absPj.length > 0) {
          this.cache.systemConfig = {
            ...this.cache.systemConfig,
            ...(absSantri.length > 0 ? { murotilAbsensiSantriList: absSantri } : {}),
            ...(absPj.length > 0 ? { murotilAbsensiPjList: absPj } : {}),
          };
        }
        break;
      }
      case 'logs':
        this.cache.logs = rows
          .map((r) => fromSupabaseRow<LogAktivitas>(r))
          .sort((a, b) => ((b.timestamp || 0) > (a.timestamp || 0) ? 1 : -1))
          .slice(0, 300);
        break;
      case 'notifikasi':
        this.cache.notifikasi = rows
          .map((r) => fromSupabaseRow<NotifikasiApp>(r))
          .sort((a, b) => (b.id > a.id ? 1 : -1))
          .slice(0, 50);
        break;
      case 'koordinasi':
        this.cache.koordinasi = rows
          .map((r) => fromSupabaseRow<PesanKoordinasi>(r))
          .sort((a, b) => (b.id > a.id ? 1 : -1));
        break;
      case 'struktur_organisasi':
        this.cache.strukturOrganisasi = rows
          .map((r) => fromSupabaseRow<StrukturOrganisasiNode>(r))
          .sort((a, b) => (a.level - b.level) || (a.urutan - b.urutan));
        break;
      case 'evaluasi_kepengurusan':
        this.cache.evaluasiKepengurusan = rows
          .map((r) => fromSupabaseRow<EvaluasiKepengurusan>(r))
          .sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
        break;
      case 'pengajuan_divisi':
        this.cache.pengajuanDivisi = rows
          .map((r) => fromSupabaseRow<PengajuanDivisi>(r))
          .sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
        break;
      case 'surat_menyurat':
        this.cache.arsipSurat = rows
          .map((r) => fromSupabaseRow<ArsipSurat>(r))
          .sort((a, b) => (b.tanggalSurat > a.tanggalSurat ? 1 : -1));
        break;
      case 'keuangan_transaksi':
        this.cache.transaksiKeuangan = rows
          .map((r) => fromSupabaseRow<TransaksiKeuangan>(r))
          .sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
        break;
      case 'perlengkapan_inventaris':
        this.cache.barangInventaris = rows
          .map((r) => fromSupabaseRow<BarangInventaris>(r))
          .sort((a, b) => (a.kodeBarang > b.kodeBarang ? 1 : -1));
        break;
      case 'perlengkapan_peminjaman':
        this.cache.peminjamanBarang = rows
          .map((r) => fromSupabaseRow<PeminjamanBarang>(r))
          .sort((a, b) => (b.tanggalPinjam > a.tanggalPinjam ? 1 : -1));
        break;
      default:
        break;
    }
  }

  public async reloadFromSupabase(): Promise<boolean> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) return false;

    const coreTables = [
      'system_config',
      'santri',
      'ustadz',
      'fasilitas_gedung',
      'dewan_keamanan',
      'perizinan',
      'pelanggaran',
      'sanksi',
      'tata_tertib',
      'users',
      'logs',
      'notifikasi',
      'koordinasi',
      'struktur_organisasi',
      'jadwal_agenda',
      'absensi_murotil',
      'evaluasi_kepengurusan',
      'pengajuan_divisi',
      'surat_menyurat',
      'keuangan_transaksi',
      'perlengkapan_inventaris',
      'perlengkapan_peminjaman',
    ] as const;

    try {
      const results = await Promise.all(
        coreTables.map(async (tbl) => ({
          table: tbl,
          rows: await this.fetchSupabaseTableRows(tbl),
        }))
      );

      for (const { table, rows } of results) {
        if (rows) {
          this.applySupabaseTableRows(table, rows);
        }
      }

      this.quotaExceeded = false;
      this.cloudError = null;
      this.cloudConnected = true;
      this.serverConfirmed = true;
      this.lastSyncTime =
        new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB';
      this.notify();
      return true;
    } catch (err) {
      const msg = extractSupabaseErrorMessage(err);
      console.warn('Reload from Supabase error:', msg);
      this.cloudConnected = false;
      this.serverConfirmed = false;
      this.cloudError = msg;
      this.lastSyncTime = 'Gagal Koneksi Supabase';
      this.notify();
      return false;
    }
  }

  public initSupabaseRealtime(): void {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) return;

    this.supabaseChannels.forEach((ch) => {
      try {
        void client.removeChannel(ch);
      } catch {
        // ignore
      }
    });
    this.supabaseChannels = [];

    const watchedTables = [
      'system_config',
      'santri',
      'ustadz',
      'fasilitas_gedung',
      'dewan_keamanan',
      'perizinan',
      'pelanggaran',
      'sanksi',
      'tata_tertib',
      'users',
      'logs',
      'notifikasi',
      'koordinasi',
      'struktur_organisasi',
      'jadwal_agenda',
      'absensi_murotil',
      'evaluasi_kepengurusan',
      'pengajuan_divisi',
      'surat_menyurat',
      'keuangan_transaksi',
      'perlengkapan_inventaris',
      'perlengkapan_peminjaman',
    ];

    const scheduleTableRefresh = (tableName: string) => {
      if (this.supabaseRefetchTimers[tableName]) {
        clearTimeout(this.supabaseRefetchTimers[tableName]);
      }
      this.supabaseRefetchTimers[tableName] = setTimeout(async () => {
        try {
          const rows = await this.fetchSupabaseTableRows(tableName);
          if (rows) {
            this.applySupabaseTableRows(tableName, rows);
            this.cloudConnected = true;
            this.serverConfirmed = true;
            this.cloudError = null;
            this.lastSyncTime =
              new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }) + ' WIB';
            this.notify();
          }
        } catch (err) {
          this.cloudError = extractSupabaseErrorMessage(err);
          this.notify();
        }
      }, 120);
    };

    const channel = client.channel('almaliki-core-realtime');
    for (const tbl of watchedTables) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: tbl },
        () => {
          scheduleTableRefresh(tbl);
        }
      );
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        this.cloudConnected = true;
        this.serverConfirmed = true;
        this.cloudError = null;
        this.notify();
      }
    });

    this.supabaseChannels.push(channel);
  }

  /**
   * Mengumpulkan seluruh data yang ada (dari cache in-memory saat ini, IndexedDB Firestore cache,
   * atau server Firestore jika kuota belum penuh + localStorage) untuk tombol migrasi satu klik ke Supabase.
   */
  public async getLegacySnapshotForMigration() {
    const pickMergedArray = <T extends { id: string }>(...sources: T[][]): T[] => {
      const map = new Map<string, T>();
      for (const src of sources) {
        if (!Array.isArray(src)) continue;
        for (const item of src) {
          if (item && item.id) {
            map.set(item.id, item);
          }
        }
      }
      return Array.from(map.values());
    };

    const readFirestoreCacheOrServer = async <T extends { id: string }>(colName: string): Promise<T[]> => {
      try {
        const cacheSnap = await getDocsFromCache(collection(db, colName));
        if (!cacheSnap.empty) {
          return cacheSnap.docs.map((d) => ({ ...d.data(), id: d.id } as T));
        }
      } catch {
        // ignore cache miss
      }
      if (!isFirestoreQuotaPaused() && !this.quotaExceeded) {
        try {
          const srvSnap = await getDocs(collection(db, colName));
          if (!srvSnap.empty) {
            return srvSnap.docs.map((d) => ({ ...d.data(), id: d.id } as T));
          }
        } catch {
          // ignore if quota exceeded
        }
      }
      return [];
    };

    let fsConfig: Partial<SystemConfig> = {};
    try {
      const cacheCfg = await getDocFromCache(doc(db, CLOUD_COLLECTIONS.SYSTEM_CONFIG, 'main'));
      if (cacheCfg.exists()) fsConfig = cacheCfg.data() as Partial<SystemConfig>;
    } catch {
      // ignore
    }
    if (!fsConfig || Object.keys(fsConfig).length === 0) {
      if (!isFirestoreQuotaPaused() && !this.quotaExceeded) {
        try {
          const srvCfg = await getDoc(doc(db, CLOUD_COLLECTIONS.SYSTEM_CONFIG, 'main'));
          if (srvCfg.exists()) fsConfig = srvCfg.data() as Partial<SystemConfig>;
        } catch {
          // ignore
        }
      }
    }

    const [
      fsSantri,
      fsDewan,
      fsPerizinan,
      fsTataTertib,
      fsPelanggaran,
      fsSanksi,
      fsUsers,
      fsLogs,
      fsNotif,
      fsKoordinasi,
      fsStruktur,
      fsAgenda,
      fsEvaluasi,
      fsPengajuan,
      fsSurat,
      fsKeuangan,
      fsInventaris,
      fsPeminjaman,
    ] = await Promise.all([
      readFirestoreCacheOrServer<Santri>(CLOUD_COLLECTIONS.SANTRI),
      readFirestoreCacheOrServer<DewanKeamanan>(CLOUD_COLLECTIONS.DEWAN_KEAMANAN),
      readFirestoreCacheOrServer<Perizinan>(CLOUD_COLLECTIONS.PERIZINAN),
      readFirestoreCacheOrServer<TataTertib>(CLOUD_COLLECTIONS.TATA_TERTIB),
      readFirestoreCacheOrServer<Pelanggaran>(CLOUD_COLLECTIONS.PELANGGARAN),
      readFirestoreCacheOrServer<Sanksi>(CLOUD_COLLECTIONS.SANKSI),
      readFirestoreCacheOrServer<UserAccount>(CLOUD_COLLECTIONS.USERS),
      readFirestoreCacheOrServer<LogAktivitas>(CLOUD_COLLECTIONS.LOGS),
      readFirestoreCacheOrServer<NotifikasiApp>(CLOUD_COLLECTIONS.NOTIFIKASI),
      readFirestoreCacheOrServer<PesanKoordinasi>(CLOUD_COLLECTIONS.KOORDINASI),
      readFirestoreCacheOrServer<StrukturOrganisasiNode>(CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI),
      readFirestoreCacheOrServer<AgendaPengurus>(CLOUD_COLLECTIONS.AGENDA_PENGURUS),
      readFirestoreCacheOrServer<EvaluasiKepengurusan>(CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN),
      readFirestoreCacheOrServer<PengajuanDivisi>(CLOUD_COLLECTIONS.PENGAJUAN_DIVISI),
      readFirestoreCacheOrServer<ArsipSurat>(CLOUD_COLLECTIONS.SURAT_MENYURAT),
      readFirestoreCacheOrServer<TransaksiKeuangan>(CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI),
      readFirestoreCacheOrServer<BarangInventaris>(CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS),
      readFirestoreCacheOrServer<PeminjamanBarang>(CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN),
    ]);

    const localSantriDirect = this.readLocalJsonArray<Santri>('almaliki_data_santri');
    const localSantriLegacy = this.readLocalJsonArray<Santri>('sim_kamtib_santri_v2');
    const localUstadzDirect = this.readLocalJsonArray<DataUstadz>('almaliki_data_ustadzah');
    const localCfgLegacy = this.readLocalJsonObject<SystemConfig>('sim_kamtib_system_config_v2');

    const currentCfg = this.getSystemConfig();
    const mergedCfg = buildCleanSystemConfig({
      ...fsConfig,
      ...(localCfgLegacy || {}),
      ...currentCfg,
    });

    const ustadzList = pickMergedArray<DataUstadz>(
      currentCfg.ustadzList || [],
      currentCfg.dataUstadzList || [],
      fsConfig.ustadzList || [],
      fsConfig.dataUstadzList || [],
      localCfgLegacy?.ustadzList || [],
      localCfgLegacy?.dataUstadzList || [],
      localUstadzDirect
    );

    const fasilitasGedungList = pickMergedArray(
      currentCfg.fasilitasGedungList || [],
      fsConfig.fasilitasGedungList || [],
      localCfgLegacy?.fasilitasGedungList || []
    );

    const jadwalPerbaikanList = pickMergedArray(
      currentCfg.jadwalPerbaikanList || [],
      fsConfig.jadwalPerbaikanList || [],
      localCfgLegacy?.jadwalPerbaikanList || []
    );

    const murotilAbsensiSantriList = pickMergedArray(
      currentCfg.murotilAbsensiSantriList || [],
      fsConfig.murotilAbsensiSantriList || [],
      localCfgLegacy?.murotilAbsensiSantriList || []
    );

    const murotilAbsensiPjList = pickMergedArray(
      currentCfg.murotilAbsensiPjList || [],
      fsConfig.murotilAbsensiPjList || [],
      localCfgLegacy?.murotilAbsensiPjList || []
    );

    mergedCfg.ustadzList = ustadzList;
    mergedCfg.dataUstadzList = ustadzList;
    mergedCfg.fasilitasGedungList = fasilitasGedungList;
    mergedCfg.jadwalPerbaikanList = jadwalPerbaikanList;
    mergedCfg.murotilAbsensiSantriList = murotilAbsensiSantriList;
    mergedCfg.murotilAbsensiPjList = murotilAbsensiPjList;

    return {
      systemConfig: mergedCfg,
      ustadzList,
      fasilitasGedungList,
      jadwalPerbaikanList,
      murotilAbsensiSantriList,
      murotilAbsensiPjList,
      santri: pickMergedArray(this.cache.santri, fsSantri, localSantriDirect, localSantriLegacy),
      dewan: pickMergedArray(this.cache.dewan, fsDewan, this.readLocalJsonArray<DewanKeamanan>('sim_kamtib_dewan_keamanan_v2')),
      perizinan: pickMergedArray(this.cache.perizinan, fsPerizinan, this.readLocalJsonArray<Perizinan>('sim_kamtib_perizinan_v2')),
      tataTertib: pickMergedArray(this.cache.tataTertib, fsTataTertib, this.readLocalJsonArray<TataTertib>('sim_kamtib_tata_tertib_v2')),
      pelanggaran: pickMergedArray(this.cache.pelanggaran, fsPelanggaran, this.readLocalJsonArray<Pelanggaran>('sim_kamtib_pelanggaran_v2')),
      sanksi: pickMergedArray(this.cache.sanksi, fsSanksi, this.readLocalJsonArray<Sanksi>('sim_kamtib_sanksi_v2')),
      users: pickMergedArray(this.cache.users, fsUsers, this.readLocalJsonArray<UserAccount>('sim_kamtib_rbac_users_v2'), INITIAL_USERS),
      logs: pickMergedArray(this.cache.logs, fsLogs, this.readLocalJsonArray<LogAktivitas>('sim_kamtib_logs_v2')),
      notifikasi: pickMergedArray(this.cache.notifikasi, fsNotif, this.readLocalJsonArray<NotifikasiApp>('sim_kamtib_notifikasi_v2')),
      koordinasi: pickMergedArray(this.cache.koordinasi, fsKoordinasi, this.readLocalJsonArray<PesanKoordinasi>('sim_kamtib_koordinasi_v2')),
      strukturOrganisasi: pickMergedArray(this.cache.strukturOrganisasi, fsStruktur, this.readLocalJsonArray<StrukturOrganisasiNode>('sim_maliki_struktur_v1')),
      agendaPengurus: pickMergedArray(this.cache.agendaPengurus, fsAgenda, this.readLocalJsonArray<AgendaPengurus>('sim_maliki_agenda_v1')),
      evaluasiKepengurusan: pickMergedArray(this.cache.evaluasiKepengurusan, fsEvaluasi, this.readLocalJsonArray<EvaluasiKepengurusan>('sim_maliki_evaluasi_v1')),
      pengajuanDivisi: pickMergedArray(this.cache.pengajuanDivisi, fsPengajuan, this.readLocalJsonArray<PengajuanDivisi>('sim_maliki_pengajuan_v1')),
      arsipSurat: pickMergedArray(this.cache.arsipSurat, fsSurat, this.readLocalJsonArray<ArsipSurat>('sim_maliki_surat_v1')),
      transaksiKeuangan: pickMergedArray(this.cache.transaksiKeuangan, fsKeuangan, this.readLocalJsonArray<TransaksiKeuangan>('sim_maliki_keuangan_v1')),
      barangInventaris: pickMergedArray(this.cache.barangInventaris, fsInventaris, this.readLocalJsonArray<BarangInventaris>('sim_maliki_inventaris_v1')),
      peminjamanBarang: pickMergedArray(this.cache.peminjamanBarang, fsPeminjaman, this.readLocalJsonArray<PeminjamanBarang>('sim_maliki_peminjaman_v1')),
    };
  }

  private async uploadCollectionBatch<T extends { id: string }>(collectionName: string, items: T[]) {
    if (this.isFirestorePaused()) return;
    try {
      for (const item of items) {
        await setDoc(doc(db, collectionName, item.id), sanitizeForFirestore(item), { merge: true });
      }
    } catch (err) {
      if (isFirestoreQuotaError(err)) {
        this.enterQuotaCacheMode(extractFirebaseErrorMessage(err));
        return;
      }
      console.warn(`Batch upload ${collectionName} warning:`, err);
    }
  }

  private async replaceCollectionInCloud<T extends { id: string }>(collectionName: string, items: T[]) {
    if (this.isFirestorePaused()) return;
    try {
      const existingSnap = await getDocs(collection(db, collectionName));
      const newIds = new Set(items.map(i => i.id));
      for (const existingDoc of existingSnap.docs) {
        if (!newIds.has(existingDoc.id)) {
          await deleteDoc(doc(db, collectionName, existingDoc.id));
        }
      }
      await this.uploadCollectionBatch(collectionName, items);
    } catch (err) {
      if (isFirestoreQuotaError(err)) {
        this.enterQuotaCacheMode(extractFirebaseErrorMessage(err));
        return;
      }
      console.warn(`Replace collection ${collectionName} warning:`, err);
    }
  }

  private async replaceSupabaseTable(
    table: string,
    rows: Array<{ id: string } & Record<string, unknown>>,
    matchFilter?: { column: string; value: string }
  ): Promise<void> {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      let query = client.from(table).select('id');
      if (matchFilter) {
        query = query.eq(matchFilter.column, matchFilter.value);
      }
      const { data: existingRows, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      const newIds = new Set(rows.map((r) => r.id));
      const toDelete = (existingRows || [])
        .map((r) => String((r as { id: string }).id))
        .filter((id) => !newIds.has(id));

      for (let i = 0; i < toDelete.length; i += 200) {
        const chunk = toDelete.slice(i, i + 200);
        const { error: delErr } = await client.from(table).delete().in('id', chunk);
        if (delErr) throw delErr;
      }

      for (let i = 0; i < rows.length; i += 200) {
        const chunk = rows.slice(i, i + 200);
        const { error: upErr } = await client.from(table).upsert(chunk, { onConflict: 'id' });
        if (upErr) throw upErr;
      }
    } catch (err) {
      console.warn(`Replace Supabase table ${table} warning:`, extractSupabaseErrorMessage(err));
    }
  }

  public getCloudSyncStatus(): CloudSyncTelemetry {
    const supabaseActive = isSupabaseConfigured();
    const total =
      this.cache.santri.length +
      this.cache.dewan.length +
      this.cache.perizinan.length +
      this.cache.pelanggaran.length +
      this.cache.sanksi.length +
      this.cache.users.length +
      this.cache.logs.length +
      this.cache.koordinasi.length +
      this.cache.strukturOrganisasi.length +
      this.cache.agendaPengurus.length +
      this.cache.evaluasiKepengurusan.length +
      this.cache.pengajuanDivisi.length +
      this.cache.arsipSurat.length +
      this.cache.transaksiKeuangan.length +
      this.cache.barangInventaris.length +
      this.cache.peminjamanBarang.length;

    let status: CloudSyncTelemetry['status'] = 'syncing';
    if (!this.isNavigatorOnline) {
      status = 'offline';
    } else if (this.cloudError || (!supabaseActive && this.quotaExceeded)) {
      status = 'error';
    } else if (this.serverConfirmed) {
      status = 'connected';
    }

    const errorMessage = !this.isNavigatorOnline
      ? 'Perangkat sedang offline (tidak ada koneksi internet).'
      : this.cloudError || undefined;

    return {
      provider: supabaseActive ? 'supabase' : 'firebase',
      supabaseConfigured: supabaseActive,
      status,
      lastSyncTime: this.lastSyncTime,
      cloudConnected: status === 'connected',
      quotaExceeded: supabaseActive ? false : this.quotaExceeded,
      errorMessage,
      migrationNotification: this.migrationNotification,
      databaseId: supabaseActive ? 'supabase-postgres-realtime' : FIRESTORE_DATABASE_ID,
      projectId: supabaseActive ? getSupabaseProjectHost() : FIREBASE_PROJECT_ID,
      activeListenersCount: supabaseActive
        ? Math.max(1, this.supabaseChannels.length * 22)
        : this.unsubscribers.length,
      totalSyncedItems: total,
    };
  }

  /**
   * Automatically wakes up Supabase or Firestore network so active realtime listeners stay fresh.
   */
  public async resyncOnResume(force = false): Promise<void> {
    if (isSupabaseConfigured()) {
      const now = Date.now();
      if (!force && now - this.lastResumeSyncAt < 15_000) return;
      this.lastResumeSyncAt = now;
      await this.reloadFromSupabase();
      if (this.supabaseChannels.length === 0) {
        this.initSupabaseRealtime();
      }
      return;
    }

    if (!force && (this.quotaExceeded || isFirestoreQuotaPaused())) {
      return;
    }

    const now = Date.now();
    if (!force && now - this.lastResumeSyncAt < 15_000) {
      return;
    }
    this.lastResumeSyncAt = now;

    if (force) {
      await resumeFirestoreNetworkFromQuota();
      this.quotaExceeded = false;
      await this.verifyCloudConnectionAndMigrate();
      if (!this.quotaExceeded && this.unsubscribers.length === 0) {
        this.initRealtimeCloudSync();
      }
      return;
    }

    if (this.unsubscribers.length === 0) {
      this.initRealtimeCloudSync();
    }

    await resyncFirestoreNetwork();
  }

  /**
   * Manual pull triggered explicitly by user settings button.
   * Reads directly from Supabase when configured, otherwise falls back to Firestore.
   */
  public async forcePullFromCloud(): Promise<boolean> {
    if (isSupabaseConfigured()) {
      const ok = await this.reloadFromSupabase();
      if (ok && this.supabaseChannels.length === 0) {
        this.initSupabaseRealtime();
      }
      return ok;
    }
    try {
      await resumeFirestoreNetworkFromQuota();
      let hitQuota = false;
      let permissionErrorMsg: string | null = null;
      let networkErrorMsg: string | null = null;

      const fetchCollectionFromCloud = async <T extends { id: string }>(colName: string): Promise<T[]> => {
        const colRef = collection(db, colName);
        if (hitQuota || permissionErrorMsg) {
          const cachedSnap = await getDocsFromCache(colRef).catch(() => null);
          return cachedSnap ? cachedSnap.docs.map(d => ({ ...d.data(), id: d.id } as T)) : [];
        }
        try {
          const snap = await getDocsFromServer(colRef);
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as T));
        } catch (err) {
          if (isFirestoreQuotaError(err)) {
            hitQuota = true;
          } else if (isFirestorePermissionError(err)) {
            permissionErrorMsg = extractFirebaseErrorMessage(err);
          } else if (!networkErrorMsg) {
            networkErrorMsg = extractFirebaseErrorMessage(err);
          }
          try {
            const cachedSnap = await getDocsFromCache(colRef);
            return cachedSnap.docs.map(d => ({ ...d.data(), id: d.id } as T));
          } catch {
            if (!hitQuota && !permissionErrorMsg) {
              const fallbackSnap = await getDocs(colRef);
              return fallbackSnap.docs.map(d => ({ ...d.data(), id: d.id } as T));
            }
            return [];
          }
        }
      };

      const pullMainConfig = async () => {
        const docRef = doc(db, CLOUD_COLLECTIONS.SYSTEM_CONFIG, 'main');
        try {
          const snap = await getDocFromServer(docRef);
          if (snap.exists()) {
            this.cache.systemConfig = buildCleanSystemConfig(snap.data() as Partial<SystemConfig>);
          }
        } catch (err) {
          if (isFirestoreQuotaError(err)) {
            hitQuota = true;
          } else if (isFirestorePermissionError(err)) {
            permissionErrorMsg = extractFirebaseErrorMessage(err);
          } else if (!networkErrorMsg) {
            networkErrorMsg = extractFirebaseErrorMessage(err);
          }
          try {
            const cachedSnap = await getDocFromCache(docRef);
            if (cachedSnap.exists()) {
              this.cache.systemConfig = buildCleanSystemConfig(cachedSnap.data() as Partial<SystemConfig>);
            }
          } catch {
            if (!hitQuota && !permissionErrorMsg) {
              const fallbackSnap = await getDoc(docRef);
              if (fallbackSnap.exists()) {
                this.cache.systemConfig = buildCleanSystemConfig(fallbackSnap.data() as Partial<SystemConfig>);
              }
            }
          }
        }
      };

      const [
        _cfgDone,
        santri,
        perizinan,
        pelanggaran,
        sanksi,
        tataTertib,
        dewan,
        users,
        logs,
        notifikasi,
        koordinasi,
        strukturOrganisasi,
        agendaPengurus,
        evaluasiKepengurusan,
        pengajuanDivisi,
        arsipSurat,
        transaksiKeuangan,
        barangInventaris,
        peminjamanBarang,
      ] = await Promise.all([
        pullMainConfig(),
        fetchCollectionFromCloud<Santri>(CLOUD_COLLECTIONS.SANTRI),
        fetchCollectionFromCloud<Perizinan>(CLOUD_COLLECTIONS.PERIZINAN),
        fetchCollectionFromCloud<Pelanggaran>(CLOUD_COLLECTIONS.PELANGGARAN),
        fetchCollectionFromCloud<Sanksi>(CLOUD_COLLECTIONS.SANKSI),
        fetchCollectionFromCloud<TataTertib>(CLOUD_COLLECTIONS.TATA_TERTIB),
        fetchCollectionFromCloud<DewanKeamanan>(CLOUD_COLLECTIONS.DEWAN_KEAMANAN),
        fetchCollectionFromCloud<UserAccount>(CLOUD_COLLECTIONS.USERS),
        fetchCollectionFromCloud<LogAktivitas>(CLOUD_COLLECTIONS.LOGS),
        fetchCollectionFromCloud<NotifikasiApp>(CLOUD_COLLECTIONS.NOTIFIKASI),
        fetchCollectionFromCloud<PesanKoordinasi>(CLOUD_COLLECTIONS.KOORDINASI),
        fetchCollectionFromCloud<StrukturOrganisasiNode>(CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI),
        fetchCollectionFromCloud<AgendaPengurus>(CLOUD_COLLECTIONS.AGENDA_PENGURUS),
        fetchCollectionFromCloud<EvaluasiKepengurusan>(CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN),
        fetchCollectionFromCloud<PengajuanDivisi>(CLOUD_COLLECTIONS.PENGAJUAN_DIVISI),
        fetchCollectionFromCloud<ArsipSurat>(CLOUD_COLLECTIONS.SURAT_MENYURAT),
        fetchCollectionFromCloud<TransaksiKeuangan>(CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI),
        fetchCollectionFromCloud<BarangInventaris>(CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS),
        fetchCollectionFromCloud<PeminjamanBarang>(CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN),
      ]);

      if (permissionErrorMsg) {
        this.cloudConnected = false;
        this.serverConfirmed = false;
        this.cloudError = permissionErrorMsg;
        this.lastSyncTime = 'Akses Firebase Ditolak Rules';
        this.notify();
        return false;
      }

      if (hitQuota) {
        if (santri.length) this.cache.santri = santri;
        if (perizinan.length) this.cache.perizinan = perizinan.sort((a, b) => (b.id > a.id ? 1 : -1));
        if (pelanggaran.length) this.cache.pelanggaran = pelanggaran.sort((a, b) => (b.id > a.id ? 1 : -1));
        if (sanksi.length) this.cache.sanksi = sanksi.sort((a, b) => (b.id > a.id ? 1 : -1));
        if (tataTertib.length) this.cache.tataTertib = tataTertib;
        if (dewan.length) this.cache.dewan = dewan;
        if (users.length) this.cache.users = users;
        this.enterQuotaCacheMode('Kuota baca harian Firestore tercapai (reset besok). Mode cache aktif.');
        return false;
      }

      if (networkErrorMsg && !this.isNavigatorOnline) {
        this.cloudConnected = false;
        this.serverConfirmed = false;
        this.cloudError = networkErrorMsg;
        this.lastSyncTime = 'Perangkat Offline';
        this.notify();
        return false;
      }

      this.quotaExceeded = false;
      this.cloudError = null;
      this.serverConfirmed = true;
      if (this.unsubscribers.length === 0) {
        this.initRealtimeCloudSync();
      }
      this.cache.santri = santri;
      this.cache.perizinan = perizinan.sort((a, b) => (b.id > a.id ? 1 : -1));
      this.cache.pelanggaran = pelanggaran.sort((a, b) => (b.id > a.id ? 1 : -1));
      this.cache.sanksi = sanksi.sort((a, b) => (b.id > a.id ? 1 : -1));
      this.cache.tataTertib = tataTertib;
      this.cache.dewan = dewan;
      this.cache.users = users;
      this.cache.logs = logs.sort((a, b) => ((b.timestamp || 0) > (a.timestamp || 0) ? 1 : -1)).slice(0, 300);
      this.cache.notifikasi = notifikasi.sort((a, b) => (b.id > a.id ? 1 : -1)).slice(0, 50);
      this.cache.koordinasi = koordinasi.sort((a, b) => (b.id > a.id ? 1 : -1));
      this.cache.strukturOrganisasi = strukturOrganisasi.sort((a, b) => (a.level - b.level) || (a.urutan - b.urutan));
      this.cache.agendaPengurus = agendaPengurus.sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
      this.cache.evaluasiKepengurusan = evaluasiKepengurusan.sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
      this.cache.pengajuanDivisi = pengajuanDivisi.sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
      this.cache.arsipSurat = arsipSurat.sort((a, b) => (b.tanggalSurat > a.tanggalSurat ? 1 : -1));
      this.cache.transaksiKeuangan = transaksiKeuangan.sort((a, b) => (b.tanggal > a.tanggal ? 1 : -1));
      this.cache.barangInventaris = barangInventaris.sort((a, b) => (a.kodeBarang > b.kodeBarang ? 1 : -1));
      this.cache.peminjamanBarang = peminjamanBarang.sort((a, b) => (b.tanggalPinjam > a.tanggalPinjam ? 1 : -1));

      const active = this.getCurrentUser();
      if (active && users.length > 0) {
        const fresh = users.find(u => u.id === active.id);
        if (fresh) {
          this.activeSessionUser = fresh;
          try {
            sessionStorage.setItem(SESSION_KEYS.CURRENT_USER, JSON.stringify(fresh));
          } catch { /* ignore */ }
        }
      }

      this.cloudConnected = true;
      this.lastSyncTime = new Date().toLocaleTimeString('id-ID') + ' WIB';
      this.notify();
      return true;
    } catch (err) {
      const errMsg = extractFirebaseErrorMessage(err);
      if (isFirestoreQuotaError(err)) {
        this.quotaExceeded = true;
        this.cloudError = errMsg;
        this.lastSyncTime = 'Kuota Harian Firestore Penuh (Mode Cache Aktif)';
      } else {
        this.cloudError = errMsg;
        this.lastSyncTime = 'Gagal Koneksi Firebase';
      }
      this.cloudConnected = false;
      this.serverConfirmed = false;
      this.notify();
      console.warn('Force pull paused:', err);
      return false;
    }
  }

  // ==========================================
  // RBAC User Accounts
  // ==========================================
  public getUsers(): UserAccount[] {
    return this.cache.users.length > 0 ? this.cache.users : INITIAL_USERS;
  }

  public saveUser(user: UserAccount) {
    const list = [...this.getUsers()];
    const index = list.findIndex(u => u.id === user.id);
    if (index >= 0) {
      list[index] = user;
      this.addLog('Kelola Akun RBAC', `Memperbarui akun personil: ${user.nama} (${user.username})`, 'admin');
    } else {
      list.push(user);
      this.addLog('Tambah Akun RBAC', `Mendaftarkan personil baru: ${user.nama} (${user.role})`, 'admin');
    }
    this.cache.users = list;

    // Jika yang diupdate adalah akun yang sedang login, perbarui sessionStorage juga agar Sidebar & Header langsung berubah
    const active = this.getCurrentUser();
    if (active && active.id === user.id) {
      this.activeSessionUser = user;
      try {
        sessionStorage.setItem(SESSION_KEYS.CURRENT_USER, JSON.stringify(user));
      } catch { /* ignore */ }
    }

    this.notify();

    // Async sync to central database (Supabase or Firestore)
    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('users', toUserRow(user));
    } else {
      this.fireFirestoreSetDoc(CLOUD_COLLECTIONS.USERS, user.id, user as unknown as Record<string, unknown>);
    }
  }

  public deleteUser(userId: string) {
    const list = this.getUsers().filter(u => u.id !== userId);
    this.cache.users = list;
    this.addLog('Hapus Akun RBAC', `Menonaktifkan / menghapus akun ID: ${userId}`, 'admin');
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseDeleteRow('users', userId);
    } else {
      this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.USERS, userId);
    }
  }

  // Authentication via 6-Digit PIN (iPhone Lock Screen Style)
  public authenticateByPin(pin: string): { success: boolean; user?: UserAccount; message?: string } {
    const cleanPin = pin.trim();
    const users = this.getUsers();
    const found = users.find(u => {
      const def = INITIAL_USERS.find(d => d.id === u.id || d.username === u.username);
      const userPin = u.pin || def?.pin || '';
      return userPin === cleanPin && u.statusAktif;
    });

    if (!found) {
      return { success: false, message: 'Kode PIN 6 Digit tidak sesuai atau akun tidak aktif.' };
    }

    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    found.terakhirLogin = `Hari ini, ${timeNow} WIB`;
    this.saveUser(found);

    this.activeSessionUser = found;
    try {
      sessionStorage.setItem(SESSION_KEYS.CURRENT_USER, JSON.stringify(found));
    } catch { /* ignore */ }
    this.addLog('Autentikasi PIN 6 Digit', `Personil ${found.nama} (${found.jabatan}) masuk menggunakan PIN Lock Screen.`, 'admin');
    this.notify();

    return { success: true, user: found };
  }

  // Authentication & Session
  public authenticate(username: string, password: string): { success: boolean; user?: UserAccount; message?: string } {
    const users = this.getUsers();
    const found = users.find(
      u => u.username.toLowerCase() === username.trim().toLowerCase() && u.statusAktif
    );

    if (!found) {
      return { success: false, message: 'Username tidak ditemukan atau akun dinonaktifkan.' };
    }

    if (found.password && found.password !== password) {
      return { success: false, message: 'Kata sandi tidak sesuai. Akses ditolak.' };
    }

    // Update last login
    const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    found.terakhirLogin = `Hari ini, ${timeNow} WIB`;
    this.saveUser(found);

    this.activeSessionUser = found;
    try {
      sessionStorage.setItem(SESSION_KEYS.CURRENT_USER, JSON.stringify(found));
    } catch { /* ignore */ }
    this.addLog('Autentikasi Masuk', `Personil ${found.nama} (${found.jabatan}) berhasil login ke sistem.`, 'admin');
    this.notify();

    return { success: true, user: found };
  }

  public logout() {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this.addLog('Keluar Sistem', `Pengguna ${currentUser.nama} keluar dari sistem.`, 'admin');
    }
    this.activeSessionUser = null;
    try {
      sessionStorage.removeItem(SESSION_KEYS.CURRENT_USER);
    } catch { /* ignore */ }
    this.notify();
  }

  public getCurrentUser(): UserAccount | null {
    if (this.activeSessionUser) {
      return this.activeSessionUser;
    }
    try {
      const sessionData = sessionStorage.getItem(SESSION_KEYS.CURRENT_USER);
      if (sessionData) {
        this.activeSessionUser = JSON.parse(sessionData);
        return this.activeSessionUser;
      }
      return null;
    } catch {
      return null;
    }
  }

  // ==========================================
  // System Configuration (Admin Option Panel)
  // ==========================================
  public getSystemConfig(): SystemConfig {
    return this.cache.systemConfig;
  }

  public updateSystemConfig(config: Partial<SystemConfig>) {
    const current = this.getSystemConfig();
    const patchPayload: Partial<SystemConfig> = {
      ...config,
      initialSeedCompleted: true,
    };
    if (config.ustadzList !== undefined) {
      patchPayload.dataUstadzList = config.ustadzList;
    } else if (config.dataUstadzList !== undefined) {
      patchPayload.ustadzList = config.dataUstadzList;
    }

    const updated: SystemConfig = {
      ...current,
      ...patchPayload,
    };
    this.cache.systemConfig = updated;
    this.addLog('Konfigurasi Sistem', 'Admin memperbarui parameter pengaturan manual di Option Panel.', 'admin');
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('system_config', toSystemConfigRow(updated));
      if (config.ustadzList !== undefined || config.dataUstadzList !== undefined) {
        const prevUstadz = current.ustadzList || current.dataUstadzList || [];
        const nextUstadz = updated.ustadzList || [];
        void this.syncNormalizedTableDiff('ustadz', prevUstadz, nextUstadz, toUstadzRow);
      }
      if (config.fasilitasGedungList !== undefined) {
        void this.syncNormalizedTableDiff(
          'fasilitas_gedung',
          current.fasilitasGedungList || [],
          updated.fasilitasGedungList || [],
          toFasilitasGedungRow
        );
      }
      if (config.jadwalPerbaikanList !== undefined) {
        void this.syncNormalizedTableDiff(
          'jadwal_agenda',
          current.jadwalPerbaikanList || [],
          updated.jadwalPerbaikanList || [],
          toJadwalAgendaFromPerbaikan,
          'perbaikan__'
        );
      }
      if (config.murotilAbsensiSantriList !== undefined) {
        void this.syncNormalizedTableDiff(
          'absensi_murotil',
          current.murotilAbsensiSantriList || [],
          updated.murotilAbsensiSantriList || [],
          toAbsensiSantriRow,
          'abs_s__'
        );
      }
      if (config.murotilAbsensiPjList !== undefined) {
        void this.syncNormalizedTableDiff(
          'absensi_murotil',
          current.murotilAbsensiPjList || [],
          updated.murotilAbsensiPjList || [],
          toAbsensiPjRow,
          'abs_pj__'
        );
      }
    } else {
      // Partial merge write so concurrent updates across devices on different fields never overwrite each other
      this.fireFirestoreSetDoc(
        CLOUD_COLLECTIONS.SYSTEM_CONFIG,
        'main',
        patchPayload as unknown as Record<string, unknown>
      );
    }
  }

  // ==========================================
  // Master Data Ustadz & Ustadzah
  // ==========================================
  public getUstadzList(): DataUstadz[] {
    const cfg = this.getSystemConfig();
    return Array.isArray(cfg.ustadzList)
      ? cfg.ustadzList
      : Array.isArray(cfg.dataUstadzList)
        ? cfg.dataUstadzList
        : [];
  }

  public saveUstadz(ustadz: DataUstadz) {
    const list = [...this.getUstadzList()];
    const idx = list.findIndex(u => u.id === ustadz.id);
    if (idx >= 0) {
      list[idx] = ustadz;
    } else {
      list.unshift(ustadz);
    }
    this.updateSystemConfig({ ustadzList: list });
  }

  public deleteUstadz(id: string) {
    const updated = this.getUstadzList().filter(u => u.id !== id);
    this.updateSystemConfig({ ustadzList: updated });
  }

  // Gender Scope
  public getGenderScope(): 'all' | 'putra' | 'putri' {
    const user = this.getCurrentUser();
    if (user && user.genderAccess !== 'all') {
      return user.genderAccess;
    }
    try {
      const saved = sessionStorage.getItem(SESSION_KEYS.GENDER_SCOPE);
      if (saved === 'putra' || saved === 'putri' || saved === 'all') {
        this.currentGenderScope = saved;
      }
    } catch { /* ignore */ }
    return this.currentGenderScope;
  }

  public setGenderScope(scope: 'all' | 'putra' | 'putri') {
    this.currentGenderScope = scope;
    try {
      sessionStorage.setItem(SESSION_KEYS.GENDER_SCOPE, scope);
    } catch { /* ignore */ }
    this.notify();
  }

  // Theme (Dark / Light)
  public getTheme(): 'dark' | 'light' {
    try {
      const theme = sessionStorage.getItem(SESSION_KEYS.THEME);
      if (theme === 'light' || theme === 'dark') {
        this.currentTheme = theme;
      }
    } catch { /* ignore */ }
    return this.currentTheme;
  }

  public setTheme(theme: 'dark' | 'light') {
    this.currentTheme = theme;
    try {
      sessionStorage.setItem(SESSION_KEYS.THEME, theme);
    } catch { /* ignore */ }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    this.notify();
  }

  // ==========================================
  // Master Data Santri
  // ==========================================
  public getSantriList(): Santri[] {
    return this.cache.santri;
  }

  public saveSantri(santri: Santri) {
    const list = [...this.getSantriList()];
    const index = list.findIndex(s => s.id === santri.id);
    if (index >= 0) {
      list[index] = santri;
      this.addLog('Perbarui Santri', `Memperbarui data: ${santri.nama} (${santri.nis})`, 'santri');
    } else {
      list.unshift(santri);
      this.addLog('Tambah Santri', `Menambahkan santri: ${santri.nama} (${santri.nis})`, 'santri');
    }
    this.cache.santri = list;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('santri', toSantriRow(santri));
    } else {
      this.fireFirestoreSetDoc(CLOUD_COLLECTIONS.SANTRI, santri.id, santri as unknown as Record<string, unknown>);
    }
  }

  public deleteSantri(id: string) {
    const list = this.getSantriList();
    const target = list.find(s => s.id === id);
    const updated = list.filter(s => s.id !== id);
    this.cache.santri = updated;
    if (target) {
      this.addLog('Hapus Santri', `Menghapus data santri: ${target.nama} (${target.nis})`, 'santri');
    }
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseDeleteRow('santri', id);
    } else {
      this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.SANTRI, id);
    }
  }

  public suspendSantri(santriId: string, suspendUntilDate: string, alasan: string) {
    const list = [...this.getSantriList()];
    const santri = list.find(s => s.id === santriId);
    if (santri) {
      santri.suspendIzinHingga = suspendUntilDate;
      santri.alasanSuspensi = alasan;
      this.cache.santri = list;
      this.addLog(
        'Penangguhan Izin Santri',
        `Santri ${santri.nama} (${santri.nis}) ditangguhkan izin keluarnya hingga ${suspendUntilDate}. Alasan: ${alasan}`,
        'santri'
      );
      this.notify();

      if (isSupabaseConfigured()) {
        void this.supabaseUpsertRow('santri', toSantriRow(santri));
      } else {
        this.fireFirestoreSetDoc(CLOUD_COLLECTIONS.SANTRI, santri.id, santri as unknown as Record<string, unknown>);
      }
    }
  }

  public liftSantriSuspension(santriId: string) {
    const list = [...this.getSantriList()];
    const santri = list.find(s => s.id === santriId);
    if (santri) {
      delete santri.suspendIzinHingga;
      delete santri.alasanSuspensi;
      this.cache.santri = list;
      this.addLog(
        'Pemulihan Izin Santri',
        `Penangguhan izin keluar santri ${santri.nama} (${santri.nis}) telah dipulihkan.`,
        'santri'
      );
      this.notify();

      if (isSupabaseConfigured()) {
        void this.supabaseUpsertRow('santri', toSantriRow(santri));
      } else {
        this.fireFirestoreSetDoc(CLOUD_COLLECTIONS.SANTRI, santri.id, santri as unknown as Record<string, unknown>);
      }
    }
  }

  // ==========================================
  // Dewan Keamanan & Piket
  // ==========================================
  public getDewanKeamananList(): DewanKeamanan[] {
    return this.cache.dewan;
  }

  public saveDewanKeamanan(pengurus: DewanKeamanan) {
    const list = [...this.getDewanKeamananList()];
    const index = list.findIndex(p => p.id === pengurus.id);
    if (index >= 0) {
      list[index] = pengurus;
    } else {
      list.unshift(pengurus);
    }
    this.cache.dewan = list;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('dewan_keamanan', toDewanKeamananRow(pengurus));
    } else {
      this.fireFirestoreSetDoc(CLOUD_COLLECTIONS.DEWAN_KEAMANAN, pengurus.id, pengurus as unknown as Record<string, unknown>);
    }
  }

  public deleteDewanKeamanan(id: string) {
    const list = this.getDewanKeamananList().filter(p => p.id !== id);
    this.cache.dewan = list;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseDeleteRow('dewan_keamanan', id);
    } else {
      this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.DEWAN_KEAMANAN, id);
    }
  }

  // ==========================================
  // Perizinan Santri
  // ==========================================
  public getPerizinanList(): Perizinan[] {
    return this.cache.perizinan;
  }

  public savePerizinan(izin: Perizinan, note?: string) {
    const list = [...this.getPerizinanList()];
    const index = list.findIndex(i => i.id === izin.id);
    const currentUser = this.getCurrentUser();
    const actorName = currentUser ? currentUser.nama : (izin.petugasPencatat || 'Petugas Keamanan');

    if (index >= 0) {
      const prev = list[index];
      list[index] = izin;

      if (prev.status !== izin.status) {
        let actionTitle = `Pembaruan Status Perizinan: ${izin.status}`;
        let peran: 'Pencatat' | 'Pemroses' | 'Penyetujui' | 'Pengawas' = 'Pemroses';
        let detailText = `Status izin santri ${izin.santriNama} (${izin.jenisIzin}) diubah dari "${prev.status}" menjadi "${izin.status}".`;

        if (izin.status === 'Disetujui' || izin.status === 'Diverifikasi') {
          actionTitle = 'Persetujuan Otoritas: Izin Disetujui';
          peran = 'Penyetujui';
          detailText = `Otoritas keamanan menyetujui izin ${izin.jenisIzin} santri ${izin.santriNama} (${izin.nomorIzin}). Valid hingga: ${izin.tglKembali} ${izin.jamKembali}.`;
        } else if (izin.status === 'Ditolak') {
          actionTitle = 'Penolakan Otoritas: Izin Ditolak';
          peran = 'Penyetujui';
          detailText = `Permohonan izin ${izin.jenisIzin} santri ${izin.santriNama} ditolak oleh pengurus. Catatan: ${note || izin.catatanPenolakan || 'Tidak memenuhi kualifikasi SOP'}.`;
        } else if (izin.status === 'Sedang Keluar') {
          actionTitle = 'Mutasi Gerbang: Santri Keluar';
          peran = 'Pemroses';
          detailText = `Santri ${izin.santriNama} diverifikasi keluar gerbang pos sentry pada ${izin.actualKeluar || 'WIB'}. Petugas: ${actorName}.`;
        } else if (izin.status === 'Sudah Kembali') {
          actionTitle = 'Mutasi Gerbang: Santri Masuk Kembali';
          peran = 'Pemroses';
          detailText = `Santri ${izin.santriNama} kembali ke pondok pesantren pada ${izin.actualKembali || 'WIB'}. Keterlambatan: ${izin.menitKeterlambatan ? `${izin.menitKeterlambatan} menit` : 'Tepat waktu'}.`;
        }

        this.addAuditLog({
          aksi: actionTitle,
          detail: detailText,
          tipe: 'izin',
          izinId: izin.id,
          santriId: izin.santriId,
          santriNama: izin.santriNama,
          santriNis: izin.santriNis,
          santriGender: izin.santriGender,
          jenisIzin: izin.jenisIzin,
          waktuPengajuan: izin.tglPengajuan,
          petugasPencatat: izin.petugasPencatat || prev.petugasPencatat,
          petugasPenyetujui: izin.disetujuiOleh || (peran === 'Penyetujui' ? actorName : prev.disetujuiOleh),
          waktuKeluar: `${izin.tglKeluar} ${izin.jamKeluar}`,
          waktuKembali: `${izin.tglKembali} ${izin.jamKembali}`,
          statusIzin: izin.status,
          peranAktor: peran,
          dataSebelum: { status: prev.status, actualKeluar: prev.actualKeluar, actualKembali: prev.actualKembali },
          dataSesudah: { status: izin.status, actualKeluar: izin.actualKeluar, actualKembali: izin.actualKembali },
        });
      }
    } else {
      list.unshift(izin);
      this.addAuditLog({
        aksi: 'Pengajuan Perizinan Baru',
        detail: `Pencatatan pengajuan izin ${izin.jenisIzin} (${izin.nomorIzin}) santri ${izin.santriNama}. Alasan: ${izin.alasan}.`,
        tipe: 'izin',
        izinId: izin.id,
        santriId: izin.santriId,
        santriNama: izin.santriNama,
        santriNis: izin.santriNis,
        santriGender: izin.santriGender,
        jenisIzin: izin.jenisIzin,
        waktuPengajuan: izin.tglPengajuan,
        petugasPencatat: actorName,
        waktuKeluar: `${izin.tglKeluar} ${izin.jamKeluar}`,
        waktuKembali: `${izin.tglKembali} ${izin.jamKembali}`,
        statusIzin: izin.status,
        peranAktor: 'Pencatat',
      });
    }

    this.cache.perizinan = list;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('perizinan', toPerizinanRow(izin));
    } else {
      this.fireFirestoreSetDoc(CLOUD_COLLECTIONS.PERIZINAN, izin.id, izin as unknown as Record<string, unknown>);
    }
  }

  public deletePerizinan(id: string, alasan?: string) {
    const list = this.getPerizinanList();
    const target = list.find(i => i.id === id);
    const updated = list.filter(i => i.id !== id);

    if (target) {
      this.addAuditLog({
        aksi: 'Pembatalan & Arsip Perizinan',
        detail: `Membatalkan izin ${target.nomorIzin} atas nama santri ${target.santriNama}. Alasan: ${alasan || 'Dibatalkan oleh pengurus berwenang'}.`,
        tipe: 'koreksi',
        izinId: target.id,
        santriId: target.santriId,
        santriNama: target.santriNama,
        isRevisi: true,
        alasanRevisi: alasan || 'Pembatalan izin secara resmi',
        dataSebelum: target,
        dataSesudah: { status: 'Dibatalkan/Dihapus' },
      });
    }

    this.cache.perizinan = updated;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseDeleteRow('perizinan', id);
    } else {
      this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.PERIZINAN, id);
    }
  }

  // Automated Tardiness Detection
  public checkAndDetectLatePermits(): number {
    if ((!isSupabaseConfigured() && this.isFirestorePaused()) || !this.isNavigatorOnline) return 0;
    const list = this.getPerizinanList();
    if (list.length === 0) return 0;
    const now = new Date();
    let updatedCount = 0;

    const updatedList = list.map(izin => {
      if (izin.status === 'Sedang Keluar') {
        const deadlineStr = `${izin.tglKembali}T${izin.jamKembali}:00`;
        const deadline = new Date(deadlineStr);
        if (!isNaN(deadline.getTime()) && now.getTime() > deadline.getTime()) {
          const diffMinutes = Math.floor((now.getTime() - deadline.getTime()) / 60000);
          if (diffMinutes > 0) {
            updatedCount++;
            const updated = {
              ...izin,
              status: 'Terlambat' as const,
              menitKeterlambatan: diffMinutes,
            };
            if (isSupabaseConfigured()) {
              void this.supabaseUpsertRow('perizinan', toPerizinanRow(updated));
            } else {
              this.fireFirestoreSetDoc(CLOUD_COLLECTIONS.PERIZINAN, updated.id, updated as unknown as Record<string, unknown>);
            }
            return updated;
          }
        }
      } else if (izin.status === 'Terlambat' && !izin.actualKembali) {
        const deadlineStr = `${izin.tglKembali}T${izin.jamKembali}:00`;
        const deadline = new Date(deadlineStr);
        if (!isNaN(deadline.getTime())) {
          const diffMinutes = Math.floor((now.getTime() - deadline.getTime()) / 60000);
          if (diffMinutes > 0 && Math.abs(diffMinutes - (izin.menitKeterlambatan || 0)) >= 15) {
            const updated = {
              ...izin,
              menitKeterlambatan: diffMinutes,
            };
            if (isSupabaseConfigured()) {
              void this.supabaseUpsertRow('perizinan', toPerizinanRow(updated));
            } else {
              this.fireFirestoreSetDoc(CLOUD_COLLECTIONS.PERIZINAN, updated.id, updated as unknown as Record<string, unknown>);
            }
            return updated;
          }
        }
      }
      return izin;
    });

    if (updatedCount > 0) {
      this.cache.perizinan = updatedList;
      this.notify();
    }
    return updatedCount;
  }

  // ==========================================
  // Tata Tertib
  // ==========================================
  public getTataTertibList(): TataTertib[] {
    return this.cache.tataTertib;
  }

  public saveTataTertib(tt: TataTertib) {
    const list = [...this.getTataTertibList()];
    const index = list.findIndex(t => t.id === tt.id);
    if (index >= 0) {
      list[index] = tt;
    } else {
      list.push(tt);
    }
    this.cache.tataTertib = list;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('tata_tertib', toTataTertibRow(tt));
    } else {
      this.fireFirestoreSetDoc(CLOUD_COLLECTIONS.TATA_TERTIB, tt.id, tt as unknown as Record<string, unknown>);
    }
  }

  public deleteTataTertib(id: string) {
    const list = this.getTataTertibList().filter(t => t.id !== id);
    this.cache.tataTertib = list;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseDeleteRow('tata_tertib', id);
    } else {
      this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.TATA_TERTIB, id);
    }
  }

  // ==========================================
  // Pelanggaran & Takzir
  // ==========================================
  public getPelanggaranList(): Pelanggaran[] {
    return this.cache.pelanggaran;
  }

  public savePelanggaran(pel: Pelanggaran, note?: string) {
    const list = [...this.getPelanggaranList()];
    const index = list.findIndex(p => p.id === pel.id);
    const currentUser = this.getCurrentUser();
    const reporterName = pel.namaPetugasPelapor || (currentUser ? currentUser.nama : 'Petugas Keamanan');

    if (index >= 0) {
      const prev = list[index];
      list[index] = pel;
      this.addAuditLog({
        aksi: 'Koreksi Catatan Pelanggaran',
        detail: `Revisi data pelanggaran santri ${pel.santriNama} (${pel.kodePelanggaran}). ${note ? `Alasan: ${note}` : ''}`,
        tipe: 'koreksi',
        pelanggaranId: pel.id,
        santriId: pel.santriId,
        santriNama: pel.santriNama,
        santriNis: pel.santriNis,
        santriGender: pel.santriGender,
        jenisPelanggaran: pel.jenisPelanggaran,
        kronologi: pel.kronologi,
        petugasPelapor: reporterName,
        isRevisi: true,
        alasanRevisi: note || 'Perbaikan kronologi atau penyesuaian bobot poin',
        dataSebelum: prev,
        dataSesudah: pel,
        peranAktor: 'Pengawas',
      });
    } else {
      list.unshift(pel);
      this.updateSantriPoin(pel.santriId, pel.poin);
      this.addAuditLog({
        aksi: 'Pencatatan Insiden Pelanggaran',
        detail: `Mencatat pelanggaran santri: ${pel.santriNama} (${pel.jenisPelanggaran}) di ${pel.lokasi}. Poin sanksi: +${pel.poin}.`,
        tipe: 'pelanggaran',
        pelanggaranId: pel.id,
        santriId: pel.santriId,
        santriNama: pel.santriNama,
        santriNis: pel.santriNis,
        santriGender: pel.santriGender,
        jenisPelanggaran: pel.jenisPelanggaran,
        kronologi: pel.kronologi,
        petugasPelapor: reporterName,
        waktuPemberian: `${pel.tanggal} ${pel.waktu} WIB`,
        peranAktor: 'Pencatat',
      });
    }

    this.cache.pelanggaran = list;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('pelanggaran', toPelanggaranRow(pel));
    } else {
      this.fireFirestoreSetDoc(CLOUD_COLLECTIONS.PELANGGARAN, pel.id, pel as unknown as Record<string, unknown>);
    }
  }

  public deletePelanggaran(id: string, alasan?: string) {
    const list = this.getPelanggaranList();
    const target = list.find(p => p.id === id);
    const updated = list.filter(p => p.id !== id);
    if (target) {
      this.updateSantriPoin(target.santriId, -target.poin);
      this.addAuditLog({
        aksi: 'Pembatalan Insiden Pelanggaran',
        detail: `Menghapus/membatalkan catatan pelanggaran ${target.kodePelanggaran} santri ${target.santriNama}. Poin ${target.poin} dipulihkan.`,
        tipe: 'koreksi',
        pelanggaranId: target.id,
        santriId: target.santriId,
        santriNama: target.santriNama,
        isRevisi: true,
        alasanRevisi: alasan || 'Klarifikasi bukti atau pembatalan sah oleh musyawarah pengurus',
        dataSebelum: target,
        dataSesudah: { status: 'Dibatalkan' },
      });
    }
    this.cache.pelanggaran = updated;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseDeleteRow('pelanggaran', id);
    } else {
      this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.PELANGGARAN, id);
    }
  }

  private updateSantriPoin(santriId: string, poinDelta: number) {
    const santriList = [...this.getSantriList()];
    const santri = santriList.find(s => s.id === santriId);
    if (santri) {
      santri.poinPelanggaran = Math.max(0, (santri.poinPelanggaran || 0) + poinDelta);
      this.cache.santri = santriList;
      if (isSupabaseConfigured()) {
        void this.supabaseUpsertRow('santri', toSantriRow(santri));
      } else {
        this.fireFirestoreSetDoc(CLOUD_COLLECTIONS.SANTRI, santri.id, santri as unknown as Record<string, unknown>);
      }
    }
  }

  // ==========================================
  // Sanksi & Takzir Edukatif
  // ==========================================
  public getSanksiList(): Sanksi[] {
    return this.cache.sanksi;
  }

  public saveSanksi(sanksi: Sanksi, note?: string) {
    const list = [...this.getSanksiList()];
    const index = list.findIndex(s => s.id === sanksi.id);
    const currentUser = this.getCurrentUser();
    const assignerName = sanksi.petugasPenetap || (currentUser ? currentUser.nama : 'Dewan Keamanan');
    const systemCfg = this.getSystemConfig();

    const preparedSanksi: Sanksi = {
      ...sanksi,
      snapshotLayout: sanksi.snapshotLayout || systemCfg.suratSanksiLayout,
      customNomorSurat: sanksi.customNomorSurat || `SNK/MALIKI/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${Math.floor(100 + Math.random() * 900)}`,
      petugasPencatat: sanksi.petugasPencatat || (currentUser ? currentUser.nama : 'Petugas Keamanan'),
    };

    if (index >= 0) {
      const prev = list[index];
      list[index] = preparedSanksi;

      if (prev.status !== preparedSanksi.status && preparedSanksi.status === 'Selesai') {
        this.addAuditLog({
          aksi: 'Penyelesaian Takzir Santri',
          detail: `Santri ${preparedSanksi.santriNama} telah menuntaskan takzir: "${preparedSanksi.bentukSanksi}". Diverifikasi oleh pembina ${preparedSanksi.ustadzPembina}.`,
          tipe: 'sanksi',
          sanksiId: preparedSanksi.id,
          pelanggaranId: preparedSanksi.pelanggaranId,
          santriId: preparedSanksi.santriId,
          santriNama: preparedSanksi.santriNama,
          santriNis: sanksi.santriNis,
          santriGender: sanksi.santriGender,
          jenisPelanggaran: sanksi.jenisPelanggaran,
          jenisHukuman: sanksi.bentukSanksi,
          petugasPenetapHukuman: sanksi.petugasPenetap,
          waktuPemberian: sanksi.tanggalPenetapan,
          statusHukuman: 'Selesai',
          peranAktor: 'Pengawas',
          dataSebelum: { status: prev.status },
          dataSesudah: { status: 'Selesai', tanggalAktualSelesai: sanksi.tanggalAktualSelesai },
        });
      }
    } else {
      list.unshift(preparedSanksi);
      this.addAuditLog({
        aksi: 'Penetapan Takzir & Sanksi Edukatif',
        detail: `Penetapan takzir ${preparedSanksi.kodeSanksi} untuk santri ${preparedSanksi.santriNama}: "${preparedSanksi.bentukSanksi}". Pembina: ${preparedSanksi.ustadzPembina}.`,
        tipe: 'sanksi',
        sanksiId: preparedSanksi.id,
        pelanggaranId: preparedSanksi.pelanggaranId,
        santriId: preparedSanksi.santriId,
        santriNama: preparedSanksi.santriNama,
        santriNis: preparedSanksi.santriNis,
        santriGender: preparedSanksi.santriGender,
        jenisPelanggaran: preparedSanksi.jenisPelanggaran,
        jenisHukuman: preparedSanksi.bentukSanksi,
        petugasPenetapHukuman: assignerName,
        waktuPemberian: preparedSanksi.tanggalPenetapan,
        statusHukuman: preparedSanksi.status,
        peranAktor: 'Penetap',
      });
    }

    this.cache.sanksi = list;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('sanksi', toSanksiRow(preparedSanksi));
    } else {
      this.fireFirestoreSetDoc(CLOUD_COLLECTIONS.SANKSI, preparedSanksi.id, preparedSanksi as unknown as Record<string, unknown>);
    }
  }

  public deleteSanksi(id: string, alasan?: string) {
    const list = this.getSanksiList();
    const target = list.find(s => s.id === id);
    const updated = list.filter(s => s.id !== id);

    if (target) {
      this.addAuditLog({
        aksi: 'Pembatalan Status Takzir',
        detail: `Membatalkan berkas sanksi ${target.kodeSanksi} santri ${target.santriNama}. Alasan: ${alasan || 'Pembatalan oleh pimpinan keamanan'}.`,
        tipe: 'koreksi',
        sanksiId: target.id,
        santriId: target.santriId,
        santriNama: target.santriNama,
        isRevisi: true,
        alasanRevisi: alasan || 'Pembatalan resmi berkas sanksi',
        dataSebelum: target,
        dataSesudah: { status: 'Dibatalkan' },
      });
    }

    this.cache.sanksi = updated;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseDeleteRow('sanksi', id);
    } else {
      this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.SANKSI, id);
    }
  }

  // Audit Hash & Immutable Log Engine
  private generateAuditHash(timestamp: number, user: string, action: string): string {
    const raw = `${timestamp}_${user}_${action}_${Math.random().toString(36).substring(2, 8)}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `SEC-${hex}`;
  }

  public getLogs(): LogAktivitas[] {
    return this.cache.logs;
  }

  public addAuditLog(entry: Partial<LogAktivitas>): LogAktivitas {
    const user = this.getCurrentUser();
    const now = new Date();
    const timestamp = Date.now();
    const timeStr = `${now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}, ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB`;
    
    const aksi = entry.aksi || 'Aktivitas Sistem Keamanan';
    const userName = entry.user || (user ? user.nama : 'Sistem Komando Pusat');
    const hash = entry.hashAudit || this.generateAuditHash(timestamp, userName, aksi);

    const newLog: LogAktivitas = {
      id: entry.id || `log_act_${timestamp}_${Math.random().toString(36).substring(2, 6)}`,
      waktu: entry.waktu || timeStr,
      timestamp,
      user: userName,
      nrp: entry.nrp || (user ? user.nrp : 'SYS-AUTO-01'),
      role: entry.role || (user ? user.role : 'System'),
      avatar: entry.avatar || (user ? user.avatar : undefined),
      aksi,
      detail: entry.detail || '',
      tipe: entry.tipe || 'admin',
      ...entry,
      hashAudit: hash,
    };

    const existing = this.getLogs();
    const logs = [newLog, ...existing].slice(0, 300);
    this.cache.logs = logs;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('logs', toLogsRow(newLog));
    } else if (!this.quotaExceeded && !isFirestoreQuotaPaused()) {
      this.trackCloudWrite(
        setDoc(doc(db, CLOUD_COLLECTIONS.LOGS, newLog.id), sanitizeForFirestore(newLog), { merge: true }),
        OperationType.WRITE,
        `${CLOUD_COLLECTIONS.LOGS}/${newLog.id}`
      );
    }

    return newLog;
  }

  public addLog(aksi: string, detail: string, tipe: LogAktivitas['tipe']) {
    return this.addAuditLog({ aksi, detail, tipe });
  }

  // ==========================================
  // Notifikasi Terpusat
  // ==========================================
  public getNotifications(): NotifikasiApp[] {
    return this.cache.notifikasi;
  }

  public addNotification(notif: Omit<NotifikasiApp, 'id' | 'waktu' | 'dibaca'>) {
    const newNotif: NotifikasiApp = {
      id: `notif_${Date.now()}`,
      waktu: 'Baru saja',
      dibaca: false,
      ...notif,
    };
    const current = [newNotif, ...this.getNotifications()].slice(0, 50);
    this.cache.notifikasi = current;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('notifikasi', toNotifikasiRow(newNotif));
    } else {
      this.fireFirestoreSetDoc(CLOUD_COLLECTIONS.NOTIFIKASI, newNotif.id, newNotif as unknown as Record<string, unknown>);
    }
  }

  public markAllNotificationsRead() {
    const current = this.getNotifications().map(n => ({ ...n, dibaca: true }));
    this.cache.notifikasi = current;
    this.notify();

    if (isSupabaseConfigured()) {
      for (const notif of current) {
        void this.supabaseUpsertRow('notifikasi', toNotifikasiRow(notif));
      }
    } else if (!this.isFirestorePaused()) {
      for (const notif of current) {
        this.fireFirestoreSetDoc(CLOUD_COLLECTIONS.NOTIFIKASI, notif.id, { dibaca: true });
      }
    }
  }

  public markNotificationRead(id: string) {
    const current = this.getNotifications().map(n => n.id === id ? { ...n, dibaca: true } : n);
    this.cache.notifikasi = current;
    this.notify();

    if (isSupabaseConfigured()) {
      const target = current.find(n => n.id === id);
      if (target) void this.supabaseUpsertRow('notifikasi', toNotifikasiRow(target));
    } else {
      this.fireFirestoreSetDoc(CLOUD_COLLECTIONS.NOTIFIKASI, id, { dibaca: true });
    }
  }

  public deleteNotification(id: string) {
    const current = this.getNotifications().filter(n => n.id !== id);
    this.cache.notifikasi = current;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseDeleteRow('notifikasi', id);
    } else {
      this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.NOTIFIKASI, id);
    }
  }

  // ==========================================
  // Koordinasi Admin & Dewan Keamanan
  // ==========================================
  public getKoordinasiList(): PesanKoordinasi[] {
    return this.cache.koordinasi;
  }

  public saveKoordinasi(pesan: PesanKoordinasi) {
    const normalizedPesan: PesanKoordinasi = {
      ...pesan,
      dibacaOleh: [...(pesan.dibacaOleh || [])],
      balasan: [...(pesan.balasan || [])],
    };
    const list = [...this.getKoordinasiList()];
    const index = list.findIndex(p => p.id === normalizedPesan.id);
    if (index >= 0) {
      list[index] = normalizedPesan;
    } else {
      list.unshift(normalizedPesan);
      const tLower = (normalizedPesan.tujuan || '').toLowerCase();
      const targetLinkMenu =
        tLower.includes('ketua') ? 'ketua_pondok_koordinasi' :
        tLower.includes('sekretaris') ? 'sekretaris_inbox' :
        tLower.includes('bendahara') ? 'bendahara_inbox' :
        tLower.includes('perlengkapan') || tLower.includes('sarpras') ? 'perlengkapan_inbox' :
        'koordinasi';

      this.addNotification({
        judul: `Pesan Masuk: ${normalizedPesan.judul}`,
        pesan: `Dari ${normalizedPesan.pengirimNama} (${normalizedPesan.pengirimJabatan || normalizedPesan.kategori})`,
        tipe: normalizedPesan.prioritas === 'Mendesak' ? 'danger' : normalizedPesan.prioritas === 'Penting' ? 'warning' : 'info',
        linkMenu: targetLinkMenu,
      });
      this.addLog(
        'Disposisi Koordinasi',
        `${normalizedPesan.pengirimNama} (${normalizedPesan.pengirimRole}) mengirim ${normalizedPesan.kategori} [${normalizedPesan.prioritas}]: "${normalizedPesan.judul}"`,
        'admin'
      );
    }
    this.cache.koordinasi = list;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('koordinasi', toKoordinasiRow(normalizedPesan));
    } else {
      this.fireFirestoreSetDoc(
        CLOUD_COLLECTIONS.KOORDINASI,
        normalizedPesan.id,
        normalizedPesan as unknown as Record<string, unknown>
      );
    }
  }

  public markKoordinasiAsRead(pesanId: string, userId: string) {
    const list = [...this.getKoordinasiList()];
    const idx = list.findIndex(p => p.id === pesanId);
    if (idx >= 0) {
      const item = list[idx];
      const existingRead = item.dibacaOleh || [];
      let changed = false;
      const nextRead = existingRead.includes(userId) ? existingRead : [...existingRead, userId];
      if (!existingRead.includes(userId)) changed = true;

      let nextStatus = item.status;
      if (item.status === 'Terkirim') {
        nextStatus = 'Dibaca';
        changed = true;
      }
      if (changed) {
        const updated: PesanKoordinasi = {
          ...item,
          dibacaOleh: nextRead,
          status: nextStatus,
        };
        list[idx] = updated;
        this.cache.koordinasi = list;
        this.notify();

        if (isSupabaseConfigured()) {
          void this.supabaseUpsertRow('koordinasi', toKoordinasiRow(updated));
        } else {
          this.fireFirestoreSetDoc(
            CLOUD_COLLECTIONS.KOORDINASI,
            pesanId,
            updated as unknown as Record<string, unknown>
          );
        }
      }
    }
  }

  public balasKoordinasi(pesanId: string, balasan: BalasanKoordinasi) {
    const list = [...this.getKoordinasiList()];
    const idx = list.findIndex(p => p.id === pesanId);
    if (idx >= 0) {
      const item = list[idx];
      const existingRead = item.dibacaOleh || [];
      const nextRead = existingRead.includes(balasan.pengirimId)
        ? existingRead
        : [...existingRead, balasan.pengirimId];
      const nextStatus =
        balasan.pengirimRole === 'admin' && item.status === 'Terkirim'
          ? 'Dibaca'
          : item.status;

      const updated: PesanKoordinasi = {
        ...item,
        dibacaOleh: nextRead,
        status: nextStatus,
        balasan: [...(item.balasan || []), balasan],
      };
      list[idx] = updated;

      const senderLower = (updated.pengirimRole || '').toLowerCase();
      const targetLinkMenu =
        senderLower === 'ketua_pondok' ? 'ketua_pondok_koordinasi' :
        senderLower === 'sekretaris' ? 'sekretaris_inbox' :
        senderLower === 'bendahara' ? 'bendahara_inbox' :
        senderLower === 'perlengkapan' ? 'perlengkapan_inbox' :
        updated.tujuan === 'ketua_pondok' ? 'ketua_pondok_koordinasi' :
        'koordinasi';

      this.addNotification({
        judul: `Balasan Pesan: ${updated.judul}`,
        pesan: `${balasan.pengirimNama}: "${balasan.isi.slice(0, 65)}"`,
        tipe: 'info',
        linkMenu: targetLinkMenu,
      });
      this.cache.koordinasi = list;
      this.notify();

      if (isSupabaseConfigured()) {
        void this.supabaseUpsertRow('koordinasi', toKoordinasiRow(updated));
      } else {
        this.fireFirestoreSetDoc(
          CLOUD_COLLECTIONS.KOORDINASI,
          pesanId,
          updated as unknown as Record<string, unknown>
        );
      }
    }
  }

  public tindakLanjutiKoordinasi(pesanId: string, catatan: string, petugasNama: string) {
    const list = [...this.getKoordinasiList()];
    const item = list.find(p => p.id === pesanId);
    if (item) {
      item.status = 'Ditindaklanjuti';
      item.tindakLanjutCatatan = catatan;
      item.tindakLanjutOleh = petugasNama;
      item.tindakLanjutWaktu = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      this.addNotification({
        judul: `Instruksi/Laporan Telah Ditindaklanjuti`,
        pesan: `Tiket ${item.nomorTiket} telah ditindaklanjuti oleh ${petugasNama}: "${catatan.slice(0, 60)}..."`,
        tipe: 'success',
        linkMenu: 'koordinasi',
      });
      this.addLog(
        'Tindak Lanjut Koordinasi',
        `${petugasNama} menyelesaikan tindak lanjut tiket ${item.nomorTiket}: ${catatan}`,
        'admin'
      );
      this.cache.koordinasi = list;
      this.notify();

      if (isSupabaseConfigured()) {
        void this.supabaseUpsertRow('koordinasi', toKoordinasiRow(item));
      } else {
        this.fireFirestoreSetDoc(
          CLOUD_COLLECTIONS.KOORDINASI,
          pesanId,
          item as unknown as Record<string, unknown>
        );
      }
    }
  }

  public tanggapiKoordinasi(pesanId: string, balasan: BalasanKoordinasi, ringkasanCatatan?: string) {
    const list = [...this.getKoordinasiList()];
    const idx = list.findIndex(p => p.id === pesanId);
    if (idx < 0) return;

    const existing = list[idx];
    const nextDibaca = existing.dibacaOleh.includes(balasan.pengirimId)
      ? existing.dibacaOleh
      : [...existing.dibacaOleh, balasan.pengirimId];

    const updated: PesanKoordinasi = {
      ...existing,
      status: 'Ditindaklanjuti',
      dibacaOleh: nextDibaca,
      tindakLanjutCatatan: ringkasanCatatan || balasan.isi,
      tindakLanjutOleh: balasan.pengirimNama,
      tindakLanjutWaktu: balasan.waktu,
      balasan: [...(existing.balasan || []), balasan],
    };

    list[idx] = updated;
    this.cache.koordinasi = list;

    this.addNotification({
      judul: `Tanggapan Ketua: ${updated.judul}`,
      pesan: `${balasan.pengirimNama}: "${balasan.isi.slice(0, 75)}"`,
      tipe: 'success',
      linkMenu: 'koordinasi',
    });
    this.addLog(
      'Tanggapan Ketua Pondok',
      `${balasan.pengirimNama} menanggapi pesan ${updated.nomorTiket}: "${balasan.isi.slice(0, 80)}"`,
      'admin'
    );
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('koordinasi', toKoordinasiRow(updated));
    } else {
      this.fireFirestoreSetDoc(
        CLOUD_COLLECTIONS.KOORDINASI,
        pesanId,
        updated as unknown as Record<string, unknown>
      );
    }
  }

  public deleteKoordinasi(pesanId: string) {
    const list = this.getKoordinasiList().filter(p => p.id !== pesanId);
    this.cache.koordinasi = list;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseDeleteRow('koordinasi', pesanId);
    } else {
      this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.KOORDINASI, pesanId);
    }
  }

  public deleteAllKoordinasi() {
    const existingIds = this.getKoordinasiList().map(p => p.id);
    this.cache.koordinasi = [];
    this.addLog('Hapus Semua Pesan Masuk', `Ketua Pondok menghapus seluruh ${existingIds.length} pesan koordinasi masuk.`, 'admin');
    this.notify();

    if (isSupabaseConfigured()) {
      for (const id of existingIds) {
        void this.supabaseDeleteRow('koordinasi', id);
      }
    } else if (!this.isFirestorePaused()) {
      for (const id of existingIds) {
        this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.KOORDINASI, id);
      }
    }
  }

  public getUnreadKoordinasiCount(user?: UserAccount): { total: number; mendesak: number } {
    const list = this.getKoordinasiList();
    const currentUserId = user ? user.id : (this.getCurrentUser()?.id || '');
    const unread = list.filter(p => !p.dibacaOleh.includes(currentUserId));
    const mendesak = unread.filter(p => p.prioritas === 'Mendesak').length;
    return {
      total: unread.length,
      mendesak,
    };
  }

  // ==========================================
  // 1. Struktur Organisasi Pondok
  // ==========================================
  public getStrukturOrganisasi(): StrukturOrganisasiNode[] {
    return this.cache.strukturOrganisasi;
  }

  public saveStrukturNode(node: StrukturOrganisasiNode) {
    const list = [...this.getStrukturOrganisasi()];
    const idx = list.findIndex(n => n.id === node.id);
    if (idx >= 0) list[idx] = node;
    else list.push(node);
    const sorted = list.sort((a, b) => (a.level - b.level) || (a.urutan - b.urutan));
    this.cache.strukturOrganisasi = sorted;
    this.addLog('Struktur Organisasi', `Memperbarui jabatan struktur: ${node.jabatan} (${node.namaPengurus})`, 'admin');
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('struktur_organisasi', toStrukturOrganisasiRow(node));
    } else {
      this.fireFirestoreSetDoc(
        CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI,
        node.id,
        node as unknown as Record<string, unknown>
      );
    }
  }

  public deleteStrukturNode(id: string) {
    const updated = this.getStrukturOrganisasi().filter(n => n.id !== id);
    this.cache.strukturOrganisasi = updated;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseDeleteRow('struktur_organisasi', id);
    } else {
      this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI, id);
    }
  }

  // ==========================================
  // 2. Ketua Pondok (Agenda, Evaluasi, Pengajuan Divisi)
  // ==========================================
  public getAgendaPengurus(): AgendaPengurus[] {
    return this.cache.agendaPengurus;
  }

  public checkAndDetectTodayAgendas(): number {
    if ((!isSupabaseConfigured() && this.isFirestorePaused()) || !this.isNavigatorOnline) return 0;
    const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    const agendas = this.getAgendaPengurus();
    const todayAgendas = agendas.filter((a) => a.tanggal === todayWib && a.status !== 'Selesai');
    if (todayAgendas.length === 0) return 0;

    let currentNotifs = [...this.getNotifications()];
    let addedCount = 0;

    for (const agd of todayAgendas) {
      const detId = `notif_agenda_${agd.id}_${todayWib}`;
      const judul = `Agenda Hari Ini: ${agd.judul}`;
      const pesan = `Jadwal hari ini (${todayWib}) pukul ${agd.waktu || '08:00'} WIB di ${agd.tempat || 'Aula Pondok'} · Divisi: ${agd.divisiTerkait || 'Semua Pengurus'}.`;
      const contentKey = `${detId}::${judul}::${pesan}`;
      if (this.detectedAgendaNotifKeys.has(contentKey)) continue;

      const existingIdx = currentNotifs.findIndex((n) => n.id === detId);

      if (existingIdx === -1) {
        const newNotif: NotifikasiApp = {
          id: detId,
          judul,
          pesan,
          waktu: `Hari Ini · ${agd.waktu || 'WIB'}`,
          dibaca: false,
          tipe: agd.status === 'Berlangsung' ? 'warning' : 'info',
          linkMenu: 'kalender_akademik',
        };
        currentNotifs = [newNotif, ...currentNotifs].slice(0, 60);
        addedCount++;
        this.detectedAgendaNotifKeys.add(contentKey);
        if (isSupabaseConfigured()) {
          void this.supabaseUpsertRow('notifikasi', toNotifikasiRow(newNotif));
        } else {
          this.fireFirestoreSetDoc(
            CLOUD_COLLECTIONS.NOTIFIKASI,
            detId,
            newNotif as unknown as Record<string, unknown>
          );
        }
      } else if (currentNotifs[existingIdx].judul !== judul || currentNotifs[existingIdx].pesan !== pesan) {
        const updatedNotif: NotifikasiApp = {
          ...currentNotifs[existingIdx],
          judul,
          pesan,
          waktu: `Hari Ini · ${agd.waktu || 'WIB'}`,
          dibaca: false,
        };
        currentNotifs[existingIdx] = updatedNotif;
        addedCount++;
        this.detectedAgendaNotifKeys.add(contentKey);
        if (isSupabaseConfigured()) {
          void this.supabaseUpsertRow('notifikasi', toNotifikasiRow(updatedNotif));
        } else {
          this.fireFirestoreSetDoc(
            CLOUD_COLLECTIONS.NOTIFIKASI,
            detId,
            updatedNotif as unknown as Record<string, unknown>
          );
        }
      } else {
        this.detectedAgendaNotifKeys.add(contentKey);
      }
    }

    if (addedCount > 0) {
      this.cache.notifikasi = currentNotifs;
      this.notify();
    }
    return addedCount;
  }

  public saveAgendaPengurus(agenda: AgendaPengurus) {
    const list = [...this.getAgendaPengurus()];
    const idx = list.findIndex(a => a.id === agenda.id);
    if (idx >= 0) list[idx] = agenda;
    else list.unshift(agenda);
    this.cache.agendaPengurus = list;
    this.addLog('Agenda Pengurus', `Menyimpan agenda kepengurusan: ${agenda.judul} (${agenda.tanggal})`, 'admin');
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('jadwal_agenda', toJadwalAgendaFromPengurus(agenda));
    } else {
      this.fireFirestoreSetDoc(
        CLOUD_COLLECTIONS.AGENDA_PENGURUS,
        agenda.id,
        agenda as unknown as Record<string, unknown>
      );
    }

    this.checkAndDetectTodayAgendas();
  }

  public deleteAgendaPengurus(id: string) {
    const updated = this.getAgendaPengurus().filter(a => a.id !== id);
    this.cache.agendaPengurus = updated;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseDeleteRow('jadwal_agenda', id);
    } else {
      this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.AGENDA_PENGURUS, id);
    }
  }

  public getEvaluasiKepengurusan(): EvaluasiKepengurusan[] {
    return this.cache.evaluasiKepengurusan;
  }

  public saveEvaluasiKepengurusan(evaluasi: EvaluasiKepengurusan) {
    const list = [...this.getEvaluasiKepengurusan()];
    const idx = list.findIndex(e => e.id === evaluasi.id);
    if (idx >= 0) list[idx] = evaluasi;
    else list.unshift(evaluasi);
    this.cache.evaluasiKepengurusan = list;
    this.addLog('Evaluasi Kepengurusan', `Ketua Pondok mencatat evaluasi divisi ${evaluasi.divisi}: ${evaluasi.judul}`, 'admin');
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('evaluasi_kepengurusan', toEvaluasiKepengurusanRow(evaluasi));
    } else {
      this.fireFirestoreSetDoc(
        CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN,
        evaluasi.id,
        evaluasi as unknown as Record<string, unknown>
      );
    }
  }

  public deleteEvaluasiKepengurusan(id: string) {
    const updated = this.getEvaluasiKepengurusan().filter(e => e.id !== id);
    this.cache.evaluasiKepengurusan = updated;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseDeleteRow('evaluasi_kepengurusan', id);
    } else {
      this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN, id);
    }
  }

  public getPengajuanDivisi(): PengajuanDivisi[] {
    return this.cache.pengajuanDivisi;
  }

  public savePengajuanDivisi(pengajuan: PengajuanDivisi) {
    const list = [...this.getPengajuanDivisi()];
    const idx = list.findIndex(p => p.id === pengajuan.id);
    if (idx >= 0) list[idx] = pengajuan;
    else {
      list.unshift(pengajuan);
      this.addNotification({
        judul: `Pengajuan Baru: Divisi ${pengajuan.divisi}`,
        pesan: `${pengajuan.pengajuNama} mengajukan "${pengajuan.judul}". Menunggu persetujuan Ketua Pondok.`,
        tipe: 'info',
        linkMenu: 'ketua_pondok',
      });
    }
    this.cache.pengajuanDivisi = list;
    this.addLog('Pengajuan Divisi', `Update pengajuan ${pengajuan.nomorPengajuan} (${pengajuan.status}): ${pengajuan.judul}`, 'admin');
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('pengajuan_divisi', toPengajuanDivisiRow(pengajuan));
    } else {
      this.fireFirestoreSetDoc(
        CLOUD_COLLECTIONS.PENGAJUAN_DIVISI,
        pengajuan.id,
        pengajuan as unknown as Record<string, unknown>
      );
    }
  }

  public deletePengajuanDivisi(id: string) {
    const updated = this.getPengajuanDivisi().filter(p => p.id !== id);
    this.cache.pengajuanDivisi = updated;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseDeleteRow('pengajuan_divisi', id);
    } else {
      this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.PENGAJUAN_DIVISI, id);
    }
  }

  // ==========================================
  // 3. Sekretaris (Persuratan 15 Jenis & Arsip)
  // ==========================================
  public getArsipSurat(): ArsipSurat[] {
    return this.cache.arsipSurat;
  }

  public saveArsipSurat(surat: ArsipSurat) {
    const list = [...this.getArsipSurat()];
    const idx = list.findIndex(s => s.id === surat.id);
    if (idx >= 0) list[idx] = surat;
    else list.unshift(surat);
    this.cache.arsipSurat = list;
    this.addLog('Administrasi Persuratan', `Menyimpan Surat ${surat.arah} (${surat.kodeJenis}) No. ${surat.nomorSurat}`, 'admin');
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('surat_menyurat', toSuratMenyuratRow(surat));
    } else {
      this.fireFirestoreSetDoc(
        CLOUD_COLLECTIONS.SURAT_MENYURAT,
        surat.id,
        surat as unknown as Record<string, unknown>
      );
    }
  }

  public deleteArsipSurat(id: string) {
    const updated = this.getArsipSurat().filter(s => s.id !== id);
    this.cache.arsipSurat = updated;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseDeleteRow('surat_menyurat', id);
    } else {
      this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.SURAT_MENYURAT, id);
    }
  }

  // ==========================================
  // 4. Bendahara (Keuangan Kas Pondok)
  // ==========================================
  public getTransaksiKeuangan(): TransaksiKeuangan[] {
    return this.cache.transaksiKeuangan;
  }

  public saveTransaksiKeuangan(trx: TransaksiKeuangan) {
    const list = [...this.getTransaksiKeuangan()];
    const idx = list.findIndex(t => t.id === trx.id);
    if (idx >= 0) list[idx] = trx;
    else list.unshift(trx);
    this.cache.transaksiKeuangan = list;
    this.addLog('Transaksi Keuangan', `${trx.tipe} Rp ${trx.nominal.toLocaleString('id-ID')} (${trx.kategori}) - ${trx.kodeTransaksi}`, 'admin');
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('keuangan_transaksi', toKeuanganTransaksiRow(trx));
    } else {
      this.fireFirestoreSetDoc(
        CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI,
        trx.id,
        trx as unknown as Record<string, unknown>
      );
    }
  }

  public deleteTransaksiKeuangan(id: string) {
    const updated = this.getTransaksiKeuangan().filter(t => t.id !== id);
    this.cache.transaksiKeuangan = updated;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseDeleteRow('keuangan_transaksi', id);
    } else {
      this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI, id);
    }
  }

  // ==========================================
  // 5. Perlengkapan (Inventaris & Peminjaman)
  // ==========================================
  public getBarangInventaris(): BarangInventaris[] {
    return this.cache.barangInventaris;
  }

  public saveBarangInventaris(barang: BarangInventaris) {
    const list = [...this.getBarangInventaris()];
    const idx = list.findIndex(b => b.id === barang.id);
    if (idx >= 0) list[idx] = barang;
    else list.unshift(barang);
    this.cache.barangInventaris = list;
    this.addLog('Inventaris Sarpras', `Memperbarui aset ${barang.kodeBarang}: ${barang.namaBarang} (${barang.jumlah} ${barang.satuan})`, 'admin');
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('perlengkapan_inventaris', toPerlengkapanInventarisRow(barang));
    } else {
      this.fireFirestoreSetDoc(
        CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS,
        barang.id,
        barang as unknown as Record<string, unknown>
      );
    }
  }

  public deleteBarangInventaris(id: string) {
    const updated = this.getBarangInventaris().filter(b => b.id !== id);
    this.cache.barangInventaris = updated;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseDeleteRow('perlengkapan_inventaris', id);
    } else {
      this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS, id);
    }
  }

  public getPeminjamanBarang(): PeminjamanBarang[] {
    return this.cache.peminjamanBarang;
  }

  public savePeminjamanBarang(pjm: PeminjamanBarang) {
    const list = [...this.getPeminjamanBarang()];
    const idx = list.findIndex(p => p.id === pjm.id);
    if (idx >= 0) list[idx] = pjm;
    else list.unshift(pjm);
    this.cache.peminjamanBarang = list;
    this.addLog('Peminjaman Perlengkapan', `${pjm.kodePeminjaman}: ${pjm.namaBarang} oleh ${pjm.peminjamNama} (${pjm.status})`, 'admin');
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseUpsertRow('perlengkapan_peminjaman', toPerlengkapanPeminjamanRow(pjm));
    } else {
      this.fireFirestoreSetDoc(
        CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN,
        pjm.id,
        pjm as unknown as Record<string, unknown>
      );
    }
  }

  public deletePeminjamanBarang(id: string) {
    const updated = this.getPeminjamanBarang().filter(p => p.id !== id);
    this.cache.peminjamanBarang = updated;
    this.notify();

    if (isSupabaseConfigured()) {
      void this.supabaseDeleteRow('perlengkapan_peminjaman', id);
    } else {
      this.fireFirestoreDeleteDoc(CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN, id);
    }
  }

  // ==========================================
  // Pembersihan Data Sample (Pertahankan Data Asli Pengurus)
  // ==========================================
  public async clearAllSampleData(): Promise<{
    removedSantri: number;
    removedUstadz: number;
    removedLainnya: number;
  }> {
    const sampleSantriIds = new Set(INITIAL_SANTRI.map(s => s.id));
    const sampleUstadzIds = new Set((INITIAL_SYSTEM_CONFIG.ustadzList || []).map(u => u.id));

    const prevSantri = this.getSantriList();
    const keptSantri = prevSantri.filter(s => !sampleSantriIds.has(s.id));
    const removedSantriList = prevSantri.filter(s => sampleSantriIds.has(s.id));
    this.cache.santri = keptSantri;

    const prevUstadz = this.getUstadzList();
    const keptUstadz = prevUstadz.filter(u => !sampleUstadzIds.has(u.id));
    const removedUstadzCount = prevUstadz.length - keptUstadz.length;

    const useSupabase = isSupabaseConfigured();
    const deleteIdsInCloud = async (supabaseTable: string, firestoreCol: string, ids: string[]) => {
      if (ids.length === 0) return;
      if (useSupabase) {
        const client = getSupabaseClient();
        if (!client) return;
        try {
          const { error } = await client.from(supabaseTable).delete().in('id', ids);
          if (error) throw error;
        } catch (err) {
          console.warn(`Supabase delete sample [${supabaseTable}] warning:`, extractSupabaseErrorMessage(err));
        }
        return;
      }
      if (this.isFirestorePaused()) return;
      for (const id of ids) {
        try {
          await deleteDoc(doc(db, firestoreCol, id));
        } catch (err) {
          if (isFirestoreQuotaError(err)) {
            this.enterQuotaCacheMode(extractFirebaseErrorMessage(err));
            return;
          }
        }
      }
    };

    let removedLainnya = 0;
    const filterSampleCol = async <T extends { id: string }>(
      current: T[],
      sampleItems: T[],
      supabaseTable: string,
      colName: string,
      assign: (items: T[]) => void
    ) => {
      const sampleIds = new Set(sampleItems.map(i => i.id));
      const kept = current.filter(i => !sampleIds.has(i.id));
      const removed = current.filter(i => sampleIds.has(i.id));
      removedLainnya += removed.length;
      assign(kept);
      await deleteIdsInCloud(supabaseTable, colName, removed.map(i => i.id));
    };

    await deleteIdsInCloud('santri', CLOUD_COLLECTIONS.SANTRI, removedSantriList.map(s => s.id));
    if (useSupabase) {
      const removedUstadzIds = prevUstadz.filter(u => sampleUstadzIds.has(u.id)).map(u => u.id);
      await deleteIdsInCloud('ustadz', '', removedUstadzIds);
    }

    await Promise.all([
      filterSampleCol(this.cache.dewan, INITIAL_DEWAN_KEAMANAN, 'dewan_keamanan', CLOUD_COLLECTIONS.DEWAN_KEAMANAN, l => { this.cache.dewan = l; }),
      filterSampleCol(this.cache.perizinan, INITIAL_PERIZINAN, 'perizinan', CLOUD_COLLECTIONS.PERIZINAN, l => { this.cache.perizinan = l; }),
      filterSampleCol(this.cache.pelanggaran, INITIAL_PELANGGARAN, 'pelanggaran', CLOUD_COLLECTIONS.PELANGGARAN, l => { this.cache.pelanggaran = l; }),
      filterSampleCol(this.cache.sanksi, INITIAL_SANKSI, 'sanksi', CLOUD_COLLECTIONS.SANKSI, l => { this.cache.sanksi = l; }),
      filterSampleCol(this.cache.logs, INITIAL_LOGS, 'logs', CLOUD_COLLECTIONS.LOGS, l => { this.cache.logs = l; }),
      filterSampleCol(this.cache.koordinasi, INITIAL_KOORDINASI, 'koordinasi', CLOUD_COLLECTIONS.KOORDINASI, l => { this.cache.koordinasi = l; }),
      filterSampleCol(this.cache.agendaPengurus, INITIAL_AGENDA_PENGURUS, 'jadwal_agenda', CLOUD_COLLECTIONS.AGENDA_PENGURUS, l => { this.cache.agendaPengurus = l; }),
      filterSampleCol(this.cache.evaluasiKepengurusan, INITIAL_EVALUASI_KEPENGURUSAN, 'evaluasi_kepengurusan', CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN, l => { this.cache.evaluasiKepengurusan = l; }),
      filterSampleCol(this.cache.pengajuanDivisi, INITIAL_PENGAJUAN_DIVISI, 'pengajuan_divisi', CLOUD_COLLECTIONS.PENGAJUAN_DIVISI, l => { this.cache.pengajuanDivisi = l; }),
      filterSampleCol(this.cache.arsipSurat, INITIAL_ARSIP_SURAT, 'surat_menyurat', CLOUD_COLLECTIONS.SURAT_MENYURAT, l => { this.cache.arsipSurat = l; }),
      filterSampleCol(this.cache.transaksiKeuangan, INITIAL_TRANSAKSI_KEUANGAN, 'keuangan_transaksi', CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI, l => { this.cache.transaksiKeuangan = l; }),
      filterSampleCol(this.cache.barangInventaris, INITIAL_BARANG_INVENTARIS, 'perlengkapan_inventaris', CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS, l => { this.cache.barangInventaris = l; }),
      filterSampleCol(this.cache.peminjamanBarang, INITIAL_PEMINJAMAN_BARANG, 'perlengkapan_peminjaman', CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN, l => { this.cache.peminjamanBarang = l; }),
    ]);

    const stripBySample = <T extends { id: string }>(arr: T[] | undefined, seedArr: T[] | undefined): T[] => {
      if (!Array.isArray(arr)) return [];
      const ids = new Set((seedArr || []).map(x => x.id));
      return arr.filter(x => !ids.has(x.id));
    };

    const currentCfg = this.getSystemConfig();
    const updatedCfg: SystemConfig = {
      ...currentCfg,
      initialSeedCompleted: true,
      sampleCleared: true,
      ustadzList: keptUstadz,
      dataUstadzList: keptUstadz,
      beritaTerkini: stripBySample(currentCfg.beritaTerkini, INITIAL_SYSTEM_CONFIG.beritaTerkini),
      programKerjaList: stripBySample(currentCfg.programKerjaList, INITIAL_SYSTEM_CONFIG.programKerjaList),
      izinPengurusList: stripBySample(currentCfg.izinPengurusList, INITIAL_SYSTEM_CONFIG.izinPengurusList),
      notulenRapatList: stripBySample(currentCfg.notulenRapatList, INITIAL_SYSTEM_CONFIG.notulenRapatList),
      syahriyahList: stripBySample(currentCfg.syahriyahList, INITIAL_SYSTEM_CONFIG.syahriyahList),
      uangSakuList: stripBySample(currentCfg.uangSakuList, INITIAL_SYSTEM_CONFIG.uangSakuList),
      anggaranList: stripBySample(currentCfg.anggaranList, INITIAL_SYSTEM_CONFIG.anggaranList),
      mutasiBarangList: stripBySample(currentCfg.mutasiBarangList, INITIAL_SYSTEM_CONFIG.mutasiBarangList),
      jadwalPerbaikanList: stripBySample(currentCfg.jadwalPerbaikanList, INITIAL_SYSTEM_CONFIG.jadwalPerbaikanList),
      kamarSantriList: stripBySample(currentCfg.kamarSantriList, INITIAL_SYSTEM_CONFIG.kamarSantriList),
      pusatInformasiList: stripBySample(currentCfg.pusatInformasiList, INITIAL_PUSAT_INFORMASI_LIST),
      murotilAbsensiSantriList: stripBySample(currentCfg.murotilAbsensiSantriList, INITIAL_MUROTIL_ABSENSI_SANTRI),
      murotilSetoranList: stripBySample(currentCfg.murotilSetoranList, INITIAL_MUROTIL_SETORAN),
      murotilAbsensiPjList: stripBySample(currentCfg.murotilAbsensiPjList, INITIAL_MUROTIL_ABSENSI_PJ),
    };

    this.cache.systemConfig = updatedCfg;

    if (useSupabase) {
      await Promise.all([
        this.supabaseUpsertRow('system_config', toSystemConfigRow(updatedCfg)),
        deleteIdsInCloud(
          'jadwal_agenda',
          '',
          (INITIAL_SYSTEM_CONFIG.jadwalPerbaikanList || []).map(j => `perbaikan__${j.id}`)
        ),
        deleteIdsInCloud(
          'absensi_murotil',
          '',
          [
            ...INITIAL_MUROTIL_ABSENSI_SANTRI.map(a => `abs_s__${a.id}`),
            ...INITIAL_MUROTIL_ABSENSI_PJ.map(a => `abs_pj__${a.id}`),
          ]
        ),
      ]);
    } else if (!this.isFirestorePaused()) {
      await setDoc(doc(db, CLOUD_COLLECTIONS.SYSTEM_CONFIG, 'main'), sanitizeForFirestore(updatedCfg), { merge: true })
        .catch(err => {
          if (isFirestoreQuotaError(err)) {
            this.enterQuotaCacheMode(extractFirebaseErrorMessage(err));
            return;
          }
          handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.SYSTEM_CONFIG}/main`);
        });
    }

    this.addLog(
      'Hapus Data Sample',
      `Membersihkan ${removedSantriList.length} data santri sample, ${removedUstadzCount} data ustadz/ustadzah sample, dan ${removedLainnya} entri contoh lainnya.`,
      'admin'
    );
    this.notify();

    return {
      removedSantri: removedSantriList.length,
      removedUstadz: removedUstadzCount,
      removedLainnya,
    };
  }

  // ==========================================
  // Backup & Restore (JSON & Excel/CSV)
  // ==========================================
  public exportFullBackup(): string {
    const cfg = this.getSystemConfig();
    const ustadz = this.getUstadzList();
    const santri = this.getSantriList();
    const backup = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      databaseId: 'ai-studio-simkamtibpondokp-0ca6cfda-fbeb-4a4d-91e1-25f2c74e35be',
      projectId: 'gold-card-583d0',
      config: cfg,
      ustadzList: ustadz,
      almaliki_data_santri: santri,
      almaliki_data_ustadzah: ustadz,
      users: this.getUsers(),
      santri,
      dewanKeamanan: this.getDewanKeamananList(),
      perizinan: this.getPerizinanList(),
      tataTertib: this.getTataTertibList(),
      pelanggaran: this.getPelanggaranList(),
      sanksi: this.getSanksiList(),
      logs: this.getLogs(),
      koordinasi: this.getKoordinasiList(),
      strukturOrganisasi: this.getStrukturOrganisasi(),
      agendaPengurus: this.getAgendaPengurus(),
      evaluasiKepengurusan: this.getEvaluasiKepengurusan(),
      pengajuanDivisi: this.getPengajuanDivisi(),
      arsipSurat: this.getArsipSurat(),
      transaksiKeuangan: this.getTransaksiKeuangan(),
      barangInventaris: this.getBarangInventaris(),
      peminjamanBarang: this.getPeminjamanBarang(),
    };
    return JSON.stringify(backup, null, 2);
  }

  public exportSantriUstadzCsv(): string {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows: string[] = [];
    rows.push(['KATEGORI', 'ID', 'NIS_ATAU_NIP', 'NAMA_LENGKAP', 'GENDER', 'KELAS_ATAU_JABATAN', 'KAMAR_ATAU_BIDANG', 'NO_WA', 'STATUS', 'ALAMAT_ATAU_JADWAL'].map(esc).join(';'));

    for (const s of this.getSantriList()) {
      rows.push([
        'SANTRI',
        s.id,
        s.nis,
        s.nama,
        s.gender,
        s.kelas,
        `${s.asrama} / ${s.kamar}`,
        s.noWaWali,
        s.status,
        s.alamat,
      ].map(esc).join(';'));
    }

    for (const u of this.getUstadzList()) {
      rows.push([
        u.gender === 'ustadzah' ? 'USTADZAH' : 'USTADZ',
        u.id,
        u.nip,
        u.nama,
        u.gender,
        `${u.jabatan} (${u.divisi})`,
        u.bidangKitab,
        u.noWa,
        `${u.statusMukim || 'Mukim'} · ${u.statusAktif ? 'Aktif' : 'Nonaktif'}`,
        u.jadwalPiket,
      ].map(esc).join(';'));
    }

    return '\uFEFF' + rows.join('\r\n');
  }

  public async importFullBackup(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') return false;

      const useSupabase = isSupabaseConfigured();

      const importedSantri: Santri[] | null = Array.isArray(parsed.santri)
        ? parsed.santri
        : Array.isArray(parsed.almaliki_data_santri)
          ? parsed.almaliki_data_santri
          : null;

      if (importedSantri !== null) {
        this.cache.santri = importedSantri;
        if (useSupabase) {
          await this.replaceSupabaseTable('santri', importedSantri.map(toSantriRow));
        } else {
          await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.SANTRI, importedSantri);
        }
      }

      if (Array.isArray(parsed.dewanKeamanan)) {
        this.cache.dewan = parsed.dewanKeamanan;
        if (useSupabase) {
          await this.replaceSupabaseTable('dewan_keamanan', parsed.dewanKeamanan.map(toDewanKeamananRow));
        } else {
          await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.DEWAN_KEAMANAN, parsed.dewanKeamanan);
        }
      }
      if (Array.isArray(parsed.perizinan)) {
        this.cache.perizinan = parsed.perizinan;
        if (useSupabase) {
          await this.replaceSupabaseTable('perizinan', parsed.perizinan.map(toPerizinanRow));
        } else {
          await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.PERIZINAN, parsed.perizinan);
        }
      }
      if (Array.isArray(parsed.tataTertib)) {
        this.cache.tataTertib = parsed.tataTertib;
        if (useSupabase) {
          await this.replaceSupabaseTable('tata_tertib', parsed.tataTertib.map(toTataTertibRow));
        } else {
          await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.TATA_TERTIB, parsed.tataTertib);
        }
      }
      if (Array.isArray(parsed.pelanggaran)) {
        this.cache.pelanggaran = parsed.pelanggaran;
        if (useSupabase) {
          await this.replaceSupabaseTable('pelanggaran', parsed.pelanggaran.map(toPelanggaranRow));
        } else {
          await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.PELANGGARAN, parsed.pelanggaran);
        }
      }
      if (Array.isArray(parsed.sanksi)) {
        this.cache.sanksi = parsed.sanksi;
        if (useSupabase) {
          await this.replaceSupabaseTable('sanksi', parsed.sanksi.map(toSanksiRow));
        } else {
          await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.SANKSI, parsed.sanksi);
        }
      }
      if (Array.isArray(parsed.users)) {
        this.cache.users = parsed.users;
        if (useSupabase) {
          await this.replaceSupabaseTable('users', parsed.users.map(toUserRow));
        } else {
          await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.USERS, parsed.users);
        }
      }
      if (Array.isArray(parsed.koordinasi)) {
        this.cache.koordinasi = parsed.koordinasi;
        if (useSupabase) {
          await this.replaceSupabaseTable('koordinasi', parsed.koordinasi.map(toKoordinasiRow));
        } else {
          await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.KOORDINASI, parsed.koordinasi);
        }
      }
      if (Array.isArray(parsed.strukturOrganisasi)) {
        this.cache.strukturOrganisasi = parsed.strukturOrganisasi;
        if (useSupabase) {
          await this.replaceSupabaseTable('struktur_organisasi', parsed.strukturOrganisasi.map(toStrukturOrganisasiRow));
        } else {
          await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI, parsed.strukturOrganisasi);
        }
      }
      if (Array.isArray(parsed.agendaPengurus)) {
        this.cache.agendaPengurus = parsed.agendaPengurus;
        if (useSupabase) {
          await this.replaceSupabaseTable(
            'jadwal_agenda',
            parsed.agendaPengurus.map(toJadwalAgendaFromPengurus),
            { column: 'sumber', value: 'agenda_pengurus' }
          );
        } else {
          await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.AGENDA_PENGURUS, parsed.agendaPengurus);
        }
      }
      if (Array.isArray(parsed.evaluasiKepengurusan)) {
        this.cache.evaluasiKepengurusan = parsed.evaluasiKepengurusan;
        if (useSupabase) {
          await this.replaceSupabaseTable('evaluasi_kepengurusan', parsed.evaluasiKepengurusan.map(toEvaluasiKepengurusanRow));
        } else {
          await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN, parsed.evaluasiKepengurusan);
        }
      }
      if (Array.isArray(parsed.pengajuanDivisi)) {
        this.cache.pengajuanDivisi = parsed.pengajuanDivisi;
        if (useSupabase) {
          await this.replaceSupabaseTable('pengajuan_divisi', parsed.pengajuanDivisi.map(toPengajuanDivisiRow));
        } else {
          await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.PENGAJUAN_DIVISI, parsed.pengajuanDivisi);
        }
      }
      if (Array.isArray(parsed.arsipSurat)) {
        this.cache.arsipSurat = parsed.arsipSurat;
        if (useSupabase) {
          await this.replaceSupabaseTable('surat_menyurat', parsed.arsipSurat.map(toSuratMenyuratRow));
        } else {
          await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.SURAT_MENYURAT, parsed.arsipSurat);
        }
      }
      if (Array.isArray(parsed.transaksiKeuangan)) {
        this.cache.transaksiKeuangan = parsed.transaksiKeuangan;
        if (useSupabase) {
          await this.replaceSupabaseTable('keuangan_transaksi', parsed.transaksiKeuangan.map(toKeuanganTransaksiRow));
        } else {
          await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI, parsed.transaksiKeuangan);
        }
      }
      if (Array.isArray(parsed.barangInventaris)) {
        this.cache.barangInventaris = parsed.barangInventaris;
        if (useSupabase) {
          await this.replaceSupabaseTable('perlengkapan_inventaris', parsed.barangInventaris.map(toPerlengkapanInventarisRow));
        } else {
          await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS, parsed.barangInventaris);
        }
      }
      if (Array.isArray(parsed.peminjamanBarang)) {
        this.cache.peminjamanBarang = parsed.peminjamanBarang;
        if (useSupabase) {
          await this.replaceSupabaseTable('perlengkapan_peminjaman', parsed.peminjamanBarang.map(toPerlengkapanPeminjamanRow));
        } else {
          await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN, parsed.peminjamanBarang);
        }
      }

      const importedUstadz: DataUstadz[] | null = Array.isArray(parsed.ustadzList)
        ? parsed.ustadzList
        : Array.isArray(parsed.almaliki_data_ustadzah)
          ? parsed.almaliki_data_ustadzah
          : Array.isArray(parsed.ustadzah)
            ? parsed.ustadzah
            : Array.isArray(parsed.config?.ustadzList)
              ? parsed.config.ustadzList
              : null;

      if (parsed.config || importedUstadz !== null) {
        const nextConfig: SystemConfig = {
          ...this.cache.systemConfig,
          ...(parsed.config || {}),
          initialSeedCompleted: true,
        };
        if (importedUstadz !== null) {
          nextConfig.ustadzList = importedUstadz;
          nextConfig.dataUstadzList = importedUstadz;
        }
        this.cache.systemConfig = nextConfig;
        if (useSupabase) {
          await this.supabaseUpsertRow('system_config', toSystemConfigRow(nextConfig));
          await Promise.all([
            this.replaceSupabaseTable('ustadz', (nextConfig.ustadzList || []).map(toUstadzRow)),
            this.replaceSupabaseTable('fasilitas_gedung', (nextConfig.fasilitasGedungList || []).map(toFasilitasGedungRow)),
            this.replaceSupabaseTable(
              'jadwal_agenda',
              (nextConfig.jadwalPerbaikanList || []).map(toJadwalAgendaFromPerbaikan),
              { column: 'sumber', value: 'perbaikan_aset' }
            ),
            this.replaceSupabaseTable(
              'absensi_murotil',
              [
                ...(nextConfig.murotilAbsensiSantriList || []).map(toAbsensiSantriRow),
                ...(nextConfig.murotilAbsensiPjList || []).map(toAbsensiPjRow),
              ]
            ),
          ]);
        } else if (!this.isFirestorePaused()) {
          await setDoc(doc(db, CLOUD_COLLECTIONS.SYSTEM_CONFIG, 'main'), sanitizeForFirestore(nextConfig), { merge: true });
        }
      }

      this.addLog('Restore Database', 'Berhasil memulihkan seluruh arsip database pusat', 'admin');
      this.notify();
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
}

export const storageService = new StorageService();
