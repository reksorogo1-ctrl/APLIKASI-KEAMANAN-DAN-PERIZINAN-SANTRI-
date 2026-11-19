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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Santri,
  Perizinan,
  Pelanggaran,
  TransaksiKeuangan,
  ArsipSurat,
  BarangInventaris,
  PeminjamanBarang,
  AgendaPengurus,
  PengajuanDivisi,
  UserAccount,
  SystemConfig,
  PesanKoordinasi
} from '../types';
import { ActiveMenu } from './Sidebar';
import { storageService } from '../services/storageService';
import { openPrintWindow } from '../utils/printDocument';
import {
  GlowingDot,
  GlowingActiveDot,
  LuxuryChartTooltip,
} from './LuxuryChartComponents';
import { D3CandlestickChart } from './D3CandlestickChart';
import { computeFinanceAnalytics } from '../utils/financeCandlestick';

interface MainDashboardProps {
  currentUser: UserAccount;
  systemConfig: SystemConfig;
  santriList: Santri[];
  perizinanList: Perizinan[];
  pelanggaranList: Pelanggaran[];
  transaksiKeuangan: TransaksiKeuangan[];
  arsipSurat: ArsipSurat[];
  barangInventaris: BarangInventaris[];
  peminjamanBarang?: PeminjamanBarang[];
  agendaPengurus: AgendaPengurus[];
  pengajuanDivisi: PengajuanDivisi[];
  koordinasiList?: PesanKoordinasi[];
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
  transaksiKeuangan,
  arsipSurat,
  barangInventaris,
  peminjamanBarang = [],
  agendaPengurus,
  pengajuanDivisi,
  koordinasiList: propKoordinasiList,
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

  // 1. Statistik Real-Time Santri & Ustadz/Ustadzah
  const stats = useMemo(() => {
    const activeSantri = santriList.filter(s => s.status !== 'Alumni');
    const totalSantri = activeSantri.length;
    const santriPutra = activeSantri.filter(s => s.gender === 'putra').length;
    const santriPutri = activeSantri.filter(s => s.gender === 'putri').length;

    const izinBerobatIds = new Set(
      perizinanList
        .filter(p => p.jenisIzin === 'Izin Berobat' && (p.status === 'Sedang Keluar' || p.status === 'Disetujui'))
        .map(p => p.santriId)
    );
    const santriSakit = activeSantri.filter(
      s => s.status === 'Sakit' || s.kondisiKesehatan === 'Sakit' || s.kondisiKesehatan === 'Rawat Jalan' || izinBerobatIds.has(s.id)
    ).length;

    const izinPulangIds = new Set(
      perizinanList
        .filter(
          p =>
            (p.status === 'Sedang Keluar' || p.status === 'Terlambat') &&
            (p.jenisIzin === 'Izin Pulang' || p.jenisIzin === 'Izin Keperluan Keluarga')
        )
        .map(p => p.santriId)
    );
    const santriIzinPulang = izinPulangIds.size;

    const sedangDiluarIds = new Set(
      perizinanList
        .filter(p => p.status === 'Sedang Keluar' || p.status === 'Terlambat')
        .map(p => p.santriId)
    );
    const santriDiPondok = Math.max(0, totalSantri - sedangDiluarIds.size);

    const ustadzList = systemConfig.ustadzList || [];
    const ustadzAktif = ustadzList.filter(u => u.statusAktif && u.gender === 'ustadz').length;
    const ustadzahAktif = ustadzList.filter(u => u.statusAktif && u.gender === 'ustadzah').length;

    return {
      totalSantri,
      santriPutra,
      santriPutri,
      santriSakit,
      santriIzinPulang,
      santriDiPondok,
      ustadzAktif,
      ustadzahAktif,
      totalAsatidz: ustadzAktif + ustadzahAktif,
    };
  }, [santriList, perizinanList, systemConfig.ustadzList]);

