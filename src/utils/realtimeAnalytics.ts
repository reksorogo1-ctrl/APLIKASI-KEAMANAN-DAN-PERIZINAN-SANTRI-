import {
  AgendaPengurus,
  ArsipSurat,
  BarangInventaris,
  DewanKeamanan,
  EvaluasiKepengurusan,
  Pelanggaran,
  PeminjamanBarang,
  PengajuanDivisi,
  Perizinan,
  PesanKoordinasi,
  Sanksi,
  Santri,
  SyahriyahSantri,
  SystemConfig,
  TransaksiKeuangan,
} from '../types';
import { computeFinanceAnalytics, FinanceAnalyticsResult } from './financeCandlestick';

export interface RealtimePondokInput {
  santriList: Santri[];
  perizinanList: Perizinan[];
  pelanggaranList: Pelanggaran[];
  sanksiList?: Sanksi[];
  transaksiKeuangan: TransaksiKeuangan[];
  arsipSurat: ArsipSurat[];
  barangInventaris: BarangInventaris[];
  peminjamanBarang?: PeminjamanBarang[];
  agendaPengurus: AgendaPengurus[];
  evaluasiKepengurusan?: EvaluasiKepengurusan[];
  pengajuanDivisi: PengajuanDivisi[];
  koordinasiList?: PesanKoordinasi[];
  dewanList?: DewanKeamanan[];
  systemConfig: SystemConfig;
}

export interface DivisionKpiMetric {
  key: 'ketua_pondok' | 'sekretaris' | 'bendahara' | 'perlengkapan' | 'keamanan';
  title: string;
  subtitle: string;
  score: number;
  ratingLabel: string;
  color: string;
  detail: string;
  breakdown: Record<string, number | string>;
}

export interface WeeklyComparisonPoint {
  pekan: string;
  minggu: string;
  bulanLalu: number;
  bulanIni: number;
}

export interface MonthlyTrendPoint {
  bulan: string;
  skorKinerjaPengurus: number;
  skorKedisiplinanSantri: number;
}

export interface SantriYearlyPoint {
  tahun: string;
  putra: number;
  putri: number;
  total: number;
}

export interface RealtimePondokAnalytics {
  santriStats: {
    totalSantri: number;
    santriPutra: number;
    santriPutri: number;
    santriSakit: number;
    santriIzinPulang: number;
    santriDiPondok: number;
    ustadzAktif: number;
    ustadzahAktif: number;
    ustadzTotal: number;
    ustadzahTotal: number;
    totalAsatidz: number;
  };
  financeAnalytics: FinanceAnalyticsResult;
  sekretarisStats: {
    totalArsip: number;
    suratMasuk: number;
    suratKeluar: number;
    suratResmiTerbit: number;
    notulenCount: number;
    kelengkapanSantriPersen: number;
  };
  perlengkapanStats: {
    totalAset: number;
    jenisBarang: number;
    kondisiBaik: number;
    kondisiRusak: number;
    sedangDipinjam: number;
    terlambatPinjam: number;
    stokKritisCount: number;
    perbaikanSelesai: number;
    perbaikanTotal: number;
  };
  keamananStats: {
    totalIzin: number;
    izinDiproses: number;
    izinTerlambat: number;
    izinAktifKeluar: number;
    totalPelanggaran: number;
    pelanggaranTerverifikasi: number;
    totalSanksi: number;
    sanksiSelesai: number;
    dewanAktif: number;
    dewanTotal: number;
  };
  divisions: {
    ketua_pondok: DivisionKpiMetric;
    sekretaris: DivisionKpiMetric;
    bendahara: DivisionKpiMetric;
    perlengkapan: DivisionKpiMetric;
    keamanan: DivisionKpiMetric;
  };
  divisionList: DivisionKpiMetric[];
  kinerjaPengurusStats: {
    bulanIni: number;
    bulanLalu: number;
    selisih: number;
    chartData: WeeklyComparisonPoint[];
  };
  kedisiplinanSantriStats: {
    bulanIni: number;
    bulanLalu: number;
    selisih: number;
    totalSantri: number;
    chartData: WeeklyComparisonPoint[];
    monthlySeries: MonthlyTrendPoint[];
  };
  santriYearlyChart: SantriYearlyPoint[];
}

function clampPct(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.max(0, Math.min(100, Math.round(val)));
}

export function getRatingLabel(score: number): string {
  if (score >= 90) return 'Sangat Baik';
  if (score >= 80) return 'Baik';
  if (score >= 70) return 'Cukup';
  return 'Perlu Optimasi';
}

function getCurrentWibYearMonth(): { currentYM: string; prevYM: string; currentYear: number } {
  const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const [yStr, mStr] = todayWib.split('-');
  const y = Number(yStr) || new Date().getFullYear();
  const m = Number(mStr) || new Date().getMonth() + 1;
  const prevDate = new Date(y, m - 2, 1);
  const prevYM = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  return {
    currentYM: `${y}-${String(m).padStart(2, '0')}`,
    prevYM,
    currentYear: y,
  };
}

function getWeekIndexFromDate(dateStr?: string): number {
  if (!dateStr || dateStr.length < 10) return 3;
  const day = Number(dateStr.slice(8, 10));
  if (!Number.isFinite(day) || day <= 0) return 3;
  if (day <= 7) return 0;
  if (day <= 14) return 1;
  if (day <= 21) return 2;
  return 3;
}

function evalToScore(nilai: EvaluasiKepengurusan['nilaiKinerja']): number {
  if (nilai === 'Sangat Baik') return 96;
  if (nilai === 'Baik') return 84;
  return 62;
}

function computeDivisionEvalAndProker(
  divisi: string,
  programKerjaList: NonNullable<SystemConfig['programKerjaList']>,
  evaluasiList: EvaluasiKepengurusan[]
): { prokerAvg: number | null; evalAvg: number | null; prokerCount: number; evalCount: number } {
  const divProker = programKerjaList.filter((p) => p.divisi === divisi);
  const divEval = evaluasiList.filter((e) => e.divisi === divisi);

  const prokerAvg =
    divProker.length > 0
      ? divProker.reduce((sum, p) => sum + (Number(p.progresPersen) || 0), 0) / divProker.length
      : null;

  const evalAvg =
    divEval.length > 0
      ? divEval.reduce((sum, e) => sum + evalToScore(e.nilaiKinerja), 0) / divEval.length
      : null;

  return {
    prokerAvg,
    evalAvg,
    prokerCount: divProker.length,
    evalCount: divEval.length,
  };
}

