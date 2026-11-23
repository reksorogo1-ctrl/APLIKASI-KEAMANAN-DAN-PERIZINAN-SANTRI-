import {
  DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN,
  getLegacyPeminjamanPerlengkapanSnapshot,
  normalizePengaturanSuratPerlengkapan,
} from './peminjamanPerlengkapanService';
import { storageService } from './storageService';
import {
  extractSupabaseErrorMessage,
  getSupabaseClient,
  isSupabaseConfigured,
} from './supabase';
import {
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
  toPeminjamanPerlengkapanRow,
  toPengajuanDivisiRow,
  toPengaturanSuratPerlengkapanRow,
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

export interface SupabaseMigrationBreakdown {
  santri: number;
  ustadz: number;
  fasilitas: number;
  surat: number;
  perizinan: number;
  peminjamanPerlengkapan: number;
  jadwal: number;
  absensi: number;
  lainnya: number;
}

export interface SupabaseMigrationResult {
  ok: boolean;
  totalMigrated: number;
  message: string;
  breakdown: SupabaseMigrationBreakdown;
  errors?: string[];
}

const EMPTY_BREAKDOWN: SupabaseMigrationBreakdown = {
  santri: 0,
  ustadz: 0,
  fasilitas: 0,
  surat: 0,
  perizinan: 0,
  peminjamanPerlengkapan: 0,
  jadwal: 0,
  absensi: 0,
  lainnya: 0,
};

async function upsertInBatches(
  table: string,
  rows: Array<Record<string, unknown>>,
  chunkSize = 200
): Promise<number> {
  if (rows.length === 0) return 0;
  const client = getSupabaseClient();
  if (!client) throw new Error('Client Supabase belum tersedia.');

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await client.from(table).upsert(chunk, { onConflict: 'id' });
    if (error) {
      throw new Error(`Tabel [${table}]: ${extractSupabaseErrorMessage(error)}`);
    }
  }
  return rows.length;
}