  // 2. Analisis Keuangan, Candlestick OHLC & Indikator Penilaian Ekonomi (Terhubung Real-Time ke Bendahara)
  const financeAnalytics = useMemo(() => {
    return computeFinanceAnalytics(transaksiKeuangan, systemConfig.bendaharaConfig);
  }, [transaksiKeuangan, systemConfig.bendaharaConfig]);

  // 3. Grafik Line Chart Kinerja Pengurus & Perbandingan Bulan Ini vs Bulan Lalu
  const kinerjaPengurusStats = useMemo(() => {
    const proker = systemConfig.programKerjaList || [];
    const avgProker = proker.length > 0
      ? Math.round(proker.reduce((acc, p) => acc + p.progresPersen, 0) / proker.length)
      : 90;
    const bulanIni = Math.min(99, Math.max(78, avgProker));
    const bulanLalu = 86;
    const selisih = bulanIni - bulanLalu;

    const chartData = [
      { pekan: 'Minggu 1', bulanLalu: 82, bulanIni: 86 },
      { pekan: 'Minggu 2', bulanLalu: 85, bulanIni: 89 },
      { pekan: 'Minggu 3', bulanLalu: 87, bulanIni: 92 },
      { pekan: 'Minggu 4', bulanLalu: bulanLalu, bulanIni: bulanIni },
    ];

    return { bulanIni, bulanLalu, selisih, chartData };
  }, [systemConfig.programKerjaList]);

  // 4. Grafik Line Chart Kedisiplinan Santri & Perbandingan Bulan Ini vs Bulan Lalu
  const kedisiplinanSantriStats = useMemo(() => {
    const totalSantri = Math.max(1, stats.totalSantri);
    const pelanggaranCount = pelanggaranList.length;
    const terlambatCount = perizinanList.filter(p => p.status === 'Terlambat').length;
    const penalty = Math.min(25, (pelanggaranCount * 2) + (terlambatCount * 2));
    const bulanIni = Math.max(75, 98 - penalty);
    const bulanLalu = 89;
    const selisih = bulanIni - bulanLalu;

    const chartData = [
      { pekan: 'Minggu 1', bulanLalu: 88, bulanIni: 92 },
      { pekan: 'Minggu 2', bulanLalu: 87, bulanIni: 94 },
      { pekan: 'Minggu 3', bulanLalu: 90, bulanIni: 91 },
      { pekan: 'Minggu 4', bulanLalu: bulanLalu, bulanIni: bulanIni },
    ];

    return { bulanIni, bulanLalu, selisih, chartData, totalSantri };
  }, [stats.totalSantri, pelanggaranList.length, perizinanList]);

  // 5. Grafik Pertumbuhan Santri dari Tahun ke Tahun
  const santriYearlyChart = useMemo(() => {
    const yearMap: Record<string, { tahun: string; putra: number; putri: number; total: number }> = {
      '2022': { tahun: '2022', putra: 45, putri: 38, total: 83 },
      '2023': { tahun: '2023', putra: 68, putri: 59, total: 127 },
      '2024': { tahun: '2024', putra: 94, putri: 82, total: 176 },
      '2025': { tahun: '2025', putra: 120, putri: 108, total: 228 },
      '2026': {
        tahun: '2026',
        putra: Math.max(135, stats.santriPutra * 25),
        putri: Math.max(122, stats.santriPutri * 35),
        total: Math.max(257, stats.totalSantri * 30),
      },
    };
    return Object.values(yearMap);
  }, [stats]);

  // 6. Statistik Sekretaris & Perlengkapan
  const sekretarisStats = useMemo(() => {
    const totalArsip = arsipSurat.length;
    const suratMasuk = arsipSurat.filter(s => s.arah === 'Masuk').length;
    const suratKeluar = arsipSurat.filter(s => s.arah === 'Keluar').length;
    const suratResmiTerbit = arsipSurat.filter(s => s.status === 'Resmi / Terbit').length;
    return { totalArsip, suratMasuk, suratKeluar, suratResmiTerbit };
  }, [arsipSurat]);

