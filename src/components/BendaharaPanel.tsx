import React, { useMemo, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Printer,
  Trash2,
  Search,
  Calendar,
  Send,
  CheckCircle2,
  CreditCard,
  Bell,
  PieChart as PieChartIcon,
  ShieldCheck,
  MessageSquare,
  FileText,
  ArrowUpRight,
  Coins,
  Scale,
  History
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
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  GlowingDot,
  GlowingActiveDot,
  LuxuryChartTooltip,
} from './LuxuryChartComponents';
import {
  TransaksiKeuangan,
  TipeTransaksiKeuangan,
  UserAccount,
  SystemConfig,
  Santri,
  PengajuanDivisi,
  PesanKoordinasi,
  LogAktivitas,
  SyahriyahSantri,
  UangSakuMutasi,
  AnggaranPondok
} from '../types';
import { storageService } from '../services/storageService';
import { openPrintWindow } from '../utils/printDocument';

interface BendaharaPanelProps {
  currentUser: UserAccount;
  systemConfig: SystemConfig;
  transaksiKeuangan: TransaksiKeuangan[];
  santriList: Santri[];
  pengajuanDivisi: PengajuanDivisi[];
  koordinasiList: PesanKoordinasi[];
  logsList: LogAktivitas[];
  initialSubTab?: 'kotak_masuk' | 'syahriyah' | 'uang_saku' | 'pengajuan_dana' | 'pemasukan_pengeluaran';
}

const KATEGORI_PEMASUKAN = [
  'Syahriah & Makan Santri',
  'Infaq & Donasi Pembangunan',
  'Pendaftaran Santri Baru (PSB)',
  'Bantuan Hibah / Wakaf Tunai',
  'Unit Usaha & Koperasi Pondok',
  'Pemasukan Lainnya',
];

const KATEGORI_PENGELUARAN = [
  'Konsumsi & Dapur Umum',
  'Utilitas (Listrik, Air & Internet)',
  'Bisyarah Asatidz & Pengurus',
  'Sarpras & Pemeliharaan',
  'Operasional Sekretariat & Keamanan',
  'Kesehatan Santri (Poskestren)',
  'Pengeluaran Lainnya',
];

const PIE_COLORS = ['#10b981', '#d4af37', '#34d399', '#f59e0b', '#059669', '#fbbf24'];