export async function transferAllLegacyDataToSupabase(): Promise<SupabaseMigrationResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      totalMigrated: 0,
      message:
        'Project URL & Anon Key Supabase belum diisi. Silakan tempel Project URL dan Anon Key pada konfigurasi environment (.env) atau file src/services/supabase.ts terlebih dahulu.',
      breakdown: { ...EMPTY_BREAKDOWN },
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      totalMigrated: 0,
      message: 'Gagal menginisialisasi koneksi Supabase Client.',
      breakdown: { ...EMPTY_BREAKDOWN },
    };
  }

  try {
    const [legacySnap, pjmLegacy] = await Promise.all([
      storageService.getLegacySnapshotForMigration(),
      getLegacyPeminjamanPerlengkapanSnapshot(),
    ]);

    const errors: string[] = [];
    const safeUpsert = async (table: string, rows: Array<Record<string, unknown>>): Promise<number> => {
      try {
        return await upsertInBatches(table, rows);
      } catch (err) {
        errors.push(extractSupabaseErrorMessage(err));
        return 0;
      }
    };

    const jadwalRows = [
      ...legacySnap.agendaPengurus.map(toJadwalAgendaFromPengurus),
      ...legacySnap.jadwalPerbaikanList.map(toJadwalAgendaFromPerbaikan),
    ];

    const absensiRows = [
      ...legacySnap.murotilAbsensiSantriList.map(toAbsensiSantriRow),
      ...legacySnap.murotilAbsensiPjList.map(toAbsensiPjRow),
    ];

    const pengaturanSurat = normalizePengaturanSuratPerlengkapan(
      pjmLegacy.pengaturanSurat || DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN
    );

    const [
      cUsers,
      cConfig,
      cSantri,
      cUstadz,
      cFasilitas,
      cDewan,
      cPerizinan,
      cTataTertib,
      cPelanggaran,
      cSanksi,
      cSurat,
      cPeminjamanPrl,
      cPengaturanSuratPrl,
      cInventaris,
      cPeminjamanLegacy,
      cJadwal,
      cAbsensi,
      cKeuangan,
      cKoordinasi,
      cStruktur,
      cEvaluasi,
      cPengajuan,
      cNotifikasi,
      cLogs,
    ] = await Promise.all([
      safeUpsert('users', legacySnap.users.map(toUserRow)),
      safeUpsert('system_config', [toSystemConfigRow(legacySnap.systemConfig)]),
      safeUpsert('santri', legacySnap.santri.map(toSantriRow)),
      safeUpsert('ustadz', legacySnap.ustadzList.map(toUstadzRow)),
      safeUpsert('fasilitas_gedung', legacySnap.fasilitasGedungList.map(toFasilitasGedungRow)),
      safeUpsert('dewan_keamanan', legacySnap.dewan.map(toDewanKeamananRow)),
      safeUpsert('perizinan', legacySnap.perizinan.map(toPerizinanRow)),
      safeUpsert('tata_tertib', legacySnap.tataTertib.map(toTataTertibRow)),
      safeUpsert('pelanggaran', legacySnap.pelanggaran.map(toPelanggaranRow)),
      safeUpsert('sanksi', legacySnap.sanksi.map(toSanksiRow)),
      safeUpsert('surat_menyurat', legacySnap.arsipSurat.map(toSuratMenyuratRow)),
      safeUpsert('peminjaman_perlengkapan', pjmLegacy.items.map(toPeminjamanPerlengkapanRow)),
      safeUpsert('pengaturan_surat_perlengkapan', [
        toPengaturanSuratPerlengkapanRow(pengaturanSurat),
      ]),
      safeUpsert('perlengkapan_inventaris', legacySnap.barangInventaris.map(toPerlengkapanInventarisRow)),
      safeUpsert('perlengkapan_peminjaman', legacySnap.peminjamanBarang.map(toPerlengkapanPeminjamanRow)),
      safeUpsert('jadwal_agenda', jadwalRows),
      safeUpsert('absensi_murotil', absensiRows),
      safeUpsert('keuangan_transaksi', legacySnap.transaksiKeuangan.map(toKeuanganTransaksiRow)),
      safeUpsert('koordinasi', legacySnap.koordinasi.map(toKoordinasiRow)),
      safeUpsert('struktur_organisasi', legacySnap.strukturOrganisasi.map(toStrukturOrganisasiRow)),
      safeUpsert('evaluasi_kepengurusan', legacySnap.evaluasiKepengurusan.map(toEvaluasiKepengurusanRow)),
      safeUpsert('pengajuan_divisi', legacySnap.pengajuanDivisi.map(toPengajuanDivisiRow)),
      safeUpsert('notifikasi', legacySnap.notifikasi.map(toNotifikasiRow)),
      safeUpsert('logs', legacySnap.logs.map(toLogsRow)),
    ]);

    const lainnya =
      cUsers +
      cConfig +
      cDewan +
      cTataTertib +
      cPelanggaran +
      cSanksi +
      cPengaturanSuratPrl +
      cInventaris +
      cPeminjamanLegacy +
      cKeuangan +
      cKoordinasi +
      cStruktur +
      cEvaluasi +
      cPengajuan +
      cNotifikasi +
      cLogs;

    const breakdown: SupabaseMigrationBreakdown = {
      santri: cSantri,
      ustadz: cUstadz,
      fasilitas: cFasilitas,
      surat: cSurat,
      perizinan: cPerizinan,
      peminjamanPerlengkapan: cPeminjamanPrl,
      jadwal: cJadwal,
      absensi: cAbsensi,
      lainnya,
    };

    const totalMigrated =
      breakdown.santri +
      breakdown.ustadz +
      breakdown.fasilitas +
      breakdown.surat +
      breakdown.perizinan +
      breakdown.peminjamanPerlengkapan +
      breakdown.jadwal +
      breakdown.absensi +
      breakdown.lainnya;

    await storageService.reloadFromSupabase();
    storageService.initSupabaseRealtime();

    if (errors.length > 0 && totalMigrated === 0) {
      return {
        ok: false,
        totalMigrated: 0,
        message: `Gagal transfer data ke Supabase. Pastikan skrip SQL CREATE TABLE sudah dijalankan di SQL Editor Supabase. Detail: ${errors[0]}`,
        breakdown,
        errors,
      };
    }

    storageService.addLog(
      'Migrasi Supabase',
      `Berhasil mentransfer ${totalMigrated} baris data (${cSantri} santri, ${cUstadz} ustadz/ustadzah, ${cFasilitas} fasilitas, ${cSurat} surat, ${cPerizinan} perizinan, ${cPeminjamanPrl} peminjaman perlengkapan, ${cJadwal} jadwal, ${cAbsensi} absensi) ke Supabase.`,
      'admin'
    );

    return {
      ok: errors.length === 0,
      totalMigrated,
      message:
        errors.length === 0
          ? `Sukses! ${totalMigrated} data berhasil ditransfer & disinkronkan ke Supabase Realtime.`
          : `Transfer selesai sebagian (${totalMigrated} data masuk), namun ada ${errors.length} tabel yang gagal: ${errors[0]}`,
      breakdown,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (err) {
    return {
      ok: false,
      totalMigrated: 0,
      message: `Terjadi kesalahan saat migrasi ke Supabase: ${extractSupabaseErrorMessage(err)}`,
      breakdown: { ...EMPTY_BREAKDOWN },
    };
  }
}
