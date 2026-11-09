export type Gender = 'putra' | 'putri';

export type UserRole = 
  | 'admin'
  | 'ketua_keamanan'
  | 'anggota_keamanan'
  | 'petugas_gerbang';

export interface UserAccount {
  id: string;
  username: string;
  password?: string; // Plaintext or hash for authentication simulation
  nama: string;
  role: UserRole;
  nrp?: string; // Nomor Registrasi Pengurus / Badge ID
  jabatan: string;
  divisi: string;
  genderAccess: 'all' | 'putra' | 'putri';
  noWa: string;
  avatar: string;
  statusAktif: boolean;
  terakhirLogin?: string;
}

export interface Santri {
  id: string;
  nis: string;
  nama: string;
  foto: string;
  gender: Gender;
  kelas: string;
  kamar: string;
  asrama: string;
  alamat: string;
  namaWali: string;
  noWaWali: string;
  jarakRumahKm: number;
  status: 'Aktif' | 'Cuti' | 'Alumni' | 'Diskors';
  poinPelanggaran: number;
  tglMasuk: string;
}

export interface DewanKeamanan {
  id: string;
  nrp: string;
  nama: string;
  foto: string;
  jabatan: string;
  divisi: 'Keamanan Banin (Putra)' | 'Keamanan Banat (Putri)' | 'Patroli & Intelijen' | 'Pos Gerbang Utama' | 'Biro Komando Pusat';
  noWa: string;
  alamat: string;
  statusKeaktifan: 'Aktif' | 'Izin' | 'Nonaktif';
  jadwalPiket: {
    hari: string;
    shift: 'Pagi (06.00 - 14.00)' | 'Sore (14.00 - 22.00)' | 'Malam (22.00 - 06.00)';
    pos: string;
  }[];
}

export type JenisIzin = 
  | 'Izin Keluar' 
  | 'Izin Pulang' 
  | 'Izin Berobat' 
  | 'Izin Keperluan Keluarga' 
  | 'Izin Tugas/Lomba';

export type StatusIzin = 
  | 'Diajukan' 
  | 'Diverifikasi' 
  | 'Disetujui' 
  | 'Ditolak' 
  | 'Sedang Keluar' 
  | 'Sudah Kembali' 
  | 'Terlambat';

export interface ApprovalStep {
  role: string;
  nama: string;
  tanggal: string;
  status: 'Setuju' | 'Tolak';
  catatan?: string;
}

export interface Perizinan {
  id: string;
  nomorIzin: string;
  santriId: string;
  santriNama: string;
  santriNis: string;
  santriGender: Gender;
  santriKelas: string;
  santriKamar: string;
  jenisIzin: JenisIzin;
  tglKeluar: string;
  jamKeluar: string;
  tglKembali: string;
  jamKembali: string;
  alasan: string;
  tujuan: string;
  namaPenjemput: string;
  noWaPenjemput: string;
  hubunganPenjemput: string;
  lampiranUrl?: string;
  status: StatusIzin;
  catatanPenolakan?: string;
  riwayatPersetujuan: ApprovalStep[];
  
  // Gate check logs
  actualKeluar?: string;
  actualKembali?: string;
  petugasKeluar?: string;
  petugasKembali?: string;
  fotoKeluar?: string;
  fotoKembali?: string;
  menitKeterlambatan?: number;
  qrCode?: string;
  tglPengajuan: string;
  petugasPencatat?: string;
  disetujuiOleh?: string;
}

export type TingkatPelanggaran = 'Ringan' | 'Sedang' | 'Berat';

export interface TataTertib {
  id: string;
  kode: string;
  kategori: 'Ubudiyah & Ibadah' | 'Akhlaq & Adab' | 'Ketertiban Keamanan' | 'Larangan Elektronik & Media' | 'Kebersihan & Kesehatan';
  pasal: string;
  deskripsi: string;
  tingkat: TingkatPelanggaran;
  poin: number;
  rekomendasiSanksi: string;
}

