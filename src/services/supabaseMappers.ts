import type {
  AgendaPengurus,
  ArsipSurat,
  BarangInventaris,
  DataFasilitasGedung,
  DataUstadz,
  DewanKeamanan,
  EvaluasiKepengurusan,
  JadwalPerbaikanAset,
  LogAktivitas,
  MurotilAbsensiPj,
  MurotilAbsensiSantri,
  NotifikasiApp,
  Pelanggaran,
  PeminjamanBarang,
  PeminjamanPerlengkapan,
  PengajuanDivisi,
  PengaturanSuratPerlengkapan,
  Perizinan,
  PesanKoordinasi,
  Sanksi,
  Santri,
  StrukturOrganisasiNode,
  SystemConfig,
  TataTertib,
  TransaksiKeuangan,
  UserAccount,
} from '../types';

export interface SupabaseJsonRow {
  id: string;
  data?: Record<string, unknown> | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export function cleanJsonData<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanJsonData(item)) as unknown as T;
  }
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v !== undefined) {
      clean[k] = cleanJsonData(v);
    }
  }
  return clean as T;
}

export function fromSupabaseRow<T extends { id: string }>(row: SupabaseJsonRow): T {
  const payload = row?.data && typeof row.data === 'object' ? row.data : {};
  return {
    ...(payload as T),
    id: String(row.id || (payload as { id?: string }).id || ''),
  };
}

