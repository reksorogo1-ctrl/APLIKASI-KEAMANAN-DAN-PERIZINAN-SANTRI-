export const SUPABASE_TABLE_NAMES = [
  'users',
  'system_config',
  'santri',
  'ustadz',
  'fasilitas_gedung',
  'dewan_keamanan',
  'perizinan',
  'tata_tertib',
  'pelanggaran',
  'sanksi',
  'surat_menyurat',
  'peminjaman_perlengkapan',
  'pengaturan_surat_perlengkapan',
  'perlengkapan_inventaris',
  'perlengkapan_peminjaman',
  'jadwal_agenda',
  'absensi_murotil',
  'keuangan_transaksi',
  'koordinasi',
  'struktur_organisasi',
  'evaluasi_kepengurusan',
  'pengajuan_divisi',
  'notifikasi',
  'logs',
] as const;

export const SUPABASE_SETUP_SQL = `-- ============================================================================
-- PONDOK PESANTREN SALAF AL-MALIKI - COMPLETE SUPABASE SCHEMA & REALTIME SETUP
-- Jalankan seluruh skrip ini di SQL Editor Supabase.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Akun Pengguna RBAC
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT,
  nama TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'keamanan',
  jabatan TEXT DEFAULT '',
  gender_access TEXT DEFAULT 'all',
  status_aktif BOOLEAN NOT NULL DEFAULT true,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Konfigurasi Utama Sistem & Pengaturan Pondok
CREATE TABLE IF NOT EXISTS public.system_config (
  id TEXT PRIMARY KEY,
  nama_pondok TEXT DEFAULT 'Pondok Pesantren Salaf Al-Maliki',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Data Master Santri
CREATE TABLE IF NOT EXISTS public.santri (
  id TEXT PRIMARY KEY,
  nis TEXT DEFAULT '',
  nama TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT 'putra',
  kelas TEXT DEFAULT '',
  kamar TEXT DEFAULT '',
  asrama TEXT DEFAULT '',
  status TEXT DEFAULT 'Aktif',
  poin_pelanggaran INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Data Master Ustadz & Ustadzah
CREATE TABLE IF NOT EXISTS public.ustadz (
  id TEXT PRIMARY KEY,
  nip TEXT DEFAULT '',
  nama TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT 'ustadz',
  jabatan TEXT DEFAULT '',
  divisi TEXT DEFAULT '',
  status_mukim TEXT DEFAULT 'Mukim',
  status_aktif BOOLEAN NOT NULL DEFAULT true,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Data Fasilitas Gedung & Kamar Perlengkapan
CREATE TABLE IF NOT EXISTS public.fasilitas_gedung (
  id TEXT PRIMARY KEY,
  nama_gedung TEXT NOT NULL DEFAULT '',
  kode_gedung TEXT DEFAULT '',
  kategori TEXT DEFAULT '',
  kondisi_umum TEXT DEFAULT 'Baik',
  penanggung_jawab TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Data Dewan Keamanan & Jadwal Piket
CREATE TABLE IF NOT EXISTS public.dewan_keamanan (
  id TEXT PRIMARY KEY,
  nrp TEXT DEFAULT '',
  nama TEXT NOT NULL DEFAULT '',
  gender TEXT DEFAULT 'putra',
  jabatan TEXT DEFAULT '',
  shift TEXT DEFAULT '',
  status_aktif BOOLEAN NOT NULL DEFAULT true,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Data Perizinan Keamanan Santri
CREATE TABLE IF NOT EXISTS public.perizinan (
  id TEXT PRIMARY KEY,
  nomor_izin TEXT DEFAULT '',
  santri_id TEXT DEFAULT '',
  santri_nama TEXT NOT NULL DEFAULT '',
  santri_gender TEXT DEFAULT 'putra',
  jenis_izin TEXT DEFAULT '',
  status TEXT DEFAULT 'Menunggu',
  tgl_keluar TEXT DEFAULT '',
  tgl_kembali TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Buku Pedoman Tata Tertib
CREATE TABLE IF NOT EXISTS public.tata_tertib (
  id TEXT PRIMARY KEY,
  kode TEXT DEFAULT '',
  kategori TEXT DEFAULT '',
  pasal TEXT DEFAULT '',
  poin_sanksi INTEGER NOT NULL DEFAULT 0,
  aktif BOOLEAN NOT NULL DEFAULT true,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Buku Pelanggaran Santri
CREATE TABLE IF NOT EXISTS public.pelanggaran (
  id TEXT PRIMARY KEY,
  kode_pelanggaran TEXT DEFAULT '',
  santri_id TEXT DEFAULT '',
  santri_nama TEXT NOT NULL DEFAULT '',
  jenis_pelanggaran TEXT DEFAULT '',
  kategori TEXT DEFAULT '',
  poin INTEGER NOT NULL DEFAULT 0,
  tanggal TEXT DEFAULT '',
  status_penanganan TEXT DEFAULT 'Menunggu Sanksi',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Sanksi & Takzir Edukatif
CREATE TABLE IF NOT EXISTS public.sanksi (
  id TEXT PRIMARY KEY,
  kode_sanksi TEXT DEFAULT '',
  pelanggaran_id TEXT DEFAULT '',
  santri_id TEXT DEFAULT '',
  santri_nama TEXT NOT NULL DEFAULT '',
  bentuk_sanksi TEXT DEFAULT '',
  status TEXT DEFAULT 'Aktif',
  tanggal_penetapan TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Persuratan Sekretaris (Surat Masuk & Surat Keluar + URL Scan PDF Storage)
CREATE TABLE IF NOT EXISTS public.surat_menyurat (
  id TEXT PRIMARY KEY,
  arah TEXT NOT NULL DEFAULT 'Keluar',
  kode_jenis TEXT DEFAULT 'SK',
  nomor_surat TEXT DEFAULT '',
  tanggal_surat TEXT DEFAULT '',
  perihal TEXT DEFAULT '',
  tujuan_atau_pengirim TEXT DEFAULT '',
  status TEXT DEFAULT 'Diarsipkan',
  file_lampiran_url TEXT DEFAULT '',
  file_lampiran_nama TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Peminjaman Perlengkapan Berbasis ACC Ketua Pondok & QR Code
CREATE TABLE IF NOT EXISTS public.peminjaman_perlengkapan (
  id TEXT PRIMARY KEY,
  nomor_surat TEXT DEFAULT '',
  nama_peminjam TEXT NOT NULL DEFAULT '',
  status_divisi_kamar TEXT DEFAULT '',
  nomor_hp TEXT DEFAULT '',
  tanggal_pinjam TEXT DEFAULT '',
  estimasi_tanggal_kembali TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Menunggu Verifikasi Ketua Pondok',
  created_at TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Pengaturan Format Surat Peminjaman Perlengkapan
CREATE TABLE IF NOT EXISTS public.pengaturan_surat_perlengkapan (
  id TEXT PRIMARY KEY,
  judul_surat TEXT DEFAULT '',
  nama_ketua_pondok TEXT DEFAULT '',
  nama_ketua_perlengkapan TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Inventaris & Stok Barang Perlengkapan
CREATE TABLE IF NOT EXISTS public.perlengkapan_inventaris (
  id TEXT PRIMARY KEY,
  kode_barang TEXT DEFAULT '',
  nama_barang TEXT NOT NULL DEFAULT '',
  kategori TEXT DEFAULT '',
  jumlah INTEGER NOT NULL DEFAULT 0,
  satuan TEXT DEFAULT 'Unit',
  kondisi TEXT DEFAULT 'Baik',
  lokasi TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Riwayat Peminjaman Barang Perlengkapan (Legacy & Mutasi)
CREATE TABLE IF NOT EXISTS public.perlengkapan_peminjaman (
  id TEXT PRIMARY KEY,
  kode_peminjaman TEXT DEFAULT '',
  barang_id TEXT DEFAULT '',
  nama_barang TEXT DEFAULT '',
  peminjam_nama TEXT DEFAULT '',
  status TEXT DEFAULT 'Dipinjam',
  tanggal_pinjam TEXT DEFAULT '',
  batas_kembali TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Jadwal & Kalender Akademik / Agenda Pengurus / Jadwal Perbaikan Aset
CREATE TABLE IF NOT EXISTS public.jadwal_agenda (
  id TEXT PRIMARY KEY,
  sumber TEXT NOT NULL DEFAULT 'agenda_pengurus',
  judul TEXT NOT NULL DEFAULT '',
  tanggal TEXT DEFAULT '',
  kategori TEXT DEFAULT '',
  status TEXT DEFAULT 'Terjadwal',
  divisi_terkait TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Absensi Murotil & Tahfidz (Santri & Ustadzah/PJ)
CREATE TABLE IF NOT EXISTS public.absensi_murotil (
  id TEXT PRIMARY KEY,
  jenis TEXT NOT NULL DEFAULT 'santri',
  tanggal TEXT DEFAULT '',
  sesi TEXT DEFAULT '',
  status TEXT DEFAULT 'Hadir',
  subjek_id TEXT DEFAULT '',
  subjek_nama TEXT DEFAULT '',
  kelompok_id TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Transaksi Keuangan Bendahara
CREATE TABLE IF NOT EXISTS public.keuangan_transaksi (
  id TEXT PRIMARY KEY,
  kode_transaksi TEXT DEFAULT '',
  tanggal TEXT DEFAULT '',
  tipe TEXT NOT NULL DEFAULT 'Pemasukan',
  kategori TEXT DEFAULT '',
  nominal NUMERIC NOT NULL DEFAULT 0,
  status_verifikasi TEXT DEFAULT 'Terverifikasi',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Pesan Koordinasi Lintas Divisi
CREATE TABLE IF NOT EXISTS public.koordinasi (
  id TEXT PRIMARY KEY,
  nomor_tiket TEXT DEFAULT '',
  judul TEXT DEFAULT '',
  prioritas TEXT DEFAULT 'Normal',
  kategori TEXT DEFAULT '',
  pengirim_nama TEXT DEFAULT '',
  tujuan TEXT DEFAULT '',
  status TEXT DEFAULT 'Terkirim',
  tanggal TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Struktur Organisasi Pondok
CREATE TABLE IF NOT EXISTS public.struktur_organisasi (
  id TEXT PRIMARY KEY,
  level INTEGER NOT NULL DEFAULT 1,
  urutan INTEGER NOT NULL DEFAULT 1,
  jabatan TEXT DEFAULT '',
  nama_pengurus TEXT DEFAULT '',
  divisi TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. Evaluasi Kepengurusan Ketua Pondok
CREATE TABLE IF NOT EXISTS public.evaluasi_kepengurusan (
  id TEXT PRIMARY KEY,
  tanggal TEXT DEFAULT '',
  divisi TEXT DEFAULT '',
  judul TEXT DEFAULT '',
  nilai_kinerja TEXT DEFAULT 'Baik',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. Pengajuan Divisi ke Ketua Pondok
CREATE TABLE IF NOT EXISTS public.pengajuan_divisi (
  id TEXT PRIMARY KEY,
  nomor_pengajuan TEXT DEFAULT '',
  tanggal TEXT DEFAULT '',
  divisi TEXT DEFAULT '',
  jenis_pengajuan TEXT DEFAULT '',
  judul TEXT DEFAULT '',
  status TEXT DEFAULT 'Menunggu Persetujuan',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. Notifikasi Aplikasi Terpusat
CREATE TABLE IF NOT EXISTS public.notifikasi (
  id TEXT PRIMARY KEY,
  judul TEXT DEFAULT '',
  tipe TEXT DEFAULT 'info',
  dibaca BOOLEAN NOT NULL DEFAULT false,
  link_menu TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. Log Aktivitas & Jejak Audit
CREATE TABLE IF NOT EXISTS public.logs (
  id TEXT PRIMARY KEY,
  timestamp_ms BIGINT NOT NULL DEFAULT 0,
  user_name TEXT DEFAULT '',
  aksi TEXT DEFAULT '',
  tipe TEXT DEFAULT 'admin',
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) & ALLOW ALL POLICIES
-- ============================================================================
DO $$
DECLARE
  t TEXT;
  tbls TEXT[] := ARRAY[
    'users', 'system_config', 'santri', 'ustadz', 'fasilitas_gedung',
    'dewan_keamanan', 'perizinan', 'tata_tertib', 'pelanggaran', 'sanksi',
    'surat_menyurat', 'peminjaman_perlengkapan', 'pengaturan_surat_perlengkapan',
    'perlengkapan_inventaris', 'perlengkapan_peminjaman', 'jadwal_agenda',
    'absensi_murotil', 'keuangan_transaksi', 'koordinasi', 'struktur_organisasi',
    'evaluasi_kepengurusan', 'pengajuan_divisi', 'notifikasi', 'logs'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all" ON public.%I;', t);
    EXECUTE format('CREATE POLICY "Allow all" ON public.%I FOR ALL USING (true) WITH CHECK (true);', t);
  END LOOP;
END $$;

-- ============================================================================
-- AKTIFKAN REALTIME PUBLICATION UNTUK SELURUH TABEL
-- ============================================================================
DO $$
DECLARE
  t TEXT;
  tbls TEXT[] := ARRAY[
    'users', 'system_config', 'santri', 'ustadz', 'fasilitas_gedung',
    'dewan_keamanan', 'perizinan', 'tata_tertib', 'pelanggaran', 'sanksi',
    'surat_menyurat', 'peminjaman_perlengkapan', 'pengaturan_surat_perlengkapan',
    'perlengkapan_inventaris', 'perlengkapan_peminjaman', 'jadwal_agenda',
    'absensi_murotil', 'keuangan_transaksi', 'koordinasi', 'struktur_organisasi',
    'evaluasi_kepengurusan', 'pengajuan_divisi', 'notifikasi', 'logs'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', t);
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- SUPABASE STORAGE BUCKET: almaliki-dokumen (Scan PDF & TTD Pejabat)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('almaliki-dokumen', 'almaliki-dokumen', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public read almaliki-dokumen" ON storage.objects;
CREATE POLICY "Allow public read almaliki-dokumen"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'almaliki-dokumen');

DROP POLICY IF EXISTS "Allow public insert almaliki-dokumen" ON storage.objects;
CREATE POLICY "Allow public insert almaliki-dokumen"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'almaliki-dokumen');

DROP POLICY IF EXISTS "Allow public update almaliki-dokumen" ON storage.objects;
CREATE POLICY "Allow public update almaliki-dokumen"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'almaliki-dokumen')
  WITH CHECK (bucket_id = 'almaliki-dokumen');

DROP POLICY IF EXISTS "Allow public delete almaliki-dokumen" ON storage.objects;
CREATE POLICY "Allow public delete almaliki-dokumen"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'almaliki-dokumen');

-- ============================================================================
-- PASTIKAN HAK AKSES ROLE ANON/AUTHENTICATED & RELOAD SCHEMA CACHE POSTGREST
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
`;