export interface Pelanggaran {
  id: string;
  kodePelanggaran: string;
  santriId: string;
  santriNama: string;
  santriNis: string;
  santriGender: Gender;
  tanggal: string;
  waktu: string;
  tataTertibId: string;
  jenisPelanggaran: string;
  kategori: TingkatPelanggaran;
  poin: number;
  kronologi: string;
  lokasi: string;
  buktiUrl?: string;
  namaPetugasPelapor: string;
  statusVerifikasi: 'Terverifikasi' | 'Menunggu Verifikasi' | 'Dibatalkan';
  sanksiId?: string;
}

export type StatusSanksi = 'Belum Dikerjakan' | 'Sedang Berjalan' | 'Selesai';

export interface SuratSanksiLayoutConfig {
  teksBismillah?: string;
  kopNamaInstansi?: string;
  kopSubInstansi?: string;
  kopAlamatKontak?: string;
  judulSurat?: string;
  formatNomorSurat?: string;
  kalimatPembuka?: string;
  tampilkanNis?: boolean;
  tampilkanKelas?: boolean;
  tampilkanKamar?: boolean;
  tampilkanWali?: boolean;
  tampilkanHariTanggal?: boolean;
  tampilkanBatasWaktu?: boolean;
  formatKalimatHukuman?: string;
  pesanEdukasi?: string;
  kotaTerbit?: string;
  jumlahTandaTangan?: 2 | 3;
  posisiTandaTangan?: 'kiri-kanan' | 'sejajar';
  jabatanPihak1?: string;
  namaPihak1?: string;
  gelarPihak1?: string;
  jabatanPihak2?: string;
  namaPihak2?: string;
  gelarPihak2?: string;
  jabatanPihak3?: string;
  namaPihak3?: string;
  gelarPihak3?: string;
  footerCatatan?: string;
  tampilkanStempelSah?: boolean;
}

export interface Sanksi {
  id: string;
  kodeSanksi: string;
  pelanggaranId: string;
  santriId: string;
  santriNama: string;
  santriNis: string;
  santriGender: Gender;
  santriKelas?: string;
  santriKamar?: string;
  jenisPelanggaran: string;
  pelanggaranTanggal?: string;
  pelanggaranHari?: string;
  kronologi?: string;
  bentukSanksi: string;
  tanggalPenetapan: string;
  petugasPenetap: string;
  petugasPencatat?: string;
  tanggalTargetSelesai: string;
  tanggalAktualSelesai?: string;
  batasMaksimal?: string;
  status: StatusSanksi;
  ustadzPembina: string;
  catatanPembinaan?: string;
  customNomorSurat?: string;
  snapshotLayout?: SuratSanksiLayoutConfig; // Layout configuration frozen at generation time
}

export interface LogAktivitas {
  id: string;
  waktu: string;
  timestamp?: number;
  user: string;
  nrp?: string;
  role: string;
  avatar?: string;
  aksi: string;
  detail: string;
  tipe: 'izin' | 'gerbang' | 'pelanggaran' | 'sanksi' | 'santri' | 'admin' | 'koreksi';
  
  // A. Monitoring Perizinan
  izinId?: string;
  santriId?: string;
  santriNama?: string;
  santriNis?: string;
  santriGender?: Gender;
  jenisIzin?: string;
  waktuPengajuan?: string;
  petugasPencatat?: string;
  petugasPenyetujui?: string;
  waktuKeluar?: string;
  waktuKembali?: string;
  statusIzin?: string;

  // B. Monitoring Takzir / Pelanggaran
  pelanggaranId?: string;
  sanksiId?: string;
  jenisPelanggaran?: string;
  kronologi?: string;
  jenisHukuman?: string;
  petugasPelapor?: string;
  petugasPenetapHukuman?: string;
  waktuPemberian?: string;
  statusHukuman?: string;

  // D. Sistem Audit & Akuntabilitas
  peranAktor?: 'Pencatat' | 'Pemroses' | 'Penyetujui' | 'Penetap' | 'Pengawas';
  dataSebelum?: Record<string, any>;
  dataSesudah?: Record<string, any>;
  isRevisi?: boolean;
  alasanRevisi?: string;
  revisiDariId?: string;
  hashAudit?: string;
}

