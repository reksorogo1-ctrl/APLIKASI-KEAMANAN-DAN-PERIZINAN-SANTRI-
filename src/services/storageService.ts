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
  PeminjamanBarang
} from '../types';
import { 
  INITIAL_SANTRI, 
  INITIAL_DEWAN_KEAMANAN, 
  INITIAL_PERIZINAN, 
  INITIAL_TATA_TERTIB, 
  INITIAL_PELANGGARAN, 
  INITIAL_SANKSI, 
  INITIAL_USERS, 
  INITIAL_SYSTEM_CONFIG, 
  INITIAL_LOGS, 
  INITIAL_KOORDINASI,
  INITIAL_STRUKTUR_ORGANISASI,
  INITIAL_AGENDA_PENGURUS,
  INITIAL_EVALUASI_KEPENGURUSAN,
  INITIAL_PENGAJUAN_DIVISI,
  INITIAL_ARSIP_SURAT,
  INITIAL_TRANSAKSI_KEUANGAN,
  INITIAL_BARANG_INVENTARIS,
  INITIAL_PEMINJAMAN_BARANG,
  INITIAL_BENDAHARA_CONFIG,
  INITIAL_FASILITAS_GEDUNG_LIST,
  INITIAL_PERLENGKAPAN_CONFIG,
  INITIAL_PUSAT_INFORMASI_LIST,
  INITIAL_MUROTIL_TINGKATAN,
  INITIAL_MUROTIL_KELOMPOK,
  INITIAL_MUROTIL_ABSENSI_SANTRI,
  INITIAL_MUROTIL_SETORAN,
  INITIAL_MUROTIL_ABSENSI_PJ,
  INITIAL_MUROTIL_CONFIG
} from '../data/seedData';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  applyPengaturanSuratToConfig,
  readPengaturanSuratFromStorage,
  savePengaturanSuratToStorage,
} from '../utils/pengaturanSurat';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs,
  Unsubscribe 
} from 'firebase/firestore';

const STORAGE_KEYS = {
  SANTRI: 'sim_kamtib_santri_v2',
  DEWAN_KEAMANAN: 'sim_kamtib_dewan_keamanan_v2',
  PERIZINAN: 'sim_kamtib_perizinan_v2',
  TATA_TERTIB: 'sim_kamtib_tata_tertib_v2',
  PELANGGARAN: 'sim_kamtib_pelanggaran_v2',
  SANKSI: 'sim_kamtib_sanksi_v2',
  USERS: 'sim_kamtib_rbac_users_v2',
  CURRENT_USER: 'sim_kamtib_active_session_v2',
  SYSTEM_CONFIG: 'sim_kamtib_system_config_v2',
  LOGS: 'sim_kamtib_logs_v2',
  NOTIFIKASI: 'sim_kamtib_notifikasi_v2',
  THEME: 'sim_kamtib_theme_v2',
  GENDER_SCOPE: 'sim_kamtib_gender_scope_v2',
  KOORDINASI: 'sim_kamtib_koordinasi_v2',
  STRUKTUR_ORGANISASI: 'sim_maliki_struktur_v1',
  AGENDA_PENGURUS: 'sim_maliki_agenda_v1',
  EVALUASI_KEPENGURUSAN: 'sim_maliki_evaluasi_v1',
  PENGAJUAN_DIVISI: 'sim_maliki_pengajuan_v1',
  SURAT_MENYURAT: 'sim_maliki_surat_v1',
  KEUANGAN_TRANSAKSI: 'sim_maliki_keuangan_v1',
  PERLENGKAPAN_INVENTARIS: 'sim_maliki_inventaris_v1',
  PERLENGKAPAN_PEMINJAMAN: 'sim_maliki_peminjaman_v1',
};

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
  databaseId: string;
  projectId: string;
  activeListenersCount: number;
  totalSyncedItems: number;
}

class StorageService {
  private listeners: (() => void)[] = [];
  private unsubscribers: Unsubscribe[] = [];
  private cloudConnected: boolean = false;
  private lastSyncTime: string = 'Inisialisasi...';
  private syncError: string | null = null;
  private cloudSawDocs: Record<string, boolean> = {};

  // Cached in-memory state for instant UI access & offline speed
  private cache = {
    santri: [] as Santri[],
    dewan: [] as DewanKeamanan[],
    perizinan: [] as Perizinan[],
    tataTertib: [] as TataTertib[],
    pelanggaran: [] as Pelanggaran[],
    sanksi: [] as Sanksi[],
    users: [] as UserAccount[],
    systemConfig: INITIAL_SYSTEM_CONFIG as SystemConfig,
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
    // Keamanan Autentikasi: Sesi baru diawali dari Layar Login
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch {
      // ignore
    }

    // 1. Populate initial memory cache from localStorage or seed fallback
    this.loadFromLocalStorage();

    // 2. Initialize Real-Time Bi-Directional Firestore Cloud Synchronization
    this.initRealtimeCloudSync();
  }

  private loadFromLocalStorage() {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.SANTRI);
      this.cache.santri = s ? JSON.parse(s) : INITIAL_SANTRI;

      const d = localStorage.getItem(STORAGE_KEYS.DEWAN_KEAMANAN);
      this.cache.dewan = d ? JSON.parse(d) : INITIAL_DEWAN_KEAMANAN;

      const p = localStorage.getItem(STORAGE_KEYS.PERIZINAN);
      this.cache.perizinan = p ? JSON.parse(p) : INITIAL_PERIZINAN;

      const tt = localStorage.getItem(STORAGE_KEYS.TATA_TERTIB);
      this.cache.tataTertib = tt ? JSON.parse(tt) : INITIAL_TATA_TERTIB;

      const pel = localStorage.getItem(STORAGE_KEYS.PELANGGARAN);
      this.cache.pelanggaran = pel ? JSON.parse(pel) : INITIAL_PELANGGARAN;

      const snk = localStorage.getItem(STORAGE_KEYS.SANKSI);
      this.cache.sanksi = snk ? JSON.parse(snk) : INITIAL_SANKSI;

      const u = localStorage.getItem(STORAGE_KEYS.USERS);
      const parsedUsers: UserAccount[] = u ? JSON.parse(u) : INITIAL_USERS;
      // Ensure newly added management role defaults and default 6-digit PIN codes exist
      const mergedUsers: UserAccount[] = parsedUsers.map(existing => {
        const def = INITIAL_USERS.find(d => d.id === existing.id || d.username === existing.username);
        return {
          ...existing,
          pin: existing.pin || def?.pin || '123456',
          alamat: existing.alamat || def?.alamat || 'Pondok Pesantren Salaf Al-Maliki, Karawang',
          murotilKelompokIds: Array.isArray(existing.murotilKelompokIds)
            ? existing.murotilKelompokIds
            : def?.murotilKelompokIds,
        };
      });
      INITIAL_USERS.forEach(defUser => {
        if (!mergedUsers.some(mu => mu.id === defUser.id)) {
          mergedUsers.push(defUser);
        }
      });
      this.cache.users = mergedUsers;