function resolveActiveSyahriyahStats(
  activeSantri: Santri[],
  systemConfig: SystemConfig
): { lunasCount: number; totalCount: number; pct: number } {
  const periodeAktif = systemConfig.bendaharaConfig?.periodeSyahriyahAktif || 'November 2026';
  const rawList = systemConfig.syahriyahList || [];
  const periodStored = rawList.filter((r) => r.bulanTahun === periodeAktif);
  const matchedIds = new Set<string>();

  let lunasFromSantri = 0;
  activeSantri.forEach((s) => {
    const found = periodStored.find((r) => r.santriId === s.id || (r.santriNis && r.santriNis === s.nis));
    if (found) {
      matchedIds.add(found.id);
      if (found.status === 'Lunas') lunasFromSantri += 1;
    }
  });

  const extra = periodStored.filter((r) => !matchedIds.has(r.id));
  const extraLunas = extra.filter((r) => r.status === 'Lunas').length;

  const totalCount = activeSantri.length + extra.length;
  const lunasCount = lunasFromSantri + extraLunas;
  const pct = totalCount > 0 ? Math.round((lunasCount / totalCount) * 100) : 0;

  return { lunasCount, totalCount, pct };
}

const MONTH_SHORT_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatShortMonthFromYM(ym: string): string {
  const m = Number(ym.slice(5, 7));
  return MONTH_SHORT_ID[(m || 1) - 1] || ym;
}