export interface NotifikasiApp {
  id: string;
  waktu: string;
  judul: string;
  pesan: string;
  tipe: 'info' | 'warning' | 'danger' | 'success';
  dibaca: boolean;
  linkMenu?: string;
  noWaTujuan?: string;
  waPesanTemplate?: string;
}

// Surat Izin Digital layout customization for Admin Option Panel
export interface SuratIzinLayoutConfig {
  teksBismillah?: string;
  kopNamaInstansi?: string;
  kopSubInstansi?: string;
  kopAlamatKontak?: string;
  judulSurat?: string;
  formatNomorSurat?: string;
  kalimatPembuka?: string;
  ketentuanPoin1?: string;
  ketentuanPoin2?: string;
  ketentuanPoin3?: string;
  kotaTerbit?: string;
  jabatanPenandatangan?: string;
  namaPenandatangan?: string;
  gelarPenandatangan?: string;
  tampilkanStempelSah?: boolean;
  tampilkanQrCode?: boolean;
}

// System configuration options for Admin Control Panel
export interface SystemConfig {
  namaPondok: string;
  logoUrl: string; // Editable logo URL or Base64
  bgUrl: string; // Editable tactical background URL or Base64
  bgOpacity: number; // Background overlay opacity (0 to 100)
  gerbangStrictEnforcement: boolean; // Cannot leave without approved permit
  autoGenerateViolationOnLate: boolean; // Auto record violation when late
  toleransiKeterlambatanMenit: number; // Grace period in minutes
  notifikasiWaAutoDirect: boolean; // Auto open WhatsApp template
  segregasiBaninBanatKetat: boolean; // Strict division between Banin and Banat
  kuotaIzinHarian: number; // Max permits per day
  modeOperasiDarurat: boolean; // Emergency lockdown mode
  suratIzinLayout?: SuratIzinLayoutConfig;
  suratSanksiLayout?: SuratSanksiLayoutConfig;
  // Pengaturan Identitas Aplikasi & PWA
  namaAplikasi?: string;
  namaPendekAplikasi?: string;
  deskripsiAplikasi?: string;
  appIconUrl?: string;
  themeColor?: string;
  backgroundColor?: string;
  splashScreenUrl?: string;
}

// -------------------------------------------------------------
// TAB KOORDINASI ADMIN DAN DEWAN KEAMANAN
// -------------------------------------------------------------
export type PrioritasKoordinasi = 'Normal' | 'Penting' | 'Mendesak';
export type StatusKoordinasi = 'Terkirim' | 'Dibaca' | 'Ditindaklanjuti';
export type KategoriKoordinasi = 
  | 'Instruksi Admin' 
  | 'Laporan Keamanan' 
  | 'Kendala & Kebutuhan' 
  | 'Laporan Kejadian' 
  | 'Tanggapan Instruksi';

export interface BalasanKoordinasi {
  id: string;
  pesanId: string;
  pengirimId: string;
  pengirimNama: string;
  pengirimRole: UserRole;
  pengirimJabatan?: string;
  pengirimAvatar?: string;
  isi: string;
  waktu: string;
  lampiranUrl?: string;
  lampiranNama?: string;
}

export interface PesanKoordinasi {
  id: string;
  nomorTiket: string;
  judul: string;
  isi: string;
  prioritas: PrioritasKoordinasi;
  kategori: KategoriKoordinasi;
  pengirimId: string;
  pengirimNama: string;
  pengirimRole: UserRole;
  pengirimJabatan?: string;
  pengirimAvatar?: string;
  tujuan: 'semua_dewan' | 'admin' | string;
  waktu: string;
  status: StatusKoordinasi;
  dibacaOleh: string[]; // List of user IDs who have opened and read this message
  lampiranUrl?: string;
  lampiranNama?: string;
  lampiranTipe?: 'dokumen' | 'foto' | 'link';
  tindakLanjutCatatan?: string;
  tindakLanjutOleh?: string;
  tindakLanjutWaktu?: string;
  balasan: BalasanKoordinasi[];
}