export function toUserRow(u: UserAccount) {
  const clean = cleanJsonData(u);
  return {
    id: clean.id,
    username: clean.username || '',
    nama: clean.nama || '',
    role: clean.role || 'keamanan',
    jabatan: clean.jabatan || '',
    gender_access: clean.genderAccess || 'all',
    status_aktif: Boolean(clean.statusAktif ?? true),
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toSystemConfigRow(cfg: SystemConfig) {
  const clean = cleanJsonData(cfg);
  return {
    id: 'main',
    nama_pondok: clean.namaPondok || 'Pondok Pesantren Salaf Al-Maliki',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toSantriRow(s: Santri) {
  const clean = cleanJsonData(s);
  return {
    id: clean.id,
    nis: clean.nis || '',
    nama: clean.nama || '',
    gender: clean.gender || 'putra',
    kelas: clean.kelas || '',
    kamar: clean.kamar || '',
    asrama: clean.asrama || '',
    status: clean.status || 'Aktif',
    poin_pelanggaran: Math.round(Number(clean.poinPelanggaran || 0)),
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toUstadzRow(u: DataUstadz) {
  const clean = cleanJsonData(u);
  return {
    id: clean.id,
    nip: clean.nip || '',
    nama: clean.nama || '',
    gender: clean.gender || 'ustadz',
    jabatan: clean.jabatan || '',
    divisi: clean.divisi || '',
    status_mukim: clean.statusMukim || 'Mukim',
    status_aktif: Boolean(clean.statusAktif ?? true),
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toFasilitasGedungRow(f: DataFasilitasGedung) {
  const clean = cleanJsonData(f);
  return {
    id: clean.id,
    nama_gedung: clean.namaGedung || '',
    kode_gedung: clean.id || '',
    kategori: clean.kategoriGedung || '',
    kondisi_umum: clean.daftarFasilitas?.[0]?.kondisi || 'Baik',
    penanggung_jawab: clean.penanggungJawab || '',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toDewanKeamananRow(d: DewanKeamanan) {
  const clean = cleanJsonData(d);
  const firstShift = Array.isArray(clean.jadwalPiket) && clean.jadwalPiket[0]?.shift ? clean.jadwalPiket[0].shift : '';
  return {
    id: clean.id,
    nrp: clean.nrp || '',
    nama: clean.nama || '',
    gender: clean.divisi?.toLowerCase().includes('banat') ? 'putri' : 'putra',
    jabatan: clean.jabatan || '',
    shift: firstShift,
    status_aktif: clean.statusKeaktifan !== 'Nonaktif',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toPerizinanRow(p: Perizinan) {
  const clean = cleanJsonData(p);
  return {
    id: clean.id,
    nomor_izin: clean.nomorIzin || '',
    santri_id: clean.santriId || '',
    santri_nama: clean.santriNama || '',
    santri_gender: clean.santriGender || 'putra',
    jenis_izin: clean.jenisIzin || '',
    status: clean.status || 'Menunggu',
    tgl_keluar: clean.tglKeluar || '',
    tgl_kembali: clean.tglKembali || '',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toTataTertibRow(t: TataTertib) {
  const clean = cleanJsonData(t);
  return {
    id: clean.id,
    kode: clean.kode || '',
    kategori: clean.kategori || '',
    pasal: clean.pasal || '',
    poin_sanksi: Math.round(Number(clean.poin || 0)),
    aktif: true,
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toPelanggaranRow(p: Pelanggaran) {
  const clean = cleanJsonData(p);
  return {
    id: clean.id,
    kode_pelanggaran: clean.kodePelanggaran || '',
    santri_id: clean.santriId || '',
    santri_nama: clean.santriNama || '',
    jenis_pelanggaran: clean.jenisPelanggaran || '',
    kategori: clean.kategori || '',
    poin: Math.round(Number(clean.poin || 0)),
    tanggal: clean.tanggal || '',
    status_penanganan: clean.statusVerifikasi || 'Menunggu Verifikasi',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toSanksiRow(s: Sanksi) {
  const clean = cleanJsonData(s);
  return {
    id: clean.id,
    kode_sanksi: clean.kodeSanksi || '',
    pelanggaran_id: clean.pelanggaranId || '',
    santri_id: clean.santriId || '',
    santri_nama: clean.santriNama || '',
    bentuk_sanksi: clean.bentukSanksi || '',
    status: clean.status || 'Aktif',
    tanggal_penetapan: clean.tanggalPenetapan || '',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toSuratMenyuratRow(s: ArsipSurat) {
  const clean = cleanJsonData(s);
  return {
    id: clean.id,
    arah: clean.arah || 'Keluar',
    kode_jenis: clean.kodeJenis || 'SK',
    nomor_surat: clean.nomorSurat || '',
    tanggal_surat: clean.tanggalSurat || '',
    perihal: clean.perihal || '',
    tujuan_atau_pengirim: clean.tujuanAtauPengirim || '',
    status: clean.status || 'Diarsipkan',
    file_lampiran_url: clean.fileLampiranUrl || '',
    file_lampiran_nama: clean.fileLampiranNama || '',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toPeminjamanPerlengkapanRow(p: PeminjamanPerlengkapan) {
  const clean = cleanJsonData(p);
  return {
    id: clean.id,
    nomor_surat: clean.nomorSurat || '',
    nama_peminjam: clean.namaPeminjam || '',
    status_divisi_kamar: clean.statusDivisiKamar || '',
    nomor_hp: clean.nomorHp || '',
    tanggal_pinjam: clean.tanggalPinjam || '',
    estimasi_tanggal_kembali: clean.estimasiTanggalKembali || '',
    status: clean.status || 'Menunggu Verifikasi Ketua Pondok',
    created_at: clean.createdAt || '',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toPengaturanSuratPerlengkapanRow(cfg: PengaturanSuratPerlengkapan) {
  const clean = cleanJsonData(cfg);
  return {
    id: 'default',
    judul_surat: clean.judulSurat || '',
    nama_ketua_pondok: clean.namaKetuaPondok || '',
    nama_ketua_perlengkapan: clean.namaKetuaPerlengkapan || '',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toPerlengkapanInventarisRow(b: BarangInventaris) {
  const clean = cleanJsonData(b);
  return {
    id: clean.id,
    kode_barang: clean.kodeBarang || '',
    nama_barang: clean.namaBarang || '',
    kategori: clean.kategori || '',
    jumlah: Math.round(Number(clean.jumlah || 0)),
    satuan: clean.satuan || 'Unit',
    kondisi: clean.kondisi || 'Baik',
    lokasi: clean.lokasi || '',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toPerlengkapanPeminjamanRow(p: PeminjamanBarang) {
  const clean = cleanJsonData(p);
  return {
    id: clean.id,
    kode_peminjaman: clean.kodePeminjaman || '',
    barang_id: clean.barangId || '',
    nama_barang: clean.namaBarang || '',
    peminjam_nama: clean.peminjamNama || '',
    status: clean.status || 'Dipinjam',
    tanggal_pinjam: clean.tanggalPinjam || '',
    batas_kembali: clean.batasKembali || '',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toJadwalAgendaFromPengurus(a: AgendaPengurus) {
  const clean = cleanJsonData(a);
  return {
    id: clean.id,
    sumber: 'agenda_pengurus',
    judul: clean.judul || '',
    tanggal: clean.tanggal || '',
    kategori: clean.kategori || '',
    status: clean.status || 'Terjadwal',
    divisi_terkait: clean.divisiTerkait || '',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toJadwalAgendaFromPerbaikan(j: JadwalPerbaikanAset) {
  const clean = cleanJsonData(j);
  return {
    id: `perbaikan__${clean.id}`,
    sumber: 'perbaikan_aset',
    judul: clean.namaBarang || '',
    tanggal: clean.tanggalJadwal || '',
    kategori: clean.kerusakan || 'Perbaikan',
    status: clean.status || 'Terjadwal',
    divisi_terkait: 'Perlengkapan',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toAbsensiSantriRow(a: MurotilAbsensiSantri) {
  const clean = cleanJsonData(a);
  return {
    id: `abs_s__${clean.id}`,
    jenis: 'santri',
    tanggal: clean.tanggal || '',
    sesi: clean.sesi || '',
    status: clean.status || 'Hadir',
    subjek_id: clean.santriId || '',
    subjek_nama: clean.santriNama || '',
    kelompok_id: clean.kelompokId || '',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toAbsensiPjRow(a: MurotilAbsensiPj) {
  const clean = cleanJsonData(a);
  return {
    id: `abs_pj__${clean.id}`,
    jenis: 'pj',
    tanggal: clean.tanggal || '',
    sesi: clean.sesi || '',
    status: clean.status || 'Hadir',
    subjek_id: clean.userId || '',
    subjek_nama: clean.namaPengurus || '',
    kelompok_id: clean.kelompokId || '',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toKeuanganTransaksiRow(t: TransaksiKeuangan) {
  const clean = cleanJsonData(t);
  return {
    id: clean.id,
    kode_transaksi: clean.kodeTransaksi || '',
    tanggal: clean.tanggal || '',
    tipe: clean.tipe || 'Pemasukan',
    kategori: clean.kategori || '',
    nominal: Number(clean.nominal || 0),
    status_verifikasi: clean.statusVerifikasi || 'Terverifikasi',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toKoordinasiRow(k: PesanKoordinasi) {
  const clean = cleanJsonData(k);
  return {
    id: clean.id,
    nomor_tiket: clean.nomorTiket || '',
    judul: clean.judul || '',
    prioritas: clean.prioritas || 'Normal',
    kategori: clean.kategori || '',
    pengirim_nama: clean.pengirimNama || '',
    tujuan: clean.tujuan || '',
    status: clean.status || 'Terkirim',
    tanggal: clean.tanggal || '',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toStrukturOrganisasiRow(s: StrukturOrganisasiNode) {
  const clean = cleanJsonData(s);
  return {
    id: clean.id,
    level: Math.round(Number(clean.level || 1)),
    urutan: Math.round(Number(clean.urutan || 1)),
    jabatan: clean.jabatan || '',
    nama_pengurus: clean.namaPengurus || '',
    divisi: clean.divisi || '',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toEvaluasiKepengurusanRow(e: EvaluasiKepengurusan) {
  const clean = cleanJsonData(e);
  return {
    id: clean.id,
    tanggal: clean.tanggal || '',
    divisi: clean.divisi || '',
    judul: clean.judul || '',
    nilai_kinerja: clean.nilaiKinerja || 'Baik',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toPengajuanDivisiRow(p: PengajuanDivisi) {
  const clean = cleanJsonData(p);
  return {
    id: clean.id,
    nomor_pengajuan: clean.nomorPengajuan || '',
    tanggal: clean.tanggal || '',
    divisi: clean.divisi || '',
    jenis_pengajuan: clean.jenisPengajuan || '',
    judul: clean.judul || '',
    status: clean.status || 'Menunggu Persetujuan',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toNotifikasiRow(n: NotifikasiApp) {
  const clean = cleanJsonData(n);
  return {
    id: clean.id,
    judul: clean.judul || '',
    tipe: clean.tipe || 'info',
    dibaca: Boolean(clean.dibaca),
    link_menu: clean.linkMenu || '',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}

export function toLogsRow(l: LogAktivitas) {
  const clean = cleanJsonData(l);
  return {
    id: clean.id,
    timestamp_ms: Math.round(Number(clean.timestamp || 0)),
    user_name: clean.user || '',
    aksi: clean.aksi || '',
    tipe: clean.tipe || 'admin',
    data: clean,
    updated_at: new Date().toISOString(),
  };
}