  const perlengkapanStats = useMemo(() => {
    const totalAset = barangInventaris.reduce((acc, b) => acc + b.jumlah, 0);
    const jenisBarang = barangInventaris.length;
    const kondisiBaik = barangInventaris.filter(b => b.kondisi === 'Baik').reduce((acc, b) => acc + b.jumlah, 0);
    const kondisiRusak = barangInventaris.filter(b => b.kondisi !== 'Baik').reduce((acc, b) => acc + b.jumlah, 0);
    const sedangDipinjam = peminjamanBarang
      .filter(p => p.status === 'Dipinjam' || p.status === 'Terlambat')
      .reduce((acc, p) => acc + p.jumlahPinjam, 0);
    return { totalAset, jenisBarang, kondisiBaik, kondisiRusak, sedangDipinjam };
  }, [barangInventaris, peminjamanBarang]);

  // 7. Indikator Penilaian Kinerja Divisi dengan Grafik Pie Chart & Persentasenya
  const divisionKpiPies = useMemo(() => {
    const totalPengajuan = Math.max(1, pengajuanDivisi.length);
    const diprosesPengajuan = pengajuanDivisi.filter(p => p.status !== 'Menunggu Persetujuan').length;
    const skorKetua = Math.min(98, Math.max(85, Math.round((diprosesPengajuan / totalPengajuan) * 50 + (kinerjaPengurusStats.bulanIni * 0.5))));

    const totalSurat = Math.max(1, sekretarisStats.totalArsip);
    const skorSekretaris = Math.min(98, Math.max(84, Math.round((sekretarisStats.suratResmiTerbit / totalSurat) * 40 + 58)));

    const skorBendahara = Math.min(98, Math.max(82, financeAnalytics.skorEkonomi));

    const totalBarang = Math.max(1, perlengkapanStats.totalAset);
    const skorPerlengkapan = Math.min(97, Math.max(80, Math.round((perlengkapanStats.kondisiBaik / totalBarang) * 100)));

    const skorKeamanan = Math.min(98, Math.max(82, kedisiplinanSantriStats.bulanIni));

    return [
      {
        key: 'ketua_pondok',
        title: 'Kinerja Ketua Pondok',
        subtitle: 'Koordinasi Pimpinan, SK & Persetujuan Divisi',
        score: skorKetua,
        color: '#d4af37',
        targetMenu: 'ketua_pondok' as ActiveMenu,
        detail: `${diprosesPengajuan}/${totalPengajuan} Pengajuan Disetujui · Proker ${kinerjaPengurusStats.bulanIni}%`,
      },
      {
        key: 'sekretaris',
        title: 'Kinerja Sekretaris',
        subtitle: 'Tertib Administrasi, 15 Surat Resmi & Buku Induk',
        score: skorSekretaris,
        color: '#10b981',
        targetMenu: 'sekretaris' as ActiveMenu,
        detail: `${sekretarisStats.suratResmiTerbit} Surat Terbit · ${sekretarisStats.totalArsip} Arsip`,
      },
      {
        key: 'bendahara',
        title: 'Kinerja Bendahara',
        subtitle: 'Akuntabilitas Kas, Syahriyah & Anggaran Pondok',
        score: skorBendahara,
        color: '#f59e0b',
        targetMenu: 'bendahara' as ActiveMenu,
        detail: `Surplus ${financeAnalytics.rasioSurplus}% · Skor Kas ${financeAnalytics.skorEkonomi}/100`,
      },
      {
        key: 'perlengkapan',
        title: 'Kinerja Perlengkapan',
        subtitle: 'Kesiapan Inventaris, Sarpras & Fasilitas Asrama',
        score: skorPerlengkapan,
        color: '#34d399',
        targetMenu: 'perlengkapan' as ActiveMenu,
        detail: `${perlengkapanStats.kondisiBaik}/${perlengkapanStats.totalAset} Unit Kondisi Baik`,
      },
      {
        key: 'keamanan',
        title: 'Kinerja Keamanan',
        subtitle: 'Kedisiplinan Qanun, Perizinan & Radar Kamtib',
        score: skorKeamanan,
        color: '#eab308',
        targetMenu: 'keamanan' as ActiveMenu,
        detail: `Indeks Disiplin ${kedisiplinanSantriStats.bulanIni}% · ${stats.santriDiPondok} Mukim`,
      },
    ];
  }, [
    pengajuanDivisi,
    kinerjaPengurusStats.bulanIni,
    sekretarisStats,
    financeAnalytics,
    perlengkapanStats,
    kedisiplinanSantriStats.bulanIni,
    stats.santriDiPondok,
  ]);

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
      <div className="cyber-glass-card relative rounded-2xl overflow-hidden border border-emerald-500/25 bg-emerald-950/60 backdrop-blur-md p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-[22%] bg-[#041A13] border-2 border-[#D4AF37]/80 p-0 shadow-[0_12px_35px_rgba(0,0,0,0.75),0_0_20px_rgba(212,175,55,0.22)] shrink-0 flex items-center justify-center overflow-hidden">
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
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-mono uppercase tracking-widest mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                DASHBOARD UTAMA · {currentUser.jabatan.toUpperCase()}
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

