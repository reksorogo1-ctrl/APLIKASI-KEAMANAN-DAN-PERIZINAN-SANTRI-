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
  BalasanKoordinasi
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
  INITIAL_KOORDINASI 
} from '../data/seedData';
import { db, handleFirestoreError, OperationType } from './firebase';
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
      this.cache.users = u ? JSON.parse(u) : INITIAL_USERS;

      const cfg = localStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIG);
      this.cache.systemConfig = cfg ? { ...INITIAL_SYSTEM_CONFIG, ...JSON.parse(cfg) } : INITIAL_SYSTEM_CONFIG;

      const l = localStorage.getItem(STORAGE_KEYS.LOGS);
      this.cache.logs = l ? JSON.parse(l) : INITIAL_LOGS;

      const n = localStorage.getItem(STORAGE_KEYS.NOTIFIKASI);
      this.cache.notifikasi = n ? JSON.parse(n) : [];

      const k = localStorage.getItem(STORAGE_KEYS.KOORDINASI);
      this.cache.koordinasi = k ? JSON.parse(k) : INITIAL_KOORDINASI;
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
            const cfg = { ...INITIAL_SYSTEM_CONFIG, ...docSnap.data() } as SystemConfig;
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
            const list: PesanKoordinasi[] = [];
            snapshot.forEach(docSnap => {
              list.push({ ...docSnap.data(), id: docSnap.id } as PesanKoordinasi);
            });
            this.cache.koordinasi = list.sort((a, b) => (b.id > a.id ? 1 : -1));
            localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(this.cache.koordinasi));
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
      this.cache.koordinasi.length;

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
      // 1. Santri
      const snapSantri = await getDocs(collection(db, CLOUD_COLLECTIONS.SANTRI));
      if (!snapSantri.empty) {
        this.cache.santri = snapSantri.docs.map(d => ({ ...d.data(), id: d.id } as Santri));
        localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(this.cache.santri));
      }

      // 2. Perizinan
      const snapIzin = await getDocs(collection(db, CLOUD_COLLECTIONS.PERIZINAN));
      if (!snapIzin.empty) {
        this.cache.perizinan = snapIzin.docs.map(d => ({ ...d.data(), id: d.id } as Perizinan));
        localStorage.setItem(STORAGE_KEYS.PERIZINAN, JSON.stringify(this.cache.perizinan));
      }

      // 3. Pelanggaran
      const snapPel = await getDocs(collection(db, CLOUD_COLLECTIONS.PELANGGARAN));
      if (!snapPel.empty) {
        this.cache.pelanggaran = snapPel.docs.map(d => ({ ...d.data(), id: d.id } as Pelanggaran));
        localStorage.setItem(STORAGE_KEYS.PELANGGARAN, JSON.stringify(this.cache.pelanggaran));
      }

      // 4. Sanksi
      const snapSanksi = await getDocs(collection(db, CLOUD_COLLECTIONS.SANKSI));
      if (!snapSanksi.empty) {
        this.cache.sanksi = snapSanksi.docs.map(d => ({ ...d.data(), id: d.id } as Sanksi));
        localStorage.setItem(STORAGE_KEYS.SANKSI, JSON.stringify(this.cache.sanksi));
      }

      // 5. Dewan Keamanan
      const snapDewan = await getDocs(collection(db, CLOUD_COLLECTIONS.DEWAN_KEAMANAN));
      if (!snapDewan.empty) {
        this.cache.dewan = snapDewan.docs.map(d => ({ ...d.data(), id: d.id } as DewanKeamanan));
        localStorage.setItem(STORAGE_KEYS.DEWAN_KEAMANAN, JSON.stringify(this.cache.dewan));
      }

      // 6. Users
      const snapUsers = await getDocs(collection(db, CLOUD_COLLECTIONS.USERS));
      if (!snapUsers.empty) {
        this.cache.users = snapUsers.docs.map(d => ({ ...d.data(), id: d.id } as UserAccount));
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.cache.users));
      }

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

  // ==========================================
  // Koordinasi Admin & Dewan Keamanan
  // ==========================================
  public getKoordinasiList(): PesanKoordinasi[] {
    return this.cache.koordinasi.length > 0 ? this.cache.koordinasi : INITIAL_KOORDINASI;
  }

  public saveKoordinasi(pesan: PesanKoordinasi) {
    const list = [...this.getKoordinasiList()];
    const index = list.findIndex(p => p.id === pesan.id);
    if (index >= 0) {
      list[index] = pesan;
    } else {
      list.unshift(pesan);
      this.addNotification({
        judul: `[KOORDINASI ${pesan.prioritas.toUpperCase()}] ${pesan.judul}`,
        pesan: `${pesan.pengirimNama} (${pesan.kategori}): ${pesan.isi.slice(0, 90)}...`,
        tipe: pesan.prioritas === 'Mendesak' ? 'danger' : pesan.prioritas === 'Penting' ? 'warning' : 'info',
        linkMenu: 'koordinasi',
      });
      this.addLog(
        'Disposisi Koordinasi',
        `${pesan.pengirimNama} (${pesan.pengirimRole}) mengirim ${pesan.kategori} [${pesan.prioritas}]: "${pesan.judul}"`,
        'admin'
      );
    }
    this.cache.koordinasi = list;
    localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(list));
    this.notify();

    setDoc(doc(db, CLOUD_COLLECTIONS.KOORDINASI, pesan.id), sanitizeForFirestore(pesan), { merge: true })
      .catch(err => handleFirestoreError(err, OperationType.WRITE, `${CLOUD_COLLECTIONS.KOORDINASI}/${pesan.id}`));
  }

  public markKoordinasiAsRead(pesanId: string, userId: string) {
    const list = [...this.getKoordinasiList()];
    const item = list.find(p => p.id === pesanId);
    if (item) {
      let changed = false;
      if (!item.dibacaOleh.includes(userId)) {
        item.dibacaOleh.push(userId);
        changed = true;
      }
      if (item.status === 'Terkirim') {
        item.status = 'Dibaca';
        changed = true;
      }
      if (changed) {
        this.cache.koordinasi = list;
        localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(list));
        this.notify();

        setDoc(doc(db, CLOUD_COLLECTIONS.KOORDINASI, pesanId), sanitizeForFirestore(item), { merge: true })
          .catch(() => {});
      }
    }
  }

  public balasKoordinasi(pesanId: string, balasan: BalasanKoordinasi) {
    const list = [...this.getKoordinasiList()];
    const item = list.find(p => p.id === pesanId);
    if (item) {
      item.balasan.push(balasan);
      if (!item.dibacaOleh.includes(balasan.pengirimId)) {
        item.dibacaOleh.push(balasan.pengirimId);
      }
      if (balasan.pengirimRole === 'admin' && item.status === 'Terkirim') {
        item.status = 'Dibaca';
      }
      this.addNotification({
        judul: `Tanggapan Baru Koordinasi: ${item.nomorTiket}`,
        pesan: `${balasan.pengirimNama}: "${balasan.isi.slice(0, 80)}..."`,
        tipe: 'info',
        linkMenu: 'koordinasi',
      });
      this.cache.koordinasi = list;
      localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(list));
      this.notify();

      setDoc(doc(db, CLOUD_COLLECTIONS.KOORDINASI, pesanId), sanitizeForFirestore(item), { merge: true })
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

  public deleteKoordinasi(pesanId: string) {
    const list = this.getKoordinasiList().filter(p => p.id !== pesanId);
    this.cache.koordinasi = list;
    localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(list));
    this.notify();

    deleteDoc(doc(db, CLOUD_COLLECTIONS.KOORDINASI, pesanId))
      .catch(err => handleFirestoreError(err, OperationType.DELETE, `${CLOUD_COLLECTIONS.KOORDINASI}/${pesanId}`));
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
