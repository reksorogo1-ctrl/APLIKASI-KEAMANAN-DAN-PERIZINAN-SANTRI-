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

class StorageService {
  private listeners: (() => void)[] = [];

  constructor() {
    this.initIfEmpty();
  }

  private initIfEmpty() {
    if (!localStorage.getItem(STORAGE_KEYS.SANTRI)) {
      this.resetToDefault();
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public resetToDefault() {
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(INITIAL_SANTRI));
    localStorage.setItem(STORAGE_KEYS.DEWAN_KEAMANAN, JSON.stringify(INITIAL_DEWAN_KEAMANAN));
    localStorage.setItem(STORAGE_KEYS.PERIZINAN, JSON.stringify(INITIAL_PERIZINAN));
    localStorage.setItem(STORAGE_KEYS.TATA_TERTIB, JSON.stringify(INITIAL_TATA_TERTIB));
    localStorage.setItem(STORAGE_KEYS.PELANGGARAN, JSON.stringify(INITIAL_PELANGGARAN));
    localStorage.setItem(STORAGE_KEYS.SANKSI, JSON.stringify(INITIAL_SANKSI));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(INITIAL_SYSTEM_CONFIG));
    localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(INITIAL_KOORDINASI));
    
    // Initial activity logs
    const initialLogs: LogAktivitas[] = [
      {
        id: 'log_01',
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        user: 'Kang Deden Suherman',
        role: 'Petugas Gerbang',
        aksi: 'Check-In Santri',
        detail: 'Mencatat kepulangan santri Ahmad Zaki Mubarak (Tepat Waktu)',
        tipe: 'gerbang',
      },
      {
        id: 'log_02',
        waktu: new Date(Date.now() - 3600000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        user: 'Ustadz Abdul Rohman, S.Pd.I',
        role: 'Ketua Keamanan',
        aksi: 'Persetujuan Izin',
        detail: 'Menyetujui perizinan keluar santri Muhammad Al-Fatih Gunawan',
        tipe: 'izin',
      }
    ];
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(initialLogs));

