export type Gender = 'putra' | 'putri';

export type UserRole = 
  | 'admin'
  | 'ketua_pondok'
  | 'sekretaris'
  | 'bendahara'
  | 'perlengkapan'
  | 'ketua_keamanan'
  | 'anggota_keamanan'
  | 'petugas_gerbang'
  | 'pengurus_murotil';

export interface UserAccount {
  id: string;
  username: string;
  password?: string; // Plaintext or hash for authentication simulation
  pin?: string; // 6-digit iPhone Lock Screen style PIN code (editable via Admin Option Panel)
  nama: string;
  role: UserRole;
  nrp?: string; // Nomor Registrasi Pengurus / Badge ID
  jabatan: string;
  divisi: string;
  genderAccess: 'all' | 'putra' | 'putri';
  noWa: string;
  alamat?: string;
  avatar: string;
  statusAktif: boolean;
  terakhirLogin?: string;
  murotilKelompokIds?: string[]; // Daftar ID kelompok murotil yang menjadi tanggung jawab pengurus terkait
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
  status: 'Aktif' | 'Cuti' | 'Alumni' | 'Diskors' | 'Sakit';
  kondisiKesehatan?: 'Sehat' | 'Sakit' | 'Rawat Jalan';
  poinPelanggaran: number;
  tglMasuk: string;
  suspendIzinHingga?: string; // Tanggal akhir suspensi izin keluar (YYYY-MM-DD WIB)
  alasanSuspensi?: string;
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
  waktuKembali?: string;
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

export type PusatInformasiKategori = 'Pengumuman' | 'Undangan Masuk';

export interface PusatInformasiItem {
  id: string;
  kategori: PusatInformasiKategori;
  judul: string;
  isi: string;
  tanggal: string;
  waktu?: string;
  tempat?: string;
  pengirim?: string;
  targetDivisi?: string;
  prioritas?: 'Normal' | 'Penting' | 'Mendesak';
  createdAt?: string;
}

// System configuration options for Admin Control Panel
export interface SystemConfig {
  namaPondok: string;
  logoUrl: string; // Editable Website logo URL or Base64 (Header, Login, Dashboard Utama)
  logoDashboardKeamananUrl?: string; // Editable logo khusus Dashboard Tab Keamanan (terpisah)
  logoSuratPerizinanUrl?: string; // Editable logo khusus Surat Perizinan & Sanksi Keamanan (terpisah)
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
  suratSekretarisConfig?: SuratSekretarisConfig;
  // Pengaturan Identitas Aplikasi & PWA
  namaAplikasi?: string;
  namaPendekAplikasi?: string;
  deskripsiAplikasi?: string;
  appIconUrl?: string;
  themeColor?: string;
  backgroundColor?: string;
  splashScreenUrl?: string;
  // Data Terpadu Pengurus & Divisi (Tersinkronisasi Real-Time via SystemConfig)
  beritaTerkini?: BeritaPondok[];
  beritaTerkiniList?: BeritaPondok[];
  ustadzList?: DataUstadz[];
  dataUstadzList?: DataUstadz[];
  programKerjaList?: ProgramKerja[];
  izinPengurusList?: IzinPengurus[];
  notulenRapatList?: NotulenRapat[];
  syahriyahList?: SyahriyahSantri[];
  uangSakuList?: UangSakuMutasi[];
  anggaranList?: AnggaranPondok[];
  bendaharaConfig?: BendaharaConfig;
  mutasiBarangList?: MutasiBarang[];
  jadwalPerbaikanList?: JadwalPerbaikanAset[];
  kamarSantriList?: DataKamarAsrama[];
  fasilitasGedungList?: DataFasilitasGedung[];
  perlengkapanConfig?: PerlengkapanConfig;
  pusatInformasiList?: PusatInformasiItem[];
  murotilTingkatanList?: MurotilTingkatan[];
  murotilKelompokList?: MurotilKelompok[];
  murotilAbsensiSantriList?: MurotilAbsensiSantri[];
  murotilSetoranList?: MurotilSetoranHafalan[];
  murotilAbsensiPjList?: MurotilAbsensiPj[];
  murotilConfig?: MurotilConfig;
  alamatPondok?: string;
  namaPimpinan?: string;
  sekretarisNama?: string;
  kotaInstansi?: string;
  kopSuratBaris1?: string;
  kopSuratBaris2?: string;
  alamatKopSurat?: string;
  judulSuratSanksi?: string;
  pembukaSuratSanksi?: string;
  penutupSuratSanksi?: string;
  catatanKakiSuratSanksi?: string;
  ketuaKeamananPutra?: string;
  ketuaKeamananPutri?: string;
  hotlineWa?: string;
  kinerjaBulananList?: {
    bulan: string;
    skorKinerjaPengurus: number;
    skorKedisiplinanSantri: number;
  }[];
  pertumbuhanSantriTahunan?: {
    tahun: string;
    putra: number;
    putri: number;
    total: number;
  }[];
  initialSeedCompleted?: boolean;
  sampleCleared?: boolean;
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
  tanggal?: string;
  status: StatusKoordinasi;
  dibacaOleh: string[]; // List of user IDs who have opened and read this message
  lampiranUrl?: string;
  lampiranNama?: string;
  lampiranTipe?: 'dokumen' | 'foto' | 'link';
  tindakLanjutCatatan?: string;
  tindakLanjutOleh?: string;
  tindakLanjutWaktu?: string;
  tindakLanjut?: any[];
  balasan: BalasanKoordinasi[];
}

// -------------------------------------------------------------
// 1. STRUKTUR ORGANISASI PONDOK PESANTREN
// -------------------------------------------------------------
export type DivisiPondok =
  | 'Pengasuh & Majelis'
  | 'Ketua Pondok'
  | 'Sekretaris'
  | 'Bendahara'
  | 'Perlengkapan'
  | 'Keamanan'
  | 'Pendidikan & Taklim';

export interface StrukturOrganisasiNode {
  id: string;
  jabatan: string;
  namaPengurus: string;
  nrp?: string;
  divisi: DivisiPondok;
  level: 1 | 2 | 3 | 4; // 1: Pengasuh, 2: Ketua Pondok, 3: Pimpinan Divisi, 4: Anggota/Staff
  parentId?: string;
  periode: string;
  noWa: string;
  tupoksi: string;
  statusAktif: boolean;
  urutan: number;
}

// -------------------------------------------------------------
// 2. KETUA PONDOK (AGENDA, EVALUASI, PERSETUJUAN DIVISI)
// -------------------------------------------------------------
export interface AgendaPengurus {
  id: string;
  judul: string;
  tanggal: string; // YYYY-MM-DD
  tanggalHijriah?: string;
  waktu: string; // HH:mm
  tempat: string;
  lokasi?: string;
  divisiTerkait: DivisiPondok | 'Seluruh Pengurus';
  kategori?: string;
  penanggungJawab?: string;
  pimpinanRapat?: string;
  deskripsi?: string;
  notulensi?: string;
  status: 'Terjadwal' | 'Berlangsung' | 'Selesai' | 'Ditunda';
  catatan?: string;
  dibuatOleh?: string;
  createdAt?: string;
}

export interface EvaluasiKepengurusan {
  id: string;
  tanggal: string;
  divisi: 'Sekretaris' | 'Bendahara' | 'Perlengkapan' | 'Keamanan' | 'Umum';
  judul: string;
  catatanEvaluasi: string;
  tindakLanjut: string;
  nilaiKinerja: 'Sangat Baik' | 'Baik' | 'Perlu Perbaikan';
  penulisNama: string;
  createdAt: string;
}

export interface PengajuanDivisi {
  id: string;
  nomorPengajuan: string;
  tanggal: string;
  divisi: 'Sekretaris' | 'Bendahara' | 'Perlengkapan' | 'Keamanan';
  jenisPengajuan: 'Laporan Berkala' | 'Pengajuan Anggaran' | 'Pengadaan Barang' | 'Surat Resmi' | 'Kebijakan';
  judul: string;
  deskripsi: string;
  nominalEstimasi?: number;
  pengajuNama: string;
  status: 'Menunggu Persetujuan' | 'Disetujui' | 'Perlu Revisi' | 'Ditolak';
  catatanKetua?: string;
  diputuskanOleh?: string;
  tanggalKeputusan?: string;
  lampiranNama?: string;
  lampiranUrl?: string;
}

// -------------------------------------------------------------
// 3. SEKRETARIS (PERSURATAN PROFESIONAL & 15 JENIS SURAT)
// -------------------------------------------------------------
export type KodeJenisSurat =
  | 'SK'
  | 'SU'
  | 'SPm'
  | 'SPb'
  | 'SPp'
  | 'SPn'
  | 'SM'
  | 'ST'
  | 'SKet'
  | 'SR'
  | 'SB'
  | 'SPPD'
  | 'SRT'
  | 'PK'
  | 'SPeng';

export interface TemplateSuratConfig {
  kode: KodeJenisSurat;
  namaJenis: string;
  kodeKlasifikasi: string;
  judulDefault: string;
  salamPembuka: string;
  kalimatPembuka: string;
  isiTemplate: string;
  kalimatPenutup: string;
  catatanKaki?: string;
}

export interface SuratSekretarisConfig {
  kopNamaYayasan: string;
  kopNamaPondok: string;
  kopSubInstansi: string;
  kopAlamatKontak: string;
  kopLogoUrl: string;
  kopLogoKananUrl?: string;
  formatNomorSurat: string; // Contoh: {NOMOR}/{KODE}/PP-MALIKI/{ROMAN}/{TAHUN}
  kotaTerbit: string;
  jabatanPenandatangan: string;
  namaPenandatangan: string;
  gelarPenandatangan: string;
  ttdUrl1?: string; // Link URL atau DataURL gambar tanda tangan digital Penandatangan 1 (Sekretaris)
  jabatanPenandatangan2: string;
  namaPenandatangan2: string;
  ttdUrl2?: string; // Link URL atau DataURL gambar tanda tangan digital Penandatangan 2 (Ketua Pondok)
  stempelUrl?: string; // Link URL atau DataURL gambar stempel pondok opsional
  tampilkanPenandatangan2: boolean;
  tampilkanStempel: boolean;
  tampilkanBismillah: boolean;
  ukuranLogoPx?: number; // Ukuran tinggi/lebar logo pada kop surat A4 (px)
  ukuranFontSurat?: 'kecil' | 'sedang' | 'besar';
  marginSuratMm?: number; // Margin halaman A4 dalam mm (15, 20, 25)
  perataanIsi?: 'justify' | 'left';
  posisiTanggal?: 'kanan_atas' | 'bawah_kanan';
  pejabatUpdatedAt?: number;
  templates: Record<KodeJenisSurat, TemplateSuratConfig>;
}

export interface ArsipSurat {
  id: string;
  arah: 'Keluar' | 'Masuk';
  kodeJenis: KodeJenisSurat;
  namaJenis: string;
  nomorSurat: string;
  tanggalSurat: string; // YYYY-MM-DD
  lampiran: string;
  perihal: string;
  tujuanAtauPengirim: string;
  alamatTujuan?: string;
  salamPembuka?: string;
  kalimatPembuka?: string;
  isiSurat: string;
  penutupSurat?: string;
  kotaTerbit?: string;
  jabatanPenandatangan?: string;
  namaPenandatangan?: string;
  ttdUrl1?: string;
  jabatanPenandatangan2?: string;
  namaPenandatangan2?: string;
  ttdUrl2?: string;
  tampilkanPenandatangan2?: boolean;
  tembusan?: string;
  status: 'Draft' | 'Menunggu TTD' | 'Resmi / Terbit' | 'Diarsipkan';
  fileLampiranUrl?: string;
  fileLampiranNama?: string;
  dibuatOleh: string;
  createdAt: string;
  dikirimKeKetua?: boolean;
  waktuKirimKetua?: string;
  statusRiwayatKeluar?: boolean;
  aksiRiwayatKeluar?: string;
  waktuRiwayatKeluar?: string;
  sumberScanKamera?: boolean;
  googleDocId?: string;
  googleDocUrl?: string;
  metodeScan?: 'google_docs' | 'kamera_ocr';
}

// -------------------------------------------------------------
// 4. BENDAHARA (ADMINISTRASI KEUANGAN PONDOK)
// -------------------------------------------------------------
export type TipeTransaksiKeuangan = 'Pemasukan' | 'Pengeluaran';

export interface TransaksiKeuangan {
  id: string;
  kodeTransaksi: string;
  tanggal: string; // YYYY-MM-DD
  waktu: string; // HH:mm WIB
  tipe: TipeTransaksiKeuangan;
  kategori: string;
  deskripsi: string;
  nominal: number;
  metodePembayaran: 'Tunai' | 'Transfer Bank' | 'QRIS';
  pihakTerkait: string;
  buktiUrl?: string;
  buktiNama?: string;
  pencatatNama: string;
  statusVerifikasi: 'Terverifikasi' | 'Menunggu Audit';
  createdAt: string;
}

// -------------------------------------------------------------
// 5. PERLENGKAPAN (INVENTARIS, PEMINJAMAN & PENGADAAN)
// -------------------------------------------------------------
export interface BarangInventaris {
  id: string;
  kodeBarang: string;
  namaBarang: string;
  kategori: 'Elektronik' | 'Meubel & Asrama' | 'Dapur & Konsumsi' | 'Ibadah & Kitab' | 'Keamanan & Pos' | 'Kebersihan & Umum';
  jumlah: number;
  stokMinimal?: number;
  satuan: string;
  kondisi: 'Baik' | 'Rusak Ringan' | 'Rusak Berat';
  lokasi: string;
  penanggungJawab: string;
  tanggalPerolehan: string;
  nilaiPerolehan?: number;
  catatan?: string;
  sumberBarang?: 'Pemberian' | 'Pengadaan' | 'Wakaf' | 'Lainnya';
  asalPemberian?: string;
  gedungId?: string;
  gedungNama?: string;
  fasilitasItemId?: string;
}

export interface PeminjamanBarang {
  id: string;
  kodePeminjaman: string;
  barangId: string;
  namaBarang: string;
  jumlahPinjam: number;
  peminjamNama: string;
  peminjamBagian: string;
  noWaPeminjam: string;
  tanggalPinjam: string;
  batasKembali: string;
  tanggalAktualKembali?: string;
  status: 'Dipinjam' | 'Dikembalikan' | 'Terlambat';
  petugasNama: string;
  keperluan: string;
  sumberBarang?: 'inventaris' | 'fasilitas';
  gedungId?: string;
  gedungNama?: string;
  fasilitasItemId?: string;
}

export interface BarangPeminjamanItem {
  id: string;
  namaBarang: string;
  jumlah: number;
  satuan: string;
  kondisiAwal: string;
  sumberBarang?: 'inventaris' | 'fasilitas';
  gedungId?: string;
  gedungNama?: string;
  fasilitasItemId?: string;
  inventarisId?: string;
}

export type StatusPeminjamanPerlengkapan =
  | 'Menunggu Verifikasi Ketua Pondok'
  | 'Disetujui'
  | 'Ditolak'
  | 'Sudah Dikembalikan';

export interface PeminjamanPerlengkapan {
  id: string;
  nomorSurat: string;
  namaPeminjam: string;
  statusDivisiKamar: string;
  nomorHp: string;
  tanggalPinjam: string;
  estimasiTanggalKembali: string;
  daftarBarang: BarangPeminjamanItem[];
  keperluan?: string;
  status: StatusPeminjamanPerlengkapan;
  catatanVerifikasi?: string;
  diverifikasiOleh?: string;
  waktuVerifikasi?: string;
  waktuKembali?: string;
  petugasPengembalian?: string;
  dibuatOleh?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PengaturanSuratPerlengkapan {
  judulSurat: string;
  teksPembuka: string;
  teksPenutup: string;
  namaKetuaPondok: string;
  jabatanKetuaPondok: string;
  namaKetuaPerlengkapan: string;
  jabatanKetuaPerlengkapan: string;
  tampilkanTtdPeminjam: boolean;
  tampilkanTtdPerlengkapan: boolean;
  tampilkanTtdKetuaPondok: boolean;
  ukuranFont: 'kecil' | 'sedang' | 'besar';
  tampilkanKopSurat: boolean;
  posisiQrCode: 'kiri_bawah' | 'kanan_bawah';
  // Pengaturan Layout Lanjutan (Option Panel Perlengkapan)
  kopTeksBismillah?: string;
  kopNamaInstansi?: string;
  kopNamaUnit?: string;
  kopAlamatKontak?: string;
  tampilkanBismillah?: boolean;
  tampilkanLogoKop?: boolean;
  tampilkanNomorSurat?: boolean;
  tampilkanIdentitasPeminjam?: boolean;
  tampilkanKeperluan?: boolean;
  tampilkanKolomSumber?: boolean;
  tampilkanKolomKondisi?: boolean;
  tampilkanKetentuan?: boolean;
  tampilkanQrCode?: boolean;
  tampilkanStempel?: boolean;
  labelTabelBarang?: string;
  warnaTemaSurat?: 'emerald' | 'gold' | 'classic_bw';
  gayaBorderKop?: 'double' | 'solid' | 'minimal';
  marginHalaman?: 'rapat' | 'standar' | 'lebar';
  perataanJudul?: 'center' | 'left';
  labelCatatanFooter?: string;
  updatedAt?: string;
}

// -------------------------------------------------------------
// 6. MODUL TERPADU DASHBOARD, KETUA, SEKRETARIS, BENDAHARA & PERLENGKAPAN
// -------------------------------------------------------------
export interface BeritaPondok {
  id: string;
  judul: string;
  isi: string;
  kategori: 'Maklumat Pengasuh' | 'Agenda Pondok' | 'Akademik & Taklim' | 'Keamanan & Ketertiban' | 'Informasi Wali';
  tanggal: string;
  penulis: string;
  penting: boolean;
  gambarUrl?: string;
}

export interface DataUstadz {
  id: string;
  nip: string;
  nama: string;
  gender: 'ustadz' | 'ustadzah';
  statusMukim?: 'Mukim' | 'Laju';
  jabatan: string;
  divisi: DivisiPondok;
  bidangKitab: string;
  noWa: string;
  jadwalPiket: string;
  statusAktif: boolean;
}

export interface ProgramKerja {
  id: string;
  divisi: 'Sekretaris' | 'Bendahara' | 'Perlengkapan' | 'Keamanan' | 'Pendidikan & Taklim' | 'Ketua Pondok';
  namaProgram: string;
  target: string;
  progresPersen: number;
  penanggungJawab: string;
  tenggat: string;
  status: 'Berjalan' | 'Tercapai' | 'Evaluasi';
  tanggalTercapai?: string;
}

export interface IzinPengurus {
  id: string;
  namaPengurus: string;
  jabatan: string;
  divisi: string;
  keperluan: string;
  tglMulai: string;
  tglSelesai: string;
  penggantiPiket: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  catatanKetua?: string;
}

export interface NotulenRapat {
  id: string;
  judulRapat: string;
  tanggal: string;
  waktu: string;
  tempat: string;
  pimpinanRapat: string;
  jumlahPeserta: number;
  pesertaHadir?: string;
  agendaBahasan: string;
  hasilKeputusan: string;
  notulis: string;
}

export interface BendaharaConfig {
  nominalDefaultSyahriyah: number;
  tanggalJatuhTempoSyahriyah: number;
  periodeSyahriyahAktif: string;
  saldoAwalJuta: number;
  ambangDaruratJuta: number;
  ambangStabilJuta: number;
  ambangPerkembanganPesatJuta: number;
  namaUnitKeuangan: string;
  namaBendaharaUmum: string;
  jabatanBendahara: string;
  noRekeningPondok: string;
  namaBankPondok: string;
  catatanKwitansi: string;
  kategoriPemasukan: string[];
  kategoriPengeluaran: string[];
}

export interface SyahriyahSantri {
  id: string;
  santriId: string;
  santriNama: string;
  santriNis: string;
  kelas: string;
  gender?: Gender;
  kamar?: string;
  bulanTahun: string; // Contoh: "November 2026"
  nominal: number;
  status: 'Lunas' | 'Menunggak';
  tanggalBayar?: string;
  metodeBayar?: 'Tunai' | 'Transfer Bank' | 'QRIS';
  noWaWali: string;
  namaWali: string;
  penyetorNama?: string;
  catatan?: string;
  dicatatOleh?: string;
  nomorKwitansi?: string;
}

export interface UangSakuMutasi {
  id: string;
  santriId: string;
  santriNama: string;
  santriNis: string;
  tanggal: string;
  tipe: 'Setoran' | 'Penarikan';
  nominal: number;
  keterangan: string;
  petugas: string;
}

export interface AnggaranPondok {
  id: string;
  kategori: string;
  divisi: 'Sekretaris' | 'Bendahara' | 'Perlengkapan' | 'Keamanan' | 'Dapur & Konsumsi' | 'Pendidikan & Umum';
  periode: string; // Contoh: "Semester Ganjil 2026/2027"
  nominalAnggaran: number;
  keterangan: string;
}

export interface MutasiBarang {
  id: string;
  barangId: string;
  namaBarang: string;
  tanggal: string;
  tipe: 'Masuk' | 'Keluar';
  jumlah: number;
  satuan: string;
  keterangan: string;
  petugas: string;
  targetTipe?: 'inventaris' | 'fasilitas';
  gedungId?: string;
  gedungNama?: string;
  fasilitasItemId?: string;
}

export interface JadwalPerbaikanAset {
  id: string;
  barangId: string;
  namaBarang: string;
  lokasi: string;
  kerusakan: string;
  teknisi: string;
  tanggalJadwal: string;
  estimasiBiaya: number;
  status: 'Terjadwal' | 'Sedang Dikerjakan' | 'Selesai';
}

export interface DataKamarAsrama {
  id: string;
  kodeKamar: string;
  namaKamar: string;
  asrama: string;
  gender: Gender;
  kapasitas: number;
  musyrif: string;
  fasilitas: string[];
  kondisi: 'Baik' | 'Perlu Perbaikan';
}

export interface FasilitasItemGedung {
  id: string;
  namaFasilitas: string;
  jumlah: number;
  satuan: string;
  kondisi: 'Baik' | 'Perlu Perbaikan' | 'Rusak';
  keterangan?: string;
  inventarisId?: string;
  asalPemberian?: string;
}

export interface DataFasilitasGedung {
  id: string;
  namaGedung: string;
  kategoriGedung?: string;
  penanggungJawab?: string;
  daftarFasilitas: FasilitasItemGedung[];
}

export interface PerlengkapanConfig {
  namaUnitPerlengkapan?: string;
  kepalaPerlengkapan?: string;
  jabatanKepala?: string;
  kategoriInventaris?: string[];
  satuanList?: string[];
}

// -------------------------------------------------------------
// 7. MUROTILIL QUR'AN DAN TAHFIDZ (6 TINGKATAN, KELOMPOK, ABSENSI & SETORAN)
// -------------------------------------------------------------
export interface MurotilTingkatan {
  id: string;
  urutan: number; // 1 s/d 6
  nama: string;
  targetJuz: string;
  juzOptions: string[];
  deskripsi: string;
}

export interface MurotilKelompok {
  id: string;
  kodeKelompok: string;
  namaKelompok: string;
  tingkatanId: string;
  gender: Gender | 'campuran';
  penanggungJawabNama: string;
  penanggungJawabUserId?: string;
  santriIds: string[];
  jadwalWaktu: string;
  lokasi: string;
  statusAktif: boolean;
}

export type StatusAbsensiMurotil = 'Hadir' | 'Izin' | 'Sakit' | 'Alpha';

export interface MurotilAbsensiSantri {
  id: string;
  tanggal: string; // YYYY-MM-DD
  sesi: string;
  kelompokId: string;
  tingkatanId: string;
  santriId: string;
  santriNama: string;
  santriNis: string;
  status: StatusAbsensiMurotil;
  catatan?: string;
  pencatatNama: string;
  updatedAt: string;
}

export type JenisSetoranMurotil =
  | 'Ziyadah (Hafalan Baru)'
  | 'Murajaah (Mengulang)'
  | 'Tasmi (Ujian Juz)';

export type PredikatSetoranMurotil =
  | 'Mumtaz (A)'
  | 'Jayyid Jiddan (B+)'
  | 'Jayyid (B)'
  | 'Maqbul / Mengulang (C)';

export interface MurotilSetoranHafalan {
  id: string;
  tanggal: string;
  tingkatanId: string;
  kelompokId: string;
  santriId: string;
  santriNama: string;
  santriNis: string;
  jenisSetoran: JenisSetoranMurotil;
  juz: string;
  surahAyat: string;
  nilai: PredikatSetoranMurotil;
  pengujiNama: string;
  catatan?: string;
  createdAt: string;
}

export type StatusAbsensiPjMurotil = 'Hadir' | 'Izin' | 'Sakit' | 'Badal / Tugas Luar';

export interface MurotilAbsensiPj {
  id: string;
  tanggal: string;
  sesi: string;
  kelompokId: string;
  namaKelompok: string;
  tingkatanId: string;
  userId?: string;
  namaPengurus: string;
  status: StatusAbsensiPjMurotil;
  penggantiBadal?: string;
  jamHadir?: string;
  catatan?: string;
  pencatatNama: string;
  updatedAt: string;
}

export interface MurotilConfig {
  namaUnit: string;
  koordinatorNama: string;
  koordinatorJabatan: string;
  sesiList: string[];
  allowPengurusLihatSemuaKelompok: boolean;
  catatanLaporanWord: string;
}