      const cfg = localStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIG);
      const parsedCfg = cfg ? JSON.parse(cfg) : {};
      const mergedBerita = (parsedCfg.beritaTerkini?.length ? parsedCfg.beritaTerkini : INITIAL_SYSTEM_CONFIG.beritaTerkini || []).map((b: any, idx: number) => {
        const seedItem = INITIAL_SYSTEM_CONFIG.beritaTerkini?.find(s => s.id === b.id) || INITIAL_SYSTEM_CONFIG.beritaTerkini?.[idx % (INITIAL_SYSTEM_CONFIG.beritaTerkini?.length || 1)];
        return {
          ...b,
          gambarUrl: b.gambarUrl || seedItem?.gambarUrl || 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?auto=format&fit=crop&w=900&q=80',
        };
      });
      this.cache.systemConfig = {
        ...INITIAL_SYSTEM_CONFIG,
        ...parsedCfg,
        beritaTerkini: mergedBerita,
        ustadzList: parsedCfg.ustadzList?.length ? parsedCfg.ustadzList : INITIAL_SYSTEM_CONFIG.ustadzList,
        programKerjaList: parsedCfg.programKerjaList?.length ? parsedCfg.programKerjaList : INITIAL_SYSTEM_CONFIG.programKerjaList,
        izinPengurusList: parsedCfg.izinPengurusList?.length ? parsedCfg.izinPengurusList : INITIAL_SYSTEM_CONFIG.izinPengurusList,
        notulenRapatList: parsedCfg.notulenRapatList?.length ? parsedCfg.notulenRapatList : INITIAL_SYSTEM_CONFIG.notulenRapatList,
        syahriyahList: parsedCfg.syahriyahList?.length ? parsedCfg.syahriyahList : INITIAL_SYSTEM_CONFIG.syahriyahList,
        uangSakuList: parsedCfg.uangSakuList?.length ? parsedCfg.uangSakuList : INITIAL_SYSTEM_CONFIG.uangSakuList,
        anggaranList: parsedCfg.anggaranList?.length ? parsedCfg.anggaranList : INITIAL_SYSTEM_CONFIG.anggaranList,
        bendaharaConfig: {
          ...INITIAL_BENDAHARA_CONFIG,
          ...(parsedCfg.bendaharaConfig || {}),
          kategoriPemasukan: parsedCfg.bendaharaConfig?.kategoriPemasukan?.length
            ? parsedCfg.bendaharaConfig.kategoriPemasukan
            : INITIAL_BENDAHARA_CONFIG.kategoriPemasukan,
          kategoriPengeluaran: parsedCfg.bendaharaConfig?.kategoriPengeluaran?.length
            ? parsedCfg.bendaharaConfig.kategoriPengeluaran
            : INITIAL_BENDAHARA_CONFIG.kategoriPengeluaran,
        },
        mutasiBarangList: parsedCfg.mutasiBarangList?.length ? parsedCfg.mutasiBarangList : INITIAL_SYSTEM_CONFIG.mutasiBarangList,
        jadwalPerbaikanList: parsedCfg.jadwalPerbaikanList?.length ? parsedCfg.jadwalPerbaikanList : INITIAL_SYSTEM_CONFIG.jadwalPerbaikanList,
        kamarSantriList: parsedCfg.kamarSantriList?.length ? parsedCfg.kamarSantriList : INITIAL_SYSTEM_CONFIG.kamarSantriList,
        fasilitasGedungList: Array.isArray(parsedCfg.fasilitasGedungList)
          ? parsedCfg.fasilitasGedungList
          : INITIAL_FASILITAS_GEDUNG_LIST,
        perlengkapanConfig: {
          ...INITIAL_PERLENGKAPAN_CONFIG,
          ...(parsedCfg.perlengkapanConfig || {}),
        },
        pusatInformasiList: Array.isArray(parsedCfg.pusatInformasiList)
          ? parsedCfg.pusatInformasiList
          : INITIAL_PUSAT_INFORMASI_LIST,
        murotilTingkatanList: Array.isArray(parsedCfg.murotilTingkatanList)
          ? parsedCfg.murotilTingkatanList
          : INITIAL_MUROTIL_TINGKATAN,
        murotilKelompokList: Array.isArray(parsedCfg.murotilKelompokList)
          ? parsedCfg.murotilKelompokList
          : INITIAL_MUROTIL_KELOMPOK,
        murotilAbsensiSantriList: Array.isArray(parsedCfg.murotilAbsensiSantriList)
          ? parsedCfg.murotilAbsensiSantriList
          : INITIAL_MUROTIL_ABSENSI_SANTRI,
        murotilSetoranList: Array.isArray(parsedCfg.murotilSetoranList)
          ? parsedCfg.murotilSetoranList
          : INITIAL_MUROTIL_SETORAN,
        murotilAbsensiPjList: Array.isArray(parsedCfg.murotilAbsensiPjList)
          ? parsedCfg.murotilAbsensiPjList
          : INITIAL_MUROTIL_ABSENSI_PJ,
        murotilConfig: {
          ...INITIAL_MUROTIL_CONFIG,
          ...(parsedCfg.murotilConfig || {}),
          sesiList: parsedCfg.murotilConfig?.sesiList?.length
            ? parsedCfg.murotilConfig.sesiList
            : INITIAL_MUROTIL_CONFIG.sesiList,
        },
        suratSekretarisConfig: applyPengaturanSuratToConfig({
          ...INITIAL_SYSTEM_CONFIG.suratSekretarisConfig!,
          ...(parsedCfg.suratSekretarisConfig || {}),
          kopLogoUrl:
            parsedCfg.suratSekretarisConfig?.kopLogoUrl &&
            !parsedCfg.suratSekretarisConfig.kopLogoUrl.includes('2026-11-11-7ffd46ad')
              ? parsedCfg.suratSekretarisConfig.kopLogoUrl
              : 'https://cdn.phototourl.com/member/2026-11-14-49a0f8f3-f2e5-443e-8c1e-36ccad7a6009.png',
          kopLogoKananUrl:
            parsedCfg.suratSekretarisConfig?.kopLogoKananUrl &&
            parsedCfg.suratSekretarisConfig.kopLogoKananUrl.trim() !== '' &&
            !parsedCfg.suratSekretarisConfig.kopLogoKananUrl.includes('2026-11-11-7ffd46ad')
              ? parsedCfg.suratSekretarisConfig.kopLogoKananUrl
              : 'https://cdn.phototourl.com/member/2026-11-14-6e57abdd-4666-430d-911c-7e8281c86140.jpg',
          ttdUrl1:
            parsedCfg.suratSekretarisConfig?.ttdUrl1 ??
            INITIAL_SYSTEM_CONFIG.suratSekretarisConfig?.ttdUrl1 ??
            '',
          ttdUrl2:
            parsedCfg.suratSekretarisConfig?.ttdUrl2 ??
            INITIAL_SYSTEM_CONFIG.suratSekretarisConfig?.ttdUrl2 ??
            '',
          templates: {
            ...INITIAL_SYSTEM_CONFIG.suratSekretarisConfig!.templates,
            ...(parsedCfg.suratSekretarisConfig?.templates || {}),
          }
        })
      };

      const l = localStorage.getItem(STORAGE_KEYS.LOGS);
      this.cache.logs = l ? JSON.parse(l) : INITIAL_LOGS;

      const n = localStorage.getItem(STORAGE_KEYS.NOTIFIKASI);
      this.cache.notifikasi = n ? JSON.parse(n) : [];

      const k = localStorage.getItem(STORAGE_KEYS.KOORDINASI);
      this.cache.koordinasi = k !== null ? JSON.parse(k) : INITIAL_KOORDINASI;

      const org = localStorage.getItem(STORAGE_KEYS.STRUKTUR_ORGANISASI);
      this.cache.strukturOrganisasi = org ? JSON.parse(org) : INITIAL_STRUKTUR_ORGANISASI;

      const agd = localStorage.getItem(STORAGE_KEYS.AGENDA_PENGURUS);
      this.cache.agendaPengurus = agd ? JSON.parse(agd) : INITIAL_AGENDA_PENGURUS;

      const evl = localStorage.getItem(STORAGE_KEYS.EVALUASI_KEPENGURUSAN);
      this.cache.evaluasiKepengurusan = evl ? JSON.parse(evl) : INITIAL_EVALUASI_KEPENGURUSAN;

      const pgj = localStorage.getItem(STORAGE_KEYS.PENGAJUAN_DIVISI);
      this.cache.pengajuanDivisi = pgj !== null ? JSON.parse(pgj) : INITIAL_PENGAJUAN_DIVISI;

      const srt = localStorage.getItem(STORAGE_KEYS.SURAT_MENYURAT);
      this.cache.arsipSurat = srt !== null ? JSON.parse(srt) : INITIAL_ARSIP_SURAT;

      const trx = localStorage.getItem(STORAGE_KEYS.KEUANGAN_TRANSAKSI);
      this.cache.transaksiKeuangan = trx ? JSON.parse(trx) : INITIAL_TRANSAKSI_KEUANGAN;

      const inv = localStorage.getItem(STORAGE_KEYS.PERLENGKAPAN_INVENTARIS);
      this.cache.barangInventaris = inv ? JSON.parse(inv) : INITIAL_BARANG_INVENTARIS;

      const pjm = localStorage.getItem(STORAGE_KEYS.PERLENGKAPAN_PEMINJAMAN);
      this.cache.peminjamanBarang = pjm ? JSON.parse(pjm) : INITIAL_PEMINJAMAN_BARANG;

      // Enforce official website logo & separate Keamanan logo while preserving custom DataURL/HTTP logos
      const OFFICIAL_LOGO = 'https://cdn.phototourl.com/member/2026-11-14-03361e24-6ae4-4db0-bdad-b98af1797f52.png';
      const OFFICIAL_KEAMANAN_LOGO = 'https://cdn.phototourl.com/member/2026-11-11-7ffd46ad-6406-4c9c-8043-01c37a880156.png';
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

      if (!isValidWebsiteLogo(this.cache.systemConfig.logoUrl)) {
        this.cache.systemConfig.logoUrl = OFFICIAL_LOGO;
      }
      if (!isValidKeamananLogo(this.cache.systemConfig.logoDashboardKeamananUrl)) {
        this.cache.systemConfig.logoDashboardKeamananUrl = OFFICIAL_KEAMANAN_LOGO;
      }
      if (!isValidKeamananLogo(this.cache.systemConfig.logoSuratPerizinanUrl)) {
        this.cache.systemConfig.logoSuratPerizinanUrl = OFFICIAL_KEAMANAN_LOGO;
      }
      if (
        !this.cache.systemConfig.appIconUrl ||
        this.cache.systemConfig.appIconUrl === '/icon.svg' ||
        this.cache.systemConfig.appIconUrl.includes('2026-11-11-7ffd46ad')
      ) {
        this.cache.systemConfig.appIconUrl = OFFICIAL_LOGO;
      }

      this.cache.santri = this.cache.santri.map(s => ({
        ...s,
        foto: s.foto && s.foto.includes('unsplash.com') ? '' : (s.foto || ''),
      }));
      this.cache.dewan = this.cache.dewan.map(d => ({
        ...d,
        foto: d.foto && d.foto.includes('unsplash.com') ? '' : (d.foto || ''),
      }));
      this.cache.users = this.cache.users.map(u => ({
        ...u,
        avatar: u.avatar && u.avatar.includes('unsplash.com') ? '' : (u.avatar || ''),
      }));
    } catch (err) {
      console.warn('LocalStorage load warning:', err);
    }
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
   * Initializes live Firestore onSnapshot listeners for all 11 application collections.
   * Any change made on any device (Laptop, Mobile browser, HP PWA, or AI Studio)
   * is instantly broadcasted by Firestore and received in real time by all other devices.
   */
  public initRealtimeCloudSync() {
    // Clean up any existing listeners
    this.unsubscribers.forEach(unsub => {
      try { unsub(); } catch { /* ignore */ }
    });
    this.unsubscribers = [];

    const handleSyncUpdate = () => {
      this.cloudConnected = true;
      this.syncError = null;
      this.lastSyncTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
      this.notify();
    };

    // 1. Santri Collection Realtime Listener
    try {
      const unsubSantri = onSnapshot(
        collection(db, CLOUD_COLLECTIONS.SANTRI),
        snapshot => {
          if (!snapshot.empty) {
            const list: Santri[] = [];
            snapshot.forEach(docSnap => {
              list.push({ ...docSnap.data(), id: docSnap.id } as Santri);
            });
            this.cache.santri = list;
            localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(list));
            handleSyncUpdate();
          } else if (this.cache.santri.length > 0) {
            // Seed cloud if empty
            this.uploadCollectionBatch(CLOUD_COLLECTIONS.SANTRI, this.cache.santri);
          }
        },
        error => handleFirestoreError(error, OperationType.GET, CLOUD_COLLECTIONS.SANTRI)
      );
      this.unsubscribers.push(unsubSantri);
    } catch (e) {
      console.warn('Sync santri listener warning:', e);
    }

    // 2. Dewan Keamanan Collection Realtime Listener
    try {
      const unsubDewan = onSnapshot(
        collection(db, CLOUD_COLLECTIONS.DEWAN_KEAMANAN),
        snapshot => {
          if (!snapshot.empty) {
            const list: DewanKeamanan[] = [];
            snapshot.forEach(docSnap => {
              list.push({ ...docSnap.data(), id: docSnap.id } as DewanKeamanan);
            });
            this.cache.dewan = list;
            localStorage.setItem(STORAGE_KEYS.DEWAN_KEAMANAN, JSON.stringify(list));
            handleSyncUpdate();
          } else if (this.cache.dewan.length > 0) {
            this.uploadCollectionBatch(CLOUD_COLLECTIONS.DEWAN_KEAMANAN, this.cache.dewan);
          }
        },
        error => handleFirestoreError(error, OperationType.GET, CLOUD_COLLECTIONS.DEWAN_KEAMANAN)
      );
      this.unsubscribers.push(unsubDewan);
    } catch (e) {
      console.warn('Sync dewan listener warning:', e);
    }

    // 3. Perizinan Collection Realtime Listener
    try {
      const unsubPerizinan = onSnapshot(
        collection(db, CLOUD_COLLECTIONS.PERIZINAN),
        snapshot => {
          if (!snapshot.empty) {
            const list: Perizinan[] = [];
            snapshot.forEach(docSnap => {
              list.push({ ...docSnap.data(), id: docSnap.id } as Perizinan);
            });
            // Sort by tglPengajuan desc or id
            this.cache.perizinan = list.sort((a, b) => (b.id > a.id ? 1 : -1));
            localStorage.setItem(STORAGE_KEYS.PERIZINAN, JSON.stringify(this.cache.perizinan));
            handleSyncUpdate();
          } else if (this.cache.perizinan.length > 0) {
            this.uploadCollectionBatch(CLOUD_COLLECTIONS.PERIZINAN, this.cache.perizinan);
          }
        },
        error => handleFirestoreError(error, OperationType.GET, CLOUD_COLLECTIONS.PERIZINAN)
      );
      this.unsubscribers.push(unsubPerizinan);
    } catch (e) {
      console.warn('Sync perizinan listener warning:', e);
    }

    // 4. Pelanggaran Collection Realtime Listener
    try {
      const unsubPelanggaran = onSnapshot(
        collection(db, CLOUD_COLLECTIONS.PELANGGARAN),
        snapshot => {
          if (!snapshot.empty) {
            const list: Pelanggaran[] = [];
            snapshot.forEach(docSnap => {
              list.push({ ...docSnap.data(), id: docSnap.id } as Pelanggaran);
            });
            this.cache.pelanggaran = list.sort((a, b) => (b.id > a.id ? 1 : -1));
            localStorage.setItem(STORAGE_KEYS.PELANGGARAN, JSON.stringify(this.cache.pelanggaran));
            handleSyncUpdate();
          } else if (this.cache.pelanggaran.length > 0) {
            this.uploadCollectionBatch(CLOUD_COLLECTIONS.PELANGGARAN, this.cache.pelanggaran);
          }
        },
        error => handleFirestoreError(error, OperationType.GET, CLOUD_COLLECTIONS.PELANGGARAN)
      );
      this.unsubscribers.push(unsubPelanggaran);
    } catch (e) {
      console.warn('Sync pelanggaran listener warning:', e);
    }

    // 5. Sanksi Collection Realtime Listener
    try {
      const unsubSanksi = onSnapshot(
        collection(db, CLOUD_COLLECTIONS.SANKSI),
        snapshot => {
          if (!snapshot.empty) {
            const list: Sanksi[] = [];
            snapshot.forEach(docSnap => {
              list.push({ ...docSnap.data(), id: docSnap.id } as Sanksi);
            });
            this.cache.sanksi = list.sort((a, b) => (b.id > a.id ? 1 : -1));
            localStorage.setItem(STORAGE_KEYS.SANKSI, JSON.stringify(this.cache.sanksi));
            handleSyncUpdate();
          } else if (this.cache.sanksi.length > 0) {
            this.uploadCollectionBatch(CLOUD_COLLECTIONS.SANKSI, this.cache.sanksi);
          }
        },
        error => handleFirestoreError(error, OperationType.GET, CLOUD_COLLECTIONS.SANKSI)
      );
      this.unsubscribers.push(unsubSanksi);
    } catch (e) {
      console.warn('Sync sanksi listener warning:', e);
    }

    // 6. Tata Tertib Collection Realtime Listener
    try {
      const unsubTataTertib = onSnapshot(
        collection(db, CLOUD_COLLECTIONS.TATA_TERTIB),
        snapshot => {
          if (!snapshot.empty) {
            const list: TataTertib[] = [];
            snapshot.forEach(docSnap => {
              list.push({ ...docSnap.data(), id: docSnap.id } as TataTertib);
            });
            this.cache.tataTertib = list;
            localStorage.setItem(STORAGE_KEYS.TATA_TERTIB, JSON.stringify(list));
            handleSyncUpdate();
          } else if (this.cache.tataTertib.length > 0) {
            this.uploadCollectionBatch(CLOUD_COLLECTIONS.TATA_TERTIB, this.cache.tataTertib);
          }
        },
        error => handleFirestoreError(error, OperationType.GET, CLOUD_COLLECTIONS.TATA_TERTIB)
      );
      this.unsubscribers.push(unsubTataTertib);
    } catch (e) {
      console.warn('Sync tata tertib listener warning:', e);
    }

    // 7. Users Collection Realtime Listener
    try {
      const unsubUsers = onSnapshot(
        collection(db, CLOUD_COLLECTIONS.USERS),
        snapshot => {
          if (!snapshot.empty) {
            const list: UserAccount[] = [];
            snapshot.forEach(docSnap => {
              list.push({ ...docSnap.data(), id: docSnap.id } as UserAccount);
            });
            this.cache.users = list;
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
            handleSyncUpdate();
          } else if (this.cache.users.length > 0) {
            this.uploadCollectionBatch(CLOUD_COLLECTIONS.USERS, this.cache.users);
          }
        },
        error => handleFirestoreError(error, OperationType.GET, CLOUD_COLLECTIONS.USERS)
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
            const cloudData = docSnap.data() as Partial<SystemConfig>;
            const mergedCloudBerita = (cloudData.beritaTerkini?.length ? cloudData.beritaTerkini : INITIAL_SYSTEM_CONFIG.beritaTerkini || []).map((b: any, idx: number) => {
              const seedItem = INITIAL_SYSTEM_CONFIG.beritaTerkini?.find(s => s.id === b.id) || INITIAL_SYSTEM_CONFIG.beritaTerkini?.[idx % (INITIAL_SYSTEM_CONFIG.beritaTerkini?.length || 1)];
              return {
                ...b,
                gambarUrl: b.gambarUrl || seedItem?.gambarUrl || 'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?auto=format&fit=crop&w=900&q=80',
              };
            });
            const OFFICIAL_LOGO = 'https://cdn.phototourl.com/member/2026-11-14-03361e24-6ae4-4db0-bdad-b98af1797f52.png';
            const OFFICIAL_KEAMANAN_LOGO = 'https://cdn.phototourl.com/member/2026-11-11-7ffd46ad-6406-4c9c-8043-01c37a880156.png';
            const cfg: SystemConfig = {
              ...INITIAL_SYSTEM_CONFIG,
              ...cloudData,
              logoUrl:
                cloudData.logoUrl &&
                !cloudData.logoUrl.includes('2026-11-11-7ffd46ad') &&
                !cloudData.logoUrl.includes('logo_pesantren_almaliki')
                  ? cloudData.logoUrl
                  : OFFICIAL_LOGO,
              logoDashboardKeamananUrl:
                cloudData.logoDashboardKeamananUrl &&
                !cloudData.logoDashboardKeamananUrl.includes('2026-11-14-03361e24') &&
                !cloudData.logoDashboardKeamananUrl.includes('logo_pesantren_almaliki')
                  ? cloudData.logoDashboardKeamananUrl
                  : OFFICIAL_KEAMANAN_LOGO,
              logoSuratPerizinanUrl:
                cloudData.logoSuratPerizinanUrl &&
                !cloudData.logoSuratPerizinanUrl.includes('2026-11-14-03361e24') &&
                !cloudData.logoSuratPerizinanUrl.includes('logo_pesantren_almaliki')
                  ? cloudData.logoSuratPerizinanUrl
                  : OFFICIAL_KEAMANAN_LOGO,
              appIconUrl:
                cloudData.appIconUrl && !cloudData.appIconUrl.includes('2026-11-11-7ffd46ad')
                  ? cloudData.appIconUrl
                  : OFFICIAL_LOGO,
              beritaTerkini: mergedCloudBerita,
              ustadzList: cloudData.ustadzList?.length ? cloudData.ustadzList : INITIAL_SYSTEM_CONFIG.ustadzList,
              programKerjaList: cloudData.programKerjaList?.length ? cloudData.programKerjaList : INITIAL_SYSTEM_CONFIG.programKerjaList,
              izinPengurusList: cloudData.izinPengurusList?.length ? cloudData.izinPengurusList : INITIAL_SYSTEM_CONFIG.izinPengurusList,
              notulenRapatList: cloudData.notulenRapatList?.length ? cloudData.notulenRapatList : INITIAL_SYSTEM_CONFIG.notulenRapatList,
              syahriyahList: cloudData.syahriyahList?.length ? cloudData.syahriyahList : INITIAL_SYSTEM_CONFIG.syahriyahList,
              uangSakuList: cloudData.uangSakuList?.length ? cloudData.uangSakuList : INITIAL_SYSTEM_CONFIG.uangSakuList,
              anggaranList: cloudData.anggaranList?.length ? cloudData.anggaranList : INITIAL_SYSTEM_CONFIG.anggaranList,
              bendaharaConfig: {
                ...INITIAL_BENDAHARA_CONFIG,
                ...(cloudData.bendaharaConfig || {}),
                kategoriPemasukan: cloudData.bendaharaConfig?.kategoriPemasukan?.length
                  ? cloudData.bendaharaConfig.kategoriPemasukan
                  : INITIAL_BENDAHARA_CONFIG.kategoriPemasukan,
                kategoriPengeluaran: cloudData.bendaharaConfig?.kategoriPengeluaran?.length
                  ? cloudData.bendaharaConfig.kategoriPengeluaran
                  : INITIAL_BENDAHARA_CONFIG.kategoriPengeluaran,
              },
              mutasiBarangList: cloudData.mutasiBarangList?.length ? cloudData.mutasiBarangList : INITIAL_SYSTEM_CONFIG.mutasiBarangList,
              jadwalPerbaikanList: cloudData.jadwalPerbaikanList?.length ? cloudData.jadwalPerbaikanList : INITIAL_SYSTEM_CONFIG.jadwalPerbaikanList,
              kamarSantriList: cloudData.kamarSantriList?.length ? cloudData.kamarSantriList : INITIAL_SYSTEM_CONFIG.kamarSantriList,
              fasilitasGedungList: Array.isArray(cloudData.fasilitasGedungList)
                ? cloudData.fasilitasGedungList
                : INITIAL_FASILITAS_GEDUNG_LIST,
              perlengkapanConfig: {
                ...INITIAL_PERLENGKAPAN_CONFIG,
                ...(cloudData.perlengkapanConfig || {}),
              },
              pusatInformasiList: Array.isArray(cloudData.pusatInformasiList)
                ? cloudData.pusatInformasiList
                : INITIAL_PUSAT_INFORMASI_LIST,
              murotilTingkatanList: Array.isArray(cloudData.murotilTingkatanList)
                ? cloudData.murotilTingkatanList
                : INITIAL_MUROTIL_TINGKATAN,
              murotilKelompokList: Array.isArray(cloudData.murotilKelompokList)
                ? cloudData.murotilKelompokList
                : INITIAL_MUROTIL_KELOMPOK,
              murotilAbsensiSantriList: Array.isArray(cloudData.murotilAbsensiSantriList)
                ? cloudData.murotilAbsensiSantriList
                : INITIAL_MUROTIL_ABSENSI_SANTRI,
              murotilSetoranList: Array.isArray(cloudData.murotilSetoranList)
                ? cloudData.murotilSetoranList
                : INITIAL_MUROTIL_SETORAN,
              murotilAbsensiPjList: Array.isArray(cloudData.murotilAbsensiPjList)
                ? cloudData.murotilAbsensiPjList
                : INITIAL_MUROTIL_ABSENSI_PJ,
              murotilConfig: {
                ...INITIAL_MUROTIL_CONFIG,
                ...(cloudData.murotilConfig || {}),
                sesiList: cloudData.murotilConfig?.sesiList?.length
                  ? cloudData.murotilConfig.sesiList
                  : INITIAL_MUROTIL_CONFIG.sesiList,
              },
              suratSekretarisConfig: (() => {
                const cloudSekCfg = {
                  ...INITIAL_SYSTEM_CONFIG.suratSekretarisConfig!,
                  ...(cloudData.suratSekretarisConfig || {}),
                  kopLogoUrl:
                    cloudData.suratSekretarisConfig?.kopLogoUrl &&
                    !cloudData.suratSekretarisConfig.kopLogoUrl.includes('2026-11-11-7ffd46ad')
                      ? cloudData.suratSekretarisConfig.kopLogoUrl
                      : 'https://cdn.phototourl.com/member/2026-11-14-49a0f8f3-f2e5-443e-8c1e-36ccad7a6009.png',
                  kopLogoKananUrl:
                    cloudData.suratSekretarisConfig?.kopLogoKananUrl &&
                    cloudData.suratSekretarisConfig.kopLogoKananUrl.trim() !== '' &&
                    !cloudData.suratSekretarisConfig.kopLogoKananUrl.includes('2026-11-11-7ffd46ad')
                      ? cloudData.suratSekretarisConfig.kopLogoKananUrl
                      : 'https://cdn.phototourl.com/member/2026-11-14-6e57abdd-4666-430d-911c-7e8281c86140.jpg',
                  ttdUrl1:
                    cloudData.suratSekretarisConfig?.ttdUrl1 ??
                    INITIAL_SYSTEM_CONFIG.suratSekretarisConfig?.ttdUrl1 ??
                    '',
                  ttdUrl2:
                    cloudData.suratSekretarisConfig?.ttdUrl2 ??
                    INITIAL_SYSTEM_CONFIG.suratSekretarisConfig?.ttdUrl2 ??
                    '',
                  templates: {
                    ...INITIAL_SYSTEM_CONFIG.suratSekretarisConfig!.templates,
                    ...(cloudData.suratSekretarisConfig?.templates || {}),
                  }
                };
                const localSaved = readPengaturanSuratFromStorage();
                const cloudTs = cloudSekCfg.pejabatUpdatedAt ?? 0;
                const localTs = localSaved?.updatedAt ?? 0;
                if (cloudTs > localTs && localTs > 0) {
                  savePengaturanSuratToStorage({
                    namaKetua: cloudSekCfg.namaPenandatangan2,
                    jabatanKetua: cloudSekCfg.jabatanPenandatangan2,
                    ttdKetua: cloudSekCfg.ttdUrl2 ?? '',
                    namaSekretaris: cloudSekCfg.namaPenandatangan,
                    jabatanSekretaris: cloudSekCfg.jabatanPenandatangan,
                    ttdSekretaris: cloudSekCfg.ttdUrl1 ?? '',
                    tampilkanKetua: cloudSekCfg.tampilkanPenandatangan2,
                    updatedAt: cloudTs,
                  });
                }
                return applyPengaturanSuratToConfig(cloudSekCfg);
              })()
            };
            this.cache.systemConfig = cfg;
            localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(cfg));
            handleSyncUpdate();
          } else {
            // Upload default config to cloud
            setDoc(doc(db, CLOUD_COLLECTIONS.SYSTEM_CONFIG, 'main'), sanitizeForFirestore(INITIAL_SYSTEM_CONFIG), { merge: true })
              .catch(err => console.warn('Config seed error:', err));
          }
        },
        error => handleFirestoreError(error, OperationType.GET, `${CLOUD_COLLECTIONS.SYSTEM_CONFIG}/main`)
      );
      this.unsubscribers.push(unsubConfig);
    } catch (e) {
      console.warn('Sync config listener warning:', e);
    }

    // 9. Logs Collection Realtime Listener
    try {
      const unsubLogs = onSnapshot(
        collection(db, CLOUD_COLLECTIONS.LOGS),
        snapshot => {
          if (!snapshot.empty) {
            const list: LogAktivitas[] = [];
            snapshot.forEach(docSnap => {
              list.push({ ...docSnap.data(), id: docSnap.id } as LogAktivitas);
            });
            this.cache.logs = list.sort((a, b) => ((b.timestamp || 0) > (a.timestamp || 0) ? 1 : -1)).slice(0, 300);
            localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(this.cache.logs));
            handleSyncUpdate();
          } else if (this.cache.logs.length > 0) {
            this.uploadCollectionBatch(CLOUD_COLLECTIONS.LOGS, this.cache.logs);
          }
        },
        error => handleFirestoreError(error, OperationType.GET, CLOUD_COLLECTIONS.LOGS)
      );
      this.unsubscribers.push(unsubLogs);
    } catch (e) {
      console.warn('Sync logs listener warning:', e);
    }

    // 10. Notifikasi Collection Realtime Listener
    try {
      const unsubNotifikasi = onSnapshot(
        collection(db, CLOUD_COLLECTIONS.NOTIFIKASI),
        snapshot => {
          if (!snapshot.empty) {
            const list: NotifikasiApp[] = [];
            snapshot.forEach(docSnap => {
              list.push({ ...docSnap.data(), id: docSnap.id } as NotifikasiApp);
            });
            this.cache.notifikasi = list.slice(0, 50);
            localStorage.setItem(STORAGE_KEYS.NOTIFIKASI, JSON.stringify(this.cache.notifikasi));
            handleSyncUpdate();
          }
        },
        error => handleFirestoreError(error, OperationType.GET, CLOUD_COLLECTIONS.NOTIFIKASI)
      );
      this.unsubscribers.push(unsubNotifikasi);
    } catch (e) {
      console.warn('Sync notifikasi listener warning:', e);
    }

    // 11. Koordinasi Collection Realtime Listener
    try {
      const unsubKoordinasi = onSnapshot(
        collection(db, CLOUD_COLLECTIONS.KOORDINASI),
        snapshot => {
          if (!snapshot.empty) {
            this.cloudSawDocs[CLOUD_COLLECTIONS.KOORDINASI] = true;
            const list: PesanKoordinasi[] = [];
            snapshot.forEach(docSnap => {
              list.push({ ...docSnap.data(), id: docSnap.id } as PesanKoordinasi);
            });
            this.cache.koordinasi = list.sort((a, b) => (b.id > a.id ? 1 : -1));
            localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(this.cache.koordinasi));
            handleSyncUpdate();
          } else if (
            this.cloudSawDocs[CLOUD_COLLECTIONS.KOORDINASI] ||
            localStorage.getItem(STORAGE_KEYS.KOORDINASI) === '[]'
          ) {
            this.cache.koordinasi = [];
            localStorage.setItem(STORAGE_KEYS.KOORDINASI, '[]');
            handleSyncUpdate();
          } else if (this.cache.koordinasi.length > 0) {
            this.uploadCollectionBatch(CLOUD_COLLECTIONS.KOORDINASI, this.cache.koordinasi);
          }
        },
        error => handleFirestoreError(error, OperationType.GET, CLOUD_COLLECTIONS.KOORDINASI)
      );
      this.unsubscribers.push(unsubKoordinasi);
    } catch (e) {
      console.warn('Sync koordinasi listener warning:', e);
    }

    // Helper for syncing additional Pesantren management collections
    const attachCollectionListener = <T extends { id: string }>(
      colName: string,
      storageKey: string,
      getList: () => T[],
      setList: (items: T[]) => void,
      sorter?: (a: T, b: T) => number
    ) => {
      try {
        const unsub = onSnapshot(
          collection(db, colName),
          snapshot => {
            if (!snapshot.empty) {
              this.cloudSawDocs[colName] = true;
              const list: T[] = [];
              snapshot.forEach(docSnap => {
                list.push({ ...docSnap.data(), id: docSnap.id } as T);
              });
              const sorted = sorter ? list.sort(sorter) : list;
              setList(sorted);
              localStorage.setItem(storageKey, JSON.stringify(sorted));
              handleSyncUpdate();
            } else if (
              this.cloudSawDocs[colName] ||
              localStorage.getItem(storageKey) === '[]'
            ) {
              setList([]);
              localStorage.setItem(storageKey, '[]');
              handleSyncUpdate();
            } else if (getList().length > 0) {
              this.uploadCollectionBatch(colName, getList());
            }
          },
          error => handleFirestoreError(error, OperationType.GET, colName)
        );
        this.unsubscribers.push(unsub);
      } catch (e) {
        console.warn(`Sync ${colName} listener warning:`, e);
      }
    };

    // 12-19. Management Collections Realtime Listeners
    attachCollectionListener<StrukturOrganisasiNode>(
      CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI,
      STORAGE_KEYS.STRUKTUR_ORGANISASI,
      () => this.cache.strukturOrganisasi,
      (items) => { this.cache.strukturOrganisasi = items; },
      (a, b) => (a.level - b.level) || (a.urutan - b.urutan)
    );
    attachCollectionListener<AgendaPengurus>(
      CLOUD_COLLECTIONS.AGENDA_PENGURUS,
      STORAGE_KEYS.AGENDA_PENGURUS,
      () => this.cache.agendaPengurus,
      (items) => {
        this.cache.agendaPengurus = items;
        setTimeout(() => this.checkAndDetectTodayAgendas(), 50);
      },
      (a, b) => (b.tanggal > a.tanggal ? 1 : -1)
    );
    attachCollectionListener<EvaluasiKepengurusan>(
      CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN,
      STORAGE_KEYS.EVALUASI_KEPENGURUSAN,
      () => this.cache.evaluasiKepengurusan,
      (items) => { this.cache.evaluasiKepengurusan = items; },
      (a, b) => (b.tanggal > a.tanggal ? 1 : -1)
    );
    attachCollectionListener<PengajuanDivisi>(
      CLOUD_COLLECTIONS.PENGAJUAN_DIVISI,
      STORAGE_KEYS.PENGAJUAN_DIVISI,
      () => this.cache.pengajuanDivisi,
      (items) => { this.cache.pengajuanDivisi = items; },
      (a, b) => (b.tanggal > a.tanggal ? 1 : -1)
    );
    attachCollectionListener<ArsipSurat>(
      CLOUD_COLLECTIONS.SURAT_MENYURAT,
      STORAGE_KEYS.SURAT_MENYURAT,
      () => this.cache.arsipSurat,
      (items) => { this.cache.arsipSurat = items; },
      (a, b) => (b.tanggalSurat > a.tanggalSurat ? 1 : -1)
    );
    attachCollectionListener<TransaksiKeuangan>(
      CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI,
      STORAGE_KEYS.KEUANGAN_TRANSAKSI,
      () => this.cache.transaksiKeuangan,
      (items) => { this.cache.transaksiKeuangan = items; },
      (a, b) => (b.tanggal > a.tanggal ? 1 : -1)
    );
    attachCollectionListener<BarangInventaris>(
      CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS,
      STORAGE_KEYS.PERLENGKAPAN_INVENTARIS,
      () => this.cache.barangInventaris,
      (items) => { this.cache.barangInventaris = items; },
      (a, b) => (a.kodeBarang > b.kodeBarang ? 1 : -1)
    );
    attachCollectionListener<PeminjamanBarang>(
      CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN,
      STORAGE_KEYS.PERLENGKAPAN_PEMINJAMAN,
      () => this.cache.peminjamanBarang,
      (items) => { this.cache.peminjamanBarang = items; },
      (a, b) => (b.tanggalPinjam > a.tanggalPinjam ? 1 : -1)
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

    return {
      status: this.cloudConnected ? 'connected' : 'syncing',
      lastSyncTime: this.lastSyncTime,
      cloudConnected: this.cloudConnected,
      databaseId: 'ai-studio-simkamtibpondokp-0ca6cfda-fbeb-4a4d-91e1-25f2c74e35be',
      projectId: 'gold-card-583d0',
      activeListenersCount: this.unsubscribers.length,
      totalSyncedItems: total,
    };
  }

  /**
   * Forces pulling latest records directly from central Firestore database
   */
  public async forcePullFromCloud(): Promise<boolean> {
    try {
      const pullCol = async <T extends { id: string }>(
        colName: string,
        storageKey: string,
        assign: (list: T[]) => void
      ) => {
        const snap = await getDocs(collection(db, colName));
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as T));
          assign(list);
          localStorage.setItem(storageKey, JSON.stringify(list));
        }
      };

      await Promise.all([
        pullCol<Santri>(CLOUD_COLLECTIONS.SANTRI, STORAGE_KEYS.SANTRI, l => { this.cache.santri = l; }),
        pullCol<Perizinan>(CLOUD_COLLECTIONS.PERIZINAN, STORAGE_KEYS.PERIZINAN, l => { this.cache.perizinan = l; }),
        pullCol<Pelanggaran>(CLOUD_COLLECTIONS.PELANGGARAN, STORAGE_KEYS.PELANGGARAN, l => { this.cache.pelanggaran = l; }),
        pullCol<Sanksi>(CLOUD_COLLECTIONS.SANKSI, STORAGE_KEYS.SANKSI, l => { this.cache.sanksi = l; }),
        pullCol<DewanKeamanan>(CLOUD_COLLECTIONS.DEWAN_KEAMANAN, STORAGE_KEYS.DEWAN_KEAMANAN, l => { this.cache.dewan = l; }),
        pullCol<UserAccount>(CLOUD_COLLECTIONS.USERS, STORAGE_KEYS.USERS, l => { this.cache.users = l; }),
        pullCol<StrukturOrganisasiNode>(CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI, STORAGE_KEYS.STRUKTUR_ORGANISASI, l => { this.cache.strukturOrganisasi = l; }),
        pullCol<AgendaPengurus>(CLOUD_COLLECTIONS.AGENDA_PENGURUS, STORAGE_KEYS.AGENDA_PENGURUS, l => { this.cache.agendaPengurus = l; }),
        pullCol<EvaluasiKepengurusan>(CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN, STORAGE_KEYS.EVALUASI_KEPENGURUSAN, l => { this.cache.evaluasiKepengurusan = l; }),
        pullCol<PengajuanDivisi>(CLOUD_COLLECTIONS.PENGAJUAN_DIVISI, STORAGE_KEYS.PENGAJUAN_DIVISI, l => { this.cache.pengajuanDivisi = l; }),
        pullCol<ArsipSurat>(CLOUD_COLLECTIONS.SURAT_MENYURAT, STORAGE_KEYS.SURAT_MENYURAT, l => { this.cache.arsipSurat = l; }),
        pullCol<TransaksiKeuangan>(CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI, STORAGE_KEYS.KEUANGAN_TRANSAKSI, l => { this.cache.transaksiKeuangan = l; }),
        pullCol<BarangInventaris>(CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS, STORAGE_KEYS.PERLENGKAPAN_INVENTARIS, l => { this.cache.barangInventaris = l; }),
        pullCol<PeminjamanBarang>(CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN, STORAGE_KEYS.PERLENGKAPAN_PEMINJAMAN, l => { this.cache.peminjamanBarang = l; }),
      ]);

      this.cloudConnected = true;
      this.lastSyncTime = new Date().toLocaleTimeString('id-ID') + ' WIB';
      this.notify();
      return true;
    } catch (err) {
      console.error('Force pull failed:', err);
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
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));

    // Jika yang diupdate adalah akun yang sedang login, perbarui sessionStorage juga agar Sidebar & Header langsung berubah
    const active = this.getCurrentUser();
    if (active && active.id === user.id) {
      try {
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } catch { /* ignore */ }
    }

    this.notify();

    // Async sync to central Firestore database
    setDoc(doc(db, CLOUD_COLLECTIONS.USERS, user.id), sanitizeForFirestore(user), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.USERS}/${user.id}`));
  }

  public deleteUser(userId: string) {
    const list = this.getUsers().filter(u => u.id !== userId);
    this.cache.users = list;
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
    this.addLog('Hapus Akun RBAC', `Menonaktifkan / menghapus akun ID: ${userId}`, 'admin');
    this.notify();

    // Async delete from central Firestore database
    deleteDoc(doc(db, CLOUD_COLLECTIONS.USERS, userId))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.USERS}/${userId}`));
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

    try {
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(found));
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(found));
    }
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

    // Simpan sesi aktif hanya di sessionStorage agar saat browser/tab dibuka baru tetap aman
    try {
      sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(found));
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(found));
    }
    this.addLog('Autentikasi Masuk', `Personil ${found.nama} (${found.jabatan}) berhasil login ke sistem.`, 'admin');
    this.notify();

    return { success: true, user: found };
  }

  public logout() {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this.addLog('Keluar Sistem', `Pengguna ${currentUser.nama} keluar dari sistem.`, 'admin');
    }
    try {
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch { /* ignore */ }
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch { /* ignore */ }
    this.notify();
  }

  public getCurrentUser(): UserAccount | null {
    try {
      const sessionData = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (sessionData) {
        return JSON.parse(sessionData);
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
    return this.cache.systemConfig || INITIAL_SYSTEM_CONFIG;
  }

  public updateSystemConfig(config: Partial<SystemConfig>) {
    const current = this.getSystemConfig();
    const updated = { ...current, ...config };
    this.cache.systemConfig = updated;
    localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(updated));
    this.addLog('Konfigurasi Sistem', 'Admin memperbarui parameter pengaturan manual di Option Panel.', 'admin');
    this.notify();

    // Sync to central Firestore database
    setDoc(doc(db, CLOUD_COLLECTIONS.SYSTEM_CONFIG, 'main'), sanitizeForFirestore(updated), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.SYSTEM_CONFIG}/main`));
  }

  // Gender Scope
  public getGenderScope(): 'all' | 'putra' | 'putri' {
    const user = this.getCurrentUser();
    if (user && user.genderAccess !== 'all') {
      return user.genderAccess;
    }
    const saved = localStorage.getItem(STORAGE_KEYS.GENDER_SCOPE);
    return (saved as 'all' | 'putra' | 'putri') || 'all';
  }

  public setGenderScope(scope: 'all' | 'putra' | 'putri') {
    localStorage.setItem(STORAGE_KEYS.GENDER_SCOPE, scope);
    this.notify();
  }

  // Theme (Dark / Light)
  public getTheme(): 'dark' | 'light' {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    return theme === 'light' ? 'light' : 'dark';
  }

  public setTheme(theme: 'dark' | 'light') {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
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
    return this.cache.santri.length > 0 ? this.cache.santri : INITIAL_SANTRI;
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
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(list));
    this.notify();

    // Realtime write to central Firestore database
    setDoc(doc(db, CLOUD_COLLECTIONS.SANTRI, santri.id), sanitizeForFirestore(santri), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.SANTRI}/${santri.id}`));
  }

  public deleteSantri(id: string) {
    const list = this.getSantriList();
    const target = list.find(s => s.id === id);
    const updated = list.filter(s => s.id !== id);
    this.cache.santri = updated;
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(updated));
    if (target) {
      this.addLog('Hapus Santri', `Menghapus data santri: ${target.nama} (${target.nis})`, 'santri');
    }
    this.notify();

    // Realtime delete from central Firestore database
    deleteDoc(doc(db, CLOUD_COLLECTIONS.SANTRI, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.SANTRI}/${id}`));
  }

  public suspendSantri(santriId: string, suspendUntilDate: string, alasan: string) {
    const list = [...this.getSantriList()];
    const santri = list.find(s => s.id === santriId);
    if (santri) {
      santri.suspendIzinHingga = suspendUntilDate;
      santri.alasanSuspensi = alasan;
      this.cache.santri = list;
      localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(list));
      this.addLog(
        'Penangguhan Izin Santri',
        `Santri ${santri.nama} (${santri.nis}) ditangguhkan izin keluarnya hingga ${suspendUntilDate}. Alasan: ${alasan}`,
        'santri'
      );
      this.notify();

      // Write to central Firestore
      setDoc(doc(db, CLOUD_COLLECTIONS.SANTRI, santri.id), sanitizeForFirestore(santri), { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.SANTRI}/${santri.id}`));
    }
  }

  public liftSantriSuspension(santriId: string) {
    const list = [...this.getSantriList()];
    const santri = list.find(s => s.id === santriId);
    if (santri) {
      delete santri.suspendIzinHingga;
      delete santri.alasanSuspensi;
      this.cache.santri = list;
      localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(list));
      this.addLog(
        'Pemulihan Izin Santri',
        `Penangguhan izin keluar santri ${santri.nama} (${santri.nis}) telah dipulihkan.`,
        'santri'
      );
      this.notify();

      setDoc(doc(db, CLOUD_COLLECTIONS.SANTRI, santri.id), sanitizeForFirestore(santri), { merge: true })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.SANTRI}/${santri.id}`));
    }
  }

  // ==========================================
  // Dewan Keamanan & Piket
  // ==========================================
  public getDewanKeamananList(): DewanKeamanan[] {
    return this.cache.dewan.length > 0 ? this.cache.dewan : INITIAL_DEWAN_KEAMANAN;
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
    localStorage.setItem(STORAGE_KEYS.DEWAN_KEAMANAN, JSON.stringify(list));
    this.notify();

    // Central Firestore sync
    setDoc(doc(db, CLOUD_COLLECTIONS.DEWAN_KEAMANAN, pengurus.id), sanitizeForFirestore(pengurus), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.DEWAN_KEAMANAN}/${pengurus.id}`));
  }

  public deleteDewanKeamanan(id: string) {
    const list = this.getDewanKeamananList().filter(p => p.id !== id);
    this.cache.dewan = list;
    localStorage.setItem(STORAGE_KEYS.DEWAN_KEAMANAN, JSON.stringify(list));
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.DEWAN_KEAMANAN, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.DEWAN_KEAMANAN}/${id}`));
  }

  // ==========================================
  // Perizinan Santri
  // ==========================================
  public getPerizinanList(): Perizinan[] {
    return this.cache.perizinan.length > 0 ? this.cache.perizinan : INITIAL_PERIZINAN;
  }

  public savePerizinan(izin: Perizinan, note?: string) {
    const list = [...this.getPerizinanList()];
    const index = list.findIndex(i => i.id === izin.id);
    const currentUser = this.getCurrentUser();
    const actorName = currentUser ? currentUser.nama : (izin.petugasPencatat || 'Petugas Keamanan');

    if (index >= 0) {
      const prev = list[index];
      list[index] = izin;

      // Status change or edit audit
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
    localStorage.setItem(STORAGE_KEYS.PERIZINAN, JSON.stringify(list));
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
    localStorage.setItem(STORAGE_KEYS.PERIZINAN, JSON.stringify(updated));
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.PERIZINAN, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.PERIZINAN}/${id}`));
  }

  // Automated Tardiness Detection
  public checkAndDetectLatePermits(): number {
    const list = this.getPerizinanList();
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
            // Async push to firestore
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
      localStorage.setItem(STORAGE_KEYS.PERIZINAN, JSON.stringify(updatedList));
      this.notify();
    }
    return updatedCount;
  }

  // ==========================================
  // Tata Tertib
  // ==========================================
  public getTataTertibList(): TataTertib[] {
    return this.cache.tataTertib.length > 0 ? this.cache.tataTertib : INITIAL_TATA_TERTIB;
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
    localStorage.setItem(STORAGE_KEYS.TATA_TERTIB, JSON.stringify(list));
    this.notify();

    setDoc(doc(db, CLOUD_COLLECTIONS.TATA_TERTIB, tt.id), sanitizeForFirestore(tt), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.TATA_TERTIB}/${tt.id}`));
  }

  public deleteTataTertib(id: string) {
    const list = this.getTataTertibList().filter(t => t.id !== id);
    this.cache.tataTertib = list;
    localStorage.setItem(STORAGE_KEYS.TATA_TERTIB, JSON.stringify(list));
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.TATA_TERTIB, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.TATA_TERTIB}/${id}`));
  }

  // ==========================================
  // Pelanggaran & Takzir
  // ==========================================
  public getPelanggaranList(): Pelanggaran[] {
    return this.cache.pelanggaran.length > 0 ? this.cache.pelanggaran : INITIAL_PELANGGARAN;
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
    localStorage.setItem(STORAGE_KEYS.PELANGGARAN, JSON.stringify(list));
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
    localStorage.setItem(STORAGE_KEYS.PELANGGARAN, JSON.stringify(updated));
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
      localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(santriList));
      setDoc(doc(db, CLOUD_COLLECTIONS.SANTRI, santri.id), sanitizeForFirestore(santri), { merge: true })
        .catch(() => {});
    }
  }

  // ==========================================
  // Sanksi & Takzir Edukatif
  // ==========================================
  public getSanksiList(): Sanksi[] {
    return this.cache.sanksi.length > 0 ? this.cache.sanksi : INITIAL_SANKSI;
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
    localStorage.setItem(STORAGE_KEYS.SANKSI, JSON.stringify(list));
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
    localStorage.setItem(STORAGE_KEYS.SANKSI, JSON.stringify(updated));
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
    return this.cache.logs.length > 0 ? this.cache.logs : INITIAL_LOGS;
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
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
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
    localStorage.setItem(STORAGE_KEYS.NOTIFIKASI, JSON.stringify(current));
    this.notify();

    setDoc(doc(db, CLOUD_COLLECTIONS.NOTIFIKASI, newNotif.id), sanitizeForFirestore(newNotif), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.NOTIFIKASI}/${newNotif.id}`));
  }

  public markAllNotificationsRead() {
    const current = this.getNotifications().map(n => ({ ...n, dibaca: true }));
    this.cache.notifikasi = current;
    localStorage.setItem(STORAGE_KEYS.NOTIFIKASI, JSON.stringify(current));
    this.notify();

    // Update in firestore
    for (const notif of current) {
      setDoc(doc(db, CLOUD_COLLECTIONS.NOTIFIKASI, notif.id), { dibaca: true }, { merge: true }).catch(() => {});
    }
  }

  public markNotificationRead(id: string) {
    const current = this.getNotifications().map(n => n.id === id ? { ...n, dibaca: true } : n);
    this.cache.notifikasi = current;
    localStorage.setItem(STORAGE_KEYS.NOTIFIKASI, JSON.stringify(current));
    this.notify();

    setDoc(doc(db, CLOUD_COLLECTIONS.NOTIFIKASI, id), { dibaca: true }, { merge: true }).catch(() => {});
  }

  public deleteNotification(id: string) {
    const current = this.getNotifications().filter(n => n.id !== id);
    this.cache.notifikasi = current;
    localStorage.setItem(STORAGE_KEYS.NOTIFIKASI, JSON.stringify(current));
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
    localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(list));
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
        localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(list));
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
      localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(list));
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
      localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(list));
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
    localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(list));

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
    localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(list));
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.KOORDINASI, pesanId))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.KOORDINASI}/${pesanId}`));
  }

  public deleteAllKoordinasi() {
    const existingIds = this.getKoordinasiList().map(p => p.id);
    this.cache.koordinasi = [];
    localStorage.setItem(STORAGE_KEYS.KOORDINASI, '[]');
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
    return this.cache.strukturOrganisasi.length > 0 ? this.cache.strukturOrganisasi : INITIAL_STRUKTUR_ORGANISASI;
  }

  public saveStrukturNode(node: StrukturOrganisasiNode) {
    const list = [...this.getStrukturOrganisasi()];
    const idx = list.findIndex(n => n.id === node.id);
    if (idx >= 0) list[idx] = node;
    else list.push(node);
    const sorted = list.sort((a, b) => (a.level - b.level) || (a.urutan - b.urutan));
    this.cache.strukturOrganisasi = sorted;
    localStorage.setItem(STORAGE_KEYS.STRUKTUR_ORGANISASI, JSON.stringify(sorted));
    this.addLog('Struktur Organisasi', `Memperbarui jabatan struktur: ${node.jabatan} (${node.namaPengurus})`, 'admin');
    this.notify();

    setDoc(doc(db, CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI, node.id), sanitizeForFirestore(node), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI}/${node.id}`));
  }

  public deleteStrukturNode(id: string) {
    const updated = this.getStrukturOrganisasi().filter(n => n.id !== id);
    this.cache.strukturOrganisasi = updated;
    localStorage.setItem(STORAGE_KEYS.STRUKTUR_ORGANISASI, JSON.stringify(updated));
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI}/${id}`));
  }

  // ==========================================
  // 2. Ketua Pondok (Agenda, Evaluasi, Pengajuan Divisi)
  // ==========================================
  public getAgendaPengurus(): AgendaPengurus[] {
    return this.cache.agendaPengurus.length > 0 ? this.cache.agendaPengurus : INITIAL_AGENDA_PENGURUS;
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
      localStorage.setItem(STORAGE_KEYS.NOTIFIKASI, JSON.stringify(currentNotifs));
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
    localStorage.setItem(STORAGE_KEYS.AGENDA_PENGURUS, JSON.stringify(list));
    this.addLog('Agenda Pengurus', `Menyimpan agenda kepengurusan: ${agenda.judul} (${agenda.tanggal})`, 'admin');
    this.notify();

    setDoc(doc(db, CLOUD_COLLECTIONS.AGENDA_PENGURUS, agenda.id), sanitizeForFirestore(agenda), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.AGENDA_PENGURUS}/${agenda.id}`));

    this.checkAndDetectTodayAgendas();
  }

  public deleteAgendaPengurus(id: string) {
    const updated = this.getAgendaPengurus().filter(a => a.id !== id);
    this.cache.agendaPengurus = updated;
    localStorage.setItem(STORAGE_KEYS.AGENDA_PENGURUS, JSON.stringify(updated));
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.AGENDA_PENGURUS, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.AGENDA_PENGURUS}/${id}`));
  }

  public getEvaluasiKepengurusan(): EvaluasiKepengurusan[] {
    return this.cache.evaluasiKepengurusan.length > 0 ? this.cache.evaluasiKepengurusan : INITIAL_EVALUASI_KEPENGURUSAN;
  }

  public saveEvaluasiKepengurusan(evaluasi: EvaluasiKepengurusan) {
    const list = [...this.getEvaluasiKepengurusan()];
    const idx = list.findIndex(e => e.id === evaluasi.id);
    if (idx >= 0) list[idx] = evaluasi;
    else list.unshift(evaluasi);
    this.cache.evaluasiKepengurusan = list;
    localStorage.setItem(STORAGE_KEYS.EVALUASI_KEPENGURUSAN, JSON.stringify(list));
    this.addLog('Evaluasi Kepengurusan', `Ketua Pondok mencatat evaluasi divisi ${evaluasi.divisi}: ${evaluasi.judul}`, 'admin');
    this.notify();

    setDoc(doc(db, CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN, evaluasi.id), sanitizeForFirestore(evaluasi), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN}/${evaluasi.id}`));
  }

  public deleteEvaluasiKepengurusan(id: string) {
    const updated = this.getEvaluasiKepengurusan().filter(e => e.id !== id);
    this.cache.evaluasiKepengurusan = updated;
    localStorage.setItem(STORAGE_KEYS.EVALUASI_KEPENGURUSAN, JSON.stringify(updated));
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
    localStorage.setItem(STORAGE_KEYS.PENGAJUAN_DIVISI, JSON.stringify(list));
    this.addLog('Pengajuan Divisi', `Update pengajuan ${pengajuan.nomorPengajuan} (${pengajuan.status}): ${pengajuan.judul}`, 'admin');
    this.notify();

    setDoc(doc(db, CLOUD_COLLECTIONS.PENGAJUAN_DIVISI, pengajuan.id), sanitizeForFirestore(pengajuan), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.PENGAJUAN_DIVISI}/${pengajuan.id}`));
  }

  public deletePengajuanDivisi(id: string) {
    const updated = this.getPengajuanDivisi().filter(p => p.id !== id);
    this.cache.pengajuanDivisi = updated;
    localStorage.setItem(STORAGE_KEYS.PENGAJUAN_DIVISI, JSON.stringify(updated));
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
    localStorage.setItem(STORAGE_KEYS.SURAT_MENYURAT, JSON.stringify(list));
    this.addLog('Administrasi Persuratan', `Menyimpan Surat ${surat.arah} (${surat.kodeJenis}) No. ${surat.nomorSurat}`, 'admin');
    this.notify();

    setDoc(doc(db, CLOUD_COLLECTIONS.SURAT_MENYURAT, surat.id), sanitizeForFirestore(surat), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.SURAT_MENYURAT}/${surat.id}`));
  }

  public deleteArsipSurat(id: string) {
    const updated = this.getArsipSurat().filter(s => s.id !== id);
    this.cache.arsipSurat = updated;
    localStorage.setItem(STORAGE_KEYS.SURAT_MENYURAT, JSON.stringify(updated));
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.SURAT_MENYURAT, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.SURAT_MENYURAT}/${id}`));
  }

  // ==========================================
  // 4. Bendahara (Keuangan Kas Pondok)
  // ==========================================
  public getTransaksiKeuangan(): TransaksiKeuangan[] {
    return this.cache.transaksiKeuangan.length > 0 ? this.cache.transaksiKeuangan : INITIAL_TRANSAKSI_KEUANGAN;
  }

  public saveTransaksiKeuangan(trx: TransaksiKeuangan) {
    const list = [...this.getTransaksiKeuangan()];
    const idx = list.findIndex(t => t.id === trx.id);
    if (idx >= 0) list[idx] = trx;
    else list.unshift(trx);
    this.cache.transaksiKeuangan = list;
    localStorage.setItem(STORAGE_KEYS.KEUANGAN_TRANSAKSI, JSON.stringify(list));
    this.addLog('Transaksi Keuangan', `${trx.tipe} Rp ${trx.nominal.toLocaleString('id-ID')} (${trx.kategori}) - ${trx.kodeTransaksi}`, 'admin');
    this.notify();

    setDoc(doc(db, CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI, trx.id), sanitizeForFirestore(trx), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI}/${trx.id}`));
  }

  public deleteTransaksiKeuangan(id: string) {
    const updated = this.getTransaksiKeuangan().filter(t => t.id !== id);
    this.cache.transaksiKeuangan = updated;
    localStorage.setItem(STORAGE_KEYS.KEUANGAN_TRANSAKSI, JSON.stringify(updated));
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI}/${id}`));
  }

  // ==========================================
  // 5. Perlengkapan (Inventaris & Peminjaman)
  // ==========================================
  public getBarangInventaris(): BarangInventaris[] {
    return this.cache.barangInventaris.length > 0 ? this.cache.barangInventaris : INITIAL_BARANG_INVENTARIS;
  }

  public saveBarangInventaris(barang: BarangInventaris) {
    const list = [...this.getBarangInventaris()];
    const idx = list.findIndex(b => b.id === barang.id);
    if (idx >= 0) list[idx] = barang;
    else list.unshift(barang);
    this.cache.barangInventaris = list;
    localStorage.setItem(STORAGE_KEYS.PERLENGKAPAN_INVENTARIS, JSON.stringify(list));
    this.addLog('Inventaris Sarpras', `Memperbarui aset ${barang.kodeBarang}: ${barang.namaBarang} (${barang.jumlah} ${barang.satuan})`, 'admin');
    this.notify();

    setDoc(doc(db, CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS, barang.id), sanitizeForFirestore(barang), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS}/${barang.id}`));
  }

  public deleteBarangInventaris(id: string) {
    const updated = this.getBarangInventaris().filter(b => b.id !== id);
    this.cache.barangInventaris = updated;
    localStorage.setItem(STORAGE_KEYS.PERLENGKAPAN_INVENTARIS, JSON.stringify(updated));
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS}/${id}`));
  }

  public getPeminjamanBarang(): PeminjamanBarang[] {
    return this.cache.peminjamanBarang.length > 0 ? this.cache.peminjamanBarang : INITIAL_PEMINJAMAN_BARANG;
  }

  public savePeminjamanBarang(pjm: PeminjamanBarang) {
    const list = [...this.getPeminjamanBarang()];
    const idx = list.findIndex(p => p.id === pjm.id);
    if (idx >= 0) list[idx] = pjm;
    else list.unshift(pjm);
    this.cache.peminjamanBarang = list;
    localStorage.setItem(STORAGE_KEYS.PERLENGKAPAN_PEMINJAMAN, JSON.stringify(list));
    this.addLog('Peminjaman Perlengkapan', `${pjm.kodePeminjaman}: ${pjm.namaBarang} oleh ${pjm.peminjamNama} (${pjm.status})`, 'admin');
    this.notify();

    setDoc(doc(db, CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN, pjm.id), sanitizeForFirestore(pjm), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN}/${pjm.id}`));
  }

  public deletePeminjamanBarang(id: string) {
    const updated = this.getPeminjamanBarang().filter(p => p.id !== id);
    this.cache.peminjamanBarang = updated;
    localStorage.setItem(STORAGE_KEYS.PERLENGKAPAN_PEMINJAMAN, JSON.stringify(updated));
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN, id))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN}/${id}`));
  }

  // ==========================================
  // Backup & Restore
  // ==========================================
  public exportFullBackup(): string {
    const backup = {
      timestamp: new Date().toISOString(),
      databaseId: 'ai-studio-simkamtibpondokp-0ca6cfda-fbeb-4a4d-91e1-25f2c74e35be',
      projectId: 'gold-card-583d0',
      config: this.getSystemConfig(),
      users: this.getUsers(),
      santri: this.getSantriList(),
      dewanKeamanan: this.getDewanKeamananList(),
      perizinan: this.getPerizinanList(),
      tataTertib: this.getTataTertibList(),
      pelanggaran: this.getPelanggaranList(),
      sanksi: this.getSanksiList(),
      logs: this.getLogs(),
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

  public async importFullBackup(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.santri) {
        this.cache.santri = parsed.santri;
        localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(parsed.santri));
        await this.uploadCollectionBatch(CLOUD_COLLECTIONS.SANTRI, parsed.santri);
      }
      if (parsed.dewanKeamanan) {
        this.cache.dewan = parsed.dewanKeamanan;
        localStorage.setItem(STORAGE_KEYS.DEWAN_KEAMANAN, JSON.stringify(parsed.dewanKeamanan));
        await this.uploadCollectionBatch(CLOUD_COLLECTIONS.DEWAN_KEAMANAN, parsed.dewanKeamanan);
      }
      if (parsed.perizinan) {
        this.cache.perizinan = parsed.perizinan;
        localStorage.setItem(STORAGE_KEYS.PERIZINAN, JSON.stringify(parsed.perizinan));
        await this.uploadCollectionBatch(CLOUD_COLLECTIONS.PERIZINAN, parsed.perizinan);
      }
      if (parsed.tataTertib) {
        this.cache.tataTertib = parsed.tataTertib;
        localStorage.setItem(STORAGE_KEYS.TATA_TERTIB, JSON.stringify(parsed.tataTertib));
        await this.uploadCollectionBatch(CLOUD_COLLECTIONS.TATA_TERTIB, parsed.tataTertib);
      }
      if (parsed.pelanggaran) {
        this.cache.pelanggaran = parsed.pelanggaran;
        localStorage.setItem(STORAGE_KEYS.PELANGGARAN, JSON.stringify(parsed.pelanggaran));
        await this.uploadCollectionBatch(CLOUD_COLLECTIONS.PELANGGARAN, parsed.pelanggaran);
      }
      if (parsed.sanksi) {
        this.cache.sanksi = parsed.sanksi;
        localStorage.setItem(STORAGE_KEYS.SANKSI, JSON.stringify(parsed.sanksi));
        await this.uploadCollectionBatch(CLOUD_COLLECTIONS.SANKSI, parsed.sanksi);
      }
      if (parsed.users) {
        this.cache.users = parsed.users;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed.users));
        await this.uploadCollectionBatch(CLOUD_COLLECTIONS.USERS, parsed.users);
      }
      if (parsed.strukturOrganisasi) {
        this.cache.strukturOrganisasi = parsed.strukturOrganisasi;
        localStorage.setItem(STORAGE_KEYS.STRUKTUR_ORGANISASI, JSON.stringify(parsed.strukturOrganisasi));
        await this.uploadCollectionBatch(CLOUD_COLLECTIONS.STRUKTUR_ORGANISASI, parsed.strukturOrganisasi);
      }
      if (parsed.agendaPengurus) {
        this.cache.agendaPengurus = parsed.agendaPengurus;
        localStorage.setItem(STORAGE_KEYS.AGENDA_PENGURUS, JSON.stringify(parsed.agendaPengurus));
        await this.uploadCollectionBatch(CLOUD_COLLECTIONS.AGENDA_PENGURUS, parsed.agendaPengurus);
      }
      if (parsed.evaluasiKepengurusan) {
        this.cache.evaluasiKepengurusan = parsed.evaluasiKepengurusan;
        localStorage.setItem(STORAGE_KEYS.EVALUASI_KEPENGURUSAN, JSON.stringify(parsed.evaluasiKepengurusan));
        await this.uploadCollectionBatch(CLOUD_COLLECTIONS.EVALUASI_KEPENGURUSAN, parsed.evaluasiKepengurusan);
      }
      if (parsed.pengajuanDivisi) {
        this.cache.pengajuanDivisi = parsed.pengajuanDivisi;
        localStorage.setItem(STORAGE_KEYS.PENGAJUAN_DIVISI, JSON.stringify(parsed.pengajuanDivisi));
        await this.uploadCollectionBatch(CLOUD_COLLECTIONS.PENGAJUAN_DIVISI, parsed.pengajuanDivisi);
      }
      if (parsed.arsipSurat) {
        this.cache.arsipSurat = parsed.arsipSurat;
        localStorage.setItem(STORAGE_KEYS.SURAT_MENYURAT, JSON.stringify(parsed.arsipSurat));
        await this.uploadCollectionBatch(CLOUD_COLLECTIONS.SURAT_MENYURAT, parsed.arsipSurat);
      }
      if (parsed.transaksiKeuangan) {
        this.cache.transaksiKeuangan = parsed.transaksiKeuangan;
        localStorage.setItem(STORAGE_KEYS.KEUANGAN_TRANSAKSI, JSON.stringify(parsed.transaksiKeuangan));
        await this.uploadCollectionBatch(CLOUD_COLLECTIONS.KEUANGAN_TRANSAKSI, parsed.transaksiKeuangan);
      }
      if (parsed.barangInventaris) {
        this.cache.barangInventaris = parsed.barangInventaris;
        localStorage.setItem(STORAGE_KEYS.PERLENGKAPAN_INVENTARIS, JSON.stringify(parsed.barangInventaris));
        await this.uploadCollectionBatch(CLOUD_COLLECTIONS.PERLENGKAPAN_INVENTARIS, parsed.barangInventaris);
      }
      if (parsed.peminjamanBarang) {
        this.cache.peminjamanBarang = parsed.peminjamanBarang;
        localStorage.setItem(STORAGE_KEYS.PERLENGKAPAN_PEMINJAMAN, JSON.stringify(parsed.peminjamanBarang));
        await this.uploadCollectionBatch(CLOUD_COLLECTIONS.PERLENGKAPAN_PEMINJAMAN, parsed.peminjamanBarang);
      }
      if (parsed.config) {
        this.cache.systemConfig = parsed.config;
        localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(parsed.config));
        await setDoc(doc(db, CLOUD_COLLECTIONS.SYSTEM_CONFIG, 'main'), sanitizeForFirestore(parsed.config), { merge: true });
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
