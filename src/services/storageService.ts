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
        this.resyncOnResume(true).catch(() => {});
        void this.verifyCloudConnectionAndMigrate();
      });
      window.addEventListener('offline', () => {
        this.isNavigatorOnline = false;
        this.cloudConnected = false;
        this.serverConfirmed = false;
        this.lastSyncTime = 'Perangkat Offline';
        this.notify();
      });
    }

    // 3. Hubungkan langsung 100% Real-Time Firestore Cloud Listeners (tanpa seed sample otomatis)
    this.initRealtimeCloudSync();

    // 4. Verifikasi koneksi server Firestore & jalankan migrasi cerdas localStorage -> Cloud (agar data lokal lama aman)
    void this.verifyCloudConnectionAndMigrate();
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

  private async verifyCloudConnectionAndMigrate(): Promise<void> {
    const conn = await testFirestoreConnection();
    if (!conn.ok) {
      this.cloudConnected = false;
      this.serverConfirmed = false;
      this.quotaExceeded = Boolean(conn.quotaExceeded);
      this.cloudError = conn.errorMessage || 'Gagal terhubung ke server Firebase.';
      this.lastSyncTime = conn.quotaExceeded
        ? 'Kuota Harian Firestore Penuh'
        : 'Gagal Koneksi Firebase';
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

  private trackCloudWrite(promise: Promise<void>, operationType: OperationType, path: string): void {
    promise
      .then(() => {
        if (this.cloudError && this.isNavigatorOnline) {
          this.cloudError = null;
          this.cloudConnected = true;
          this.serverConfirmed = true;
          this.notify();
        }
      })
      .catch(err => {
        handleFirestoreError(err, operationType, path);
        const msg = extractFirebaseErrorMessage(err);
        if (isFirestoreQuotaError(err)) {
          this.quotaExceeded = true;
          this.cloudConnected = false;
          this.cloudError = msg;
          this.lastSyncTime = 'Kuota Harian Firestore Penuh';
          this.notify();
        } else if (isFirestorePermissionError(err) || !this.isNavigatorOnline) {
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
        this.quotaExceeded = true;
        this.cloudConnected = false;
        this.cloudError = rawMessage;
        this.lastSyncTime = 'Kuota Harian Firestore Penuh (Mode Cache Aktif)';
        this.notify();
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

  private async uploadCollectionBatch<T extends { id: string }>(collectionName: string, items: T[]) {
    try {
      for (const item of items) {
        await setDoc(doc(db, collectionName, item.id), sanitizeForFirestore(item), { merge: true });
      }
    } catch (err) {
      console.warn(`Batch upload ${collectionName} warning:`, err);
    }
  }

  private async replaceCollectionInCloud<T extends { id: string }>(collectionName: string, items: T[]) {
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
      console.warn(`Replace collection ${collectionName} warning:`, err);
    }
  }

  public getCloudSyncStatus(): CloudSyncTelemetry {
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
    } else if (this.cloudError || this.quotaExceeded) {
      status = 'error';
    } else if (this.serverConfirmed) {
      status = 'connected';
    }

    const errorMessage = !this.isNavigatorOnline
      ? 'Perangkat sedang offline (tidak ada koneksi internet).'
      : this.cloudError || undefined;

    return {
      status,
      lastSyncTime: this.lastSyncTime,
      cloudConnected: status === 'connected',
      quotaExceeded: this.quotaExceeded,
      errorMessage,
      migrationNotification: this.migrationNotification,
      databaseId: FIRESTORE_DATABASE_ID,
      projectId: FIREBASE_PROJECT_ID,
      activeListenersCount: this.unsubscribers.length,
      totalSyncedItems: total,
    };
  }

  /**
   * Automatically wakes up Firestore network so active onSnapshot listeners sync delta changes
   * without re-reading every collection from the server (protects Firestore free daily read quota).
   */
  public async resyncOnResume(force = false): Promise<void> {
    const now = Date.now();
    if (!force && now - this.lastResumeSyncAt < 15_000) {
      return;
    }
    this.lastResumeSyncAt = now;

    if (this.unsubscribers.length === 0) {
      this.initRealtimeCloudSync();
    }

    await resyncFirestoreNetwork();
    if (force) {
      await this.verifyCloudConnectionAndMigrate();
    }
  }

  /**
   * Manual pull triggered explicitly by user settings button.
   * Falls back seamlessly to Firestore IndexedDB cache if daily free read quota is reached.
   */
  public async forcePullFromCloud(): Promise<boolean> {
    try {
      let hitQuota = false;

      const fetchCollectionFromCloud = async <T extends { id: string }>(colName: string): Promise<T[]> => {
        const colRef = collection(db, colName);
        if (hitQuota) {
          const cachedSnap = await getDocsFromCache(colRef).catch(() => null);
          return cachedSnap ? cachedSnap.docs.map(d => ({ ...d.data(), id: d.id } as T)) : [];
        }
        try {
          const snap = await getDocsFromServer(colRef);
          return snap.docs.map(d => ({ ...d.data(), id: d.id } as T));
        } catch (err) {
          if (isFirestoreQuotaError(err)) {
            hitQuota = true;
            this.quotaExceeded = true;
          }
          try {
            const cachedSnap = await getDocsFromCache(colRef);
            return cachedSnap.docs.map(d => ({ ...d.data(), id: d.id } as T));
          } catch {
            if (!hitQuota) {
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
            this.quotaExceeded = true;
          }
          try {
            const cachedSnap = await getDocFromCache(docRef);
            if (cachedSnap.exists()) {
              this.cache.systemConfig = buildCleanSystemConfig(cachedSnap.data() as Partial<SystemConfig>);
            }
          } catch {
            if (!hitQuota) {
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

      if (hitQuota) {
        this.lastSyncTime = 'Kuota Harian Firestore Penuh (Mode Cache Aktif)';
        this.notify();
        return false;
      }

      this.quotaExceeded = false;
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
      if (isFirestoreQuotaError(err)) {
        this.quotaExceeded = true;
        this.lastSyncTime = 'Kuota Harian Firestore Penuh (Mode Cache Aktif)';
        this.notify();
      }
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

    // Async sync to central Firestore database
    this.trackCloudWrite(
      setDoc(doc(db, CLOUD_COLLECTIONS.USERS, user.id), sanitizeForFirestore(user), { merge: true }),
      OperationType.WRITE,
      `${CLOUD_COLLECTIONS.USERS}/${user.id}`
    );
  }

  public deleteUser(userId: string) {
    const list = this.getUsers().filter(u => u.id !== userId);
    this.cache.users = list;
    this.addLog('Hapus Akun RBAC', `Menonaktifkan / menghapus akun ID: ${userId}`, 'admin');
    this.notify();

    // Async delete from central Firestore database
    this.trackCloudWrite(
      deleteDoc(doc(db, CLOUD_COLLECTIONS.USERS, userId)),
      OperationType.DELETE,
      `${CLOUD_COLLECTIONS.USERS}/${userId}`
    );
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

    // Partial merge write so concurrent updates across devices on different fields never overwrite each other
    this.trackCloudWrite(
      setDoc(doc(db, CLOUD_COLLECTIONS.SYSTEM_CONFIG, 'main'), sanitizeForFirestore(patchPayload), { merge: true }),
      OperationType.WRITE,
      `${CLOUD_COLLECTIONS.SYSTEM_CONFIG}/main`
    );
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

    // Realtime write to central Firestore database
    this.trackCloudWrite(
      setDoc(doc(db, CLOUD_COLLECTIONS.SANTRI, santri.id), sanitizeForFirestore(santri), { merge: true }),
      OperationType.WRITE,
      `${CLOUD_COLLECTIONS.SANTRI}/${santri.id}`
    );
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

    // Realtime delete from central Firestore database
    this.trackCloudWrite(
      deleteDoc(doc(db, CLOUD_COLLECTIONS.SANTRI, id)),
      OperationType.DELETE,
      `${CLOUD_COLLECTIONS.SANTRI}/${id}`
    );
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

      // Write to central Firestore
      this.trackCloudWrite(
        setDoc(doc(db, CLOUD_COLLECTIONS.SANTRI, santri.id), sanitizeForFirestore(santri), { merge: true }),
        OperationType.WRITE,
        `${CLOUD_COLLECTIONS.SANTRI}/${santri.id}`
      );
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

      this.trackCloudWrite(
        setDoc(doc(db, CLOUD_COLLECTIONS.SANTRI, santri.id), sanitizeForFirestore(santri), { merge: true }),
        OperationType.WRITE,
        `${CLOUD_COLLECTIONS.SANTRI}/${santri.id}`
      );
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

    // Central Firestore sync
    this.trackCloudWrite(
      setDoc(doc(db, CLOUD_COLLECTIONS.DEWAN_KEAMANAN, pengurus.id), sanitizeForFirestore(pengurus), { merge: true }),
      OperationType.WRITE,
      `${CLOUD_COLLECTIONS.DEWAN_KEAMANAN}/${pengurus.id}`
    );
  }

  public deleteDewanKeamanan(id: string) {
    const list = this.getDewanKeamananList().filter(p => p.id !== id);
    this.cache.dewan = list;
    this.notify();

    this.trackCloudWrite(
      deleteDoc(doc(db, CLOUD_COLLECTIONS.DEWAN_KEAMANAN, id)),
      OperationType.DELETE,
      `${CLOUD_COLLECTIONS.DEWAN_KEAMANAN}/${id}`
    );
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

    // Realtime write to central Firestore database
    setDoc(doc(db, CLOUD_COLLECTIONS.PERIZINAN, izin.id), sanitizeForFirestore(izin), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.PERIZINAN}/${izin.id}`));
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

    deleteDoc(doc(db, CLOUD_COLLECTIONS.PERIZINAN, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.PERIZINAN}/${id}`));
  }

  // Automated Tardiness Detection
  public checkAndDetectLatePermits(): number {
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
            setDoc(doc(db, CLOUD_COLLECTIONS.PERIZINAN, updated.id), sanitizeForFirestore(updated), { merge: true })
              .catch(() => {});
            return updated;
          }
        }
      } else if (izin.status === 'Terlambat' && !izin.actualKembali) {
        const deadlineStr = `${izin.tglKembali}T${izin.jamKembali}:00`;
        const deadline = new Date(deadlineStr);
        if (!isNaN(deadline.getTime())) {
          const diffMinutes = Math.floor((now.getTime() - deadline.getTime()) / 60000);
          if (diffMinutes > 0 && diffMinutes !== izin.menitKeterlambatan) {
            const updated = {
              ...izin,
              menitKeterlambatan: diffMinutes,
            };
            setDoc(doc(db, CLOUD_COLLECTIONS.PERIZINAN, updated.id), sanitizeForFirestore(updated), { merge: true })
              .catch(() => {});
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

    setDoc(doc(db, CLOUD_COLLECTIONS.TATA_TERTIB, tt.id), sanitizeForFirestore(tt), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.TATA_TERTIB}/${tt.id}`));
  }

  public deleteTataTertib(id: string) {
    const list = this.getTataTertibList().filter(t => t.id !== id);
    this.cache.tataTertib = list;
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.TATA_TERTIB, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.TATA_TERTIB}/${id}`));
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

    // Central Firestore sync
    setDoc(doc(db, CLOUD_COLLECTIONS.PELANGGARAN, pel.id), sanitizeForFirestore(pel), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.PELANGGARAN}/${pel.id}`));
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

    deleteDoc(doc(db, CLOUD_COLLECTIONS.PELANGGARAN, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.PELANGGARAN}/${id}`));
  }

  private updateSantriPoin(santriId: string, poinDelta: number) {
    const santriList = [...this.getSantriList()];
    const santri = santriList.find(s => s.id === santriId);
    if (santri) {
      santri.poinPelanggaran = Math.max(0, (santri.poinPelanggaran || 0) + poinDelta);
      this.cache.santri = santriList;
      setDoc(doc(db, CLOUD_COLLECTIONS.SANTRI, santri.id), sanitizeForFirestore(santri), { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.SANTRI}/${santri.id}`));
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

    // Central Firestore sync
    setDoc(doc(db, CLOUD_COLLECTIONS.SANKSI, preparedSanksi.id), sanitizeForFirestore(preparedSanksi), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.SANKSI}/${preparedSanksi.id}`));
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

    deleteDoc(doc(db, CLOUD_COLLECTIONS.SANKSI, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.SANKSI}/${id}`));
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

    // Central Firestore sync
    setDoc(doc(db, CLOUD_COLLECTIONS.LOGS, newLog.id), sanitizeForFirestore(newLog), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.LOGS}/${newLog.id}`));

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

    setDoc(doc(db, CLOUD_COLLECTIONS.NOTIFIKASI, newNotif.id), sanitizeForFirestore(newNotif), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.NOTIFIKASI}/${newNotif.id}`));
  }

  public markAllNotificationsRead() {
    const current = this.getNotifications().map(n => ({ ...n, dibaca: true }));
    this.cache.notifikasi = current;
    this.notify();

    for (const notif of current) {
      setDoc(doc(db, CLOUD_COLLECTIONS.NOTIFIKASI, notif.id), { dibaca: true }, { merge: true }).catch(() => {});
    }
  }

  public markNotificationRead(id: string) {
    const current = this.getNotifications().map(n => n.id === id ? { ...n, dibaca: true } : n);
    this.cache.notifikasi = current;
    this.notify();

    setDoc(doc(db, CLOUD_COLLECTIONS.NOTIFIKASI, id), { dibaca: true }, { merge: true }).catch(() => {});
  }

  public deleteNotification(id: string) {
    const current = this.getNotifications().filter(n => n.id !== id);
    this.cache.notifikasi = current;
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.NOTIFIKASI, id)).catch(() => {});
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

    setDoc(doc(db, CLOUD_COLLECTIONS.KOORDINASI, normalizedPesan.id), sanitizeForFirestore(normalizedPesan), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.KOORDINASI}/${normalizedPesan.id}`));
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

        setDoc(doc(db, CLOUD_COLLECTIONS.KOORDINASI, pesanId), sanitizeForFirestore(updated), { merge: true })
          .catch(() => {});
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

      setDoc(doc(db, CLOUD_COLLECTIONS.KOORDINASI, pesanId), sanitizeForFirestore(updated), { merge: true })
        .catch(() => {});
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

      setDoc(doc(db, CLOUD_COLLECTIONS.KOORDINASI, pesanId), sanitizeForFirestore(item), { merge: true })
        .catch(() => {});
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

    setDoc(doc(db, CLOUD_COLLECTIONS.KOORDINASI, pesanId), sanitizeForFirestore(updated), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.KOORDINASI}/${pesanId}`));
  }

  public deleteKoordinasi(pesanId: string) {
    const list = this.getKoordinasiList().filter(p => p.id !== pesanId);
    this.cache.koordinasi = list;
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.KOORDINASI, pesanId))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.KOORDINASI}/${pesanId}`));
  }

  public deleteAllKoordinasi() {
    const existingIds = this.getKoordinasiList().map(p => p.id);
    this.cache.koordinasi = [];
    this.addLog('Hapus Semua Pesan Masuk', `Ketua Pondok menghapus seluruh ${existingIds.length} pesan koordinasi masuk.`, 'admin');
    this.notify();

    for (const id of existingIds) {
      deleteDoc(doc(db, CLOUD_COLLECTIONS.KOORDINASI, id))
        .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.KOORDINASI}/${id}`));
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

    setDoc(doc(db, CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI, node.id), sanitizeForFirestore(node), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI}/${node.id}`));
  }

  public deleteStrukturNode(id: string) {
    const updated = this.getStrukturOrganisasi().filter(n => n.id !== id);
    this.cache.strukturOrganisasi = updated;
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI}/${id}`));
  }

  // ==========================================
  // 2. Ketua Pondok (Agenda, Evaluasi, Pengajuan Divisi)
  // ==========================================
  public getAgendaPengurus(): AgendaPengurus[] {
    return this.cache.agendaPengurus;
  }

  public checkAndDetectTodayAgendas(): number {
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
        setDoc(doc(db, CLOUD_COLLECTIONS.NOTIFIKASI, detId), sanitizeForFirestore(newNotif), { merge: true }).catch(() => {});
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
        setDoc(doc(db, CLOUD_COLLECTIONS.NOTIFIKASI, detId), sanitizeForFirestore(updatedNotif), { merge: true }).catch(() => {});
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

    setDoc(doc(db, CLOUD_COLLECTIONS.AGENDA_PENGURUS, agenda.id), sanitizeForFirestore(agenda), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.AGENDA_PENGURUS}/${agenda.id}`));

    this.checkAndDetectTodayAgendas();
  }

  public deleteAgendaPengurus(id: string) {
    const updated = this.getAgendaPengurus().filter(a => a.id !== id);
    this.cache.agendaPengurus = updated;
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.AGENDA_PENGURUS, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.AGENDA_PENGURUS}/${id}`));
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

    setDoc(doc(db, CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN, evaluasi.id), sanitizeForFirestore(evaluasi), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN}/${evaluasi.id}`));
  }

  public deleteEvaluasiKepengurusan(id: string) {
    const updated = this.getEvaluasiKepengurusan().filter(e => e.id !== id);
    this.cache.evaluasiKepengurusan = updated;
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN}/${id}`));
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

    setDoc(doc(db, CLOUD_COLLECTIONS.PENGAJUAN_DIVISI, pengajuan.id), sanitizeForFirestore(pengajuan), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.PENGAJUAN_DIVISI}/${pengajuan.id}`));
  }

  public deletePengajuanDivisi(id: string) {
    const updated = this.getPengajuanDivisi().filter(p => p.id !== id);
    this.cache.pengajuanDivisi = updated;
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.PENGAJUAN_DIVISI, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.PENGAJUAN_DIVISI}/${id}`));
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

    setDoc(doc(db, CLOUD_COLLECTIONS.SURAT_MENYURAT, surat.id), sanitizeForFirestore(surat), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.SURAT_MENYURAT}/${surat.id}`));
  }

  public deleteArsipSurat(id: string) {
    const updated = this.getArsipSurat().filter(s => s.id !== id);
    this.cache.arsipSurat = updated;
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.SURAT_MENYURAT, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.SURAT_MENYURAT}/${id}`));
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

    setDoc(doc(db, CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI, trx.id), sanitizeForFirestore(trx), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI}/${trx.id}`));
  }

  public deleteTransaksiKeuangan(id: string) {
    const updated = this.getTransaksiKeuangan().filter(t => t.id !== id);
    this.cache.transaksiKeuangan = updated;
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI}/${id}`));
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

    setDoc(doc(db, CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS, barang.id), sanitizeForFirestore(barang), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS}/${barang.id}`));
  }

  public deleteBarangInventaris(id: string) {
    const updated = this.getBarangInventaris().filter(b => b.id !== id);
    this.cache.barangInventaris = updated;
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS}/${id}`));
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

    setDoc(doc(db, CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN, pjm.id), sanitizeForFirestore(pjm), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN}/${pjm.id}`));
  }

  public deletePeminjamanBarang(id: string) {
    const updated = this.getPeminjamanBarang().filter(p => p.id !== id);
    this.cache.peminjamanBarang = updated;
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN}/${id}`));
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

    let removedLainnya = 0;
    const filterSampleCol = async <T extends { id: string }>(
      current: T[],
      sampleItems: T[],
      colName: string,
      assign: (items: T[]) => void
    ) => {
      const sampleIds = new Set(sampleItems.map(i => i.id));
      const kept = current.filter(i => !sampleIds.has(i.id));
      const removed = current.filter(i => sampleIds.has(i.id));
      removedLainnya += removed.length;
      assign(kept);
      for (const item of removed) {
        try {
          await deleteDoc(doc(db, colName, item.id));
        } catch {
          // ignore
        }
      }
    };

    for (const s of removedSantriList) {
      try {
        await deleteDoc(doc(db, CLOUD_COLLECTIONS.SANTRI, s.id));
      } catch {
        // ignore
      }
    }

    await Promise.all([
      filterSampleCol(this.cache.dewan, INITIAL_DEWAN_KEAMANAN, CLOUD_COLLECTIONS.DEWAN_KEAMANAN, l => { this.cache.dewan = l; }),
      filterSampleCol(this.cache.perizinan, INITIAL_PERIZINAN, CLOUD_COLLECTIONS.PERIZINAN, l => { this.cache.perizinan = l; }),
      filterSampleCol(this.cache.pelanggaran, INITIAL_PELANGGARAN, CLOUD_COLLECTIONS.PELANGGARAN, l => { this.cache.pelanggaran = l; }),
      filterSampleCol(this.cache.sanksi, INITIAL_SANKSI, CLOUD_COLLECTIONS.SANKSI, l => { this.cache.sanksi = l; }),
      filterSampleCol(this.cache.logs, INITIAL_LOGS, CLOUD_COLLECTIONS.LOGS, l => { this.cache.logs = l; }),
      filterSampleCol(this.cache.koordinasi, INITIAL_KOORDINASI, CLOUD_COLLECTIONS.KOORDINASI, l => { this.cache.koordinasi = l; }),
      filterSampleCol(this.cache.agendaPengurus, INITIAL_AGENDA_PENGURUS, CLOUD_COLLECTIONS.AGENDA_PENGURUS, l => { this.cache.agendaPengurus = l; }),
      filterSampleCol(this.cache.evaluasiKepengurusan, INITIAL_EVALUASI_KEPENGURUSAN, CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN, l => { this.cache.evaluasiKepengurusan = l; }),
      filterSampleCol(this.cache.pengajuanDivisi, INITIAL_PENGAJUAN_DIVISI, CLOUD_COLLECTIONS.PENGAJUAN_DIVISI, l => { this.cache.pengajuanDivisi = l; }),
      filterSampleCol(this.cache.arsipSurat, INITIAL_ARSIP_SURAT, CLOUD_COLLECTIONS.SURAT_MENYURAT, l => { this.cache.arsipSurat = l; }),
      filterSampleCol(this.cache.transaksiKeuangan, INITIAL_TRANSAKSI_KEUANGAN, CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI, l => { this.cache.transaksiKeuangan = l; }),
      filterSampleCol(this.cache.barangInventaris, INITIAL_BARANG_INVENTARIS, CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS, l => { this.cache.barangInventaris = l; }),
      filterSampleCol(this.cache.peminjamanBarang, INITIAL_PEMINJAMAN_BARANG, CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN, l => { this.cache.peminjamanBarang = l; }),
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

    await setDoc(doc(db, CLOUD_COLLECTIONS.SYSTEM_CONFIG, 'main'), sanitizeForFirestore(updatedCfg), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.SYSTEM_CONFIG}/main`));

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

      const importedSantri: Santri[] | null = Array.isArray(parsed.santri)
        ? parsed.santri
        : Array.isArray(parsed.almaliki_data_santri)
          ? parsed.almaliki_data_santri
          : null;

      if (importedSantri !== null) {
        this.cache.santri = importedSantri;
        await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.SANTRI, importedSantri);
      }

      if (Array.isArray(parsed.dewanKeamanan)) {
        this.cache.dewan = parsed.dewanKeamanan;
        await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.DEWAN_KEAMANAN, parsed.dewanKeamanan);
      }
      if (Array.isArray(parsed.perizinan)) {
        this.cache.perizinan = parsed.perizinan;
        await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.PERIZINAN, parsed.perizinan);
      }
      if (Array.isArray(parsed.tataTertib)) {
        this.cache.tataTertib = parsed.tataTertib;
        await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.TATA_TERTIB, parsed.tataTertib);
      }
      if (Array.isArray(parsed.pelanggaran)) {
        this.cache.pelanggaran = parsed.pelanggaran;
        await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.PELANGGARAN, parsed.pelanggaran);
      }
      if (Array.isArray(parsed.sanksi)) {
        this.cache.sanksi = parsed.sanksi;
        await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.SANKSI, parsed.sanksi);
      }
      if (Array.isArray(parsed.users)) {
        this.cache.users = parsed.users;
        await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.USERS, parsed.users);
      }
      if (Array.isArray(parsed.koordinasi)) {
        this.cache.koordinasi = parsed.koordinasi;
        await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.KOORDINASI, parsed.koordinasi);
      }
      if (Array.isArray(parsed.strukturOrganisasi)) {
        this.cache.strukturOrganisasi = parsed.strukturOrganisasi;
        await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI, parsed.strukturOrganisasi);
      }
      if (Array.isArray(parsed.agendaPengurus)) {
        this.cache.agendaPengurus = parsed.agendaPengurus;
        await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.AGENDA_PENGURUS, parsed.agendaPengurus);
      }
      if (Array.isArray(parsed.evaluasiKepengurusan)) {
        this.cache.evaluasiKepengurusan = parsed.evaluasiKepengurusan;
        await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN, parsed.evaluasiKepengurusan);
      }
      if (Array.isArray(parsed.pengajuanDivisi)) {
        this.cache.pengajuanDivisi = parsed.pengajuanDivisi;
        await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.PENGAJUAN_DIVISI, parsed.pengajuanDivisi);
      }
      if (Array.isArray(parsed.arsipSurat)) {
        this.cache.arsipSurat = parsed.arsipSurat;
        await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.SURAT_MENYURAT, parsed.arsipSurat);
      }
      if (Array.isArray(parsed.transaksiKeuangan)) {
        this.cache.transaksiKeuangan = parsed.transaksiKeuangan;
        await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI, parsed.transaksiKeuangan);
      }
      if (Array.isArray(parsed.barangInventaris)) {
        this.cache.barangInventaris = parsed.barangInventaris;
        await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS, parsed.barangInventaris);
      }
      if (Array.isArray(parsed.peminjamanBarang)) {
        this.cache.peminjamanBarang = parsed.peminjamanBarang;
        await this.replaceCollectionInCloud(CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN, parsed.peminjamanBarang);
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
        await setDoc(doc(db, CLOUD_COLLECTIONS.SYSTEM_CONFIG, 'main'), sanitizeForFirestore(nextConfig), { merge: true });
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