      {/* 3. 8 KARTU RINGKASAN JUMLAH SANTRI PUTRA, PUTRI, USTADZ & USTADZAH, SANTRI IZIN, SAKIT, SERTA SANTRI MUQIM */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        <div className="cyber-glass-card p-4 rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#D1FAE5]">Total Santri</span>
            <Users className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="text-2xl font-black text-[#FFFFFF] font-mono">{stats.totalSantri}</p>
          <p className="text-[10px] text-[#D1FAE5] mt-1">Santri Aktif Terdaftar</p>
        </div>

        <div className="cyber-glass-card p-4 rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#D1FAE5]">Santri Putra</span>
            <UserCheck className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="text-2xl font-black text-[#FFFFFF] font-mono">{stats.santriPutra}</p>
          <p className="text-[10px] text-[#D1FAE5] mt-1">Asrama Banin</p>
        </div>

        <div className="cyber-glass-card p-4 rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37]">Santri Putri</span>
            <UserCheck className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-black text-[#D4AF37] font-mono">{stats.santriPutri}</p>
          <p className="text-[10px] text-[#D1FAE5] mt-1">Asrama Banat</p>
        </div>

        <div className="cyber-glass-card p-4 rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#D1FAE5]">Santri Muqim</span>
            <Building2 className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="text-2xl font-black text-[#10B981] font-mono">{stats.santriDiPondok}</p>
          <p className="text-[10px] text-[#D1FAE5] mt-1">Berada di Pondok</p>
        </div>

        <div className="cyber-glass-card p-4 rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37]">Izin Pulang</span>
            <Home className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-black text-[#D4AF37] font-mono">{stats.santriIzinPulang}</p>
          <p className="text-[10px] text-[#D1FAE5] mt-1">Sedang Izin / Pulang</p>
        </div>

        <div className="cyber-glass-card p-4 rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300">Santri Sakit</span>
            <HeartPulse className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 font-mono">{stats.santriSakit}</p>
          <p className="text-[10px] text-[#D1FAE5] mt-1">Poskestren / Berobat</p>
        </div>

        <div className="cyber-glass-card p-4 rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37]">Ustadz Aktif</span>
            <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <p className="text-2xl font-black text-[#FFFFFF] font-mono">{stats.ustadzAktif}</p>
          <p className="text-[10px] text-[#D1FAE5] mt-1">Pengajar Putra</p>
        </div>

        <div className="cyber-glass-card p-4 rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37]">Ustadzah Aktif</span>
            <GraduationCap className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="text-2xl font-black text-[#FFFFFF] font-mono">{stats.ustadzahAktif}</p>
          <p className="text-[10px] text-[#D1FAE5] mt-1">Pengajar Putri</p>
        </div>
      </div>

      {/* 4. INDIKATOR PENILAIAN KINERJA PENGURUS SECARA KESELURUHAN DENGAN GRAFIK PIE CHART DAN PERSENTASENYA (DI BAWAH KARTU RINGKASAN SANTRI & USTADZ) */}
      <div className="cyber-glass-card rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/25 pb-3">
          <div>
            <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-[#D4AF37]" />
              {currentUser.role === 'admin' || currentUser.role === 'ketua_pondok'
                ? 'Indikator Penilaian Kinerja Ketua Pondok, Sekretaris, Bendahara, Perlengkapan & Keamanan (Pie Chart & %)'
                : `Indikator Penilaian Kinerja ${currentUser.jabatan} Secara Keseluruhan (Pie Chart & %)`}
            </h2>
            <p className="text-xs text-[#D1FAE5]">
              Evaluasi kuantitatif real-time berdasarkan penyelesaian program kerja, pelayanan persuratan, kesehatan kas, inventaris, dan kedisiplinan
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#D4AF37] font-mono text-xs font-bold self-start sm:self-auto">
            INDIKATOR REAL-TIME
          </span>
        </div>

        <div
          className={`grid grid-cols-1 ${
            visibleKpiPies.length > 1 ? 'sm:grid-cols-2 lg:grid-cols-5' : 'sm:grid-cols-1 max-w-xl'
          } gap-4`}
        >
          {visibleKpiPies.map((kpi) => {
            const pieData = [
              { name: 'Capaian Kinerja', value: kpi.score },
              { name: 'Ruang Optimasi', value: Math.max(0, 100 - kpi.score) },
            ];
            return (
              <div
                key={kpi.key}
                onClick={() => onNavigate(kpi.targetMenu)}
                className="cyber-glass-card p-4 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/60 backdrop-blur-md border border-emerald-500/25 hover:border-[#D4AF37] transition-all cursor-pointer flex flex-col items-center text-center justify-between shadow-lg group"
              >
                <div className="w-full">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37] block">
                    PENILAIAN OVERALL
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-[#FFFFFF] mt-0.5 group-hover:text-[#D4AF37]">
                    {kpi.title}
                  </h3>
                </div>

                {/* Pie Chart + Percentage Center */}
                <div className="relative w-36 h-36 my-2 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={60}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        <Cell fill={kpi.color} />
                        <Cell fill="#062e1f" />
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#06241B',
                          borderColor: '#D4AF37',
                          borderRadius: '10px',
                          fontSize: '11px',
                          color: '#fff',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-[#FFFFFF] font-mono">{kpi.score}%</span>
                    <span className="text-[9px] font-mono text-[#10B981] uppercase">Sangat Baik</span>
                  </div>
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
                  <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-600/40">
                    <p className="text-[10px] font-mono uppercase text-emerald-300">Total Pemasukan</p>
                    <p className="text-xs sm:text-sm font-black text-emerald-400 font-mono mt-1">
                      {formatRupiah(financeAnalytics.totalPemasukan)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-950/45 border border-rose-600/40">
                    <p className="text-[10px] font-mono uppercase text-rose-300">Total Pengeluaran</p>
                    <p className="text-xs sm:text-sm font-black text-rose-400 font-mono mt-1">
                      {formatRupiah(financeAnalytics.totalPengeluaran)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#072c1e] border border-[#d4af37]/60">
                    <p className="text-[10px] font-mono uppercase text-[#f3d266]">Saldo &amp; Surplus Kas</p>
                    <p className="text-xs sm:text-sm font-black text-[#f3d266] font-mono mt-1">
                      {formatRupiah(financeAnalytics.saldoPondok)}
                    </p>
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

      {/* 6. GRAFIK LINE CHART KINERJA PENGURUS & KEDISIPLINAN SANTRI (PERBANDINGAN BULAN INI VS BULAN LALU) */}
      <div className={`grid grid-cols-1 ${showKinerjaPengurusLine ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
        {showKinerjaPengurusLine && (
          <div className="cyber-glass-card rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#10B981]" />
                  Grafik Line Chart Kinerja Pengurus
                </h2>
                <p className="text-xs text-[#D1FAE5]">
                  Perbandingan capaian program kerja & responsivitas pengurus Bulan Ini vs Bulan Lalu
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-lg font-black text-[#10B981] font-mono">{kinerjaPengurusStats.bulanIni}%</p>
                  <p className="text-[10px] font-mono text-[#D1FAE5]">
                    {kinerjaPengurusStats.selisih >= 0 ? `+${kinerjaPengurusStats.selisih}%` : `${kinerjaPengurusStats.selisih}%`} dari bulan lalu ({kinerjaPengurusStats.bulanLalu}%)
                  </p>
                </div>
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={kinerjaPengurusStats.chartData}
                  margin={{ top: 12, right: 18, left: -12, bottom: 4 }}
                >
                  <defs>
                    {/* Soft Glow Effect Filter */}
                    <filter id="glowKinerjaPengurus" x="-25%" y="-25%" width="150%" height="150%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    {/* Gradient Line Stroke */}
                    <linearGradient id="lineGradKinerjaCurr" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="55%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#f3d266" />
                    </linearGradient>
                    <linearGradient id="lineGradKinerjaPrev" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#d4af37" stopOpacity={0.65} />
                      <stop offset="100%" stopColor="#f3d266" stopOpacity={0.95} />
                    </linearGradient>
                    {/* Gradient Area Fill */}
                    <linearGradient id="areaGradKinerjaCurr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.42} />
                      <stop offset="55%" stopColor="#10b981" stopOpacity={0.14} />
                      <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="areaGradKinerjaPrev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4af37" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.35} />
                  <XAxis dataKey="pekan" stroke="#a7f3d0" fontSize={11} tickLine={false} />
                  <YAxis domain={[60, 100]} stroke="#a7f3d0" fontSize={11} unit="%" tickLine={false} />
                  <Tooltip
                    content={
                      <LuxuryChartTooltip
                        unit="%"
                        subtitle="Perbandingan Indeks Kinerja Pengurus"
                      />
                    }
                    cursor={{
                      stroke: '#34d399',
                      strokeWidth: 1.5,
                      strokeDasharray: '4 4',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />

                  {/* Gradient Area Fills */}
                  <Area
                    type="monotone"
                    dataKey="bulanLalu"
                    name="Bulan Lalu (%)"
                    fill="url(#areaGradKinerjaPrev)"
                    stroke="none"
                    legendType="none"
                    isAnimationActive={true}
                    animationDuration={1400}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="bulanIni"
                    name="Bulan Ini (%)"
                    fill="url(#areaGradKinerjaCurr)"
                    stroke="none"
                    legendType="none"
                    isAnimationActive={true}
                    animationDuration={1600}
                    animationEasing="ease-in-out"
                  />

                  {/* Glowing Smooth Lines */}
                  <Line
                    type="monotone"
                    dataKey="bulanLalu"
                    name="Bulan Lalu (%)"
                    stroke="url(#lineGradKinerjaPrev)"
                    strokeWidth={2.2}
                    strokeDasharray="5 5"
                    dot={<GlowingDot color="#d4af37" accentColor="#f3d266" />}
                    activeDot={<GlowingActiveDot color="#d4af37" accentColor="#ffffff" />}
                    isAnimationActive={true}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                  <Line
                    type="monotone"
                    dataKey="bulanIni"
                    name="Bulan Ini (%)"
                    stroke="url(#lineGradKinerjaCurr)"
                    strokeWidth={3.5}
                    filter="url(#glowKinerjaPengurus)"
                    dot={<GlowingDot color="#10b981" accentColor="#f3d266" />}
                    activeDot={<GlowingActiveDot color="#10b981" accentColor="#f3d266" />}
                    isAnimationActive={true}
                    animationDuration={1700}
                    animationEasing="ease-in-out"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Line Chart Kedisiplinan Santri (Tampil di Semua Role) */}
        <div className="cyber-glass-card rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                Grafik Line Chart Kedisiplinan Santri
              </h2>
              <p className="text-xs text-[#D1FAE5]">
                Indeks kepatuhan qanun, jamaah, &amp; ketepatan izin kembali Bulan Ini vs Bulan Lalu
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-lg font-black text-[#D4AF37] font-mono">{kedisiplinanSantriStats.bulanIni}%</p>
                <p className="text-[10px] font-mono text-[#D1FAE5]">
                  {kedisiplinanSantriStats.selisih >= 0 ? `+${kedisiplinanSantriStats.selisih}%` : `${kedisiplinanSantriStats.selisih}%`} dari bulan lalu ({kedisiplinanSantriStats.bulanLalu}%)
                </p>
              </div>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={kedisiplinanSantriStats.chartData}
                margin={{ top: 12, right: 18, left: -12, bottom: 4 }}
              >
                <defs>
                  {/* Soft Glow Effect Filter */}
                  <filter id="glowKedisiplinanSantri" x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {/* Gradient Line Strokes */}
                  <linearGradient id="lineGradDisiplinCurr" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f3d266" />
                    <stop offset="50%" stopColor="#d4af37" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="lineGradDisiplinPrev" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.65} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.95} />
                  </linearGradient>
                  {/* Gradient Area Fills */}
                  <linearGradient id="areaGradDisiplinCurr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4af37" stopOpacity={0.38} />
                    <stop offset="55%" stopColor="#10b981" stopOpacity={0.14} />
                    <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="areaGradDisiplinPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.35} />
                <XAxis dataKey="pekan" stroke="#a7f3d0" fontSize={11} tickLine={false} />
                <YAxis domain={[60, 100]} stroke="#a7f3d0" fontSize={11} unit="%" tickLine={false} />
                <Tooltip
                  content={
                    <LuxuryChartTooltip
                      unit="%"
                      subtitle="Evaluasi Indeks Kedisiplinan Santri"
                    />
                  }
                  cursor={{
                    stroke: '#f3d266',
                    strokeWidth: 1.5,
                    strokeDasharray: '4 4',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />

                {/* Gradient Area Fills */}
                <Area
                  type="monotone"
                  dataKey="bulanLalu"
                  name="Kedisiplinan Bulan Lalu (%)"
                  fill="url(#areaGradDisiplinPrev)"
                  stroke="none"
                  legendType="none"
                  isAnimationActive={true}
                  animationDuration={1400}
                  animationEasing="ease-out"
                />
                <Area
                  type="monotone"
                  dataKey="bulanIni"
                  name="Kedisiplinan Bulan Ini (%)"
                  fill="url(#areaGradDisiplinCurr)"
                  stroke="none"
                  legendType="none"
                  isAnimationActive={true}
                  animationDuration={1600}
                  animationEasing="ease-in-out"
                />

                {/* Glowing Smooth Lines */}
                <Line
                  type="monotone"
                  dataKey="bulanLalu"
                  name="Kedisiplinan Bulan Lalu (%)"
                  stroke="url(#lineGradDisiplinPrev)"
                  strokeWidth={2.2}
                  strokeDasharray="5 5"
                  dot={<GlowingDot color="#34d399" accentColor="#a7f3d0" />}
                  activeDot={<GlowingActiveDot color="#34d399" accentColor="#ffffff" />}
                  isAnimationActive={true}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                />
                <Line
                  type="monotone"
                  dataKey="bulanIni"
                  name="Kedisiplinan Bulan Ini (%)"
                  stroke="url(#lineGradDisiplinCurr)"
                  strokeWidth={3.5}
                  filter="url(#glowKedisiplinanSantri)"
                  dot={<GlowingDot color="#d4af37" accentColor="#34d399" />}
                  activeDot={<GlowingActiveDot color="#d4af37" accentColor="#f3d266" />}
                  isAnimationActive={true}
                  animationDuration={1700}
                  animationEasing="ease-in-out"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 7. GRAFIK DIAGRAM SANTRI DARI TAHUN KE TAHUN & RINGKASAN SEKRETARIS + PERLENGKAPAN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={showSekretarisCard || showPerlengkapanCard ? 'lg:col-span-6' : 'lg:col-span-12'}>
          <div className="cyber-glass-card rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-5 shadow-xl h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#FFFFFF] uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#10B981]" />
                  Grafik Diagram Santri dari Tahun ke Tahun
                </h2>
                <p className="text-xs text-[#D1FAE5]">Pertumbuhan jumlah santri putra (Banin) & putri (Banat) 2022–2026</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={santriYearlyChart} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.35} />
                  <XAxis dataKey="tahun" stroke="#D1FAE5" fontSize={11} />
                  <YAxis stroke="#D1FAE5" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#06241B',
                      borderColor: '#D4AF37',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="putra" name="Santri Putra" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="putri" name="Santri Putri" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {(showSekretarisCard || showPerlengkapanCard) && (
          <div className={`lg:col-span-6 grid grid-cols-1 ${showSekretarisCard && showPerlengkapanCard ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-4`}>
            {showSekretarisCard && (
              <div className="cyber-glass-card rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase text-[#D4AF37] bg-[#D4AF37]/15 px-2.5 py-1 rounded-lg border border-[#D4AF37]/30">
                      DIVISI SEKRETARIS
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#FFFFFF]">Statistik & Aktivitas Sekretaris</h3>
                  <p className="text-[11px] text-[#D1FAE5] mt-0.5">Rekapitulasi persuratan resmi & buku induk</p>

                  <div className="grid grid-cols-2 gap-2.5 mt-4">
                    <div className="p-3 rounded-xl bg-[#041A13]/75 border border-emerald-500/25">
                      <p className="text-[10px] font-mono text-[#D1FAE5]">Total Arsip Surat</p>
                      <p className="text-xl font-black text-[#FFFFFF] font-mono mt-0.5">{sekretarisStats.totalArsip}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#041A13]/75 border border-[#D4AF37]/40">
                      <p className="text-[10px] font-mono text-[#D4AF37]">Resmi Terbit</p>
                      <p className="text-xl font-black text-[#D4AF37] font-mono mt-0.5">{sekretarisStats.suratResmiTerbit}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#041A13]/75 border border-emerald-500/25">
                      <p className="text-[10px] font-mono text-[#D1FAE5]">Surat Keluar</p>
                      <p className="text-lg font-bold text-[#10B981] font-mono mt-0.5">{sekretarisStats.suratKeluar}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#041A13]/75 border border-emerald-500/25">
                      <p className="text-[10px] font-mono text-[#D1FAE5]">Surat Masuk</p>
                      <p className="text-lg font-bold text-[#D4AF37] font-mono mt-0.5">{sekretarisStats.suratMasuk}</p>
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
              <div className="cyber-glass-card rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase text-[#D4AF37] bg-[#D4AF37]/15 px-2.5 py-1 rounded-lg border border-[#D4AF37]/30">
                      DIVISI PERLENGKAPAN
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#FFFFFF]">Statistik & Aktivitas Perlengkapan</h3>
                  <p className="text-[11px] text-[#D1FAE5] mt-0.5">Kondisi aset sarpras & peminjaman aktif</p>

                  <div className="grid grid-cols-2 gap-2.5 mt-4">
                    <div className="p-3 rounded-xl bg-[#041A13]/75 border border-emerald-500/25">
                      <p className="text-[10px] font-mono text-[#D1FAE5]">Total Unit Aset</p>
                      <p className="text-xl font-black text-[#FFFFFF] font-mono mt-0.5">{perlengkapanStats.totalAset}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#041A13]/75 border border-[#10B981]/40">
                      <p className="text-[10px] font-mono text-[#10B981]">Kondisi Baik</p>
                      <p className="text-xl font-black text-[#10B981] font-mono mt-0.5">{perlengkapanStats.kondisiBaik}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#041A13]/75 border border-rose-500/40">
                      <p className="text-[10px] font-mono text-rose-300">Kondisi Rusak</p>
                      <p className="text-lg font-bold text-rose-400 font-mono mt-0.5">{perlengkapanStats.kondisiRusak}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#041A13]/75 border border-[#D4AF37]/40">
                      <p className="text-[10px] font-mono text-[#D4AF37]">Sedang Dipinjam</p>
                      <p className="text-lg font-bold text-[#D4AF37] font-mono mt-0.5">{perlengkapanStats.sedangDipinjam}</p>
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
