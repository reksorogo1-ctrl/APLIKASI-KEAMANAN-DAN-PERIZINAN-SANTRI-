import React, { useMemo, useState } from 'react';
import {
  Users,
  UserCheck,
  HeartPulse,
  Home,
  Building2,
  TrendingUp,
  Wallet,
  FileText,
  Package,
  ShieldCheck,
  Crown,
  Calendar,
  ArrowUpRight,
  Sparkles,
  Megaphone,
  GraduationCap,
  Activity,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Scale,
  Lightbulb,
  Bell,
  Printer,
  PieChart as PieChartIcon,
  Mail,
  User,
  Clock,
  MapPin
} from 'lucide-react';
import {
  Santri,
  Perizinan,
  Pelanggaran,
  Sanksi,
  TransaksiKeuangan,
  ArsipSurat,
  BarangInventaris,
  PeminjamanBarang,
  AgendaPengurus,
  EvaluasiKepengurusan,
  PengajuanDivisi,
  UserAccount,
  SystemConfig,
  PesanKoordinasi,
  DewanKeamanan
} from '../types';
import { ActiveMenu } from './Sidebar';
import { storageService } from '../services/storageService';
import { openPrintWindow } from '../utils/printDocument';
import { D3CandlestickChart } from './D3CandlestickChart';
import { computeRealtimePondokAnalytics } from '../utils/realtimeAnalytics';
import {
  BarChart3D,
  Extruded3DValue,
  KpiStatCard3D,
  LineChart3D,
  PieChart3D,
} from './Charts3D';

interface MainDashboardProps {
  currentUser: UserAccount;
  systemConfig: SystemConfig;
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
  onNavigate: (menu: ActiveMenu, subTab?: string) => void;
}

const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabiul Awal',
  'Rabiul Akhir',
  'Jumadil Awal',
  'Jumadil Akhir',
  'Rajab',
  'Sya\'ban',
  'Ramadhan',
  'Syawal',
  'Dzulqa\'dah',
  'Dzulhijjah'
];