export function computeRealtimePondokAnalytics(input: RealtimePondokInput): RealtimePondokAnalytics {
  const {
    santriList,
    perizinanList,
    pelanggaranList,
    sanksiList = [],
    transaksiKeuangan,
    arsipSurat,
    barangInventaris,
    peminjamanBarang = [],
    agendaPengurus,
    evaluasiKepengurusan = [],
    pengajuanDivisi,
    koordinasiList = [],
    dewanList = [],
    systemConfig,
  } = input;

  const { currentYM, prevYM, currentYear } = getCurrentWibYearMonth();
  const programKerjaList = systemConfig.programKerjaList || [];
  const izinPengurusList = systemConfig.izinPengurusList || [];
  const notulenRapatList = systemConfig.notulenRapatList || [];
  const jadwalPerbaikanList = systemConfig.jadwalPerbaikanList || [];
  const fasilitasGedungList = systemConfig.fasilitasGedungList || [];
  const kamarSantriList = systemConfig.kamarSantriList || [];
  const anggaranList = systemConfig.anggaranList || [];
  const ustadzList =
    Array.isArray(systemConfig.ustadzList) && systemConfig.ustadzList.length > 0
      ? systemConfig.ustadzList
      : Array.isArray(systemConfig.dataUstadzList)
        ? systemConfig.dataUstadzList
        : Array.isArray(systemConfig.ustadzList)
          ? systemConfig.ustadzList
          : [];
  const murotilAbsensiSantriList = systemConfig.murotilAbsensiSantriList || [];

  // 1. SANTRI & ASATIDZ REAL-TIME STATS
  const activeSantri = santriList.filter((s) => s.status !== 'Alumni');
  const totalSantri = activeSantri.length;
  const santriPutra = activeSantri.filter((s) => s.gender === 'putra').length;
  const santriPutri = activeSantri.filter((s) => s.gender === 'putri').length;

  const izinBerobatIds = new Set(
    perizinanList
      .filter((p) => p.jenisIzin === 'Izin Berobat' && (p.status === 'Sedang Keluar' || p.status === 'Disetujui'))
      .map((p) => p.santriId)
  );
  const santriSakit = activeSantri.filter(
    (s) =>
      s.status === 'Sakit' ||
      s.kondisiKesehatan === 'Sakit' ||
      s.kondisiKesehatan === 'Rawat Jalan' ||
      izinBerobatIds.has(s.id)
  ).length;

  const izinPulangIds = new Set(
    perizinanList
      .filter(
        (p) =>
          (p.status === 'Sedang Keluar' || p.status === 'Terlambat') &&
          (p.jenisIzin === 'Izin Pulang' || p.jenisIzin === 'Izin Keperluan Keluarga')
      )
      .map((p) => p.santriId)
  );
  const santriIzinPulang = izinPulangIds.size;

  const sedangDiluarIds = new Set(
    perizinanList
      .filter((p) => p.status === 'Sedang Keluar' || p.status === 'Terlambat')
      .map((p) => p.santriId)
  );
  const santriDiPondok = Math.max(0, totalSantri - sedangDiluarIds.size);

  const ustadzTotal = ustadzList.filter((u) => (u.gender || 'ustadz') !== 'ustadzah').length;
  const ustadzahTotal = ustadzList.filter((u) => u.gender === 'ustadzah').length;
  const ustadzAktif = ustadzList.filter((u) => u.statusAktif !== false && (u.gender || 'ustadz') !== 'ustadzah').length;
  const ustadzahAktif = ustadzList.filter((u) => u.statusAktif !== false && u.gender === 'ustadzah').length;
  const totalAsatidz = ustadzList.length;

  const santriStats = {
    totalSantri,
    santriPutra,
    santriPutri,
    santriSakit,
    santriIzinPulang,
    santriDiPondok,
    ustadzAktif,
    ustadzahAktif,
    ustadzTotal,
    ustadzahTotal,
    totalAsatidz,
  };

  // 2. KEDISIPLINAN SANTRI (REAL-TIME TANPA CLAMP BUATAN)
  const calcDisciplineScore = (
    pelItems: Pelanggaran[],
    izinItems: Perizinan[],
    sanksiItems: Sanksi[],
    alphaCount = 0,
    totalAbsensi = 0
  ): number => {
    const activePel = pelItems.filter((p) => p.statusVerifikasi !== 'Dibatalkan');
    const popFactor = Math.max(10, totalSantri) / 10;

    const violationPenalty = activePel.reduce((sum, p) => {
      const catWeight = p.kategori === 'Berat' ? 4.5 : p.kategori === 'Sedang' ? 2.8 : 1.5;
      const poinFactor = p.poin ? Math.max(1, p.poin / 15) : 1;
      return sum + (catWeight * poinFactor) / Math.sqrt(popFactor);
    }, 0);

    const lateCount = izinItems.filter((p) => p.status === 'Terlambat').length;
    const latePenalty = (lateCount * 2.2) / Math.sqrt(popFactor);

    const sanksiSelesaiCount = sanksiItems.filter((s) => s.status === 'Selesai').length;
    const sanksiPendingCount = sanksiItems.filter((s) => s.status !== 'Selesai').length;
    const sanksiCredit = Math.min(violationPenalty * 0.45, (sanksiSelesaiCount * 1.4) / Math.sqrt(popFactor));
    const sanksiPendingPenalty = (sanksiPendingCount * 0.8) / Math.sqrt(popFactor);

    const murotilPenalty = totalAbsensi > 0 ? Math.min(10, (alphaCount / totalAbsensi) * 20) : 0;

    return clampPct(100 - violationPenalty - latePenalty - sanksiPendingPenalty + sanksiCredit - murotilPenalty);
  };

  const currentMonthAbsensi = murotilAbsensiSantriList.filter((a) => (a.tanggal || '').startsWith(currentYM));
  const currentMonthAlpha = currentMonthAbsensi.filter((a) => a.status === 'Alpha').length;

  const disiplinBulanIni = calcDisciplineScore(
    pelanggaranList,
    perizinanList,
    sanksiList,
    currentMonthAlpha,
    currentMonthAbsensi.length
  );

  // Weekly Kedisiplinan Santri progression across Weeks 1..4
  const prevMonthPel = pelanggaranList.filter((p) => (p.tanggal || '').startsWith(prevYM));
  const prevMonthIzin = perizinanList.filter((p) => (p.tglKeluar || '').startsWith(prevYM));
  const prevMonthSanksi = sanksiList.filter((s) => (s.tanggalPenetapan || '').startsWith(prevYM));
  const prevMonthAbsensi = murotilAbsensiSantriList.filter((a) => (a.tanggal || '').startsWith(prevYM));
  const prevMonthAlpha = prevMonthAbsensi.filter((a) => a.status === 'Alpha').length;

  const historicalBulanan = systemConfig.kinerjaBulananList || [];
  const hasPrevDisiplinRecords =
    prevMonthPel.length > 0 || prevMonthIzin.length > 0 || prevMonthSanksi.length > 0 || prevMonthAbsensi.length > 0;
  const fallbackPrevDisiplin =
    historicalBulanan.length >= 2
      ? historicalBulanan[historicalBulanan.length - 2].skorKedisiplinanSantri
      : historicalBulanan.length === 1
        ? historicalBulanan[0].skorKedisiplinanSantri
        : disiplinBulanIni;

  const disiplinBulanLalu = hasPrevDisiplinRecords
    ? calcDisciplineScore(prevMonthPel, prevMonthIzin, prevMonthSanksi, prevMonthAlpha, prevMonthAbsensi.length)
    : clampPct(fallbackPrevDisiplin);

  const disiplinChartData: WeeklyComparisonPoint[] = [0, 1, 2, 3].map((weekIdx) => {
    const pelUpToW = pelanggaranList.filter((p) => {
      const ym = (p.tanggal || '').slice(0, 7);
      if (ym && ym < currentYM) return true;
      if (ym === currentYM) return getWeekIndexFromDate(p.tanggal) <= weekIdx;
      return weekIdx === 3;
    });
    const izinUpToW = perizinanList.filter((p) => {
      const d = p.tglKembali || p.tglKeluar || '';
      const ym = d.slice(0, 7);
      if (ym && ym < currentYM) return true;
      if (ym === currentYM) return getWeekIndexFromDate(d) <= weekIdx;
      return weekIdx === 3;
    });
    const sanksiUpToW = sanksiList.filter((s) => {
      const d = s.tanggalAktualSelesai || s.tanggalPenetapan || '';
      const ym = d.slice(0, 7);
      if (ym && ym < currentYM) return true;
      if (ym === currentYM) return getWeekIndexFromDate(d) <= weekIdx;
      return weekIdx === 3;
    });

    const wIni =
      weekIdx === 3
        ? disiplinBulanIni
        : calcDisciplineScore(
            pelUpToW,
            izinUpToW,
            sanksiUpToW,
            currentMonthAlpha,
            currentMonthAbsensi.length
          );

    let wLalu = disiplinBulanLalu;
    if (hasPrevDisiplinRecords && weekIdx < 3) {
      const pPel = prevMonthPel.filter((p) => getWeekIndexFromDate(p.tanggal) <= weekIdx);
      const pIzin = prevMonthIzin.filter((p) => getWeekIndexFromDate(p.tglKembali || p.tglKeluar) <= weekIdx);
      const pSanksi = prevMonthSanksi.filter((s) => getWeekIndexFromDate(s.tanggalPenetapan) <= weekIdx);
      wLalu = calcDisciplineScore(pPel, pIzin, pSanksi, prevMonthAlpha, prevMonthAbsensi.length);
    } else if (!hasPrevDisiplinRecords && weekIdx < 3) {
      wLalu = clampPct(disiplinBulanLalu - (2 - weekIdx));
    }

    return {
      pekan: `Minggu ${weekIdx + 1}`,
      minggu: `Pekan ${weekIdx + 1}`,
      bulanIni: wIni,
      bulanLalu: wLalu,
    };
  });

  // 3. DIVISION 1: KETUA PONDOK (Tersinkron Real-Time dengan Tab Ketua Pondok)
  const totalPengajuan = pengajuanDivisi.length;
  const diprosesPengajuan = pengajuanDivisi.filter(
    (p) => p.status === 'Disetujui' || p.status === 'Ditolak'
  ).length;
  const pengajuanRate = totalPengajuan > 0 ? (diprosesPengajuan / totalPengajuan) * 100 : 100;

  const totalIzin = perizinanList.length;
  const izinDiproses = perizinanList.filter((p) => p.status !== 'Diajukan').length;
  const izinProsesRate = totalIzin > 0 ? (izinDiproses / totalIzin) * 100 : 100;

  const totalIzinPengurus = izinPengurusList.length;
  const izinPengurusDiproses = izinPengurusList.filter((i) => i.status !== 'Menunggu').length;
  const izinPengurusRate = totalIzinPengurus > 0 ? (izinPengurusDiproses / totalIzinPengurus) * 100 : 100;

  const avgAllProker =
    programKerjaList.length > 0
      ? programKerjaList.reduce((acc, p) => acc + (Number(p.progresPersen) || 0), 0) / programKerjaList.length
      : 85;

  const agendaSelesai = agendaPengurus.filter((a) => a.status === 'Selesai').length;
  const agendaAktif = agendaPengurus.filter((a) => a.status === 'Berlangsung' || a.status === 'Terjadwal').length;
  const agendaRate =
    agendaPengurus.length > 0
      ? ((agendaSelesai + agendaAktif * 0.85) / agendaPengurus.length) * 100
      : 85;

  const koordinasiResponded = koordinasiList.filter(
    (k) => k.status === 'Ditindaklanjuti' || (k.balasan && k.balasan.length > 0) || (k.dibacaOleh && k.dibacaOleh.length > 1)
  ).length;
  const koordinasiRate =
    koordinasiList.length > 0 ? (koordinasiResponded / koordinasiList.length) * 100 : 90;

  const evalAllAvg =
    evaluasiKepengurusan.length > 0
      ? evaluasiKepengurusan.reduce((s, e) => s + evalToScore(e.nilaiKinerja), 0) / evaluasiKepengurusan.length
      : null;

  const ketuaBaseScore =
    avgAllProker * 0.34 +
    pengajuanRate * 0.24 +
    izinProsesRate * 0.14 +
    izinPengurusRate * 0.10 +
    agendaRate * 0.09 +
    koordinasiRate * 0.09;

  const skorKetua = clampPct(
    evalAllAvg !== null ? ketuaBaseScore * 0.88 + evalAllAvg * 0.12 : ketuaBaseScore
  );

  const ketuaDivision: DivisionKpiMetric = {
    key: 'ketua_pondok',
    title: 'Kinerja Ketua Pondok',
    subtitle: 'Koordinasi Pimpinan, Proker, Evaluasi & Persetujuan Divisi',
    score: skorKetua,
    ratingLabel: getRatingLabel(skorKetua),
    color: '#d4af37',
    detail: `${diprosesPengajuan}/${totalPengajuan} Pengajuan · Proker ${Math.round(avgAllProker)}%`,
    breakdown: {
      diprosesPengajuan,
      totalPengajuan,
      avgProker: Math.round(avgAllProker),
      izinPengurusDiproses,
      totalIzinPengurus,
      evaluasiCount: evaluasiKepengurusan.length,
    },
  };

  // 4. DIVISION 2: SEKRETARIS (Tersinkron Real-Time dengan Tab Sekretaris)
  const totalArsip = arsipSurat.length;
  const suratMasuk = arsipSurat.filter((s) => s.arah === 'Masuk').length;
  const suratKeluar = arsipSurat.filter((s) => s.arah === 'Keluar').length;
  const suratResmiTerbit = arsipSurat.filter((s) => s.status === 'Resmi / Terbit').length;
  const suratSelesai = arsipSurat.filter(
    (s) => s.status === 'Resmi / Terbit' || s.status === 'Diarsipkan'
  ).length;
  const suratCompletionRate = totalArsip > 0 ? (suratSelesai / totalArsip) * 100 : 75;

  const santriFieldsRate =
    activeSantri.length > 0
      ? (activeSantri.reduce((sum, s) => {
          let filled = 0;
          if (s.nis?.trim()) filled += 1;
          if (s.nama?.trim()) filled += 1;
          if (s.kelas?.trim()) filled += 1;
          if (s.kamar?.trim()) filled += 1;
          if (s.namaWali?.trim()) filled += 1;
          if (s.noWaWali?.trim()) filled += 1;
          return sum + filled / 6;
        }, 0) /
          activeSantri.length) *
        100
      : 0;

  const ustadzActiveRate =
    ustadzList.length > 0
      ? (ustadzList.filter((u) => u.statusAktif).length / ustadzList.length) * 100
      : 80;

  const notulenScore = Math.min(100, 72 + notulenRapatList.length * 6);
  const sekMeta = computeDivisionEvalAndProker('Sekretaris', programKerjaList, evaluasiKepengurusan);

  let sekScoreRaw =
    suratCompletionRate * 0.36 +
    santriFieldsRate * 0.32 +
    ustadzActiveRate * 0.12 +
    notulenScore * 0.10 +
    koordinasiRate * 0.10;

  if (sekMeta.prokerAvg !== null && sekMeta.evalAvg !== null) {
    sekScoreRaw = sekScoreRaw * 0.78 + sekMeta.prokerAvg * 0.12 + sekMeta.evalAvg * 0.10;
  } else if (sekMeta.prokerAvg !== null) {
    sekScoreRaw = sekScoreRaw * 0.85 + sekMeta.prokerAvg * 0.15;
  } else if (sekMeta.evalAvg !== null) {
    sekScoreRaw = sekScoreRaw * 0.85 + sekMeta.evalAvg * 0.15;
  }

  const skorSekretaris = clampPct(sekScoreRaw);
  const sekretarisStats = {
    totalArsip,
    suratMasuk,
    suratKeluar,
    suratResmiTerbit,
    notulenCount: notulenRapatList.length,
    kelengkapanSantriPersen: Math.round(santriFieldsRate),
  };

  const sekretarisDivision: DivisionKpiMetric = {
    key: 'sekretaris',
    title: 'Kinerja Sekretaris',
    subtitle: 'Tertib Persuratan, Data Santri, Ustadz & Notulen Rapat',
    score: skorSekretaris,
    ratingLabel: getRatingLabel(skorSekretaris),
    color: '#10b981',
    detail: `${suratResmiTerbit}/${totalArsip} Surat Terbit · ${totalSantri} Santri (${Math.round(santriFieldsRate)}% Lengkap)`,
    breakdown: {
      suratResmiTerbit,
      totalArsip,
      kelengkapanSantri: Math.round(santriFieldsRate),
      notulenCount: notulenRapatList.length,
    },
  };

  // 5. DIVISION 3: BENDAHARA (Tersinkron Real-Time dengan Tab Bendahara & Candlestick)
  const financeAnalytics = computeFinanceAnalytics(transaksiKeuangan, systemConfig.bendaharaConfig);
  const syahriyahStats = resolveActiveSyahriyahStats(activeSantri, systemConfig);

  const trxVerifiedRate =
    transaksiKeuangan.length > 0
      ? (transaksiKeuangan.filter((t) => t.statusVerifikasi === 'Terverifikasi').length /
          transaksiKeuangan.length) *
        100
      : 80;

  const anggaranCompliance =
    anggaranList.length > 0
      ? (anggaranList.reduce((sum, ang) => {
          const realisasi = transaksiKeuangan
            .filter((t) => t.tipe === 'Pengeluaran' && t.kategori === ang.kategori)
            .reduce((a, b) => a + (Number(b.nominal) || 0), 0);
          if (ang.nominalAnggaran <= 0) return sum + 1;
          const ratio = realisasi / ang.nominalAnggaran;
          return sum + (ratio <= 1 ? 1 : Math.max(0.4, 1 - (ratio - 1)));
        }, 0) /
          anggaranList.length) *
        100
      : 85;

  const benMeta = computeDivisionEvalAndProker('Bendahara', programKerjaList, evaluasiKepengurusan);
  let benScoreRaw =
    financeAnalytics.skorEkonomi * 0.45 +
    syahriyahStats.pct * 0.25 +
    trxVerifiedRate * 0.15 +
    anggaranCompliance * 0.15;

  if (benMeta.prokerAvg !== null && benMeta.evalAvg !== null) {
    benScoreRaw = benScoreRaw * 0.80 + benMeta.prokerAvg * 0.10 + benMeta.evalAvg * 0.10;
  } else if (benMeta.prokerAvg !== null) {
    benScoreRaw = benScoreRaw * 0.86 + benMeta.prokerAvg * 0.14;
  } else if (benMeta.evalAvg !== null) {
    benScoreRaw = benScoreRaw * 0.86 + benMeta.evalAvg * 0.14;
  }

  const skorBendahara = clampPct(benScoreRaw);

  const bendaharaDivision: DivisionKpiMetric = {
    key: 'bendahara',
    title: 'Kinerja Bendahara',
    subtitle: 'Akuntabilitas Kas, Syahriyah & Anggaran Pondok',
    score: skorBendahara,
    ratingLabel: getRatingLabel(skorBendahara),
    color: '#f59e0b',
    detail: `Skor Kas ${financeAnalytics.skorEkonomi}/100 · Syahriyah ${syahriyahStats.pct}% (${syahriyahStats.lunasCount}/${syahriyahStats.totalCount})`,
    breakdown: {
      skorEkonomi: financeAnalytics.skorEkonomi,
      syahriyahPct: syahriyahStats.pct,
      lunasCount: syahriyahStats.lunasCount,
      totalSyahriyah: syahriyahStats.totalCount,
      trxVerifiedRate: Math.round(trxVerifiedRate),
    },
  };

  // 6. DIVISION 4: PERLENGKAPAN (Tersinkron Real-Time dengan Tab Perlengkapan)
  const totalAset = barangInventaris.reduce((acc, b) => acc + (Number(b.jumlah) || 0), 0);
  const jenisBarang = barangInventaris.length;
  const kondisiBaik = barangInventaris
    .filter((b) => b.kondisi === 'Baik')
    .reduce((acc, b) => acc + (Number(b.jumlah) || 0), 0);
  const kondisiRusak = barangInventaris
    .filter((b) => b.kondisi !== 'Baik')
    .reduce((acc, b) => acc + (Number(b.jumlah) || 0), 0);
  const sedangDipinjam = peminjamanBarang
    .filter((p) => p.status === 'Dipinjam' || p.status === 'Terlambat')
    .reduce((acc, p) => acc + (Number(p.jumlahPinjam) || 0), 0);
  const terlambatPinjam = peminjamanBarang.filter((p) => p.status === 'Terlambat').length;
  const stokKritisCount = barangInventaris.filter((b) => b.jumlah <= (b.stokMinimal ?? 3)).length;
  const perbaikanSelesai = jadwalPerbaikanList.filter((j) => j.status === 'Selesai').length;
  const perbaikanTotal = jadwalPerbaikanList.length;

  const unitBaikRate = totalAset > 0 ? (kondisiBaik / totalAset) * 100 : 0;
  const stokAmanRate = jenisBarang > 0 ? ((jenisBarang - stokKritisCount) / jenisBarang) * 100 : 0;
  const peminjamanRate =
    peminjamanBarang.length > 0
      ? ((peminjamanBarang.length - terlambatPinjam) / peminjamanBarang.length) * 100
      : 95;
  const perbaikanRate = perbaikanTotal > 0 ? (perbaikanSelesai / perbaikanTotal) * 100 : 90;

  const allFacilityItems = [
    ...fasilitasGedungList.flatMap((g) => g.daftarFasilitas || []).map((f) => f.kondisi === 'Baik'),
    ...kamarSantriList.map((k) => k.kondisi === 'Baik'),
  ];
  const fasilitasRate =
    allFacilityItems.length > 0
      ? (allFacilityItems.filter(Boolean).length / allFacilityItems.length) * 100
      : 90;

  const prlMeta = computeDivisionEvalAndProker('Perlengkapan', programKerjaList, evaluasiKepengurusan);
  let prlScoreRaw =
    unitBaikRate * 0.35 +
    stokAmanRate * 0.20 +
    peminjamanRate * 0.15 +
    perbaikanRate * 0.15 +
    fasilitasRate * 0.15;

  if (prlMeta.prokerAvg !== null && prlMeta.evalAvg !== null) {
    prlScoreRaw = prlScoreRaw * 0.80 + prlMeta.prokerAvg * 0.10 + prlMeta.evalAvg * 0.10;
  } else if (prlMeta.prokerAvg !== null) {
    prlScoreRaw = prlScoreRaw * 0.86 + prlMeta.prokerAvg * 0.14;
  } else if (prlMeta.evalAvg !== null) {
    prlScoreRaw = prlScoreRaw * 0.86 + prlMeta.evalAvg * 0.14;
  }

  const skorPerlengkapan = clampPct(prlScoreRaw);
  const perlengkapanStats = {
    totalAset,
    jenisBarang,
    kondisiBaik,
    kondisiRusak,
    sedangDipinjam,
    terlambatPinjam,
    stokKritisCount,
    perbaikanSelesai,
    perbaikanTotal,
  };

  const perlengkapanDivision: DivisionKpiMetric = {
    key: 'perlengkapan',
    title: 'Kinerja Perlengkapan',
    subtitle: 'Kesiapan Inventaris, Peminjaman & Fasilitas Asrama',
    score: skorPerlengkapan,
    ratingLabel: getRatingLabel(skorPerlengkapan),
    color: '#34d399',
    detail: `${kondisiBaik}/${totalAset} Unit Baik · ${stokKritisCount} Stok Kritis`,
    breakdown: {
      kondisiBaik,
      totalAset,
      stokKritisCount,
      fasilitasRate: Math.round(fasilitasRate),
      perbaikanSelesai,
      perbaikanTotal,
    },
  };

  // 7. DIVISION 5: KEAMANAN (Tersinkron Real-Time dengan Tab Ketua Pondok & Modul Keamanan)
  const izinTerlambat = perizinanList.filter((p) => p.status === 'Terlambat').length;
  const izinAktifKeluar = perizinanList.filter(
    (p) => p.status === 'Sedang Keluar' || p.status === 'Terlambat'
  ).length;
  const izinTepatRate = totalIzin > 0 ? ((totalIzin - izinTerlambat) / totalIzin) * 100 : 95;

  const totalSanksi = sanksiList.length;
  const sanksiSelesai = sanksiList.filter((s) => s.status === 'Selesai').length;
  const sanksiTuntasRate = totalSanksi > 0 ? (sanksiSelesai / totalSanksi) * 100 : 92;

  const pelanggaranTerverifikasi = pelanggaranList.filter(
    (p) => p.statusVerifikasi === 'Terverifikasi'
  ).length;
  const pengajuanKeamanan = pengajuanDivisi.filter((p) => p.divisi === 'Keamanan');
  const pengajuanKeamananDiproses = pengajuanKeamanan.filter(
    (p) => p.status === 'Disetujui' || p.status === 'Ditolak'
  ).length;
  const pengajuanKeamananRate =
    pengajuanKeamanan.length > 0 ? (pengajuanKeamananDiproses / pengajuanKeamanan.length) * 100 : 92;

  const dewanTotal = dewanList.length;
  const dewanAktif = dewanList.filter((d) => d.statusKeaktifan === 'Aktif').length;
  const dewanAktifRate = dewanTotal > 0 ? (dewanAktif / dewanTotal) * 100 : 90;

  const kamMeta = computeDivisionEvalAndProker('Keamanan', programKerjaList, evaluasiKepengurusan);
  const prokerKeamananPct = kamMeta.prokerAvg !== null ? kamMeta.prokerAvg : avgAllProker;

  let kamScoreRaw =
    disiplinBulanIni * 0.30 +
    izinTepatRate * 0.20 +
    sanksiTuntasRate * 0.15 +
    izinProsesRate * 0.13 +
    prokerKeamananPct * 0.12 +
    pengajuanKeamananRate * 0.05 +
    dewanAktifRate * 0.05;

  if (kamMeta.evalAvg !== null) {
    kamScoreRaw = kamScoreRaw * 0.88 + kamMeta.evalAvg * 0.12;
  }

  const skorKeamanan = clampPct(kamScoreRaw);
  const keamananStats = {
    totalIzin,
    izinDiproses,
    izinTerlambat,
    izinAktifKeluar,
    totalPelanggaran: pelanggaranList.length,
    pelanggaranTerverifikasi,
    totalSanksi,
    sanksiSelesai,
    dewanAktif,
    dewanTotal,
  };

  const keamananDivision: DivisionKpiMetric = {
    key: 'keamanan',
    title: 'Kinerja Keamanan',
    subtitle: 'Kedisiplinan Qanun, Perizinan, Sanksi & Evaluasi Ketua',
    score: skorKeamanan,
    ratingLabel: getRatingLabel(skorKeamanan),
    color: '#eab308',
    detail: `Disiplin ${disiplinBulanIni}% · Sanksi ${sanksiSelesai}/${totalSanksi} · Proker ${Math.round(prokerKeamananPct)}%`,
    breakdown: {
      disiplinBulanIni,
      izinTepatRate: Math.round(izinTepatRate),
      sanksiSelesai,
      totalSanksi,
      prokerKeamanan: Math.round(prokerKeamananPct),
      pengajuanKeamananDiproses,
    },
  };

  const divisionList: DivisionKpiMetric[] = [
    ketuaDivision,
    sekretarisDivision,
    bendaharaDivision,
    perlengkapanDivision,
    keamananDivision,
  ];

  // 8. GRAFIK 3D LINE CHART KINERJA PENGURUS (GABUNGAN REAL-TIME 5 DIVISI + AKTIVITAS MINGGUAN)
  const kinerjaBulanIni = clampPct(
    divisionList.reduce((acc, d) => acc + d.score, 0) / divisionList.length
  );

  const prevEvalItems = evaluasiKepengurusan.filter((e) => (e.tanggal || '').startsWith(prevYM));
  const fallbackPrevKinerja =
    historicalBulanan.length >= 2
      ? historicalBulanan[historicalBulanan.length - 2].skorKinerjaPengurus
      : historicalBulanan.length === 1
        ? historicalBulanan[0].skorKinerjaPengurus
        : Math.max(0, kinerjaBulanIni - 3);

  const kinerjaBulanLalu =
    prevEvalItems.length > 0
      ? clampPct(
          prevEvalItems.reduce((s, e) => s + evalToScore(e.nilaiKinerja), 0) / prevEvalItems.length
        )
      : clampPct(fallbackPrevKinerja);

  const calcWeeklyAdminScore = (weekIdx: number): number => {
    if (weekIdx === 3) return kinerjaBulanIni;
    const suratUpToW = arsipSurat.filter((s) => {
      const ym = (s.tanggalSurat || '').slice(0, 7);
      if (ym && ym < currentYM) return true;
      if (ym === currentYM) return getWeekIndexFromDate(s.tanggalSurat) <= weekIdx;
      return false;
    });
    const pgjUpToW = pengajuanDivisi.filter((p) => {
      const d = p.tanggalKeputusan || p.tanggal || '';
      const ym = d.slice(0, 7);
      if (ym && ym < currentYM) return true;
      if (ym === currentYM) return getWeekIndexFromDate(d) <= weekIdx;
      return false;
    });
    const evalUpToW = evaluasiKepengurusan.filter((e) => {
      const ym = (e.tanggal || '').slice(0, 7);
      if (ym && ym < currentYM) return true;
      if (ym === currentYM) return getWeekIndexFromDate(e.tanggal) <= weekIdx;
      return false;
    });
    const agendaUpToW = agendaPengurus.filter((a) => {
      const ym = (a.tanggal || '').slice(0, 7);
      if (ym && ym < currentYM) return true;
      if (ym === currentYM) return getWeekIndexFromDate(a.tanggal) <= weekIdx;
      return false;
    });

    const wSuratRatio =
      suratUpToW.length > 0
        ? (suratUpToW.filter((s) => s.status === 'Resmi / Terbit' || s.status === 'Diarsipkan').length /
            suratUpToW.length) *
          100
        : kinerjaBulanIni - (3 - weekIdx) * 2;
    const wPgjRatio =
      pgjUpToW.length > 0
        ? (pgjUpToW.filter((p) => p.status === 'Disetujui' || p.status === 'Ditolak').length /
            pgjUpToW.length) *
          100
        : kinerjaBulanIni - (3 - weekIdx) * 2;
    const wEvalScore =
      evalUpToW.length > 0
        ? evalUpToW.reduce((s, e) => s + evalToScore(e.nilaiKinerja), 0) / evalUpToW.length
        : kinerjaBulanIni - (3 - weekIdx) * 1.5;
    const wAgendaRatio =
      agendaUpToW.length > 0
        ? (agendaUpToW.filter((a) => a.status === 'Selesai' || a.status === 'Berlangsung').length /
            agendaUpToW.length) *
          100
        : kinerjaBulanIni - (3 - weekIdx) * 2;

    const activitySignal = (wSuratRatio + wPgjRatio + wEvalScore + wAgendaRatio) / 4;
    const progressFactor = (weekIdx + 1) / 4;
    return clampPct(kinerjaBulanLalu * (1 - progressFactor * 0.5) + (kinerjaBulanIni * 0.7 + activitySignal * 0.3) * (progressFactor * 0.5 + 0.5));
  };

  const kinerjaChartData: WeeklyComparisonPoint[] = [0, 1, 2, 3].map((weekIdx) => ({
    pekan: `Minggu ${weekIdx + 1}`,
    minggu: `Pekan ${weekIdx + 1}`,
    bulanIni: calcWeeklyAdminScore(weekIdx),
    bulanLalu:
      weekIdx === 3
        ? kinerjaBulanLalu
        : clampPct(kinerjaBulanLalu - (3 - weekIdx) * 1.5),
  }));

  // 9. MULTI-MONTH TREND SERIES (Untuk KeamananModule & Laporan Tren)
  const monthlySeries: MonthlyTrendPoint[] = (() => {
    const monthSet = new Set<string>();
    const baseDate = new Date(Number(currentYM.slice(0, 4)), Number(currentYM.slice(5, 7)) - 1, 1);
    for (let i = 4; i >= 0; i--) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
      monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const yms = Array.from(monthSet).sort();

    return yms.map((ym, idx) => {
      if (ym === currentYM) {
        return {
          bulan: formatShortMonthFromYM(ym),
          skorKinerjaPengurus: skorKeamanan,
          skorKedisiplinanSantri: disiplinBulanIni,
        };
      }
      const mPel = pelanggaranList.filter((p) => (p.tanggal || '').startsWith(ym));
      const mIzin = perizinanList.filter((p) => (p.tglKeluar || '').startsWith(ym));
      const mSanksi = sanksiList.filter((s) => (s.tanggalPenetapan || '').startsWith(ym));
      const mAbs = murotilAbsensiSantriList.filter((a) => (a.tanggal || '').startsWith(ym));
      const mAlpha = mAbs.filter((a) => a.status === 'Alpha').length;
      const mEval = evaluasiKepengurusan.filter((e) => (e.tanggal || '').startsWith(ym) && (e.divisi === 'Keamanan' || e.divisi === 'Umum'));

      const shortLbl = formatShortMonthFromYM(ym);
      const histMatch = historicalBulanan.find((h) => h.bulan.toLowerCase() === shortLbl.toLowerCase());

      const hasMonthData = mPel.length > 0 || mIzin.length > 0 || mSanksi.length > 0 || mAbs.length > 0;
      const monthDisiplin = hasMonthData
        ? calcDisciplineScore(mPel, mIzin, mSanksi, mAlpha, mAbs.length)
        : histMatch
          ? clampPct(histMatch.skorKedisiplinanSantri)
          : clampPct(disiplinBulanLalu - (3 - idx));

      const monthKeamanan =
        mEval.length > 0
          ? clampPct(mEval.reduce((s, e) => s + evalToScore(e.nilaiKinerja), 0) / mEval.length)
          : histMatch
            ? clampPct(histMatch.skorKinerjaPengurus)
            : clampPct((skorKeamanan + monthDisiplin) / 2 - (3 - idx));

      return {
        bulan: shortLbl,
        skorKinerjaPengurus: monthKeamanan,
        skorKedisiplinanSantri: monthDisiplin,
      };
    });
  })();

  // 10. GRAFIK 3D DIAGRAM SANTRI DARI TAHUN KE TAHUN (100% REAL DATA DARI santriList)
  const santriYearlyChart: SantriYearlyPoint[] = (() => {
    const parsedEntries = activeSantri.map((s) => {
      const y = parseInt(String(s.tglMasuk || '').slice(0, 4), 10);
      return {
        gender: s.gender,
        year: Number.isFinite(y) && y >= 2000 && y <= currentYear + 1 ? y : currentYear,
      };
    });

    const yearsInData = parsedEntries.map((e) => e.year);
    const maxYear = yearsInData.length > 0 ? Math.max(currentYear, ...yearsInData) : currentYear;
    const minCandidate = yearsInData.length > 0 ? Math.min(...yearsInData) : maxYear - 4;
    const minYear = Math.max(maxYear - 5, Math.min(minCandidate, maxYear - 4));

    const points: SantriYearlyPoint[] = [];
    for (let yr = minYear; yr <= maxYear; yr++) {
      const putra = parsedEntries.filter((e) => e.gender === 'putra' && e.year <= yr).length;
      const putri = parsedEntries.filter((e) => e.gender === 'putri' && e.year <= yr).length;
      points.push({
        tahun: String(yr),
        putra,
        putri,
        total: putra + putri,
      });
    }
    return points;
  })();

  return {
    santriStats,
    financeAnalytics,
    sekretarisStats,
    perlengkapanStats,
    keamananStats,
    divisions: {
      ketua_pondok: ketuaDivision,
      sekretaris: sekretarisDivision,
      bendahara: bendaharaDivision,
      perlengkapan: perlengkapanDivision,
      keamanan: keamananDivision,
    },
    divisionList,
    kinerjaPengurusStats: {
      bulanIni: kinerjaBulanIni,
      bulanLalu: kinerjaBulanLalu,
      selisih: kinerjaBulanIni - kinerjaBulanLalu,
      chartData: kinerjaChartData,
    },
    kedisiplinanSantriStats: {
      bulanIni: disiplinBulanIni,
      bulanLalu: disiplinBulanLalu,
      selisih: disiplinBulanIni - disiplinBulanLalu,
      totalSantri: Math.max(0, totalSantri),
      chartData: disiplinChartData,
      monthlySeries,
    },
    santriYearlyChart,
  };
}