export const BendaharaPanel: React.FC<BendaharaPanelProps> = ({
  currentUser,
  systemConfig,
  transaksiKeuangan,
  santriList,
  pengajuanDivisi,
  koordinasiList,
  logsList,
  initialSubTab,
}) => {
  const [activeTab, setActiveTab] = useState<
    'kotak_masuk' | 'syahriyah' | 'uang_saku' | 'pengajuan_dana' | 'pemasukan_pengeluaran'
  >(initialSubTab || 'pemasukan_pengeluaran');

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [filterPeriode, setFilterPeriode] = useState<'semua' | 'harian' | 'bulanan' | 'tahunan'>('semua');
  const [filterTipe, setFilterTipe] = useState<'Semua' | TipeTransaksiKeuangan>('Semua');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Form Buku Kas Baru
  const [formData, setFormData] = useState<Partial<TransaksiKeuangan>>({
    tanggal: new Date().toISOString().split('T')[0],
    tipe: 'Pemasukan',
    kategori: KATEGORI_PEMASUKAN[0],
    deskripsi: '',
    nominal: 0,
    metodePembayaran: 'Transfer Bank',
    pihakTerkait: '',
  });

  // Form Uang Saku Santri
  const [uangSakuForm, setUangSakuForm] = useState({
    santriId: santriList[0]?.id || 'san_001',
    tipe: 'Setoran' as 'Setoran' | 'Penarikan',
    nominal: 100000,
    keterangan: '',
  });

  // Form Anggaran Baru
  const [anggaranForm, setAnggaranForm] = useState<Partial<AnggaranPondok>>({
    kategori: KATEGORI_PENGELUARAN[0],
    divisi: 'Dapur & Konsumsi',
    periode: 'November 2026',
    nominalAnggaran: 5000000,
    keterangan: '',
  });

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // Filtered Transaksi Buku Kas (Semua / Harian / Bulanan / Tahunan)
  const filteredTransaksi = useMemo(() => {
    return transaksiKeuangan.filter(t => {
      if (filterTipe !== 'Semua' && t.tipe !== filterTipe) return false;
      if (filterPeriode === 'harian' && t.tanggal !== selectedDate) return false;
      if (filterPeriode === 'bulanan' && !t.tanggal.startsWith(selectedMonth)) return false;
      if (filterPeriode === 'tahunan' && !t.tanggal.startsWith(selectedYear)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.kodeTransaksi.toLowerCase().includes(q) ||
          t.deskripsi.toLowerCase().includes(q) ||
          t.kategori.toLowerCase().includes(q) ||
          t.pihakTerkait.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transaksiKeuangan, filterTipe, filterPeriode, selectedDate, selectedMonth, selectedYear, searchQuery]);

  // Statistik Keuangan, Candlestick, Line Chart, Pie Chart & Kategori Keseluruhan Periode
  const financeCharts = useMemo(() => {
    const totalMasuk = filteredTransaksi.filter(t => t.tipe === 'Pemasukan').reduce((a, b) => a + b.nominal, 0);
    const totalKeluar = filteredTransaksi.filter(t => t.tipe === 'Pengeluaran').reduce((a, b) => a + b.nominal, 0);
    const saldo = totalMasuk - totalKeluar;

    // Candlestick Data (Juta Rupiah)
    const candlestick = [
      { bln: 'Jun', open: 14.0, close: 21.5, high: 24.0, low: 12.5 },
      { bln: 'Jul', open: 21.5, close: 29.0, high: 33.5, low: 19.0 },
      { bln: 'Agu', open: 29.0, close: 25.2, high: 31.0, low: 22.8 },
      { bln: 'Sep', open: 25.2, close: 33.4, high: 36.0, low: 24.0 },
      { bln: 'Okt', open: 33.4, close: 38.0, high: 41.2, low: 31.0 },
      {
        bln: 'Nov',
        open: 22.0,
        close: Number(Math.max(8, saldo / 1000000).toFixed(1)),
        high: Number(Math.max(30, totalMasuk / 1000000).toFixed(1)),
        low: Number(Math.max(5, (totalMasuk - totalKeluar * 1.1) / 1000000).toFixed(1)),
      },
    ];

    // Pie Chart Kategori + Persentase
    const catMap: Record<string, number> = {};
    let grandTotal = 0;
    transaksiKeuangan.forEach(t => {
      catMap[t.kategori] = (catMap[t.kategori] || 0) + t.nominal;
      grandTotal += t.nominal;
    });
    const pieData = Object.entries(catMap).map(([name, value]) => ({
      name,
      value,
      persen: grandTotal > 0 ? Math.round((value / grandTotal) * 100) : 0,
    }));

    // Bar Chart Kategori Pemasukan & Pengeluaran (Keseluruhan Periode)
    const allCatMap: Record<string, { kategori: string; pemasukan: number; pengeluaran: number }> = {};
    transaksiKeuangan.forEach(t => {
      if (!allCatMap[t.kategori]) {
        allCatMap[t.kategori] = { kategori: t.kategori, pemasukan: 0, pengeluaran: 0 };
      }
      if (t.tipe === 'Pemasukan') allCatMap[t.kategori].pemasukan += t.nominal;
      else allCatMap[t.kategori].pengeluaran += t.nominal;
    });

    // Line Chart Tren Arus Kas
    const lineData = [
      { pekan: 'Pekan 1', pemasukan: 28500000, pengeluaran: 11200000 },
      { pekan: 'Pekan 2', pemasukan: 17300000, pengeluaran: 8500000 },
      { pekan: 'Pekan 3', pemasukan: 14200000, pengeluaran: 6400000 },
      { pekan: 'Pekan 4', pemasukan: totalMasuk, pengeluaran: totalKeluar },
    ];

    return {
      totalMasuk,
      totalKeluar,
      saldo,
      candlestick,
      pieData,
      categoryBarData: Object.values(allCatMap),
      lineData,
    };
  }, [filteredTransaksi, transaksiKeuangan]);

  // Simpan Transaksi Baru + Catat Log Transparansi
  const handleSaveTransaksi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.deskripsi || !formData.nominal) return;
    const prefix = formData.tipe === 'Pemasukan' ? 'KAS-IN' : 'KAS-OUT';
    const trx: TransaksiKeuangan = {
      id: `trx_${Date.now()}`,
      kodeTransaksi: `${prefix}-${Date.now().toString().slice(-5)}`,
      tanggal: formData.tanggal || new Date().toISOString().split('T')[0],
      waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      tipe: (formData.tipe as TipeTransaksiKeuangan) || 'Pemasukan',
      kategori: formData.kategori || KATEGORI_PEMASUKAN[0],
      deskripsi: formData.deskripsi,
      nominal: Number(formData.nominal),
      metodePembayaran: (formData.metodePembayaran as any) || 'Tunai',
      pihakTerkait: formData.pihakTerkait || '-',
      pencatatNama: currentUser.nama,
      statusVerifikasi: 'Terverifikasi',
      createdAt: new Date().toISOString().split('T')[0],
    };
    storageService.saveTransaksiKeuangan(trx);
    setToastMsg(`Transaksi ${trx.kodeTransaksi} berhasil dicatat oleh ${currentUser.nama}!`);
    setTimeout(() => setToastMsg(''), 4000);
    setFormData({ ...formData, deskripsi: '', nominal: 0, pihakTerkait: '' });
  };

  // Syahriyah Santri: Lunasi & Otomatis Masuk ke Buku Kas
  const handleLunasiSyahriyah = (item: SyahriyahSantri) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedList = (systemConfig.syahriyahList || []).map(s =>
      s.id === item.id
        ? { ...s, status: 'Lunas' as const, tanggalBayar: todayStr, metodeBayar: 'Transfer Bank' as const }
        : s
    );
    storageService.updateSystemConfig({ syahriyahList: updatedList });

    // Otomatis catat ke Buku Kas Pemasukan
    storageService.saveTransaksiKeuangan({
      id: `trx_syh_${Date.now()}`,
      kodeTransaksi: `SYH-${Date.now().toString().slice(-5)}`,
      tanggal: todayStr,
      waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      tipe: 'Pemasukan',
      kategori: 'Syahriah & Makan Santri',
      deskripsi: `Pelunasan Syahriyah ${item.bulanTahun} Santri ${item.santriNama} (${item.santriNis})`,
      nominal: item.nominal,
      metodePembayaran: 'Transfer Bank',
      pihakTerkait: item.namaWali,
      pencatatNama: currentUser.nama,
      statusVerifikasi: 'Terverifikasi',
      createdAt: todayStr,
    });

    setToastMsg(`Syahriyah ${item.santriNama} LUNAS & otomatis tercatat pada Buku Kas Pemasukan!`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Pengingat Otomatis Syahriyah Menunggak
  const handleKirimPengingatSyahriyah = (item: SyahriyahSantri) => {
    storageService.addNotification({
      judul: `Pengingat Syahriyah: ${item.santriNama}`,
      pesan: `Notifikasi pengingat syahriyah bulan ${item.bulanTahun} (${formatRupiah(item.nominal)}) telah dikirim ke Wali Santri ${item.namaWali} (${item.noWaWali}).`,
      tipe: 'warning',
      noWaTujuan: item.noWaWali,
    });
    setToastMsg(`Pengingat otomatis WhatsApp & Notifikasi dikirim ke Wali ${item.namaWali} (${item.noWaWali})!`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Uang Saku Santri: Setoran & Penarikan
  const handleSimpanUangSaku = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSantri = santriList.find(s => s.id === uangSakuForm.santriId);
    if (!targetSantri || !uangSakuForm.nominal) return;

    const newMutasi: UangSakuMutasi = {
      id: `usk_${Date.now()}`,
      santriId: targetSantri.id,
      santriNama: targetSantri.nama,
      santriNis: targetSantri.nis,
      tanggal: new Date().toISOString().split('T')[0],
      tipe: uangSakuForm.tipe,
      nominal: Number(uangSakuForm.nominal),
      keterangan: uangSakuForm.keterangan || `${uangSakuForm.tipe} Uang Saku Santri`,
      petugas: currentUser.nama,
    };

    storageService.updateSystemConfig({
      uangSakuList: [newMutasi, ...(systemConfig.uangSakuList || [])],
    });
    setToastMsg(`${newMutasi.tipe} uang saku ${targetSantri.nama} sebesar ${formatRupiah(newMutasi.nominal)} berhasil dicatat!`);
    setTimeout(() => setToastMsg(''), 4000);
    setUangSakuForm({ ...uangSakuForm, keterangan: '' });
  };

  // Hitung Saldo Uang Saku per Santri
  const saldoUangSakuPerSantri = useMemo(() => {
    const list = systemConfig.uangSakuList || [];
    return santriList.map(s => {
      const mutasiSantri = list.filter(m => m.santriId === s.id);
      const setoran = mutasiSantri.filter(m => m.tipe === 'Setoran').reduce((a, b) => a + b.nominal, 0);
      const penarikan = mutasiSantri.filter(m => m.tipe === 'Penarikan').reduce((a, b) => a + b.nominal, 0);
      return {
        santri: s,
        setoran,
        penarikan,
        saldo: setoran - penarikan,
      };
    });
  }, [santriList, systemConfig.uangSakuList]);

  // Tambah Anggaran Pondok
  const handleSimpanAnggaran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!anggaranForm.nominalAnggaran) return;
    const item: AnggaranPondok = {
      id: `ang_${Date.now()}`,
      kategori: anggaranForm.kategori || KATEGORI_PENGELUARAN[0],
      divisi: (anggaranForm.divisi as any) || 'Bendahara',
      periode: anggaranForm.periode || 'November 2026',
      nominalAnggaran: Number(anggaranForm.nominalAnggaran),
      keterangan: anggaranForm.keterangan || '-',
    };
    storageService.updateSystemConfig({
      anggaranList: [...(systemConfig.anggaranList || []), item],
    });
    setToastMsg(`Pos anggaran "${item.kategori}" berhasil ditambahkan!`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Pencairan Pengajuan Dana yang Telah Disetujui Ketua Pondok
  const handleCairkanPengajuanDana = (pgj: PengajuanDivisi) => {
    const todayStr = new Date().toISOString().split('T')[0];
    storageService.saveTransaksiKeuangan({
      id: `trx_pgj_${Date.now()}`,
      kodeTransaksi: `KAS-OUT-${Date.now().toString().slice(-5)}`,
      tanggal: todayStr,
      waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      tipe: 'Pengeluaran',
      kategori: 'Sarpras & Pemeliharaan',
      deskripsi: `Pencairan Pengajuan Divisi ${pgj.divisi}: ${pgj.judul} (${pgj.nomorPengajuan})`,
      nominal: pgj.nominalEstimasi || 1000000,
      metodePembayaran: 'Transfer Bank',
      pihakTerkait: `${pgj.pengajuNama} (${pgj.divisi})`,
      pencatatNama: currentUser.nama,
      statusVerifikasi: 'Terverifikasi',
      createdAt: todayStr,
    });
    setToastMsg(`Dana untuk "${pgj.judul}" berhasil dicairkan & tercatat di Buku Kas Pengeluaran!`);
    setTimeout(() => setToastMsg(''), 4000);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER BENDAHARA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#041d14]/95 border border-[#d4af37]/40 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f3d266]">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
              BENDAHARA & MANAJEMEN KEUANGAN PUSAT
            </span>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-1">
              Sistem Keuangan, Syahriyah, Uang Saku, Anggaran & Grafik Candlestick
            </h1>
            <p className="text-xs text-emerald-200/75">
              Grafik Candlestick, Line & Pie Chart (%), Syahriyah Santri, Uang Saku, Buku Kas Harian/Bulanan/Tahunan, Anggaran vs Realisasi, & Audit Transparansi
            </p>
          </div>
        </div>

        {/* Sub-Tab Navigasi Bendahara */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#02100a] p-1.5 rounded-2xl border border-emerald-800/70">
          {[
            { id: 'kotak_masuk', label: `Kotak Masuk & Pesan (${koordinasiList.length})` },
            { id: 'syahriyah', label: 'Tab Syahriyah' },
            { id: 'uang_saku', label: 'Tab Uang Saku' },
            { id: 'pengajuan_dana', label: `Tab Pengajuan Dana (${pengajuanDivisi.length})` },
            { id: 'pemasukan_pengeluaran', label: 'Pemasukan & Pengeluaran' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] shadow-md'
                  : 'text-emerald-200 hover:text-white hover:bg-[#06281c]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/95 border border-[#d4af37] text-emerald-100 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-[#f3d266] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TAB: PEMASUKAN DAN PENGELUARAN (PIE CHART & PERBANDINGAN BULAN LALU, BUKU KAS, ANGGARAN & REALISASI, FILTER LAPORAN, GRAFIK KATEGORI) */}
      {activeTab === 'pemasukan_pengeluaran' && (
        <div className="space-y-6">
          {/* 3 Ringkasan Saldo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#041d14]/95 border border-emerald-500/35 shadow-lg">
              <p className="text-[10px] font-mono uppercase text-emerald-300">Total Pemasukan Kas</p>
              <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{formatRupiah(financeCharts.totalMasuk)}</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#041d14]/95 border border-rose-500/35 shadow-lg">
              <p className="text-[10px] font-mono uppercase text-rose-300">Total Pengeluaran Kas</p>
              <p className="text-2xl font-black text-rose-400 font-mono mt-1">{formatRupiah(financeCharts.totalKeluar)}</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/45 shadow-lg">
              <p className="text-[10px] font-mono uppercase text-[#f3d266]">Saldo Akhir Kas Pondok</p>
              <p className="text-2xl font-black text-[#f3d266] font-mono mt-1">{formatRupiah(financeCharts.saldo)}</p>
            </div>
          </div>

          {/* Grafik Candlestick + Line Chart + Pie Chart (%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Candlestick Kondisi Keuangan */}
            <div className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl">
              <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-1">
                Grafik Candlestick Kondisi Keuangan
              </h2>
              <p className="text-[11px] text-emerald-200/70 mb-4">Pergerakan Open, High, Low, Close Kas (Juta Rp)</p>
              <div className="bg-[#02120b] border border-emerald-900/70 rounded-xl p-3">
                <div className="grid grid-cols-6 gap-2 items-end h-44 pt-2 pb-1">
                  {financeCharts.candlestick.map((c, idx) => {
                    const maxS = 45;
                    const bull = c.close >= c.open;
                    const highP = Math.min(100, (c.high / maxS) * 100);
                    const lowP = Math.max(4, (c.low / maxS) * 100);
                    const topP = Math.min(100, (Math.max(c.open, c.close) / maxS) * 100);
                    const botP = Math.max(4, (Math.min(c.open, c.close) / maxS) * 100);
                    return (
                      <div key={idx} className="flex flex-col items-center h-full justify-end">
                        <div className="relative w-full h-32 flex justify-center">
                          <div
                            className={`w-0.5 absolute ${bull ? 'bg-emerald-400' : 'bg-rose-400'}`}
                            style={{ bottom: `${lowP}%`, height: `${Math.max(5, highP - lowP)}%` }}
                          />
                          <div
                            className={`w-5 rounded-sm absolute border ${
                              bull ? 'bg-emerald-500 border-emerald-300' : 'bg-rose-500 border-rose-300'
                            }`}
                            style={{ bottom: `${botP}%`, height: `${Math.max(6, topP - botP)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-white mt-1">{c.bln}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Line Chart Arus Kas */}
            <div className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl">
              <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-1">
                Grafik Line Chart Tren Arus Kas
              </h2>
              <p className="text-[11px] text-emerald-200/70 mb-3">Tren Pemasukan vs Pengeluaran Mingguan</p>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={financeCharts.lineData}
                    margin={{ top: 10, right: 10, left: -12, bottom: 0 }}
                  >
                    <defs>
                      <filter id="glowArusKas" x="-25%" y="-25%" width="150%" height="150%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <linearGradient id="lineGradMasuk" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                      <linearGradient id="lineGradKeluar" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#fb7185" />
                        <stop offset="100%" stopColor="#f43f5e" />
                      </linearGradient>
                      <linearGradient id="areaGradMasuk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.38} />
                        <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="areaGradKeluar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.35} />
                    <XAxis dataKey="pekan" stroke="#a7f3d0" fontSize={10} tickLine={false} />
                    <YAxis stroke="#a7f3d0" fontSize={10} tickLine={false} />
                    <Tooltip
                      content={<LuxuryChartTooltip unit="" valuePrefix="Rp " subtitle="Arus Kas Mingguan Bendahara" />}
                      cursor={{ stroke: '#d4af37', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                    <Area
                      type="monotone"
                      dataKey="pengeluaran"
                      name="Pengeluaran"
                      fill="url(#areaGradKeluar)"
                      stroke="none"
                      legendType="none"
                      isAnimationActive={true}
                      animationDuration={1400}
                    />
                    <Area
                      type="monotone"
                      dataKey="pemasukan"
                      name="Pemasukan"
                      fill="url(#areaGradMasuk)"
                      stroke="none"
                      legendType="none"
                      isAnimationActive={true}
                      animationDuration={1600}
                    />
                    <Line
                      type="monotone"
                      dataKey="pengeluaran"
                      name="Pengeluaran"
                      stroke="url(#lineGradKeluar)"
                      strokeWidth={2.5}
                      dot={<GlowingDot color="#f43f5e" accentColor="#fecdd3" />}
                      activeDot={<GlowingActiveDot color="#f43f5e" accentColor="#ffffff" />}
                      isAnimationActive={true}
                      animationDuration={1500}
                    />
                    <Line
                      type="monotone"
                      dataKey="pemasukan"
                      name="Pemasukan"
                      stroke="url(#lineGradMasuk)"
                      strokeWidth={3.2}
                      filter="url(#glowArusKas)"
                      dot={<GlowingDot color="#10b981" accentColor="#f3d266" />}
                      activeDot={<GlowingActiveDot color="#10b981" accentColor="#f3d266" />}
                      isAnimationActive={true}
                      animationDuration={1700}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart Kategori & Persentasenya */}
            <div className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl">
              <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-1">
                Pie Chart Proporsi Kategori & Persentase (%)
              </h2>
              <p className="text-[11px] text-emerald-200/70 mb-2">Distribusi persentase transaksi per kategori</p>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={financeCharts.pieData} dataKey="value" nameKey="name" outerRadius={55} innerRadius={28}>
                      {financeCharts.pieData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#02120a', borderColor: '#d4af37', borderRadius: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1 mt-2 max-h-24 overflow-y-auto">
                {financeCharts.pieData.map((p, idx) => (
                  <div key={p.name} className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-emerald-100 truncate">{idx + 1}. {p.name}</span>
                    <span className="text-[#f3d266] font-bold">{p.persen}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grafik Kategori Pemasukan & Pengeluaran (Keseluruhan Periode) */}
          <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
              Grafik Kategori Pemasukan & Pengeluaran (Keseluruhan Periode)
            </h2>
            <p className="text-xs text-emerald-200/70 mb-4">Perbandingan volume kas masuk dan keluar pada setiap pos kategori</p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeCharts.categoryBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.35} />
                  <XAxis dataKey="kategori" stroke="#a7f3d0" fontSize={10} />
                  <YAxis stroke="#a7f3d0" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#02120a', borderColor: '#d4af37', borderRadius: '12px' }} />
                  <Legend />
                  <Bar dataKey="pemasukan" name="Pemasukan (Rp)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pengeluaran" name="Pengeluaran (Rp)" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Input Transaksi & Buku Kas Harian / Bulanan / Tahunan */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form onSubmit={handleSaveTransaksi} className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-3 h-fit">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Input Transaksi Buku Kas Pondok
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                <select
                  value={formData.tipe}
                  onChange={e => {
                    const t = e.target.value as TipeTransaksiKeuangan;
                    setFormData({
                      ...formData,
                      tipe: t,
                      kategori: t === 'Pemasukan' ? KATEGORI_PEMASUKAN[0] : KATEGORI_PENGELUARAN[0],
                    });
                  }}
                  className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-bold"
                >
                  <option value="Pemasukan">Pemasukan (+)</option>
                  <option value="Pengeluaran">Pengeluaran (-)</option>
                </select>
                <input
                  type="date"
                  value={formData.tanggal}
                  onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>
              <select
                value={formData.kategori}
                onChange={e => setFormData({ ...formData, kategori: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              >
                {(formData.tipe === 'Pemasukan' ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN).map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <input
                type="number"
                required
                placeholder="Nominal Rupiah..."
                value={formData.nominal || ''}
                onChange={e => setFormData({ ...formData, nominal: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
              />
              <input
                type="text"
                required
                placeholder="Uraian / Keterangan Transaksi..."
                value={formData.deskripsi}
                onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Pihak Terkait / Penyetor / Penerima..."
                value={formData.pihakTerkait}
                onChange={e => setFormData({ ...formData, pihakTerkait: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs cursor-pointer"
              >
                Simpan ke Buku Kas
              </button>
            </form>

            {/* Tabel Buku Kas + Filter Semua / Harian / Bulanan / Tahunan */}
            <div className="lg:col-span-8 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['semua', 'harian', 'bulanan', 'tahunan'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setFilterPeriode(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase cursor-pointer ${
                        filterPeriode === p
                          ? 'bg-[#d4af37] text-[#02120a]'
                          : 'bg-[#03160f] text-emerald-200 border border-emerald-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  {filterPeriode === 'harian' && (
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-[#03160f] border border-emerald-700 text-xs text-white"
                    />
                  )}
                  {filterPeriode === 'bulanan' && (
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-[#03160f] border border-emerald-700 text-xs text-white"
                    />
                  )}
                  {filterPeriode === 'tahunan' && (
                    <input
                      type="number"
                      value={selectedYear}
                      onChange={e => setSelectedYear(e.target.value)}
                      className="w-24 px-2.5 py-1 rounded-lg bg-[#03160f] border border-emerald-700 text-xs text-white"
                    />
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Cari transaksi / kategori..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#03160f]">
                      <th className="py-3 px-3">Kode & Tanggal</th>
                      <th className="py-3 px-3">Kategori & Uraian</th>
                      <th className="py-3 px-3">Nominal</th>
                      <th className="py-3 px-3">Diinput Oleh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/50">
                    {filteredTransaksi.map(t => (
                      <tr key={t.id} className="hover:bg-[#06281c]/50">
                        <td className="py-3 px-3 font-mono text-white">
                          {t.kodeTransaksi}
                          <span className="block text-[10px] text-emerald-400">{t.tanggal} · {t.waktu}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#d4af37]/15 text-[#f3d266]">
                            {t.kategori}
                          </span>
                          <p className="font-bold text-white mt-0.5">{t.deskripsi}</p>
                        </td>
                        <td className={`py-3 px-3 font-mono font-bold ${t.tipe === 'Pemasukan' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.tipe === 'Pemasukan' ? '+' : '-'}{formatRupiah(t.nominal)}
                        </td>
                        <td className="py-3 px-3 text-emerald-200 font-mono text-[11px]">
                          {t.pencatatNama}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ANGGARAN DAN REALISASINYA (SUPAYA TAHU POS MANA YANG HAMPIR HABIS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form onSubmit={handleSimpanAnggaran} className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-3 h-fit">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Tambah Alokasi Anggaran Pondok (RAPBP)
              </h2>
              <select
                value={anggaranForm.kategori}
                onChange={e => setAnggaranForm({ ...anggaranForm, kategori: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              >
                {KATEGORI_PENGELUARAN.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <input
                type="number"
                required
                placeholder="Pagu Anggaran (Rp)..."
                value={anggaranForm.nominalAnggaran || ''}
                onChange={e => setAnggaranForm({ ...anggaranForm, nominalAnggaran: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
              />
              <input
                type="text"
                placeholder="Keterangan peruntukan..."
                value={anggaranForm.keterangan}
                onChange={e => setAnggaranForm({ ...anggaranForm, keterangan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#d4af37] text-[#02120a] font-bold text-xs cursor-pointer"
              >
                Simpan Pos Anggaran
              </button>
            </form>

            <div className="lg:col-span-8 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Anggaran & Realisasinya (Indikator Pos yang Hampir Habis)
              </h2>
              <div className="space-y-3">
                {(systemConfig.anggaranList || []).map((ang) => {
                  const realisasi = transaksiKeuangan
                    .filter(t => t.tipe === 'Pengeluaran' && t.kategori === ang.kategori)
                    .reduce((a, b) => a + b.nominal, 0);
                  const persen = ang.nominalAnggaran > 0 ? Math.min(100, Math.round((realisasi / ang.nominalAnggaran) * 100)) : 0;
                  const hampirHabis = persen >= 80;
                  return (
                    <div key={ang.id} className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{ang.kategori} ({ang.divisi})</span>
                        <span className={`text-xs font-mono font-bold ${hampirHabis ? 'text-rose-400' : 'text-[#f3d266]'}`}>
                          {persen}% Terserap {hampirHabis ? '⚠️ HAMPIR HABIS' : ''}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] font-mono text-emerald-200">
                        <span>Pagu Anggaran: {formatRupiah(ang.nominalAnggaran)}</span>
                        <span>Realisasi: {formatRupiah(realisasi)}</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-emerald-950 overflow-hidden">
                        <div
                          className={`h-full ${hampirHabis ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-500 to-[#d4af37]'}`}
                          style={{ width: `${persen}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SYAHRIYAH (GRAFIK LINE CHART & PERBANDINGAN BULAN LALU, STATUS LUNAS/MENUNGGAK + PENGINGAT OTOMATIS, LOG TRANSPARANSI) */}
      {activeTab === 'syahriyah' && (
        <div className="space-y-6">
          {/* Grafik Statistik Line Chart Syahriyah & Perbandingan Bulan Lalu */}
          <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Grafik Statistik Line Chart Syahriyah & Perbandingan Bulan Lalu (%)
                </h2>
                <p className="text-xs text-emerald-200/75">
                  Persentase kolektibilitas pembayaran syahriyah santri Bulan Ini dibanding Bulan Lalu
                </p>
              </div>
              <div className="text-right">
                {(() => {
                  const list = systemConfig.syahriyahList || [];
                  const lunasCount = list.filter(s => s.status === 'Lunas').length;
                  const pctNow = list.length > 0 ? Math.round((lunasCount / list.length) * 100) : 88;
                  const pctLast = 82;
                  const diff = pctNow - pctLast;
                  return (
                    <>
                      <p className="text-xl font-black text-emerald-400 font-mono">{pctNow}% Lunas</p>
                      <p className="text-[10px] font-mono text-[#f3d266]">
                        {diff >= 0 ? `+${diff}%` : `${diff}%`} dibanding Bulan Lalu ({pctLast}%)
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={[
                    { pekan: 'Minggu 1 (Tgl 1-7)', bulanLalu: 45, bulanIni: 54 },
                    { pekan: 'Minggu 2 (Tgl 8-14)', bulanLalu: 68, bulanIni: 76 },
                    { pekan: 'Minggu 3 (Tgl 15-21)', bulanLalu: 77, bulanIni: 84 },
                    { pekan: 'Minggu 4 (Tgl 22-30)', bulanLalu: 82, bulanIni: 90 },
                  ]}
                  margin={{ top: 12, right: 18, left: -12, bottom: 4 }}
                >
                  <defs>
                    <filter id="glowSyahriyah" x="-25%" y="-25%" width="150%" height="150%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient id="syahriyahLineCurr" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="55%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#f3d266" />
                    </linearGradient>
                    <linearGradient id="syahriyahAreaCurr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="55%" stopColor="#10b981" stopOpacity={0.14} />
                      <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="syahriyahAreaPrev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4af37" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.35} />
                  <XAxis dataKey="pekan" stroke="#a7f3d0" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#a7f3d0" fontSize={11} unit="%" tickLine={false} />
                  <Tooltip
                    content={<LuxuryChartTooltip unit="%" subtitle="Kolektibilitas Pembayaran Syahriyah" />}
                    cursor={{ stroke: '#34d399', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Area
                    type="monotone"
                    dataKey="bulanLalu"
                    name="Kolektibilitas Bulan Lalu (%)"
                    fill="url(#syahriyahAreaPrev)"
                    stroke="none"
                    legendType="none"
                    isAnimationActive={true}
                    animationDuration={1400}
                  />
                  <Area
                    type="monotone"
                    dataKey="bulanIni"
                    name="Kolektibilitas Bulan Ini (%)"
                    fill="url(#syahriyahAreaCurr)"
                    stroke="none"
                    legendType="none"
                    isAnimationActive={true}
                    animationDuration={1600}
                  />
                  <Line
                    type="monotone"
                    dataKey="bulanLalu"
                    name="Kolektibilitas Bulan Lalu (%)"
                    stroke="#d4af37"
                    strokeWidth={2.2}
                    strokeDasharray="5 5"
                    dot={<GlowingDot color="#d4af37" accentColor="#f3d266" />}
                    activeDot={<GlowingActiveDot color="#d4af37" accentColor="#ffffff" />}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="bulanIni"
                    name="Kolektibilitas Bulan Ini (%)"
                    stroke="url(#syahriyahLineCurr)"
                    strokeWidth={3.5}
                    filter="url(#glowSyahriyah)"
                    dot={<GlowingDot color="#10b981" accentColor="#f3d266" />}
                    activeDot={<GlowingActiveDot color="#10b981" accentColor="#f3d266" />}
                    isAnimationActive={true}
                    animationDuration={1700}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabel Syahriyah per Santri */}
          <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Syahriyah per Santri (Status Lunas/Menunggak + Pengingat Otomatis)
                </h2>
                <p className="text-xs text-emerald-200/75">
                  Pelunasan syahriyah otomatis tercatat pada Buku Kas Pemasukan; tersedia tombol Pengingat Otomatis bagi wali santri yang menunggak
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                  Lunas: {(systemConfig.syahriyahList || []).filter(s => s.status === 'Lunas').length} Santri
                </span>
                <span className="px-3 py-1 rounded-xl bg-rose-950 text-rose-300 border border-rose-600/40">
                  Menunggak: {(systemConfig.syahriyahList || []).filter(s => s.status === 'Menunggak').length} Santri
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#03160f]">
                    <th className="py-3 px-3">Santri & NIS</th>
                    <th className="py-3 px-3">Periode & Nominal</th>
                    <th className="py-3 px-3">Wali Santri & WA</th>
                    <th className="py-3 px-3">Status Pembayaran</th>
                    <th className="py-3 px-3">Tindakan / Pengingat Otomatis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/50">
                  {(systemConfig.syahriyahList || []).map((syh) => (
                    <tr key={syh.id} className="hover:bg-[#06281c]/50">
                      <td className="py-3 px-3 font-bold text-white">
                        {syh.santriNama}
                        <span className="block text-[10px] font-mono text-emerald-400">NIS: {syh.santriNis} · {syh.kelas}</span>
                      </td>
                      <td className="py-3 px-3 font-mono text-white">
                        {syh.bulanTahun}
                        <span className="block text-[#f3d266] font-bold">{formatRupiah(syh.nominal)}</span>
                      </td>
                      <td className="py-3 px-3 text-emerald-100">
                        {syh.namaWali}
                        <span className="block text-[10px] font-mono text-emerald-400">{syh.noWaWali}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold ${
                          syh.status === 'Lunas'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {syh.status.toUpperCase()} {syh.tanggalBayar ? `(${syh.tanggalBayar})` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {syh.status === 'Menunggak' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleLunasiSyahriyah(syh)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                            >
                              Catat Lunas
                            </button>
                            <button
                              onClick={() => handleKirimPengingatSyahriyah(syh)}
                              className="px-3 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e5c158] text-[#02120a] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Bell className="w-3.5 h-3.5" /> Kirim Pengingat WA
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-emerald-400">✓ Terverifikasi Lunas</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Catatan Siapa yang Menginput atau Mengubah Data (Log Aktivitas) agar Transparan */}
          <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-[#f3d266]" />
              Catatan Siapa yang Menginput atau Mengubah Data (Log Aktivitas Transparansi)
            </h2>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {transaksiKeuangan.map((trx) => (
                <div key={trx.id} className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800/60 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-mono text-[#f3d266] font-bold">{trx.kodeTransaksi}</span> ·{' '}
                    <span className="font-bold text-white">{trx.deskripsi}</span>
                    <p className="text-[11px] text-emerald-300 mt-0.5">
                      Diinput oleh: <strong>{trx.pencatatNama}</strong> pada {trx.tanggal} ({trx.waktu}) · Metode: {trx.metodePembayaran}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">{formatRupiah(trx.nominal)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: UANG SAKU SANTRI (SALDO, SETORAN, PENARIKAN, RIWAYAT) */}
      {activeTab === 'uang_saku' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleSimpanUangSaku} className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-3 h-fit">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#f3d266]" />
              Input Setoran / Penarikan Uang Saku
            </h2>
            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Pilih Santri</label>
              <select
                value={uangSakuForm.santriId}
                onChange={e => setUangSakuForm({ ...uangSakuForm, santriId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              >
                {santriList.map(s => (
                  <option key={s.id} value={s.id}>{s.nama} ({s.nis})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={uangSakuForm.tipe}
                onChange={e => setUangSakuForm({ ...uangSakuForm, tipe: e.target.value as any })}
                className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-bold"
              >
                <option value="Setoran">Setoran (+)</option>
                <option value="Penarikan">Penarikan (-)</option>
              </select>
              <input
                type="number"
                required
                value={uangSakuForm.nominal}
                onChange={e => setUangSakuForm({ ...uangSakuForm, nominal: Number(e.target.value) })}
                className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
              />
            </div>
            <input
              type="text"
              placeholder="Keperluan / Keterangan..."
              value={uangSakuForm.keterangan}
              onChange={e => setUangSakuForm({ ...uangSakuForm, keterangan: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs cursor-pointer"
            >
              Simpan Transaksi Uang Saku
            </button>
          </form>

          <div className="lg:col-span-8 space-y-5">
            <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Rekapitulasi Saldo Uang Saku per Santri
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {saldoUangSakuPerSantri.map(({ santri, setoran, penarikan, saldo }) => (
                  <div key={santri.id} className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800/70 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{santri.nama}</p>
                      <p className="text-[10px] font-mono text-emerald-300">
                        Setor: {formatRupiah(setoran)} · Tarik: {formatRupiah(penarikan)}
                      </p>
                    </div>
                    <span className="text-sm font-black font-mono text-[#f3d266]">{formatRupiah(saldo)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Riwayat Mutasi Uang Saku */}
            <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl space-y-3">
              <h2 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider">
                Riwayat Setoran & Penarikan Uang Saku Santri ({(systemConfig.uangSakuList || []).length})
              </h2>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(systemConfig.uangSakuList || []).map((m) => (
                  <div key={m.id} className="p-3 rounded-xl bg-[#03160f] border border-emerald-800/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{m.santriNama} ({m.santriNis})</p>
                      <p className="text-[11px] text-emerald-200/80">{m.keterangan} · {m.tanggal} · Petugas: {m.petugas}</p>
                    </div>
                    <span className={`font-mono font-bold ${m.tipe === 'Setoran' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {m.tipe === 'Setoran' ? '+' : '-'}{formatRupiah(m.nominal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PENGAJUAN DANA SETIAP KEBUTUHAN YANG DIAJUKAN OLEH DIVISI PENGURUS */}
      {activeTab === 'pengajuan_dana' && (
        <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Daftar Pengajuan Dana & Pengadaan dari Seluruh Divisi Pengurus ({pengajuanDivisi.length})
          </h2>
          <div className="space-y-3">
            {pengajuanDivisi.map(pgj => (
              <div key={pgj.id} className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#d4af37]/20 text-[#f3d266]">
                      {pgj.divisi} · {pgj.nomorPengajuan}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300">Status Persetujuan Ketua Pondok: {pgj.status}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">{pgj.judul}</h3>
                  <p className="text-xs text-emerald-200/80">{pgj.deskripsi}</p>
                  {pgj.nominalEstimasi ? (
                    <p className="text-xs font-mono font-bold text-[#f3d266] mt-1">
                      Nominal Pengajuan: {formatRupiah(pgj.nominalEstimasi)}
                    </p>
                  ) : null}
                </div>
                {pgj.status === 'Disetujui' && (
                  <button
                    onClick={() => handleCairkanPengajuanDana(pgj)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer shrink-0"
                  >
                    Cairkan Dana & Catat Kas
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: KOTAK MASUK & PESAN DARI SELURUH PENGURUS */}
      {activeTab === 'kotak_masuk' && (
        <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#f3d266]" />
            Kotak Masuk Pemberitahuan & Permintaan dari Seluruh Pengurus ({koordinasiList.length})
          </h2>
          <div className="space-y-3">
            {koordinasiList.map((msg) => (
              <div key={msg.id} className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#f3d266] font-bold">
                    {msg.nomorTiket} · Dari: {msg.pengirimNama} ({msg.pengirimJabatan || msg.pengirimRole})
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300">{msg.waktu}</span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-white">{msg.judul}</h3>
                <p className="text-xs text-emerald-100/85 whitespace-pre-line">{msg.isi}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