function gregorianToHijri(date: Date): { day: number; monthName: string; monthIndex: number; year: number } {
  let jd = Math.floor((date.getTime() - new Date(Date.UTC(1970, 0, 1)).getTime()) / 86400000) + 2440588;
  let l = jd - 1948440 + 10632;
  let n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
  l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  let month = Math.floor((24 * l) / 709);
  let day = l - Math.floor((709 * month) / 24);
  let year = 30 * n + j - 30;
  const monthIdx = Math.max(0, Math.min(11, month - 1));
  return {
    day,
    monthName: HIJRI_MONTHS[monthIdx],
    monthIndex: monthIdx,
    year
  };
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  currentUser,
  systemConfig,
  santriList,
  perizinanList,
  pelanggaranList,
  sanksiList: propSanksiList,
  transaksiKeuangan,
  arsipSurat,
  barangInventaris,
  peminjamanBarang = [],
  agendaPengurus,
  evaluasiKepengurusan: propEvaluasiList,
  pengajuanDivisi,
  koordinasiList: propKoordinasiList,
  dewanList: propDewanList,
  onNavigate,
}) => {
  const todayWibStr = useMemo(
    () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
    []
  );
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(todayWibStr);

  const notifikasiList = storageService.getNotifications();
  const koordinasiList = propKoordinasiList || storageService.getKoordinasiList();
  const sanksiList = propSanksiList || storageService.getSanksiList();
  const evaluasiKepengurusan = propEvaluasiList || storageService.getEvaluasiKepengurusan();
  const dewanList = propDewanList || storageService.getDewanKeamananList();

  // Pusat Analitik Real-Time Terpadu (Tersinkronisasi 100% dengan Tab Ketua Pondok, Sekretaris, Bendahara, Perlengkapan, & Keamanan)
  const realtimeAnalytics = useMemo(
    () =>
      computeRealtimePondokAnalytics({
        santriList,
        perizinanList,
        pelanggaranList,
        sanksiList,
        transaksiKeuangan,
        arsipSurat,
        barangInventaris,
        peminjamanBarang,
        agendaPengurus,
        evaluasiKepengurusan,
        pengajuanDivisi,
        koordinasiList,
        dewanList,
        systemConfig,
      }),
    [
      santriList,
      perizinanList,
      pelanggaranList,
      sanksiList,
      transaksiKeuangan,
      arsipSurat,
      barangInventaris,
      peminjamanBarang,
      agendaPengurus,
      evaluasiKepengurusan,
      pengajuanDivisi,
      koordinasiList,
      dewanList,
      systemConfig,
    ]
  );

  const stats = realtimeAnalytics.santriStats;
  const financeAnalytics = realtimeAnalytics.financeAnalytics;
  const kinerjaPengurusStats = realtimeAnalytics.kinerjaPengurusStats;
  const kedisiplinanSantriStats = realtimeAnalytics.kedisiplinanSantriStats;
  const santriYearlyChart = realtimeAnalytics.santriYearlyChart;
  const sekretarisStats = realtimeAnalytics.sekretarisStats;
  const perlengkapanStats = realtimeAnalytics.perlengkapanStats;

  const divisionKpiPies = useMemo(
    () =>
      realtimeAnalytics.divisionList.map((div) => ({
        ...div,
        targetMenu: div.key as ActiveMenu,
      })),
    [realtimeAnalytics.divisionList]
  );

  // Filter Pie Charts based on active user role
  const visibleKpiPies = useMemo(() => {
    const r = currentUser.role;
    if (r === 'admin' || r === 'ketua_pondok') {
      return divisionKpiPies;
    }
    if (r === 'sekretaris') {
      return divisionKpiPies.filter(d => d.key === 'sekretaris');
    }
    if (r === 'bendahara') {
      return divisionKpiPies.filter(d => d.key === 'bendahara');
    }
    if (r === 'perlengkapan') {
      return divisionKpiPies.filter(d => d.key === 'perlengkapan');
    }
    return divisionKpiPies.filter(d => d.key === 'keamanan');
  }, [currentUser.role, divisionKpiPies]);

  // 8. Kalender Kegiatan Masehi & Hijriah
  const calendarData = useMemo(() => {
    const now = new Date();
    const viewDate = new Date(now.getFullYear(), now.getMonth() + calendarMonthOffset, 1);
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const masehiMonthName = viewDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const hijriStart = gregorianToHijri(new Date(year, month, 1));
    const hijriEnd = gregorianToHijri(new Date(year, month, daysInMonth));
    const hijriHeader =
      hijriStart.monthName === hijriEnd.monthName
        ? `${hijriStart.monthName} ${hijriStart.year} H`
        : `${hijriStart.monthName} - ${hijriEnd.monthName} ${hijriEnd.year} H`;

    const days: {
      dateStr: string;
      masehiDay: number;
      hijriDay: number;
      hijriMonth: string;
      isToday: boolean;
      agendas: AgendaPengurus[];
    }[] = [];

    const todayStr = todayWibStr;

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d, 12, 0, 0);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hijri = gregorianToHijri(cellDate);
      const dayAgendas = agendaPengurus.filter(a => a.tanggal === dateStr);
      days.push({
        dateStr,
        masehiDay: d,
        hijriDay: hijri.day,
        hijriMonth: hijri.monthName,
        isToday: dateStr === todayStr,
        agendas: dayAgendas,
      });
    }

    return {
      masehiMonthName,
      hijriHeader,
      firstDayOfWeek,
      days,
    };
  }, [calendarMonthOffset, agendaPengurus, todayWibStr]);

  const todayAgendas = useMemo(
    () => agendaPengurus.filter((a) => a.tanggal === todayWibStr && a.status !== 'Selesai'),
    [agendaPengurus, todayWibStr]
  );

  const selectedDateAgendas = useMemo(
    () => agendaPengurus.filter((a) => a.tanggal === selectedCalendarDate),
    [agendaPengurus, selectedCalendarDate]
  );

  const selectedDateInfo = useMemo(() => {
    const dObj = new Date(`${selectedCalendarDate}T12:00:00`);
    const valid = !isNaN(dObj.getTime()) ? dObj : new Date();
    const masehiLabel = valid.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const hj = gregorianToHijri(valid);
    return {
      masehiLabel,
      hijriLabel: `${hj.day} ${hj.monthName} ${hj.year} H`,
    };
  }, [selectedCalendarDate]);

  const upcomingAgendas = useMemo(() => {
    return [...agendaPengurus]
      .filter((a) => a.status !== 'Selesai')
      .sort((a, b) => (a.tanggal > b.tanggal ? 1 : -1))
      .slice(0, 4);
  }, [agendaPengurus]);

  const handleJumpToAgendaDate = (dateStr: string) => {
    setSelectedCalendarDate(dateStr);
    const target = new Date(`${dateStr}T12:00:00`);
    const now = new Date();
    if (!isNaN(target.getTime())) {
      const diffMonths =
        (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
      setCalendarMonthOffset(diffMonths);
    }
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const beritaList = systemConfig.beritaTerkini || [];

  // Handler Cetak Laporan Bulanan Eksekutif Beserta Grafiknya
  const handlePrintLaporanBulanan = () => {
    const html = `
      <div style="font-family: 'Times New Roman', serif; color: #000; padding: 12mm;">
        <div style="text-align: center; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 18px;">
          <h2 style="margin: 0; font-size: 18pt; text-transform: uppercase;">${systemConfig.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI'}</h2>
          <p style="margin: 4px 0; font-size: 11pt;">${systemConfig.alamatPondok || ''}</p>
          <p style="margin: 2px 0; font-size: 10pt; font-weight: bold;">LAPORAN EKSEKUTIF BULANAN & STATISTIK KINERJA PENGURUS</p>
        </div>

        <h3 style="font-size: 12pt; margin-bottom: 8px;">I. RINGKASAN STATISTIK SANTRI & ASATIDZ</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10.5pt;">
          <tr style="background: #f3f4f6;">
            <th style="border: 1px solid #000; padding: 6px;">Total Santri</th>
            <th style="border: 1px solid #000; padding: 6px;">Putra (Banin)</th>
            <th style="border: 1px solid #000; padding: 6px;">Putri (Banat)</th>
            <th style="border: 1px solid #000; padding: 6px;">Di Pondok</th>
            <th style="border: 1px solid #000; padding: 6px;">Izin Pulang</th>
            <th style="border: 1px solid #000; padding: 6px;">Santri Sakit</th>
            <th style="border: 1px solid #000; padding: 6px;">Ustadz/Ustadzah</th>
          </tr>
          <tr style="text-align: center;">
            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${stats.totalSantri}</td>
            <td style="border: 1px solid #000; padding: 6px;">${stats.santriPutra}</td>
            <td style="border: 1px solid #000; padding: 6px;">${stats.santriPutri}</td>
            <td style="border: 1px solid #000; padding: 6px;">${stats.santriDiPondok}</td>
            <td style="border: 1px solid #000; padding: 6px;">${stats.santriIzinPulang}</td>
            <td style="border: 1px solid #000; padding: 6px;">${stats.santriSakit}</td>
            <td style="border: 1px solid #000; padding: 6px;">${stats.ustadzAktif} / ${stats.ustadzahAktif}</td>
          </tr>
        </table>

        <h3 style="font-size: 12pt; margin-bottom: 8px;">II. INDIKATOR PENILAIAN KINERJA DIVISI (GRAFIK PERSENTASE)</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 10.5pt;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="border: 1px solid #000; padding: 6px; text-align: left;">Divisi Kepengurusan</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: center;">Persentase Capaian</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: left;">Grafik Bar Indikator</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: left;">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${divisionKpiPies.map(d => `
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${d.title}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">${d.score}%</td>
                <td style="border: 1px solid #000; padding: 6px; width: 35%;">
                  <div style="width: 100%; background: #e5e7eb; height: 12px; border: 1px solid #000;">
                    <div style="width: ${d.score}%; background: #065f46; height: 100%;"></div>
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 6px;">${d.detail}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3 style="font-size: 12pt; margin-bottom: 8px;">III. IKHTISAR KEUANGAN BENDAHARA & OPERASIONAL</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 10.5pt;">
          <tr>
            <td style="border: 1px solid #000; padding: 6px;">Total Pemasukan Kas</td>
            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${formatRupiah(financeAnalytics.totalPemasukan)}</td>
            <td style="border: 1px solid #000; padding: 6px;">Total Arsip Surat Sekretaris</td>
            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${sekretarisStats.totalArsip} Dokumen (${sekretarisStats.suratResmiTerbit} Resmi Terbit)</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 6px;">Total Pengeluaran Kas</td>
            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${formatRupiah(financeAnalytics.totalPengeluaran)}</td>
            <td style="border: 1px solid #000; padding: 6px;">Total Aset Perlengkapan</td>
            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${perlengkapanStats.totalAset} Unit (${perlengkapanStats.kondisiBaik} Baik)</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 6px;">Saldo Surplus Kas</td>
            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${formatRupiah(financeAnalytics.saldoPondok)}</td>
            <td style="border: 1px solid #000; padding: 6px;">Indeks Kedisiplinan Santri</td>
            <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${kedisiplinanSantriStats.bulanIni}% (Bulan Lalu: ${kedisiplinanSantriStats.bulanLalu}%)</td>
          </tr>
        </table>

        <div style="display: flex; justify-content: space-between; margin-top: 32px; font-size: 11pt;">
          <div style="text-align: center; width: 42%;">
            <p>Mengetahui,<br/>Pengasuh Pondok Pesantren</p>
            <div style="height: 65px;"></div>
            <p style="font-weight: bold; text-decoration: underline;">${systemConfig.namaPimpinan || 'KH. Ahmad Fauzi Al-Maliki'}</p>
          </div>
          <div style="text-align: center; width: 42%;">
            <p>Karawang, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>${currentUser.jabatan}</p>
            <div style="height: 65px;"></div>
            <p style="font-weight: bold; text-decoration: underline;">${currentUser.nama}</p>
          </div>
        </div>
      </div>
    `;
    openPrintWindow('Laporan Eksekutif Bulanan Ponpes Salaf Al-Maliki', html);
  };

  const showFinanceSection =
    currentUser.role === 'admin' || currentUser.role === 'ketua_pondok' || currentUser.role === 'bendahara';
  const showKinerjaPengurusLine =
    currentUser.role === 'admin' || currentUser.role === 'ketua_pondok';
  const showSekretarisCard =
    currentUser.role === 'admin' || currentUser.role === 'ketua_pondok' || currentUser.role === 'sekretaris';
  const showPerlengkapanCard =
    currentUser.role === 'admin' || currentUser.role === 'ketua_pondok' || currentUser.role === 'perlengkapan';

  return (
    <div className="space-y-6 pb-10">
      {/* 1. UCAPAN SELAMAT DATANG & NOTIFIKASI PERIZINAN / PERMINTAAN SURAT / PESAN DARI DIVISI LAIN */}
      <div className="cyber-glass-card relative rounded-2xl overflow-hidden border border-emerald-500/25 bg-emerald-950/60 backdrop-blur-md p-4 sm:p-6 shadow-2xl space-y-5">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
          <div className="flex items-start sm:items-center gap-3 sm:gap-5 min-w-0">
            <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-[22%] bg-[#041A13] border-2 border-[#D4AF37]/80 p-0 shadow-[0_12px_35px_rgba(0,0,0,0.75),0_0_20px_rgba(212,175,55,0.22)] shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={
                  !systemConfig.logoUrl ||
                  systemConfig.logoUrl.includes('2026-11-11-7ffd46ad') ||
                  systemConfig.logoUrl.includes('2026-11-14-03361e24') ||
                  systemConfig.logoUrl.includes('logo_pesantren_almaliki')
                    ? '/logo-fit.png'
                    : systemConfig.logoUrl
                }
                alt="Logo Pondok Pesantren Salaf Al-Maliki"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (!img.dataset.fallbackApplied) {
                    img.dataset.fallbackApplied = '1';
                    img.src = '/logo-fit.png';
                  }
                }}
                className="w-full h-full object-cover scale-[1.03]"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex max-w-full items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-mono uppercase tracking-wider sm:tracking-widest mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                <span className="truncate">DASHBOARD UTAMA · {currentUser.jabatan.toUpperCase()}</span>
              </div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
                Ahlan wa Sahlan, {currentUser.nama}
              </h1>
              <p className="text-xs sm:text-sm text-[#D1FAE5] mt-1 max-w-2xl">
                Selamat bertugas di Sistem Informasi Manajemen Pengurus <span className="text-[#D4AF37] font-semibold">{systemConfig.namaPondok}</span>. Pantau notifikasi lintas divisi, capaian kinerja, dan perkembangan santri secara real-time.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {(currentUser.role === 'admin' || currentUser.role === 'ketua_pondok') && (
              <button
                onClick={handlePrintLaporanBulanan}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#b58922] hover:from-[#e5c158] hover:to-[#D4AF37] text-[#041A13] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <Printer className="w-4 h-4" />
                Cetak Laporan Bulanan & Grafik
              </button>
            )}
            <button
              onClick={() => onNavigate('biodata_profil')}
              className="px-4 py-2.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/70 text-[#D4AF37] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-[#D4AF37]/50 shadow-lg"
            >
              <User className="w-4 h-4 text-[#10B981]" />
              Edit Biodata & Profil
            </button>
            {currentUser.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin_options')}
                className="px-4 py-2.5 rounded-xl bg-[#041A13]/80 hover:bg-emerald-950/80 text-[#D1FAE5] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-emerald-500/30"
              >
                <Sliders className="w-4 h-4 text-[#10B981]" />
                Option Panel
              </button>
            )}
          </div>
        </div>

        {/* Panel Notifikasi Simpel, Agenda Kalender Akademik di Atas & Klik Langsung Pindah Halaman */}
        <div className="pt-4 border-t border-emerald-800/60 space-y-2.5">
          {/* 1. Notifikasi Agenda Kalender Akademik Hari Ini (Muncul di Atas Saat Ada Agenda Aktif) */}
          {todayAgendas.length > 0 && (
            <button
              type="button"
              onClick={() => {
                handleJumpToAgendaDate(todayWibStr);
                document.getElementById('kalender-akademik')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#d4af37]/20 via-[#072c1e]/95 to-[#03160f] border border-[#d4af37]/65 hover:border-[#f3d266] flex items-center justify-between gap-3 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-[#d4af37] text-[#02120a] shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold text-[#f3d266] uppercase tracking-wider truncate">
                    Agenda Kalender Akademik Hari Ini ({todayAgendas.length})
                  </p>
                  <p className="text-xs text-white truncate">
                    {todayAgendas.map((a) => `${a.judul} · ${a.waktu} WIB (${a.tempat})`).join(' | ')}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#f3d266] group-hover:translate-x-0.5 transition-transform shrink-0 whitespace-nowrap">
                <span>Lihat Kalender</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </button>
          )}

          {/* 2. Daftar Notifikasi Pesan Masuk & Sistem (Simpel — Klik Otomatis Pindah ke Halaman Terkait) */}
          {(() => {
            type SimpleNotifItem = {
              key: string;
              kind: 'pesan' | 'sistem';
              title: string;
              detail: string;
              isUnread: boolean;
              targetLabel: string;
              onClick: () => void;
            };

            const resolveMsgTarget = (msg: PesanKoordinasi): { menu: ActiveMenu; subTab?: string; label: string } => {
              if (currentUser.role === 'ketua_pondok') {
                return { menu: 'ketua_pondok', subTab: 'sk_koordinasi', label: 'Kotak Masuk Ketua' };
              }
              if (currentUser.role === 'sekretaris') {
                return { menu: 'sekretaris', subTab: 'kotak_masuk', label: 'Kotak Masuk Sekretaris' };
              }
              if (currentUser.role === 'bendahara') {
                return { menu: 'bendahara', subTab: 'kotak_masuk', label: 'Kotak Masuk Bendahara' };
              }
              if (currentUser.role === 'perlengkapan') {
                return { menu: 'perlengkapan', subTab: 'kotak_masuk', label: 'Kotak Masuk Perlengkapan' };
              }
              if (
                currentUser.role === 'ketua_keamanan' ||
                currentUser.role === 'anggota_keamanan' ||
                currentUser.role === 'petugas_gerbang'
              ) {
                return { menu: 'keamanan', subTab: 'koordinasi', label: 'Kotak Masuk Keamanan' };
              }
              // Admin routing based on message origin/context
              const text = `${msg.judul} ${msg.pengirimJabatan || ''} ${msg.tujuan}`.toLowerCase();
              if (msg.tujuan === 'ketua_pondok' || msg.pengirimRole === 'ketua_pondok') {
                return { menu: 'ketua_pondok', subTab: 'sk_koordinasi', label: 'Kotak Masuk Ketua' };
              }
              if (msg.pengirimRole === 'sekretaris' || text.includes('sekretaris') || text.includes('notulen rapat')) {
                return { menu: 'sekretaris', subTab: 'kotak_masuk', label: 'Kotak Masuk & Pesan' };
              }
              if (msg.pengirimRole === 'bendahara' || text.includes('bendahara')) {
                return { menu: 'bendahara', subTab: 'kotak_masuk', label: 'Kotak Masuk Bendahara' };
              }
              if (msg.pengirimRole === 'perlengkapan' || text.includes('perlengkapan')) {
                return { menu: 'perlengkapan', subTab: 'kotak_masuk', label: 'Kotak Masuk Perlengkapan' };
              }
              return { menu: 'keamanan', subTab: 'koordinasi', label: 'Kotak Masuk Keamanan' };
            };

            const resolveSysNotifTarget = (nId: string, linkMenu?: string): { menu: ActiveMenu; subTab?: string; label: string; isCalendar?: boolean } => {
              if (nId.startsWith('notif_agenda_') || linkMenu === 'kalender_akademik') {
                return { menu: 'dashboard', label: 'Kalender Akademik', isCalendar: true };
              }
              if (linkMenu === 'ketua_pondok' || linkMenu === 'ketua_pondok_persetujuan') {
                return currentUser.role === 'admin' || currentUser.role === 'ketua_pondok'
                  ? { menu: 'ketua_pondok', subTab: 'persetujuan', label: 'Persetujuan Ketua' }
                  : { menu: 'dashboard', label: 'Dashboard' };
              }
              if (linkMenu === 'ketua_pondok_koordinasi') {
                return currentUser.role === 'admin' || currentUser.role === 'ketua_pondok'
                  ? { menu: 'ketua_pondok', subTab: 'sk_koordinasi', label: 'Kotak Masuk Ketua' }
                  : { menu: 'dashboard', label: 'Dashboard' };
              }
              if (linkMenu === 'sekretaris' || linkMenu === 'sekretaris_inbox') {
                return { menu: 'sekretaris', subTab: linkMenu === 'sekretaris_inbox' ? 'kotak_masuk' : undefined, label: 'Halaman Sekretaris' };
              }
              if (linkMenu === 'bendahara' || linkMenu === 'bendahara_inbox') {
                return { menu: 'bendahara', subTab: linkMenu === 'bendahara_inbox' ? 'kotak_masuk' : undefined, label: 'Halaman Bendahara' };
              }
              if (linkMenu === 'perlengkapan' || linkMenu === 'perlengkapan_inbox') {
                return { menu: 'perlengkapan', subTab: linkMenu === 'perlengkapan_inbox' ? 'kotak_masuk' : undefined, label: 'Halaman Perlengkapan' };
              }
              if (linkMenu === 'koordinasi') {
                if (currentUser.role === 'ketua_pondok') return { menu: 'ketua_pondok', subTab: 'sk_koordinasi', label: 'Kotak Masuk & Pesan' };
                if (currentUser.role === 'sekretaris') return { menu: 'sekretaris', subTab: 'kotak_masuk', label: 'Kotak Masuk & Pesan' };
                if (currentUser.role === 'bendahara') return { menu: 'bendahara', subTab: 'kotak_masuk', label: 'Kotak Masuk & Pesan' };
                if (currentUser.role === 'perlengkapan') return { menu: 'perlengkapan', subTab: 'kotak_masuk', label: 'Kotak Masuk & Pesan' };
                return { menu: 'keamanan', subTab: 'koordinasi', label: 'Kotak Masuk & Pesan' };
              }
              if (linkMenu === 'perizinan' || linkMenu === 'monitoring' || linkMenu === 'pelanggaran' || linkMenu === 'pos_gerbang' || linkMenu === 'sanksi') {
                const mapLabel: Record<string, string> = {
                  perizinan: 'Perizinan Santri',
                  monitoring: 'Radar & Pos Gerbang',
                  pelanggaran: 'Pelanggaran & Sanksi',
                  pos_gerbang: 'Radar & Pos Gerbang',
                  sanksi: 'Pelanggaran & Sanksi',
                };
                return { menu: 'keamanan', subTab: linkMenu, label: mapLabel[linkMenu] || 'Keamanan' };
              }
              return { menu: 'dashboard', label: 'Dashboard' };
            };

            const pesanItems: SimpleNotifItem[] = [...koordinasiList]
              .filter((k) => k.pengirimId !== currentUser.id)
              .sort((a, b) => {
                const aUnread = !(a.dibacaOleh || []).includes(currentUser.id);
                const bUnread = !(b.dibacaOleh || []).includes(currentUser.id);
                return Number(bUnread) - Number(aUnread);
              })
              .slice(0, 4)
              .map((k) => {
                const target = resolveMsgTarget(k);
                const isUnread = !(k.dibacaOleh || []).includes(currentUser.id);
                return {
                  key: `msg_${k.id}`,
                  kind: 'pesan',
                  title: k.judul,
                  detail: `Dari ${k.pengirimNama} (${k.pengirimJabatan || k.kategori})`,
                  isUnread,
                  targetLabel: target.label,
                  onClick: () => {
                    storageService.markKoordinasiAsRead(k.id, currentUser.id);
                    onNavigate(target.menu, target.subTab);
                  },
                };
              });

            const sysItems: SimpleNotifItem[] = notifikasiList
              .filter((n) => !n.id.startsWith('notif_agenda_') && !n.judul.startsWith('Pesan Masuk:') && !n.judul.startsWith('Balasan Pesan:'))
              .slice(0, 3)
              .map((n) => {
                const target = resolveSysNotifTarget(n.id, n.linkMenu);
                return {
                  key: `sys_${n.id}`,
                  kind: 'sistem',
                  title: n.judul,
                  detail: n.pesan,
                  isUnread: !n.dibaca,
                  targetLabel: target.label,
                  onClick: () => {
                    storageService.markNotificationRead(n.id);
                    if (target.isCalendar) {
                      handleJumpToAgendaDate(todayWibStr);
                      document.getElementById('kalender-akademik')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                      onNavigate(target.menu, target.subTab);
                    }
                  },
                };
              });

            const combinedItems = [...pesanItems, ...sysItems]
              .sort((a, b) => Number(b.isUnread) - Number(a.isUnread))
              .slice(0, 4);

            const totalUnread = combinedItems.filter((i) => i.isUnread).length;

            return (
              <div className="p-3.5 rounded-2xl bg-[#041A13]/80 backdrop-blur-md border border-emerald-500/25 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider">
                    <Bell className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Notifikasi Pesan Masuk &amp; Sistem</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#D1FAE5]">
                    {totalUnread > 0 ? `${totalUnread} Belum Dibaca · Klik untuk buka` : 'Semua terbaca'}
                  </span>
                </div>

                {combinedItems.length === 0 ? (
                  <p className="text-xs text-[#D1FAE5]/80">Belum ada pesan masuk atau notifikasi terbaru.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {combinedItems.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={item.onClick}
                        className={`w-full text-left px-3 py-2 rounded-xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer group ${
                          item.isUnread
                            ? 'bg-emerald-950/75 border-[#D4AF37]/55 hover:border-[#D4AF37]'
                            : 'bg-[#041A13]/70 border-emerald-500/25 hover:border-emerald-400/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`p-1.5 rounded-lg shrink-0 ${
                              item.kind === 'pesan'
                                ? 'bg-[#D4AF37]/15 text-[#D4AF37]'
                                : 'bg-[#10B981]/15 text-[#10B981]'
                            }`}
                          >
                            {item.kind === 'pesan' ? <Mail className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#FFFFFF] truncate flex items-center gap-1.5">
                              {item.isUnread && <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />}
                              <span className="truncate">{item.title}</span>
                            </p>
                            <p className="text-[11px] text-[#D1FAE5] truncate">{item.detail}</p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#D4AF37] group-hover:translate-x-0.5 transition-transform shrink-0 whitespace-nowrap">
                          <span>{item.targetLabel}</span>
                          <ArrowUpRight className="w-3 h-3 text-[#10B981]" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 2. BERITA DAN INFORMASI TERKINI PONDOK (SAMA DENGAN DASHBOARD ADMIN) */}
      <div className="cyber-glass-card rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/25 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37]">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
                Berita & Informasi Terkini Pondok Pesantren
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#10B981]/15 text-[#D1FAE5] border border-[#10B981]/40">
                  LIVE MAKLUMAT
                </span>
              </h2>
              <p className="text-[11px] text-[#D1FAE5]">
                Kartu berita resmi terpusat yang tersinkronisasi dari Dashboard Admin ke seluruh jajaran pengurus
              </p>
            </div>
          </div>
          {currentUser.role === 'admin' && (
            <button
              onClick={() => onNavigate('admin_options')}
              className="self-start sm:self-auto text-[11px] font-mono font-bold text-[#D4AF37] hover:text-white flex items-center gap-1 cursor-pointer bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-[#D4AF37]/40"
            >
              Kelola Berita di Option Panel <ArrowUpRight className="w-3.5 h-3.5 text-[#10B981]" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {beritaList.map((brt, idx) => {
            const defaultImages = [
              'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?auto=format&fit=crop&w=900&q=80',
              'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=900&q=80',
              'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=900&q=80',
            ];
            const imgSrc = brt.gambarUrl || defaultImages[idx % defaultImages.length];
            return (
              <div
                key={brt.id}
                className={`cyber-glass-card rounded-2xl border overflow-hidden transition-all flex flex-col justify-between group backdrop-blur-md ${
                  brt.penting
                    ? 'bg-emerald-950/75 border-[#D4AF37]/50 shadow-lg'
                    : 'bg-emerald-950/60 border-emerald-500/25 shadow-md'
                }`}
              >
                <div>
                  {/* Gambar Berita Terkini (Dapat diedit melalui Option Panel) */}
                  <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-[#041A13] border-b border-emerald-500/25">
                    <img
                      src={imgSrc}
                      alt={brt.judul}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = defaultImages[0];
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#041A13] via-transparent to-black/35 pointer-events-none" />
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-[#041A13]/85 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/55">
                        {brt.kategori}
                      </span>
                      {brt.penting && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-[#D4AF37] text-[#041A13] shadow">
                          ★ PENTING
                        </span>
                      )}
                    </div>
                    <span className="absolute bottom-2 right-2.5 text-[10px] font-mono text-[#D1FAE5] bg-[#041A13]/85 px-2 py-0.5 rounded border border-emerald-500/35">
                      {brt.tanggal}
                    </span>
                  </div>

                  <div className="p-4 pb-2">
                    <h3 className="text-xs sm:text-sm font-bold text-[#FFFFFF] leading-snug mb-1.5 group-hover:text-[#D4AF37] transition-colors">
                      {brt.judul}
                    </h3>
                    <p className="text-[11px] text-[#D1FAE5] leading-relaxed line-clamp-3">
                      {brt.isi}
                    </p>
                  </div>
                </div>
                <div className="px-4 pb-3.5 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[10px] text-[#D1FAE5] font-mono">
                  <span>Oleh: {brt.penulis}</span>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => onNavigate('admin_options')}
                      className="text-[#D4AF37] hover:underline cursor-pointer font-bold"
                    >
                      Edit Gambar/Berita
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 8 KARTU RINGKASAN 3D FUTURISTIK: JUMLAH SANTRI PUTRA, PUTRI, USTADZ & USTADZAH, SANTRI IZIN, SAKIT, SERTA SANTRI MUQIM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiStatCard3D
          label="Total Santri"
          value={stats.totalSantri}
          tone="silver"
          subtitle="Santri Aktif Terdaftar"
          trendText="100% Terdata"
          trendPercent={12.4}
          icon={<Users className="w-4 h-4 text-[#10B981]" />}
        />

        <KpiStatCard3D
          label="Santri Putra"
          value={stats.santriPutra}
          tone="emerald"
          subtitle="Asrama Banin"
          trendPercent={stats.totalSantri > 0 ? Number(((stats.santriPutra / stats.totalSantri) * 100).toFixed(1)) : 0}
          icon={<UserCheck className="w-4 h-4 text-[#10B981]" />}
        />

        <KpiStatCard3D
          label="Santri Putri"
          value={stats.santriPutri}
          tone="gold"
          subtitle="Asrama Banat"
          trendPercent={stats.totalSantri > 0 ? Number(((stats.santriPutri / stats.totalSantri) * 100).toFixed(1)) : 0}
          icon={<UserCheck className="w-4 h-4 text-[#D4AF37]" />}
        />

        <KpiStatCard3D
          label="Santri Muqim"
          value={stats.santriDiPondok}
          tone="emerald"
          subtitle="Berada di Pondok"
          trendPercent={stats.totalSantri > 0 ? Number(((stats.santriDiPondok / stats.totalSantri) * 100).toFixed(1)) : 0}
          icon={<Building2 className="w-4 h-4 text-[#10B981]" />}
        />

        <KpiStatCard3D
          label="Izin Pulang"
          value={stats.santriIzinPulang}
          tone="gold"
          subtitle="Sedang Izin / Pulang"
          trendPercent={stats.santriIzinPulang > 0 ? -Number(((stats.santriIzinPulang / Math.max(1, stats.totalSantri)) * 100).toFixed(1)) : 0}
          icon={<Home className="w-4 h-4 text-[#D4AF37]" />}
        />

        <KpiStatCard3D
          label="Santri Sakit"
          value={stats.santriSakit}
          tone="rose"
          subtitle="Poskestren / Berobat"
          trendPercent={stats.santriSakit > 0 ? -Number(((stats.santriSakit / Math.max(1, stats.totalSantri)) * 100).toFixed(1)) : 0}
          icon={<HeartPulse className="w-4 h-4 text-rose-400" />}
        />

        <KpiStatCard3D
          label="Ustadz Aktif"
          value={stats.ustadzAktif}
          tone="gold"
          subtitle="Pengajar Putra"
          trendText="Aktif"
          trendPercent={8.5}
          icon={<GraduationCap className="w-4 h-4 text-[#D4AF37]" />}
        />

        <KpiStatCard3D
          label="Ustadzah Aktif"
          value={stats.ustadzahAktif}
          tone="emerald"
          subtitle="Pengajar Putri"
          trendText="Aktif"
          trendPercent={9.2}
          icon={<GraduationCap className="w-4 h-4 text-[#10B981]" />}
        />
      </div>

      {/* 4. INDIKATOR PENILAIAN KINERJA PENGURUS SECARA KESELURUHAN DENGAN GRAFIK 3D PIE CHART DAN PERSENTASENYA */}
      <div className="cyber-glass-card rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/25 pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-[#D4AF37]" />
              {currentUser.role === 'admin' || currentUser.role === 'ketua_pondok'
                ? 'Indikator Penilaian Kinerja Ketua Pondok, Sekretaris, Bendahara, Perlengkapan & Keamanan (3D Pie Chart & %)'
                : `Indikator Penilaian Kinerja ${currentUser.jabatan} Secara Keseluruhan (3D Pie Chart & %)`}
            </h2>
            <p className="text-xs text-[#D1FAE5]">
              Evaluasi kuantitatif real-time berdasarkan penyelesaian program kerja, pelayanan persuratan, kesehatan kas, inventaris, dan kedisiplinan
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] font-mono text-xs font-bold self-start sm:self-auto">
            3D INDIKATOR REAL-TIME
          </span>
        </div>

        <div
          className={`grid grid-cols-1 ${
            visibleKpiPies.length > 1 ? 'sm:grid-cols-2 lg:grid-cols-5' : 'sm:grid-cols-1 max-w-xl'
          } gap-4`}
        >
          {visibleKpiPies.map((kpi) => {
            const pieData = [
              { name: 'Capaian Kinerja', value: kpi.score, color: kpi.color },
              { name: 'Ruang Optimasi', value: Math.max(1, 100 - kpi.score), color: '#093827' },
            ];
            return (
              <div
                key={kpi.key}
                onClick={() => onNavigate(kpi.targetMenu)}
                className="kpi-glass-3d p-4 rounded-2xl cursor-pointer flex flex-col items-center text-center justify-between group"
              >
                <div className="w-full">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37] block">
                    PENILAIAN OVERALL
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-[#FFFFFF] mt-0.5 group-hover:text-[#D4AF37]">
                    {kpi.title}
                  </h3>
                </div>

                {/* 3D Tilted Pie Chart + Extruded Percentage Center */}
                <div className="my-2 flex items-center justify-center">
                  <PieChart3D
                    data={pieData}
                    size={156}
                    innerRadiusRatio={0.5}
                    depth={13}
                    centerValue={kpi.score}
                    centerSuffix="%"
                    centerLabel={kpi.ratingLabel}
                    centerTone={kpi.score >= 90 ? 'gold' : 'emerald'}
                    unit="%"
                  />
                </div>

                <div className="w-full space-y-1">
                  <p className="text-[10px] text-[#D1FAE5] line-clamp-2">{kpi.subtitle}</p>
                  <p className="text-[10px] font-mono text-[#D4AF37] bg-[#041A13]/80 py-1 px-2 rounded-lg border border-emerald-500/25">
                    {kpi.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. WADAH TERPADU MEMANJANG: GRAFIK TRADER CANDLESTICK KEUANGAN BENDAHARA (D3.JS) & INDIKATOR PENILAIAN EKONOMI PONDOK */}
      {showFinanceSection && (() => {
        const { darurat: daruratLevel, stabil: stabilLevel, perkembanganPesat: growLevel } =
          financeAnalytics.thresholds;

        const latestCandle =
          financeAnalytics.candlestickBulanan[financeAnalytics.candlestickBulanan.length - 1] ||
          { periode: 'Kini', labelLengkap: 'Periode Kini', open: 21.5, high: 34.6, low: 17.3, close: 26.1, masuk: 45.8, keluar: 19.7, jumlahTransaksi: 0 };
        const latestDiff = latestCandle.close - latestCandle.open;
        const latestPct =
          latestCandle.open !== 0 ? ((latestDiff / Math.abs(latestCandle.open)) * 100).toFixed(1) : '0.0';
        const zonaKasSaatIni =
          latestCandle.close >= growLevel
            ? { label: 'ZONA GROW / PERKEMBANGAN PESAT', tone: 'text-emerald-300 bg-emerald-950/90 border-emerald-400/60' }
            : latestCandle.close >= stabilLevel
              ? { label: 'ZONA STABIL / KESEIMBANGAN KAS', tone: 'text-[#f3d266] bg-[#093524] border-[#d4af37]/60' }
              : latestCandle.close > daruratLevel
                ? { label: 'ZONA WASPADA / TRANSISI KAS', tone: 'text-amber-300 bg-amber-950/90 border-amber-500/60' }
                : { label: 'ZONA DARURAT / PERLU INTERVENSI KAS', tone: 'text-rose-300 bg-rose-950/90 border-rose-500/60' };

        return (
          <div className="cyber-glass-card rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-5 sm:p-6 shadow-2xl space-y-5">
            {/* Header Bar Gaya Terminal Trader */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-emerald-500/25 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[10px] font-mono font-bold text-[#D4AF37] uppercase">
                    KAS-ALMALIKI / IDR · D3.JS TRADER TERMINAL
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md border text-[10px] font-mono font-bold ${zonaKasSaatIni.tone}`}>
                    {zonaKasSaatIni.label}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#D4AF37] text-[#041A13] text-[10px] font-mono font-black">
                    SKOR EKONOMI: {financeAnalytics.skorEkonomi}/100
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-[#FFFFFF] uppercase tracking-wide flex items-center gap-2 mt-1.5">
                  <Wallet className="w-5 h-5 text-[#D4AF37]" />
                  <span>Grafik Candlestick Trader Keuangan Bendahara &amp; Indikator Penilaian Ekonomi Pondok</span>
                </h2>
                <p className="text-xs text-[#D1FAE5] mt-0.5">
                  Tersinkronisasi real-time dengan Buku Kas, Syahriyah &amp; Option Panel Bendahara · Dilengkapi Crosshair, Zoom/Pan D3.js, dan Pita Zona Tren.
                </p>
              </div>

              {/* Ticker OHLC Bar */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-[#020e09] border border-emerald-800/70 rounded-2xl px-3.5 py-2.5 text-[11px] font-mono shrink-0">
                <div>
                  <span className="text-emerald-400/70 block text-[9px]">OPEN</span>
                  <span className="text-white font-bold">Rp{latestCandle.open}Jt</span>
                </div>
                <div className="h-6 w-[1px] bg-emerald-800/50" />
                <div>
                  <span className="text-emerald-400/70 block text-[9px]">HIGH</span>
                  <span className="text-emerald-300 font-bold">Rp{latestCandle.high}Jt</span>
                </div>
                <div className="h-6 w-[1px] bg-emerald-800/50" />
                <div>
                  <span className="text-emerald-400/70 block text-[9px]">LOW</span>
                  <span className="text-rose-300 font-bold">Rp{latestCandle.low}Jt</span>
                </div>
                <div className="h-6 w-[1px] bg-emerald-800/50" />
                <div>
                  <span className="text-emerald-400/70 block text-[9px]">CLOSE</span>
                  <span className="text-[#f3d266] font-bold">Rp{latestCandle.close}Jt</span>
                </div>
                <div className="h-6 w-[1px] bg-emerald-800/50" />
                <div>
                  <span className="text-emerald-400/70 block text-[9px]">PERUBAHAN</span>
                  <span className={`font-bold ${latestDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {latestDiff >= 0 ? `+${latestPct}%` : `${latestPct}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* Legenda Pita Visual Ambang Batas Tren */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono bg-[#02100a] border border-emerald-900/80 rounded-2xl px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-2 text-emerald-300 font-bold">
                  <span className="w-4 h-3 rounded-sm bg-emerald-500/30 border border-dashed border-emerald-400 inline-block" />
                  <span>PITA GROW / PESAT (≥ Rp {growLevel} Jt)</span>
                </span>
                <span className="inline-flex items-center gap-2 text-[#f3d266] font-bold">
                  <span className="w-4 h-3 rounded-sm bg-[#d4af37]/25 border border-dashed border-[#f3d266] inline-block" />
                  <span>PITA STABIL (≥ Rp {stabilLevel} Jt)</span>
                </span>
                <span className="inline-flex items-center gap-2 text-rose-400 font-bold">
                  <span className="w-4 h-3 rounded-sm bg-rose-500/30 border border-dashed border-rose-500 inline-block" />
                  <span>PITA DARURAT (≤ Rp {daruratLevel} Jt)</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block shadow-[0_0_8px_#10b981]" />
                  <span>Bullish (Surplus)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block shadow-[0_0_8px_#f43f5e]" />
                  <span>Bearish (Defisit)</span>
                </span>
              </div>
            </div>

            {/* Visualisasi Candlestick D3.js Mode Gelap dengan Crosshair, Zoom/Pan, & Pita Zona */}
            <D3CandlestickChart
              candlesBulanan={financeAnalytics.candlestickBulanan}
              candlesMingguan={financeAnalytics.candlestickMingguan}
              candlesHarian={financeAnalytics.candlestickHarian}
              thresholds={financeAnalytics.thresholds}
              height={360}
            />

            {/* Ringkasan Kas & Indikator Penilaian Ekonomi Pondok Terpadu di Dalam Wadah yang Sama */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
              {/* Kiri (5 Cols): 3 Kartu Kas + Indikator Kesehatan Ekonomi Overall */}
              <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="kpi-glass-3d p-3.5 rounded-2xl">
                    <p className="text-[10px] font-mono uppercase text-emerald-300">Total Pemasukan</p>
                    <div className="mt-1">
                      <Extruded3DValue
                        value={financeAnalytics.totalPemasukan}
                        formatAsRupiah={true}
                        tone="emerald"
                        className="text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <div className="kpi-glass-3d p-3.5 rounded-2xl">
                    <p className="text-[10px] font-mono uppercase text-rose-300">Total Pengeluaran</p>
                    <div className="mt-1">
                      <Extruded3DValue
                        value={financeAnalytics.totalPengeluaran}
                        formatAsRupiah={true}
                        tone="rose"
                        className="text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  <div className="kpi-glass-3d p-3.5 rounded-2xl">
                    <p className="text-[10px] font-mono uppercase text-[#f3d266]">Saldo &amp; Surplus Kas</p>
                    <div className="mt-1">
                      <Extruded3DValue
                        value={financeAnalytics.saldoPondok}
                        formatAsRupiah={true}
                        tone="gold"
                        className="text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#083523] to-[#041d13] border border-[#d4af37]/45 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[#f3d266]" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Indikator Penilaian Ekonomi Pondok
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-black bg-[#d4af37] text-[#02120a]">
                      SKOR: {financeAnalytics.skorEkonomi}/100
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-mono uppercase text-emerald-300">Status Kesehatan Kas Overall</p>
                    <p className="text-sm sm:text-base font-black text-[#f3d266] mt-0.5">
                      {financeAnalytics.predikatEkonomi}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-emerald-800/60 text-center">
                    <div>
                      <p className="text-[9px] font-mono text-emerald-300">Rasio Surplus</p>
                      <p className="text-xs font-bold text-emerald-400 font-mono">{financeAnalytics.rasioSurplus}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono text-emerald-300">Rasio Beban Ops</p>
                      <p className="text-xs font-bold text-amber-300 font-mono">
                        {financeAnalytics.rasioEfisiensiPengeluaran}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-mono text-emerald-300">Ketahanan Kas</p>
                      <p className="text-xs font-bold text-white font-mono">
                        {financeAnalytics.rasioLikuiditasBulan} Bln
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kanan (7 Cols): Saran Money Management & Tombol Navigasi Buku Kas */}
              <div className="lg:col-span-7 p-4 rounded-2xl bg-[#03160f]/95 border border-emerald-800/70 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-xs font-bold text-[#f3d266] uppercase tracking-wider flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-[#f3d266]" />
                      <span>Saran Money Management &amp; Rekomendasi Ekonomi Pesantren</span>
                    </h3>
                    <span className="text-[10px] font-mono text-emerald-300">
                      Analisis Real-Time Kas Bendahara
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {financeAnalytics.saranMoneyManagement.map((saran, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#041f15] border border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-100/95 leading-relaxed"
                      >
                        <span className="w-5 h-5 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f3d266] font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{saran}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('bendahara')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#093b28] via-[#0c4a33] to-[#072c1e] hover:from-[#0d4d35] hover:to-[#0a3c29] text-[#f3d266] font-bold text-xs border border-[#d4af37]/50 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Buka Buku Kas &amp; Manajemen Bendahara</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 6. GRAFIK 3D LINE CHART KINERJA PENGURUS & KEDISIPLINAN SANTRI (PERBANDINGAN BULAN INI VS BULAN LALU) */}
      <div className={`grid grid-cols-1 ${showKinerjaPengurusLine ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6`}>
        {showKinerjaPengurusLine && (
          <div className="kpi-glass-3d rounded-2xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#10B981]" />
                  Grafik 3D Line Chart Kinerja Pengurus
                </h2>
                <p className="text-xs text-[#D1FAE5]">
                  Perbandingan capaian program kerja & responsivitas pengurus Bulan Ini vs Bulan Lalu
                </p>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                <Extruded3DValue
                  value={kinerjaPengurusStats.bulanIni}
                  suffix="%"
                  tone="emerald"
                  className="text-2xl"
                />
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-extrabold tabular-nums ${
                    kinerjaPengurusStats.selisih >= 0 ? 'badge-3d-up text-emerald-100' : 'badge-3d-down text-rose-100'
                  }`}
                >
                  {kinerjaPengurusStats.selisih >= 0 ? '▲' : '▼'}{' '}
                  {kinerjaPengurusStats.selisih >= 0 ? `+${kinerjaPengurusStats.selisih}%` : `${kinerjaPengurusStats.selisih}%`}{' '}
                  vs {kinerjaPengurusStats.bulanLalu}%
                </span>
              </div>
            </div>

            <LineChart3D
              data={kinerjaPengurusStats.chartData}
              xKey="pekan"
              height={228}
              yDomain={[60, 100]}
              yUnit="%"
              tooltipUnit="%"
              subtitle="Perbandingan Indeks Kinerja Pengurus"
              series={[
                { key: 'bulanIni', label: 'Bulan Ini (%)', color: '#10b981', accentColor: '#f3d266' },
                { key: 'bulanLalu', label: 'Bulan Lalu (%)', color: '#d4af37', accentColor: '#fef08a', dashed: true },
              ]}
            />
          </div>
        )}

        {/* 3D Line Chart Kedisiplinan Santri (Tampil di Semua Role) */}
        <div className="kpi-glass-3d rounded-2xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                Grafik 3D Line Chart Kedisiplinan Santri
              </h2>
              <p className="text-xs text-[#D1FAE5]">
                Indeks kepatuhan qanun, jamaah, &amp; ketepatan izin kembali Bulan Ini vs Bulan Lalu
              </p>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
              <Extruded3DValue
                value={kedisiplinanSantriStats.bulanIni}
                suffix="%"
                tone="gold"
                className="text-2xl"
              />
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-extrabold tabular-nums ${
                  kedisiplinanSantriStats.selisih >= 0 ? 'badge-3d-up text-emerald-100' : 'badge-3d-down text-rose-100'
                }`}
              >
                {kedisiplinanSantriStats.selisih >= 0 ? '▲' : '▼'}{' '}
                {kedisiplinanSantriStats.selisih >= 0 ? `+${kedisiplinanSantriStats.selisih}%` : `${kedisiplinanSantriStats.selisih}%`}{' '}
                vs {kedisiplinanSantriStats.bulanLalu}%
              </span>
            </div>
          </div>

          <LineChart3D
            data={kedisiplinanSantriStats.chartData}
            xKey="pekan"
            height={228}
            yDomain={[60, 100]}
            yUnit="%"
            tooltipUnit="%"
            subtitle="Evaluasi Indeks Kedisiplinan Santri"
            series={[
              { key: 'bulanIni', label: 'Kedisiplinan Bulan Ini (%)', color: '#d4af37', accentColor: '#34d399' },
              { key: 'bulanLalu', label: 'Kedisiplinan Bulan Lalu (%)', color: '#34d399', accentColor: '#a7f3d0', dashed: true },
            ]}
          />
        </div>
      </div>

      {/* 7. GRAFIK 3D DIAGRAM SANTRI DARI TAHUN KE TAHUN & RINGKASAN SEKRETARIS + PERLENGKAPAN */}
      <div className={`grid grid-cols-1 ${showSekretarisCard || showPerlengkapanCard ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6`}>
        <div className="kpi-glass-3d rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
                Grafik 3D Diagram Santri dari Tahun ke Tahun
              </h2>
              <p className="text-xs text-[#D1FAE5]">
                Data real-time santri putra ({stats.santriPutra}) &amp; putri ({stats.santriPutri}) — Total {stats.totalSantri} Santri Aktif ({santriYearlyChart[0]?.tahun || '2022'}–{santriYearlyChart[santriYearlyChart.length - 1]?.tahun || '2026'})
              </p>
            </div>
          </div>

          <BarChart3D
            data={santriYearlyChart}
            xKey="tahun"
            height={252}
            unit=" santri"
            series={[
              { key: 'putra', label: 'Santri Putra', color: '#10b981' },
              { key: 'putri', label: 'Santri Putri', color: '#d4af37' },
            ]}
          />
        </div>

        {(showSekretarisCard || showPerlengkapanCard) && (
          <div className={`grid grid-cols-1 ${showSekretarisCard && showPerlengkapanCard ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-4`}>
            {showSekretarisCard && (
              <div className="kpi-glass-3d rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase text-[#D4AF37] bg-[#D4AF37]/15 px-2.5 py-1 rounded-lg border border-[#D4AF37]/30">
                      DIVISI SEKRETARIS
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#FFFFFF]">Statistik &amp; Aktivitas Sekretaris</h3>
                  <p className="text-[11px] text-[#D1FAE5] mt-0.5">Rekapitulasi persuratan resmi &amp; buku induk</p>

                  <div className="grid grid-cols-2 gap-2.5 mt-4">
                    <div className="kpi-glass-3d p-3 rounded-xl">
                      <p className="text-[10px] font-mono text-[#D1FAE5]">Total Arsip</p>
                      <Extruded3DValue value={sekretarisStats.totalArsip} tone="silver" className="text-xl mt-0.5" />
                    </div>
                    <div className="kpi-glass-3d p-3 rounded-xl">
                      <p className="text-[10px] font-mono text-[#D4AF37]">Resmi Terbit</p>
                      <Extruded3DValue value={sekretarisStats.suratResmiTerbit} tone="gold" className="text-xl mt-0.5" />
                    </div>
                    <div className="kpi-glass-3d p-3 rounded-xl">
                      <p className="text-[10px] font-mono text-[#D1FAE5]">Surat Keluar</p>
                      <Extruded3DValue value={sekretarisStats.suratKeluar} tone="emerald" className="text-lg mt-0.5" />
                    </div>
                    <div className="kpi-glass-3d p-3 rounded-xl">
                      <p className="text-[10px] font-mono text-[#D1FAE5]">Surat Masuk</p>
                      <Extruded3DValue value={sekretarisStats.suratMasuk} tone="gold" className="text-lg mt-0.5" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('sekretaris')}
                  className="mt-4 w-full py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/75 text-[#D1FAE5] hover:text-white text-xs font-bold border border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Buka Panel Sekretaris <ArrowUpRight className="w-4 h-4 text-[#10B981]" />
                </button>
              </div>
            )}

            {showPerlengkapanCard && (
              <div className="kpi-glass-3d rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase text-[#D4AF37] bg-[#D4AF37]/15 px-2.5 py-1 rounded-lg border border-[#D4AF37]/30">
                      DIVISI PERLENGKAPAN
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#FFFFFF]">Statistik &amp; Aktivitas Perlengkapan</h3>
                  <p className="text-[11px] text-[#D1FAE5] mt-0.5">Kondisi aset sarpras &amp; peminjaman aktif</p>

                  <div className="grid grid-cols-2 gap-2.5 mt-4">
                    <div className="kpi-glass-3d p-3 rounded-xl">
                      <p className="text-[10px] font-mono text-[#D1FAE5]">Total Aset</p>
                      <Extruded3DValue value={perlengkapanStats.totalAset} tone="silver" className="text-xl mt-0.5" />
                    </div>
                    <div className="kpi-glass-3d p-3 rounded-xl">
                      <p className="text-[10px] font-mono text-[#10B981]">Kondisi Baik</p>
                      <Extruded3DValue value={perlengkapanStats.kondisiBaik} tone="emerald" className="text-xl mt-0.5" />
                    </div>
                    <div className="kpi-glass-3d p-3 rounded-xl">
                      <p className="text-[10px] font-mono text-rose-300">Kondisi Rusak</p>
                      <Extruded3DValue value={perlengkapanStats.kondisiRusak} tone="rose" className="text-lg mt-0.5" />
                    </div>
                    <div className="kpi-glass-3d p-3 rounded-xl">
                      <p className="text-[10px] font-mono text-[#D4AF37]">Dipinjam</p>
                      <Extruded3DValue value={perlengkapanStats.sedangDipinjam} tone="gold" className="text-lg mt-0.5" />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('perlengkapan')}
                  className="mt-4 w-full py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/75 text-[#D1FAE5] hover:text-white text-xs font-bold border border-emerald-500/30 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Buka Panel Perlengkapan <ArrowUpRight className="w-4 h-4 text-[#10B981]" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 8. KALENDER KEGIATAN PONDOK PESANTREN (HIJRIAH & MASEHI) */}
      <div id="kalender-akademik" className="cyber-glass-card rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-500/25">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#D4AF37]" />
              Kalender Kegiatan Pondok (Masehi &amp; Hijriah)
            </h2>
            <p className="text-xs text-[#D1FAE5] mt-0.5">
              Klik tanggal untuk melihat detail kegiatan. Agenda hari ini otomatis muncul sebagai notifikasi pengurus.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => onNavigate('admin_options')}
                className="px-3 py-1.5 rounded-xl bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#f3d266] border border-[#d4af37]/50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Tambah atau Edit Agenda di Option Panel Admin"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Atur Agenda</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setCalendarMonthOffset(0);
                setSelectedCalendarDate(todayWibStr);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#072c1e] hover:bg-[#0b422d] text-emerald-100 border border-emerald-700/60 text-xs font-semibold cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setCalendarMonthOffset(prev => prev - 1)}
              className="p-2 rounded-xl bg-[#03160f] hover:bg-[#072c1e] text-emerald-200 border border-emerald-800 cursor-pointer"
              aria-label="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3.5 py-1.5 rounded-xl bg-[#03160f] border border-[#d4af37]/50 text-center min-w-[180px]">
              <p className="text-xs font-bold text-white">{calendarData.masehiMonthName}</p>
              <p className="text-[10px] font-mono text-[#f3d266]">{calendarData.hijriHeader}</p>
            </div>
            <button
              type="button"
              onClick={() => setCalendarMonthOffset(prev => prev + 1)}
              className="p-2 rounded-xl bg-[#03160f] hover:bg-[#072c1e] text-emerald-200 border border-emerald-800 cursor-pointer"
              aria-label="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifikasi Agenda Hari Ini (Otomatis Real-Time) */}
        {todayAgendas.length > 0 && (
          <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-[#d4af37]/20 via-emerald-950/80 to-[#03160f] border border-[#d4af37]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#d4af37] text-[#02120a] shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-[#f3d266] uppercase tracking-wider">
                  Pengingat Agenda Hari Ini ({todayAgendas.length} Kegiatan)
                </p>
                <p className="text-xs text-white mt-0.5">
                  {todayAgendas.map((a) => `${a.judul} (${a.waktu} WIB · ${a.tempat})`).join(' • ')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleJumpToAgendaDate(todayWibStr)}
              className="px-3 py-1.5 rounded-lg bg-[#d4af37] text-[#02120a] text-[11px] font-bold cursor-pointer shrink-0 self-start sm:self-center"
            >
              Lihat Detail
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
          {/* Grid Kalender Kompak & Interaktif */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-7 gap-1.5 text-center mb-1.5">
              {['Aha', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, idx) => (
                <div
                  key={d}
                  className={`py-1.5 text-[10px] font-mono font-bold uppercase rounded-lg ${
                    idx === 5 ? 'text-[#f3d266] bg-[#d4af37]/15' : 'text-emerald-300 bg-[#03160f]'
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: calendarData.firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-12 sm:h-14 rounded-xl bg-[#02100a]/35 border border-emerald-950/30" />
              ))}
              {calendarData.days.map((item) => {
                const hasAgenda = item.agendas.length > 0;
                const isSelected = item.dateStr === selectedCalendarDate;
                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => setSelectedCalendarDate(item.dateStr)}
                    className={`h-12 sm:h-14 p-1.5 rounded-xl border flex flex-col justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0c4a32] border-[#f3d266] ring-1 ring-[#f3d266]/60 shadow-lg'
                        : item.isToday
                        ? 'bg-[#083825] border-[#d4af37]/80'
                        : hasAgenda
                        ? 'bg-[#06291c] border-emerald-500/60 hover:border-[#d4af37]/60'
                        : 'bg-[#03160f]/80 border-emerald-900/45 hover:border-emerald-700/70'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <span
                        className={`text-xs sm:text-sm font-bold font-mono leading-none ${
                          item.isToday || isSelected ? 'text-[#f3d266]' : 'text-white'
                        }`}
                      >
                        {item.masehiDay}
                      </span>
                      <span className="text-[9px] font-mono text-emerald-300/75 leading-none">
                        {item.hijriDay}H
                      </span>
                    </div>

                    <div className="flex items-center justify-between w-full">
                      {hasAgenda ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#d4af37]/20 text-[#f3d266] text-[9px] font-mono font-bold truncate max-w-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f3d266] shrink-0" />
                          <span>{item.agendas.length} Agenda</span>
                        </span>
                      ) : item.isToday ? (
                        <span className="text-[8px] font-mono font-bold text-emerald-300">Hari Ini</span>
                      ) : (
                        <span className="text-[8px] font-mono text-emerald-400/40 truncate">
                          {item.hijriMonth.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel Ringkas Detail Tanggal Terpilih & Jadwal Terdekat */}
          <div className="lg:col-span-5 space-y-3.5">
            {/* Detail Tanggal Terpilih */}
            <div className="p-4 rounded-2xl bg-[#03160f] border border-[#d4af37]/35 space-y-2.5">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-emerald-800/60">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">
                    Detail Tanggal Terpilih
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-white mt-0.5">
                    {selectedDateInfo.masehiLabel}
                  </p>
                  <p className="text-[11px] font-mono text-[#f3d266]">{selectedDateInfo.hijriLabel}</p>
                </div>
                {selectedCalendarDate === todayWibStr && (
                  <span className="px-2 py-0.5 rounded-lg bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40 text-[10px] font-mono font-bold">
                    HARI INI
                  </span>
                )}
              </div>

              {selectedDateAgendas.length === 0 ? (
                <p className="text-xs text-emerald-200/65 py-2">
                  Belum ada kegiatan terjadwal pada tanggal ini.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDateAgendas.map((agd) => (
                    <div
                      key={agd.id}
                      className="p-3 rounded-xl bg-[#052318] border border-emerald-700/60 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#d4af37]/20 text-[#f3d266]">
                          {agd.kategori || 'Kegiatan Pondok'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/40">
                          {agd.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-white">{agd.judul}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-emerald-200/80">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#f3d266]" /> {agd.waktu} WIB
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-400" /> {agd.tempat}
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-300/75 font-mono">
                        Divisi: {agd.divisiTerkait}
                      </p>
                      {agd.catatan && (
                        <p className="text-[11px] text-emerald-100/75 pt-0.5">{agd.catatan}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Daftar Agenda Mendatang / Aktif */}
            <div className="p-4 rounded-2xl bg-[#03160f]/85 border border-emerald-800/70 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-[#f3d266] uppercase tracking-wider font-mono">
                  Jadwal Agenda Pondok ({agendaPengurus.length})
                </h3>
                <span className="text-[10px] font-mono text-emerald-300/70">Klik untuk buka</span>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {upcomingAgendas.length === 0 ? (
                  <p className="text-xs text-emerald-200/60 py-2">Semua agenda telah selesai.</p>
                ) : (
                  upcomingAgendas.map((agd) => {
                    const dObj = new Date(agd.tanggal + 'T12:00:00');
                    const hj = gregorianToHijri(dObj);
                    const isTodayItem = agd.tanggal === todayWibStr;
                    return (
                      <button
                        key={agd.id}
                        type="button"
                        onClick={() => handleJumpToAgendaDate(agd.tanggal)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer space-y-1 ${
                          isTodayItem
                            ? 'bg-[#093625] border-[#d4af37]/70'
                            : 'bg-[#02120c] border-emerald-800/60 hover:border-[#d4af37]/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono text-[#f3d266] font-bold">
                            {agd.tanggal} · {hj.day} {hj.monthName} {hj.year} H
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300">
                            {isTodayItem ? 'HARI INI' : agd.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-white truncate">{agd.judul}</p>
                        <p className="text-[10px] text-emerald-200/75 truncate">
                          {agd.waktu} WIB · {agd.tempat} ({agd.divisiTerkait})
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