export function computeBendaharaWeeklyCashflow(
  transactions: TransaksiKeuangan[]
): { pekan: string; pemasukan: number; pengeluaran: number }[] {
  const buckets = [
    { pekan: 'Pekan 1', pemasukan: 0, pengeluaran: 0 },
    { pekan: 'Pekan 2', pemasukan: 0, pengeluaran: 0 },
    { pekan: 'Pekan 3', pemasukan: 0, pengeluaran: 0 },
    { pekan: 'Pekan 4', pemasukan: 0, pengeluaran: 0 },
  ];

  transactions.forEach((t) => {
    const idx = getWeekIndexFromDate(t.tanggal);
    const nom = Number(t.nominal) || 0;
    if (t.tipe === 'Pemasukan') buckets[idx].pemasukan += nom;
    else buckets[idx].pengeluaran += nom;
  });

  return buckets;
}

export function computeSyahriyahWeeklySeries(
  mergedCurrentPeriod: SyahriyahSantri[],
  allStoredSyahriyah: SyahriyahSantri[],
  activePeriod: string
): {
  pctNow: number;
  pctLast: number;
  diff: number;
  hasPrevPeriodData: boolean;
  chartData: { pekan: string; bulanLalu: number; bulanIni: number }[];
} {
  const labels = [
    'Minggu 1 (Tgl 1-7)',
    'Minggu 2 (Tgl 8-14)',
    'Minggu 3 (Tgl 15-21)',
    'Minggu 4 (Tgl 22-30)',
  ];

  const totalNow = mergedCurrentPeriod.length;
  const nowWeekHits = [0, 0, 0, 0];
  mergedCurrentPeriod.forEach((r) => {
    if (r.status === 'Lunas') {
      const idx = r.tanggalBayar ? getWeekIndexFromDate(r.tanggalBayar) : 3;
      nowWeekHits[idx] += 1;
    }
  });

  const prevRecords = allStoredSyahriyah.filter((r) => r.bulanTahun !== activePeriod);
  let prevTargetRecords: SyahriyahSantri[] = [];
  if (prevRecords.length > 0) {
    const prevPeriodName = prevRecords[0].bulanTahun;
    prevTargetRecords = prevRecords.filter((r) => r.bulanTahun === prevPeriodName);
  }
  const hasPrevPeriodData = prevTargetRecords.length > 0;
  const prevWeekHits = [0, 0, 0, 0];
  prevTargetRecords.forEach((r) => {
    if (r.status === 'Lunas') {
      const idx = r.tanggalBayar ? getWeekIndexFromDate(r.tanggalBayar) : 3;
      prevWeekHits[idx] += 1;
    }
  });

  let cumNow = 0;
  let cumPrev = 0;
  const chartData = labels.map((pekan, i) => {
    cumNow += nowWeekHits[i];
    cumPrev += prevWeekHits[i];
    const pctIni = totalNow > 0 ? Math.round((cumNow / totalNow) * 100) : 0;
    const pctLalu =
      prevTargetRecords.length > 0 ? Math.round((cumPrev / prevTargetRecords.length) * 100) : 0;
    return {
      pekan,
      bulanIni: pctIni,
      bulanLalu: pctLalu,
    };
  });

  const pctNow = chartData[3]?.bulanIni ?? 0;
  const pctLast = chartData[3]?.bulanLalu ?? 0;

  return {
    pctNow,
    pctLast,
    diff: pctNow - pctLast,
    hasPrevPeriodData,
    chartData,
  };
}