    // Initial notifications
    const initialNotifs: NotifikasiApp[] = [
      {
        id: 'notif_01',
        waktu: 'Baru saja',
        judul: 'Peringatan Keamanan Pos Gerbang',
        pesan: 'Santri Muhammad Rizqy Habibi melewati batas waktu kembali izin (+45 menit).',
        tipe: 'danger',
        dibaca: false,
        linkMenu: 'monitoring',
        noWaTujuan: '081577889900',
      },
      {
        id: 'notif_02',
        waktu: '1 jam lalu',
        judul: 'Pengajuan Izin Baru Masuk',
        pesan: 'Santri Aisyah Nurfadilah mengajukan Izin Keluar untuk keperluan madrasah.',
        tipe: 'info',
        dibaca: false,
        linkMenu: 'perizinan',
      }
    ];
    localStorage.setItem(STORAGE_KEYS.NOTIFIKASI, JSON.stringify(initialNotifs));
    localStorage.setItem(STORAGE_KEYS.GENDER_SCOPE, 'all');
    this.notify();
  }

  // RBAC User Accounts
  public getUsers(): UserAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  }

  public saveUser(user: UserAccount) {
    const list = this.getUsers();
    const index = list.findIndex(u => u.id === user.id);
    if (index >= 0) {
      list[index] = user;
      this.addLog('Kelola Akun RBAC', `Memperbarui akun personil: ${user.nama} (${user.username})`, 'admin');
    } else {
      list.push(user);
      this.addLog('Tambah Akun RBAC', `Mendaftarkan personil baru: ${user.nama} (${user.role})`, 'admin');
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
    this.notify();
  }

  public deleteUser(userId: string) {
    const list = this.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
    this.addLog('Hapus Akun RBAC', `Menonaktifkan / menghapus akun ID: ${userId}`, 'admin');
    this.notify();
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

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(found));
    this.addLog('Autentikasi Masuk', `Personil ${found.nama} (${found.jabatan}) berhasil login ke sistem.`, 'admin');
    this.notify();

    return { success: true, user: found };
  }

  public logout() {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      this.addLog('Keluar Sistem', `Pengguna ${currentUser.nama} keluar dari sistem.`, 'admin');
    }
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    this.notify();
  }

  public getCurrentUser(): UserAccount | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  // System Configuration (Admin Option Panel)
  public getSystemConfig(): SystemConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIG);
      return data ? JSON.parse(data) : INITIAL_SYSTEM_CONFIG;
    } catch {
      return INITIAL_SYSTEM_CONFIG;
    }
  }

  public updateSystemConfig(config: Partial<SystemConfig>) {
    const current = this.getSystemConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(updated));
    this.addLog('Konfigurasi Sistem', 'Admin memperbarui parameter pengaturan manual di Option Panel.', 'admin');
    this.notify();
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

  // Data Santri
  public getSantriList(): Santri[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SANTRI);
      return data ? JSON.parse(data) : INITIAL_SANTRI;
    } catch {
      return INITIAL_SANTRI;
    }
  }

  public saveSantri(santri: Santri) {
    const list = this.getSantriList();
    const index = list.findIndex(s => s.id === santri.id);
    if (index >= 0) {
      list[index] = santri;
      this.addLog('Perbarui Santri', `Memperbarui data: ${santri.nama} (${santri.nis})`, 'santri');
    } else {
      list.unshift(santri);
      this.addLog('Tambah Santri', `Menambahkan santri: ${santri.nama} (${santri.nis})`, 'santri');
    }
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(list));
    this.notify();
  }

  public deleteSantri(id: string) {
    const list = this.getSantriList();
    const target = list.find(s => s.id === id);
    const updated = list.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(updated));
    if (target) {
      this.addLog('Hapus Santri', `Menghapus data santri: ${target.nama} (${target.nis})`, 'santri');
    }
    this.notify();
  }

  // Dewan Keamanan
  public getDewanKeamananList(): DewanKeamanan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DEWAN_KEAMANAN);
      return data ? JSON.parse(data) : INITIAL_DEWAN_KEAMANAN;
    } catch {
      return INITIAL_DEWAN_KEAMANAN;
    }
  }

  public saveDewanKeamanan(pengurus: DewanKeamanan) {
    const list = this.getDewanKeamananList();
    const index = list.findIndex(p => p.id === pengurus.id);
    if (index >= 0) {
      list[index] = pengurus;
    } else {
      list.unshift(pengurus);
    }
    localStorage.setItem(STORAGE_KEYS.DEWAN_KEAMANAN, JSON.stringify(list));
    this.notify();
  }

  public deleteDewanKeamanan(id: string) {
    const list = this.getDewanKeamananList();
    const updated = list.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.DEWAN_KEAMANAN, JSON.stringify(updated));
    this.notify();
  }

  // Perizinan
  public getPerizinanList(): Perizinan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PERIZINAN);
      return data ? JSON.parse(data) : INITIAL_PERIZINAN;
    } catch {
      return INITIAL_PERIZINAN;
    }
  }

  public savePerizinan(izin: Perizinan, note?: string) {
    const list = this.getPerizinanList();
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
      } else {
        // Data revision/correction
        this.addAuditLog({
          aksi: 'Koreksi/Revisi Data Perizinan',
          detail: `Pengurus merevisi rincian perizinan santri ${izin.santriNama} (${izin.nomorIzin}). ${note ? `Alasan: ${note}` : ''}`,
          tipe: 'koreksi',
          izinId: izin.id,
          santriId: izin.santriId,
          santriNama: izin.santriNama,
          santriNis: izin.santriNis,
          santriGender: izin.santriGender,
          jenisIzin: izin.jenisIzin,
          statusIzin: izin.status,
          peranAktor: 'Pengawas',
          isRevisi: true,
          alasanRevisi: note || 'Penyesuaian jadwal atau rincian penjemput',
          dataSebelum: prev,
          dataSesudah: izin,
        });
      }
    } else {
      // New permit submission
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

    localStorage.setItem(STORAGE_KEYS.PERIZINAN, JSON.stringify(list));
    this.notify();
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

    localStorage.setItem(STORAGE_KEYS.PERIZINAN, JSON.stringify(updated));
    this.notify();
  }

  // Tata Tertib
  public getTataTertibList(): TataTertib[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TATA_TERTIB);
      return data ? JSON.parse(data) : INITIAL_TATA_TERTIB;
    } catch {
      return INITIAL_TATA_TERTIB;
    }
  }

  public saveTataTertib(tt: TataTertib) {
    const list = this.getTataTertibList();
    const index = list.findIndex(t => t.id === tt.id);
    if (index >= 0) {
      list[index] = tt;
    } else {
      list.push(tt);
    }
    localStorage.setItem(STORAGE_KEYS.TATA_TERTIB, JSON.stringify(list));
    this.notify();
  }

  public deleteTataTertib(id: string) {
    const list = this.getTataTertibList();
    const updated = list.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TATA_TERTIB, JSON.stringify(updated));
    this.notify();
  }

  // Pelanggaran & Takzir
  public getPelanggaranList(): Pelanggaran[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PELANGGARAN);
      return data ? JSON.parse(data) : INITIAL_PELANGGARAN;
    } catch {
      return INITIAL_PELANGGARAN;
    }
  }

  public savePelanggaran(pel: Pelanggaran, note?: string) {
    const list = this.getPelanggaranList();
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

    localStorage.setItem(STORAGE_KEYS.PELANGGARAN, JSON.stringify(list));
    this.notify();
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
    localStorage.setItem(STORAGE_KEYS.PELANGGARAN, JSON.stringify(updated));
    this.notify();
  }

  private updateSantriPoin(santriId: string, poinDelta: number) {
    const santriList = this.getSantriList();
    const santri = santriList.find(s => s.id === santriId);
    if (santri) {
      santri.poinPelanggaran = Math.max(0, (santri.poinPelanggaran || 0) + poinDelta);
      localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(santriList));
    }
  }

  // Sanksi & Takzir Edukatif
  public getSanksiList(): Sanksi[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SANKSI);
      return data ? JSON.parse(data) : INITIAL_SANKSI;
    } catch {
      return INITIAL_SANKSI;
    }
  }

  public saveSanksi(sanksi: Sanksi, note?: string) {
    const list = this.getSanksiList();
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
      } else {
        this.addAuditLog({
          aksi: 'Koreksi/Pembaruan Data Takzir',
          detail: `Pengurus memperbarui data sanksi takzir ${sanksi.kodeSanksi} santri ${sanksi.santriNama}. ${note ? `Catatan: ${note}` : ''}`,
          tipe: 'koreksi',
          sanksiId: sanksi.id,
          santriId: sanksi.santriId,
          santriNama: sanksi.santriNama,
          santriNis: sanksi.santriNis,
          santriGender: sanksi.santriGender,
          jenisHukuman: sanksi.bentukSanksi,
          statusHukuman: sanksi.status,
          peranAktor: 'Penetap',
          isRevisi: true,
          alasanRevisi: note || 'Penyesuaian target atau bentuk pembinaan',
          dataSebelum: prev,
          dataSesudah: preparedSanksi,
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

    localStorage.setItem(STORAGE_KEYS.SANKSI, JSON.stringify(list));
    this.notify();
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

    localStorage.setItem(STORAGE_KEYS.SANKSI, JSON.stringify(updated));
    this.notify();
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
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (data) {
        const parsed: LogAktivitas[] = JSON.parse(data);
        if (parsed.length > 0) return parsed;
      }
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
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

    // Immutable append-only log: newest entries on top, preserves history
    const existing = this.getLogs();
    const logs = [newLog, ...existing].slice(0, 300);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    this.notify();
    return newLog;
  }

  public addLog(aksi: string, detail: string, tipe: LogAktivitas['tipe']) {
    return this.addAuditLog({ aksi, detail, tipe });
  }

  // Notifications
  public getNotifications(): NotifikasiApp[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFIKASI);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public addNotification(notif: Omit<NotifikasiApp, 'id' | 'waktu' | 'dibaca'>) {
    const newNotif: NotifikasiApp = {
      id: `notif_${Date.now()}`,
      waktu: 'Baru saja',
      dibaca: false,
      ...notif,
    };
    const current = [newNotif, ...this.getNotifications()].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.NOTIFIKASI, JSON.stringify(current));
    this.notify();
  }

  public markAllNotificationsRead() {
    const current = this.getNotifications().map(n => ({ ...n, dibaca: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFIKASI, JSON.stringify(current));
    this.notify();
  }

  // -------------------------------------------------------------
  // TAB KOORDINASI ADMIN DAN DEWAN KEAMANAN
  // -------------------------------------------------------------
  public getKoordinasiList(): PesanKoordinasi[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.KOORDINASI);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(INITIAL_KOORDINASI));
        return INITIAL_KOORDINASI;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_KOORDINASI;
    }
  }

  public saveKoordinasi(pesan: PesanKoordinasi) {
    const list = this.getKoordinasiList();
    const index = list.findIndex(p => p.id === pesan.id);
    if (index >= 0) {
      list[index] = pesan;
    } else {
      list.unshift(pesan);
      // Auto notification to dashboard
      this.addNotification({
        judul: `[KOORDINASI ${pesan.prioritas.toUpperCase()}] ${pesan.judul}`,
        pesan: `${pesan.pengirimNama} (${pesan.kategori}): ${pesan.isi.slice(0, 90)}...`,
        tipe: pesan.prioritas === 'Mendesak' ? 'danger' : pesan.prioritas === 'Penting' ? 'warning' : 'info',
        linkMenu: 'koordinasi',
      });
      // Audit log
      this.addLog(
        'Disposisi Koordinasi',
        `${pesan.pengirimNama} (${pesan.pengirimRole}) mengirim ${pesan.kategori} [${pesan.prioritas}]: "${pesan.judul}"`,
        'admin'
      );
    }
    localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(list));
    this.notify();
  }

  public markKoordinasiAsRead(pesanId: string, userId: string) {
    const list = this.getKoordinasiList();
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
        localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(list));
        this.notify();
      }
    }
  }

  public balasKoordinasi(pesanId: string, balasan: BalasanKoordinasi) {
    const list = this.getKoordinasiList();
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
      localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(list));
      this.notify();
    }
  }

  public tindakLanjutiKoordinasi(pesanId: string, catatan: string, petugasNama: string) {
    const list = this.getKoordinasiList();
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
      localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(list));
      this.notify();
    }
  }

  public deleteKoordinasi(pesanId: string) {
    const list = this.getKoordinasiList();
    const filtered = list.filter(p => p.id !== pesanId);
    localStorage.setItem(STORAGE_KEYS.KOORDINASI, JSON.stringify(filtered));
    this.notify();
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

  // Backup & Restore
  public exportFullBackup(): string {
    const backup = {
      timestamp: new Date().toISOString(),
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

  public importFullBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.santri) localStorage.setItem(STORAGE_KEYS.SANTRI, JSON.stringify(parsed.santri));
      if (parsed.dewanKeamanan) localStorage.setItem(STORAGE_KEYS.DEWAN_KEAMANAN, JSON.stringify(parsed.dewanKeamanan));
      if (parsed.perizinan) localStorage.setItem(STORAGE_KEYS.PERIZINAN, JSON.stringify(parsed.perizinan));
      if (parsed.tataTertib) localStorage.setItem(STORAGE_KEYS.TATA_TERTIB, JSON.stringify(parsed.tataTertib));
      if (parsed.pelanggaran) localStorage.setItem(STORAGE_KEYS.PELANGGARAN, JSON.stringify(parsed.pelanggaran));
      if (parsed.sanksi) localStorage.setItem(STORAGE_KEYS.SANKSI, JSON.stringify(parsed.sanksi));
      if (parsed.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed.users));
      if (parsed.config) localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(parsed.config));
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
