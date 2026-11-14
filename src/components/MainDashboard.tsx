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
  User
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
  onNavigate: (menu: ActiveMenu) => void;
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
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

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

  // 2. Analisis Keuangan, Candlestick OHLC & Indikator Penilaian Ekonomi
  const financeAnalytics = useMemo(() => {
    const totalPemasukan = transaksiKeuangan
      .filter(t => t.tipe === 'Pemasukan')
      .reduce((acc, t) => acc + t.nominal, 0);
    const totalPengeluaran = transaksiKeuangan
      .filter(t => t.tipe === 'Pengeluaran')
      .reduce((acc, t) => acc + t.nominal, 0);
    const saldoPondok = totalPemasukan - totalPengeluaran;

    const rasioEfisiensiPengeluaran = totalPemasukan > 0 ? Math.round((totalPengeluaran / totalPemasukan) * 100) : 0;
    const rasioSurplus = totalPemasukan > 0 ? Math.round((saldoPondok / totalPemasukan) * 100) : 0;
    const rasioLikuiditasBulan = totalPengeluaran > 0 ? Number((saldoPondok / (totalPengeluaran / 2)).toFixed(1)) : 2.5;

    let predikatEkonomi = 'SANGAT SEHAT (SURPLUS OPTIMAL)';
    let skorEkonomi = 92;
    let saranMoneyManagement = [
      'Alokasikan 30% dari dana surplus ke Dana Cadangan Abadi (Endowment/Wakaf Produktif) untuk ketahanan kas jangka panjang.',
      'Pertahankan rasio pengeluaran operasional di bawah 65% dari total penerimaan syahriyah dan infaq.',
      'Optimalkan kolektibilitas syahriyah tepat waktu sebelum tanggal 10 setiap bulan untuk menjaga arus kas (cashflow) harian dapur & utilitas.'
    ];

    if (saldoPondok < 0) {
      predikatEkonomi = 'DEFISIT ANGGARAN (PERLU EFISIENSI)';
      skorEkonomi = 48;
      saranMoneyManagement = [
        'Tunda pengadaan barang non-prioritas dan fokuskan kas pada konsumsi santri serta utilitas vital.',
        'Aktifkan pengingat otomatis tunggakan syahriyah kepada wali santri melalui panel Bendahara.',
        'Evaluasi pos pengeluaran terbesar bersama Ketua Pondok untuk memangkas pemborosan anggaran.'
      ];
    } else if (rasioSurplus < 20) {
      predikatEkonomi = 'CUKUP SEHAT (LIKUIDITAS MODERAT)';
      skorEkonomi = 76;
      saranMoneyManagement = [
        'Tingkatkan cadangan kas likuid minimal setara 2 bulan belanja operasional dapur umum.',
        'Perketat verifikasi realisasi anggaran (RAPBP) pada setiap pengajuan dana divisi.',
        'Dorong program infaq jariyah dan unit usaha koperasi pesantren untuk diversifikasi pemasukan.'
      ];
    }

    const currentClose = Number(Math.max(8, saldoPondok / 1000000).toFixed(1));
    const currentHigh = Number(Math.max(34, totalPemasukan / 1000000).toFixed(1));
    const currentLow = Number(Math.max(6, (totalPemasukan - totalPengeluaran * 1.15) / 1000000).toFixed(1));

    const candlestickData = [
      { periode: 'Apr', open: 11.5, close: 16.2, high: 19.0, low: 9.8, masuk: 26.5, keluar: 21.8 },
      { periode: 'Mei', open: 16.2, close: 14.0, high: 18.5, low: 11.2, masuk: 24.0, keluar: 26.2 },
      { periode: 'Jun', open: 14.0, close: 21.5, high: 24.8, low: 12.5, masuk: 32.0, keluar: 24.5 },
      { periode: 'Jul', open: 21.5, close: 29.0, high: 33.5, low: 19.0, masuk: 41.0, keluar: 33.5 },
      { periode: 'Agu', open: 29.0, close: 25.2, high: 31.0, low: 22.4, masuk: 28.0, keluar: 31.8 },
      { periode: 'Sep', open: 25.2, close: 33.4, high: 36.8, low: 24.0, masuk: 38.2, keluar: 30.0 },
      { periode: 'Okt', open: 33.4, close: 38.0, high: 41.5, low: 31.0, masuk: 36.6, keluar: 32.0 },
      {
        periode: 'Nov (Kini)',
        open: 28.5,
        close: currentClose,
        high: currentHigh,
        low: currentLow,
        masuk: Number((totalPemasukan / 1000000).toFixed(1)),
        keluar: Number((totalPengeluaran / 1000000).toFixed(1)),
      },
    ];

    return {
      totalPemasukan,
      totalPengeluaran,
      saldoPondok,
      rasioEfisiensiPengeluaran,
      rasioSurplus,
      rasioLikuiditasBulan,
      predikatEkonomi,
      skorEkonomi,
      saranMoneyManagement,
      candlestickData,
    };
  }, [transaksiKeuangan]);

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

    const todayStr = now.toISOString().split('T')[0];

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
  }, [calendarMonthOffset, agendaPengurus]);

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
      <div className="relative rounded-3xl overflow-hidden border border-[#d4af37]/35 bg-gradient-to-br from-[#062a1d] via-[#041d14] to-[#02100a] p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(243,210,102,0.25)] space-y-5">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-[22%] bg-[#041d13] border-2 border-[#d4af37]/80 p-0 shadow-[0_12px_35px_rgba(0,0,0,0.75),0_0_20px_rgba(212,175,55,0.25)] shrink-0 flex items-center justify-center overflow-hidden">
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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#f3d266] text-[10px] font-mono uppercase tracking-widest mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                DASHBOARD UTAMA · {currentUser.jabatan.toUpperCase()}
              </div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                Ahlan wa Sahlan, {currentUser.nama}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl">
                Selamat bertugas di Sistem Informasi Manajemen Pengurus <span className="text-[#f3d266] font-semibold">{systemConfig.namaPondok}</span>. Pantau notifikasi lintas divisi, capaian kinerja, dan perkembangan santri secara real-time.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {(currentUser.role === 'admin' || currentUser.role === 'ketua_pondok') && (
              <button
                onClick={handlePrintLaporanBulanan}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] hover:from-[#e5c158] hover:to-[#d4af37] text-[#02120a] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <Printer className="w-4 h-4" />
                Cetak Laporan Bulanan & Grafik
              </button>
            )}
            <button
              onClick={() => onNavigate('biodata_profil')}
              className="px-4 py-2.5 rounded-xl bg-[#073021] hover:bg-[#0b422d] text-[#f3d266] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-[#d4af37]/50 shadow-lg"
            >
              <User className="w-4 h-4" />
              Edit Biodata & Profil
            </button>
            {currentUser.role === 'admin' && (
              <button
                onClick={() => onNavigate('admin_options')}
                className="px-4 py-2.5 rounded-xl bg-[#041d13] hover:bg-[#073021] text-emerald-200 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-emerald-700/50"
              >
                <Sliders className="w-4 h-4" />
                Option Panel
              </button>
            )}
          </div>
        </div>

        {/* Panel Notifikasi Perizinan / Permintaan Surat / Pesan Koordinasi dari Divisi Lain */}
        <div className="pt-4 border-t border-emerald-800/60 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#03160f]/90 border border-[#d4af37]/30 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40 shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#f3d266] uppercase tracking-wider">
                  Notifikasi Perizinan & Permintaan Lintas Divisi
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/40">
                  {notifikasiList.filter(n => !n.dibaca).length} Baru
                </span>
              </div>
              {notifikasiList.length > 0 ? (
                <div className="mt-1.5 space-y-1">
                  {notifikasiList.slice(0, 2).map(n => (
                    <p key={n.id} className="text-xs text-emerald-50 truncate">
                      • <strong className="text-white">{n.judul}:</strong> {n.pesan}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-200/70 mt-1">Belum ada notifikasi perizinan atau permintaan baru.</p>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#03160f]/90 border border-emerald-700/40 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                  Pesan Koordinasi & Permintaan Surat dari Pengurus
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#d4af37]/15 text-[#f3d266] border border-[#d4af37]/30">
                  {koordinasiList.length} Pesan
                </span>
              </div>
              {koordinasiList.length > 0 ? (
                <div className="mt-1.5 space-y-1">
                  {koordinasiList.slice(0, 2).map(k => (
                    <p key={k.id} className="text-xs text-emerald-50 truncate">
                      • <strong className="text-[#f3d266]">[{k.pengirimJabatan || k.pengirimNama}]</strong> {k.judul}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-emerald-200/70 mt-1">Belum ada pesan koordinasi masuk.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. BERITA DAN INFORMASI TERKINI PONDOK (SAMA DENGAN DASHBOARD ADMIN) */}
      <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f3d266]">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Berita & Informasi Terkini Pondok Pesantren
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                  LIVE MAKLUMAT
                </span>
              </h2>
              <p className="text-[11px] text-emerald-200/70">
                Kartu berita resmi terpusat yang tersinkronisasi dari Dashboard Admin ke seluruh jajaran pengurus
              </p>
            </div>
          </div>
          {currentUser.role === 'admin' && (
            <button
              onClick={() => onNavigate('admin_options')}
              className="self-start sm:self-auto text-[11px] font-mono font-bold text-[#f3d266] hover:text-white flex items-center gap-1 cursor-pointer bg-[#073021] px-3 py-1.5 rounded-xl border border-[#d4af37]/40"
            >
              Kelola Berita di Option Panel <ArrowUpRight className="w-3.5 h-3.5" />
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
                className={`rounded-2xl border overflow-hidden transition-all flex flex-col justify-between group ${
                  brt.penting
                    ? 'bg-gradient-to-br from-[#083322] to-[#041b12] border-[#d4af37]/50 shadow-lg'
                    : 'bg-[#03160f]/90 border-emerald-800/60 shadow-md'
                }`}
              >
                <div>
                  {/* Gambar Berita Terkini (Dapat diedit melalui Option Panel) */}
                  <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-[#02100a] border-b border-emerald-800/50">
                    <img
                      src={imgSrc}
                      alt={brt.judul}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = defaultImages[0];
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#03160f] via-transparent to-black/35 pointer-events-none" />
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-[#02120a]/85 backdrop-blur-md text-[#f3d266] border border-[#d4af37]/55">
                        {brt.kategori}
                      </span>
                      {brt.penting && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-[#d4af37] text-[#02120a] shadow">
                          ★ PENTING
                        </span>
                      )}
                    </div>
                    <span className="absolute bottom-2 right-2.5 text-[10px] font-mono text-emerald-200 bg-[#02120a]/80 px-2 py-0.5 rounded border border-emerald-700/40">
                      {brt.tanggal}
                    </span>
                  </div>

                  <div className="p-4 pb-2">
                    <h3 className="text-xs sm:text-sm font-bold text-white leading-snug mb-1.5 group-hover:text-[#f3d266] transition-colors">
                      {brt.judul}
                    </h3>
                    <p className="text-[11px] text-emerald-100/80 leading-relaxed line-clamp-3">
                      {brt.isi}
                    </p>
                  </div>
                </div>
                <div className="px-4 pb-3.5 pt-2 border-t border-emerald-800/40 flex items-center justify-between text-[10px] text-emerald-300/80 font-mono">
                  <span>Oleh: {brt.penulis}</span>
                  {currentUser.role === 'admin' && (
                    <button
                      onClick={() => onNavigate('admin_options')}
                      className="text-[#f3d266] hover:underline cursor-pointer font-bold"
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
        <div className="p-4 rounded-2xl bg-[#041d14]/90 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">Total Santri</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{stats.totalSantri}</p>
          <p className="text-[10px] text-emerald-300/80 mt-1">Santri Aktif Terdaftar</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#041d14]/90 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">Santri Putra</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-300 font-mono">{stats.santriPutra}</p>
          <p className="text-[10px] text-emerald-200/70 mt-1">Asrama Banin</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#041d14]/90 border border-[#d4af37]/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#f3d266]">Santri Putri</span>
            <UserCheck className="w-4 h-4 text-[#f3d266]" />
          </div>
          <p className="text-2xl font-black text-[#f3d266] font-mono">{stats.santriPutri}</p>
          <p className="text-[10px] text-amber-200/70 mt-1">Asrama Banat</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#041d14]/90 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">Santri Muqim</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">{stats.santriDiPondok}</p>
          <p className="text-[10px] text-emerald-200/70 mt-1">Berada di Pondok</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#041d14]/90 border border-amber-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300">Izin Pulang</span>
            <Home className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono">{stats.santriIzinPulang}</p>
          <p className="text-[10px] text-amber-200/70 mt-1">Sedang Izin / Pulang</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#041d14]/90 border border-rose-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300">Santri Sakit</span>
            <HeartPulse className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 font-mono">{stats.santriSakit}</p>
          <p className="text-[10px] text-rose-200/70 mt-1">Poskestren / Berobat</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#041d14]/90 border border-[#d4af37]/40 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#f3d266]">Ustadz Aktif</span>
            <GraduationCap className="w-4 h-4 text-[#f3d266]" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{stats.ustadzAktif}</p>
          <p className="text-[10px] text-emerald-200/75 mt-1">Pengajar Putra</p>
        </div>

        <div className="p-4 rounded-2xl bg-[#041d14]/90 border border-[#d4af37]/40 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#f3d266]">Ustadzah Aktif</span>
            <GraduationCap className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{stats.ustadzahAktif}</p>
          <p className="text-[10px] text-emerald-200/75 mt-1">Pengajar Putri</p>
        </div>
      </div>

      {/* 4. INDIKATOR PENILAIAN KINERJA PENGURUS SECARA KESELURUHAN DENGAN GRAFIK PIE CHART DAN PERSENTASENYA (DI BAWAH KARTU RINGKASAN SANTRI & USTADZ) */}
      <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/60 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-[#f3d266]" />
              {currentUser.role === 'admin' || currentUser.role === 'ketua_pondok'
                ? 'Indikator Penilaian Kinerja Ketua Pondok, Sekretaris, Bendahara, Perlengkapan & Keamanan (Pie Chart & %)'
                : `Indikator Penilaian Kinerja ${currentUser.jabatan} Secara Keseluruhan (Pie Chart & %)`}
            </h2>
            <p className="text-xs text-emerald-200/70">
              Evaluasi kuantitatif real-time berdasarkan penyelesaian program kerja, pelayanan persuratan, kesehatan kas, inventaris, dan kedisiplinan
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f3d266] font-mono text-xs font-bold self-start sm:self-auto">
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
                className="p-4 rounded-2xl bg-[#03160f] hover:bg-[#06261a] border border-[#d4af37]/30 hover:border-[#d4af37] transition-all cursor-pointer flex flex-col items-center text-center justify-between shadow-lg group"
              >
                <div className="w-full">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#f3d266] block">
                    PENILAIAN OVERALL
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-white mt-0.5 group-hover:text-[#f3d266]">
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
                          backgroundColor: '#02120a',
                          borderColor: '#d4af37',
                          borderRadius: '10px',
                          fontSize: '11px',
                          color: '#fff',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-white font-mono">{kpi.score}%</span>
                    <span className="text-[9px] font-mono text-emerald-300 uppercase">Sangat Baik</span>
                  </div>
                </div>

                <div className="w-full space-y-1">
                  <p className="text-[10px] text-emerald-200/80 line-clamp-2">{kpi.subtitle}</p>
                  <p className="text-[10px] font-mono text-[#f3d266] bg-[#041d13] py-1 px-2 rounded-lg border border-emerald-800/60">
                    {kpi.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. WADAH TERPADU MEMANJANG: GRAFIK TRADER CANDLESTICK KEUANGAN BENDAHARA & INDIKATOR PENILAIAN EKONOMI PONDOK */}
      {showFinanceSection && (() => {
        const maxScale = 45; // Skala maksimum 45 Juta Rupiah
        const growLevel = 32; // Garis Perkembangan Pesat / Grow (Atas)
        const stabilLevel = 22; // Garis Stabil (Tengah)
        const daruratLevel = 12; // Garis Darurat (Bawah)

        const growPct = (growLevel / maxScale) * 100;
        const stabilPct = (stabilLevel / maxScale) * 100;
        const daruratPct = (daruratLevel / maxScale) * 100;

        const latestCandle =
          financeAnalytics.candlestickData[financeAnalytics.candlestickData.length - 1] ||
          { periode: 'Kini', open: 28.5, high: 38, low: 20, close: 34, masuk: 38, keluar: 20 };
        const latestDiff = latestCandle.close - latestCandle.open;
        const latestPct = latestCandle.open > 0 ? ((latestDiff / latestCandle.open) * 100).toFixed(1) : '0.0';
        const zonaKasSaatIni =
          latestCandle.close >= growLevel
            ? { label: 'ZONA GROW / PERKEMBANGAN PESAT', tone: 'text-emerald-300 bg-emerald-950/90 border-emerald-400/60' }
            : latestCandle.close >= stabilLevel
              ? { label: 'ZONA STABIL / KESEIMBANGAN KAS', tone: 'text-[#f3d266] bg-[#093524] border-[#d4af37]/60' }
              : { label: 'ZONA DARURAT / PERLU INTERVENSI KAS', tone: 'text-rose-300 bg-rose-950/90 border-rose-500/60' };

        return (
          <div className="rounded-3xl bg-gradient-to-b from-[#041d14]/95 via-[#031710]/95 to-[#02100b]/95 border border-[#d4af37]/45 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.65)] space-y-6">
            {/* Header Bar Gaya Terminal Trader */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-[#d4af37]/25 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#d4af37]/20 border border-[#d4af37]/50 text-[10px] font-mono font-bold text-[#f3d266] uppercase">
                    KAS-ALMALIKI / IDR · 1M OHLC TRADER CHART
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md border text-[10px] font-mono font-bold ${zonaKasSaatIni.tone}`}>
                    {zonaKasSaatIni.label}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-[#d4af37] text-[#02120a] text-[10px] font-mono font-black">
                    SKOR EKONOMI: {financeAnalytics.skorEkonomi}/100
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide flex items-center gap-2 mt-1.5">
                  <Wallet className="w-5 h-5 text-[#f3d266]" />
                  <span>Grafik Candlestick Trader Keuangan Bendahara &amp; Indikator Penilaian Ekonomi Pondok</span>
                </h2>
                <p className="text-xs text-emerald-200/75 mt-0.5">
                  Wadah terpadu analisis OHLC Kas Pondok (Open, High, Low, Close) dilengkapi Garis Perkembangan Pesat (Grow), Garis Stabil, dan Garis Darurat.
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

            {/* Legenda Garis Indikator Trader */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono bg-[#02100a] border border-emerald-900/80 rounded-2xl px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-2 text-emerald-300 font-bold">
                  <span className="w-6 border-t-2 border-dashed border-emerald-400 inline-block shadow-[0_0_8px_#10b981]" />
                  <span>ATAS: Garis Perkembangan Pesat / Grow (≥ Rp 32 Jt)</span>
                </span>
                <span className="inline-flex items-center gap-2 text-[#f3d266] font-bold">
                  <span className="w-6 border-t-2 border-dashed border-[#f3d266] inline-block shadow-[0_0_8px_#f3d266]" />
                  <span>TENGAH: Garis Stabil / Keseimbangan (Rp 22 Jt)</span>
                </span>
                <span className="inline-flex items-center gap-2 text-rose-400 font-bold">
                  <span className="w-6 border-t-2 border-dashed border-rose-500 inline-block shadow-[0_0_8px_#f43f5e]" />
                  <span>BAWAH: Garis Darurat / Minimum Kas (≤ Rp 12 Jt)</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block shadow-[0_0_8px_#10b981]" />
                  <span>Candle Bullish (Surplus)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block shadow-[0_0_8px_#f43f5e]" />
                  <span>Candle Bearish (Defisit)</span>
                </span>
              </div>
            </div>

            {/* Wadah Memanjang Grafik Trader Candlestick */}
            <div className="bg-[#010a06] border-2 border-[#d4af37]/30 rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-inner">
              {/* Background Grid Trader */}
              <div
                className="relative h-72 sm:h-80 pr-12 sm:pr-16 pt-4 pb-8 select-none"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(16, 185, 129, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(16, 185, 129, 0.07) 1px, transparent 1px)',
                  backgroundSize: '48px 36px',
                }}
              >
                {/* Zona Warna Halus di Belakang Candle */}
                <div
                  className="absolute left-0 right-12 sm:right-16 top-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none"
                  style={{ height: `${100 - growPct}%` }}
                />
                <div
                  className="absolute left-0 right-12 sm:right-16 bottom-8 bg-gradient-to-t from-rose-600/15 to-transparent pointer-events-none"
                  style={{ height: `${daruratPct}%` }}
                />

                {/* Skala Harga Kanan (Right Price Axis ala TradingView) */}
                <div className="absolute right-0 top-2 bottom-8 w-12 sm:w-14 border-l border-emerald-900/80 flex flex-col justify-between items-end pr-1.5 text-[9px] font-mono text-emerald-300/70 pointer-events-none">
                  <span>45 Jt</span>
                  <span>36 Jt</span>
                  <span>27 Jt</span>
                  <span>18 Jt</span>
                  <span>9 Jt</span>
                  <span>0 Jt</span>
                </div>

                {/* Area Plot Candlestick + 3 Garis Indikator */}
                <div className="relative w-full h-full">
                  {/* 1. GARIS ATAS: PERKEMBANGAN PESAT / GROW */}
                  <div
                    className="absolute left-0 right-0 border-t-2 border-dashed border-emerald-400/90 z-10 pointer-events-none shadow-[0_0_12px_rgba(16,185,129,0.55)]"
                    style={{ bottom: `${growPct}%` }}
                  >
                    <div className="flex items-center justify-between -mt-3 px-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/95 border border-emerald-400 text-[9px] sm:text-[10px] font-mono font-black text-emerald-300 shadow-lg">
                        ▲ GARIS PERKEMBANGAN PESAT / GROW (Rp 32 Jt)
                      </span>
                      <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-emerald-500 text-[#010a06] text-[9px] font-mono font-black">
                        GROW 32Jt
                      </span>
                    </div>
                  </div>

                  {/* 2. GARIS TENGAH: STABIL */}
                  <div
                    className="absolute left-0 right-0 border-t-2 border-dashed border-[#f3d266]/90 z-10 pointer-events-none shadow-[0_0_12px_rgba(243,210,102,0.45)]"
                    style={{ bottom: `${stabilPct}%` }}
                  >
                    <div className="flex items-center justify-between -mt-3 px-2">
                      <span className="px-2 py-0.5 rounded bg-[#1f1905]/95 border border-[#f3d266] text-[9px] sm:text-[10px] font-mono font-black text-[#f3d266] shadow-lg">
                        ◆ GARIS STABIL / KESEIMBANGAN KAS (Rp 22 Jt)
                      </span>
                      <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#f3d266] text-[#010a06] text-[9px] font-mono font-black">
                        STABIL 22Jt
                      </span>
                    </div>
                  </div>

                  {/* 3. GARIS PALING BAWAH: DARURAT */}
                  <div
                    className="absolute left-0 right-0 border-t-2 border-dashed border-rose-500/95 z-10 pointer-events-none shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                    style={{ bottom: `${daruratPct}%` }}
                  >
                    <div className="flex items-center justify-between -mt-3 px-2">
                      <span className="px-2 py-0.5 rounded bg-rose-950/95 border border-rose-500 text-[9px] sm:text-[10px] font-mono font-black text-rose-300 shadow-lg">
                        ▼ GARIS DARURAT / BATAS MINIMUM LIKUIDITAS (Rp 12 Jt)
                      </span>
                      <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-rose-500 text-white text-[9px] font-mono font-black">
                        DARURAT 12Jt
                      </span>
                    </div>
                  </div>

                  {/* Barisan Candlestick Trader Memanjang */}
                  <div className="grid grid-cols-8 gap-2 sm:gap-4 items-end h-full px-2 sm:px-6 relative z-20">
                    {financeAnalytics.candlestickData.map((c, i) => {
                      const isBullish = c.close >= c.open;
                      const highPct = Math.min(98, Math.max(6, (c.high / maxScale) * 100));
                      const lowPct = Math.min(92, Math.max(2, (c.low / maxScale) * 100));
                      const bodyTopPct = Math.min(96, (Math.max(c.open, c.close) / maxScale) * 100);
                      const bodyBottomPct = Math.max(3, (Math.min(c.open, c.close) / maxScale) * 100);
                      const bodyHeightPct = Math.max(5, bodyTopPct - bodyBottomPct);
                      const diff = c.close - c.open;

                      return (
                        <div key={i} className="flex flex-col items-center h-full justify-end group relative">
                          {/* Interactive Trader Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-150 absolute -top-3 z-30 bg-[#041d14]/95 border border-[#d4af37] rounded-xl px-3 py-2 text-[10px] font-mono text-white whitespace-nowrap shadow-2xl pointer-events-none">
                            <p className="font-bold text-[#f3d266] border-b border-emerald-800 pb-0.5 mb-1">
                              Periode: {c.periode} ({isBullish ? 'BULLISH' : 'BEARISH'})
                            </p>
                            <p>
                              O: <strong>Rp{c.open}Jt</strong> · H: <strong className="text-emerald-300">Rp{c.high}Jt</strong>
                            </p>
                            <p>
                              L: <strong className="text-rose-300">Rp{c.low}Jt</strong> · C: <strong className="text-[#f3d266]">Rp{c.close}Jt</strong>
                            </p>
                            <p className="text-[9px] text-emerald-200 mt-0.5">
                              Masuk: Rp{c.masuk}Jt | Keluar: Rp{c.keluar}Jt
                            </p>
                          </div>

                          {/* Candle Wick & Body */}
                          <div className="relative w-full h-full flex justify-center">
                            {/* Upper & Lower Wick */}
                            <div
                              className={`w-[2px] absolute transition-all ${
                                isBullish
                                  ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                                  : 'bg-rose-400 shadow-[0_0_8px_#f43f5e]'
                              }`}
                              style={{
                                bottom: `${lowPct}%`,
                                height: `${Math.max(4, highPct - lowPct)}%`,
                              }}
                            />

                            {/* Candle Body */}
                            <div
                              className={`w-6 sm:w-10 md:w-12 rounded-md absolute border transition-all group-hover:scale-105 ${
                                isBullish
                                  ? 'bg-gradient-to-t from-emerald-600 via-emerald-500 to-emerald-300 border-emerald-200 shadow-[0_0_16px_rgba(16,185,129,0.45)]'
                                  : 'bg-gradient-to-t from-rose-700 via-rose-500 to-rose-400 border-rose-200 shadow-[0_0_16px_rgba(244,63,94,0.45)]'
                              }`}
                              style={{
                                bottom: `${bodyBottomPct}%`,
                                height: `${bodyHeightPct}%`,
                              }}
                            />

                            {/* Close Price Tag on Latest Candle */}
                            {i === financeAnalytics.candlestickData.length - 1 && (
                              <span
                                className="absolute -right-2 sm:-right-4 px-1.5 py-0.5 rounded bg-[#d4af37] text-[#02120a] font-mono font-black text-[8px] sm:text-[9px] shadow-md whitespace-nowrap"
                                style={{ bottom: `${bodyTopPct}%` }}
                              >
                                {c.close}Jt
                              </span>
                            )}
                          </div>

                          {/* X-Axis Period Label & Delta */}
                          <div className="absolute -bottom-7 flex flex-col items-center">
                            <span className="text-[10px] font-mono font-bold text-emerald-100 whitespace-nowrap">
                              {c.periode}
                            </span>
                            <span
                              className={`text-[9px] font-mono font-bold ${
                                isBullish ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isBullish ? `+${diff.toFixed(1)}jt` : `${diff.toFixed(1)}jt`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

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
          <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/40 p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Grafik Line Chart Kinerja Pengurus
                </h2>
                <p className="text-xs text-emerald-200/70">
                  Perbandingan capaian program kerja & responsivitas pengurus Bulan Ini vs Bulan Lalu
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="text-lg font-black text-emerald-400 font-mono">{kinerjaPengurusStats.bulanIni}%</p>
                  <p className="text-[10px] font-mono text-emerald-300">
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
        <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/40 p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#f3d266]" />
                Grafik Line Chart Kedisiplinan Santri
              </h2>
              <p className="text-xs text-emerald-200/70">
                Indeks kepatuhan qanun, jamaah, &amp; ketepatan izin kembali Bulan Ini vs Bulan Lalu
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-lg font-black text-[#f3d266] font-mono">{kedisiplinanSantriStats.bulanIni}%</p>
                <p className="text-[10px] font-mono text-emerald-300">
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
          <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/40 p-5 shadow-xl h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Grafik Diagram Santri dari Tahun ke Tahun
                </h2>
                <p className="text-xs text-emerald-200/70">Pertumbuhan jumlah santri putra (Banin) & putri (Banat) 2022–2026</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={santriYearlyChart} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.35} />
                  <XAxis dataKey="tahun" stroke="#a7f3d0" fontSize={11} />
                  <YAxis stroke="#a7f3d0" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#02120a',
                      borderColor: '#d4af37',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="putra" name="Santri Putra" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="putri" name="Santri Putri" fill="#d4af37" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {(showSekretarisCard || showPerlengkapanCard) && (
          <div className={`lg:col-span-6 grid grid-cols-1 ${showSekretarisCard && showPerlengkapanCard ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-4`}>
            {showSekretarisCard && (
              <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase text-[#f3d266] bg-[#d4af37]/15 px-2.5 py-1 rounded-lg border border-[#d4af37]/30">
                      DIVISI SEKRETARIS
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">Statistik & Aktivitas Sekretaris</h3>
                  <p className="text-[11px] text-emerald-200/70 mt-0.5">Rekapitulasi persuratan resmi & buku induk</p>

                  <div className="grid grid-cols-2 gap-2.5 mt-4">
                    <div className="p-3 rounded-xl bg-[#03160f] border border-emerald-800/60">
                      <p className="text-[10px] font-mono text-emerald-300">Total Arsip Surat</p>
                      <p className="text-xl font-black text-white font-mono mt-0.5">{sekretarisStats.totalArsip}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#03160f] border border-[#d4af37]/40">
                      <p className="text-[10px] font-mono text-[#f3d266]">Resmi Terbit</p>
                      <p className="text-xl font-black text-[#f3d266] font-mono mt-0.5">{sekretarisStats.suratResmiTerbit}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#03160f] border border-emerald-800/60">
                      <p className="text-[10px] font-mono text-emerald-300">Surat Keluar</p>
                      <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{sekretarisStats.suratKeluar}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#03160f] border border-emerald-800/60">
                      <p className="text-[10px] font-mono text-emerald-300">Surat Masuk</p>
                      <p className="text-lg font-bold text-amber-300 font-mono mt-0.5">{sekretarisStats.suratMasuk}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('sekretaris')}
                  className="mt-4 w-full py-2.5 rounded-xl bg-[#073021] hover:bg-[#0b422d] text-emerald-200 hover:text-white text-xs font-bold border border-emerald-700/50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Buka Panel Sekretaris <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {showPerlengkapanCard && (
              <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono uppercase text-[#f3d266] bg-[#d4af37]/15 px-2.5 py-1 rounded-lg border border-[#d4af37]/30">
                      DIVISI PERLENGKAPAN
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">Statistik & Aktivitas Perlengkapan</h3>
                  <p className="text-[11px] text-emerald-200/70 mt-0.5">Kondisi aset sarpras & peminjaman aktif</p>

                  <div className="grid grid-cols-2 gap-2.5 mt-4">
                    <div className="p-3 rounded-xl bg-[#03160f] border border-emerald-800/60">
                      <p className="text-[10px] font-mono text-emerald-300">Total Unit Aset</p>
                      <p className="text-xl font-black text-white font-mono mt-0.5">{perlengkapanStats.totalAset}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#03160f] border border-emerald-700/50">
                      <p className="text-[10px] font-mono text-emerald-400">Kondisi Baik</p>
                      <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">{perlengkapanStats.kondisiBaik}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#03160f] border border-rose-800/60">
                      <p className="text-[10px] font-mono text-rose-300">Kondisi Rusak</p>
                      <p className="text-lg font-bold text-rose-400 font-mono mt-0.5">{perlengkapanStats.kondisiRusak}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#03160f] border border-amber-700/50">
                      <p className="text-[10px] font-mono text-amber-300">Sedang Dipinjam</p>
                      <p className="text-lg font-bold text-amber-400 font-mono mt-0.5">{perlengkapanStats.sedangDipinjam}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('perlengkapan')}
                  className="mt-4 w-full py-2.5 rounded-xl bg-[#073021] hover:bg-[#0b422d] text-emerald-200 hover:text-white text-xs font-bold border border-emerald-700/50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Buka Panel Perlengkapan <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 8. KALENDER KEGIATAN PONDOK PESANTREN (HIJRIAH & MASEHI) */}
      <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-800/70">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#f3d266]" />
              Kalender Kegiatan Pondok Pesantren (Masehi & Hijriah)
            </h2>
            <p className="text-xs text-emerald-200/75 mt-0.5">
              Penanggalan terpadu Masehi & Hijriah beserta jadwal rapat, pengajian akbar, dan kegiatan pengurus
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCalendarMonthOffset(prev => prev - 1)}
              className="p-2 rounded-xl bg-[#03160f] hover:bg-[#072c1e] text-emerald-200 border border-emerald-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 py-1.5 rounded-xl bg-[#03160f] border border-[#d4af37]/50 text-center min-w-[200px]">
              <p className="text-xs font-bold text-white">{calendarData.masehiMonthName}</p>
              <p className="text-[10px] font-mono text-[#f3d266]">{calendarData.hijriHeader}</p>
            </div>
            <button
              type="button"
              onClick={() => setCalendarMonthOffset(prev => prev + 1)}
              className="p-2 rounded-xl bg-[#03160f] hover:bg-[#072c1e] text-emerald-200 border border-emerald-800 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
              {['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((d, idx) => (
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
                <div key={`empty-${i}`} className="h-16 sm:h-20 rounded-xl bg-[#02100a]/40 border border-emerald-950/40" />
              ))}
              {calendarData.days.map((item) => {
                const hasAgenda = item.agendas.length > 0;
                return (
                  <div
                    key={item.dateStr}
                    className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all ${
                      item.isToday
                        ? 'bg-gradient-to-br from-[#0b422d] to-[#06281c] border-[#d4af37] shadow-md'
                        : hasAgenda
                        ? 'bg-[#072c1e]/90 border-emerald-500/60'
                        : 'bg-[#03160f]/80 border-emerald-900/50 hover:border-emerald-700/60'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`text-xs sm:text-sm font-bold font-mono ${item.isToday ? 'text-[#f3d266]' : 'text-white'}`}>
                        {item.masehiDay}
                      </span>
                      <span className="text-[9px] font-mono text-emerald-300/80 bg-emerald-950/80 px-1 rounded">
                        {item.hijriDay}H
                      </span>
                    </div>

                    {hasAgenda ? (
                      <div className="truncate text-[9px] px-1.5 py-0.5 rounded bg-[#d4af37]/25 text-[#f3d266] border border-[#d4af37]/40 font-semibold">
                        {item.agendas[0].judul}
                      </div>
                    ) : (
                      <span className="text-[8px] font-mono text-emerald-400/50 truncate">
                        {item.hijriMonth}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-[#f3d266] uppercase tracking-wider font-mono">
              Agenda Kegiatan & Musyawarah Terjadwal
            </h3>
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {agendaPengurus.map((agd) => {
                const dObj = new Date(agd.tanggal + 'T12:00:00');
                const hj = gregorianToHijri(dObj);
                return (
                  <div
                    key={agd.id}
                    className="p-3.5 rounded-2xl bg-[#03160f] border border-emerald-800/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-[#f3d266] font-bold">
                        {agd.tanggal} · {hj.day} {hj.monthName} {hj.year} H
                      </span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/40">
                        {agd.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white">{agd.judul}</p>
                    <p className="text-[11px] text-emerald-200/75">
                      Pukul {agd.waktu} WIB · {agd.tempat} ({agd.divisiTerkait})
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
