import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  Printer,
  Trash2,
  Search,
  CheckCircle2,
  Bell,
  MessageSquare,
  Coins,
  Scale,
  History,
  Sliders,
  Edit3,
  Save,
  X,
  UserCheck,
  RefreshCw,
  Receipt,
  Plus,
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
  Legend,
} from 'recharts';
import {
  GlowingDot,
  GlowingActiveDot,
  LuxuryChartTooltip,
} from './LuxuryChartComponents';
import { D3CandlestickChart } from './D3CandlestickChart';
import { DivisiKotakMasuk } from './DivisiKotakMasuk';
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
  AnggaranPondok,
  BendaharaConfig,
} from '../types';
import { storageService } from '../services/storageService';
import { openPrintWindow } from '../utils/printDocument';
import {
  computeFinanceAnalytics,
  resolveBendaharaConfig,
} from '../utils/financeCandlestick';

interface BendaharaPanelProps {
  currentUser: UserAccount;
  systemConfig: SystemConfig;
  transaksiKeuangan: TransaksiKeuangan[];
  santriList: Santri[];
  pengajuanDivisi: PengajuanDivisi[];
  koordinasiList: PesanKoordinasi[];
  logsList: LogAktivitas[];
  initialSubTab?:
    | 'kotak_masuk'
    | 'syahriyah'
    | 'uang_saku'
    | 'pengajuan_dana'
    | 'pemasukan_pengeluaran'
    | 'option_bendahara';
}

type BendaharaTabKey =
  | 'kotak_masuk'
  | 'syahriyah'
  | 'uang_saku'
  | 'pengajuan_dana'
  | 'pemasukan_pengeluaran'
  | 'option_bendahara';

type OptionSectionKey = 'umum' | 'transaksi' | 'anggaran' | 'syahriyah_uangsaku';

const PIE_COLORS = ['#10b981', '#d4af37', '#34d399', '#f59e0b', '#059669', '#fbbf24'];

const PERIODE_PRESETS = [
  'Oktober 2026',
  'November 2026',
  'Desember 2026',
  'Januari 2027',
  'Februari 2027',
];

function escapeHtml(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const BendaharaPanel: React.FC<BendaharaPanelProps> = ({
  currentUser,
  systemConfig,
  transaksiKeuangan,
  santriList,
  pengajuanDivisi,
  koordinasiList,
  initialSubTab,
}) => {
  const [activeTab, setActiveTab] = useState<BendaharaTabKey>(
    initialSubTab || 'pemasukan_pengeluaran'
  );

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  const bendaharaCfg = useMemo(
    () => resolveBendaharaConfig(systemConfig.bendaharaConfig),
    [systemConfig.bendaharaConfig]
  );

  const kategoriPemasukan = bendaharaCfg.kategoriPemasukan;
  const kategoriPengeluaran = bendaharaCfg.kategoriPengeluaran;

  // Active santri connected directly from Data Santri (Sekretaris)
  const activeSantriList = useMemo(
    () => santriList.filter((s) => s.status !== 'Alumni'),
    [santriList]
  );

  const [filterPeriode, setFilterPeriode] = useState<'semua' | 'harian' | 'bulanan' | 'tahunan'>('semua');
  const [filterTipe, setFilterTipe] = useState<'Semua' | TipeTransaksiKeuangan>('Semua');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4200);
  };

  // Form Buku Kas Baru
  const [formData, setFormData] = useState<Partial<TransaksiKeuangan>>({
    tanggal: new Date().toISOString().split('T')[0],
    tipe: 'Pemasukan',
    kategori: kategoriPemasukan[0] || 'Syahriah & Makan Santri',
    deskripsi: '',
    nominal: 0,
    metodePembayaran: 'Transfer Bank',
    pihakTerkait: '',
  });

  // =========================================================================
  // STATE TAB SYAHRIYAH (TERHUBUNG LANGSUNG DATA SANTRI + INPUT MANUAL BAYAR)
  // =========================================================================
  const syahriyahFormRef = useRef<HTMLFormElement | null>(null);
  const [periodeSyahriyahFilter, setPeriodeSyahriyahFilter] = useState<string>(
    bendaharaCfg.periodeSyahriyahAktif || 'November 2026'
  );
  const [syahriyahSearch, setSyahriyahSearch] = useState('');
  const [syahriyahStatusFilter, setSyahriyahStatusFilter] = useState<'Semua' | 'Lunas' | 'Menunggak'>('Semua');
  const [santriPickerQuery, setSantriPickerQuery] = useState('');

  const [manualBayarForm, setManualBayarForm] = useState({
    santriId: activeSantriList[0]?.id || '',
    bulanTahun: bendaharaCfg.periodeSyahriyahAktif || 'November 2026',
    nominal: bendaharaCfg.nominalDefaultSyahriyah || 650000,
    tanggalBayar: new Date().toISOString().split('T')[0],
    metodeBayar: 'Tunai' as 'Tunai' | 'Transfer Bank' | 'QRIS',
    penyetorNama: activeSantriList[0]?.namaWali || '',
    catatan: '',
    autoCatatBukuKas: true,
  });

  // Sync default santriId if empty when santriList loads
  useEffect(() => {
    if (!manualBayarForm.santriId && activeSantriList.length > 0) {
      const first = activeSantriList[0];
      setManualBayarForm((prev) => ({
        ...prev,
        santriId: first.id,
        penyetorNama: first.namaWali || '',
        nominal: bendaharaCfg.nominalDefaultSyahriyah || 650000,
      }));
    }
  }, [activeSantriList, manualBayarForm.santriId, bendaharaCfg.nominalDefaultSyahriyah]);

  // Filtered santri for dropdown picker in manual Syahriyah payment form
  const pickerSantriOptions = useMemo(() => {
    const q = santriPickerQuery.trim().toLowerCase();
    if (!q) return activeSantriList;
    return activeSantriList.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        s.nis.toLowerCase().includes(q) ||
        s.kelas.toLowerCase().includes(q) ||
        s.namaWali.toLowerCase().includes(q)
    );
  }, [activeSantriList, santriPickerQuery]);

  const selectedManualSantri = useMemo(
    () => activeSantriList.find((s) => s.id === manualBayarForm.santriId) || activeSantriList[0],
    [activeSantriList, manualBayarForm.santriId]
  );

  // Available periods in Syahriyah
  const availableSyahriyahPeriods = useMemo(() => {
    const set = new Set<string>(PERIODE_PRESETS);
    if (bendaharaCfg.periodeSyahriyahAktif) set.add(bendaharaCfg.periodeSyahriyahAktif);
    (systemConfig.syahriyahList || []).forEach((s) => {
      if (s.bulanTahun) set.add(s.bulanTahun);
    });
    return Array.from(set);
  }, [bendaharaCfg.periodeSyahriyahAktif, systemConfig.syahriyahList]);

  // Merged Syahriyah rows directly linked with Data Santri (Sekretaris)
  const mergedSyahriyahList = useMemo<SyahriyahSantri[]>(() => {
    const stored = systemConfig.syahriyahList || [];
    const periodStored = stored.filter((r) => r.bulanTahun === periodeSyahriyahFilter);
    const matchedStoredIds = new Set<string>();

    const fromActiveSantri: SyahriyahSantri[] = activeSantriList.map((s) => {
      const existing = periodStored.find(
        (r) => r.santriId === s.id || (r.santriNis && r.santriNis === s.nis)
      );
      if (existing) {
        matchedStoredIds.add(existing.id);
        return {
          ...existing,
          santriId: s.id,
          santriNama: s.nama,
          santriNis: s.nis,
          kelas: s.kelas,
          gender: s.gender,
          kamar: s.kamar,
          namaWali: s.namaWali,
          noWaWali: s.noWaWali,
        };
      }
      const slug = periodeSyahriyahFilter.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      return {
        id: `syh_${s.id}_${slug}`,
        santriId: s.id,
        santriNama: s.nama,
        santriNis: s.nis,
        kelas: s.kelas,
        gender: s.gender,
        kamar: s.kamar,
        bulanTahun: periodeSyahriyahFilter,
        nominal: bendaharaCfg.nominalDefaultSyahriyah,
        status: 'Menunggak',
        namaWali: s.namaWali,
        noWaWali: s.noWaWali,
      };
    });

    const extraRecords = periodStored.filter((r) => !matchedStoredIds.has(r.id));
    return [...fromActiveSantri, ...extraRecords];
  }, [
    activeSantriList,
    systemConfig.syahriyahList,
    periodeSyahriyahFilter,
    bendaharaCfg.nominalDefaultSyahriyah,
  ]);

  const filteredSyahriyahRows = useMemo(() => {
    return mergedSyahriyahList.filter((item) => {
      if (syahriyahStatusFilter !== 'Semua' && item.status !== syahriyahStatusFilter) return false;
      if (syahriyahSearch.trim()) {
        const q = syahriyahSearch.toLowerCase();
        return (
          item.santriNama.toLowerCase().includes(q) ||
          item.santriNis.toLowerCase().includes(q) ||
          item.kelas.toLowerCase().includes(q) ||
          item.namaWali.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [mergedSyahriyahList, syahriyahStatusFilter, syahriyahSearch]);

  const syahriyahStats = useMemo(() => {
    const total = mergedSyahriyahList.length;
    const lunasRows = mergedSyahriyahList.filter((s) => s.status === 'Lunas');
    const menunggakRows = mergedSyahriyahList.filter((s) => s.status === 'Menunggak');
    const pctNow = total > 0 ? Math.round((lunasRows.length / total) * 100) : 0;
    const pctLast = 82;
    const diff = pctNow - pctLast;
    const totalTerkumpul = lunasRows.reduce((acc, r) => acc + (Number(r.nominal) || 0), 0);
    const totalTunggakan = menunggakRows.reduce((acc, r) => acc + (Number(r.nominal) || 0), 0);

    const chartData = [
      { pekan: 'Minggu 1 (Tgl 1-7)', bulanLalu: 45, bulanIni: Math.max(35, Math.min(pctNow, Math.round(pctNow * 0.6))) },
      { pekan: 'Minggu 2 (Tgl 8-14)', bulanLalu: 68, bulanIni: Math.max(48, Math.min(pctNow, Math.round(pctNow * 0.82))) },
      { pekan: 'Minggu 3 (Tgl 15-21)', bulanLalu: 77, bulanIni: Math.max(55, Math.min(pctNow, Math.round(pctNow * 0.93))) },
      { pekan: 'Minggu 4 (Tgl 22-30)', bulanLalu: pctLast, bulanIni: pctNow },
    ];

    return {
      total,
      lunasCount: lunasRows.length,
      menunggakCount: menunggakRows.length,
      pctNow,
      pctLast,
      diff,
      totalTerkumpul,
      totalTunggakan,
      chartData,
    };
  }, [mergedSyahriyahList]);

  // =========================================================================
  // STATE UANG SAKU & ANGGARAN
  // =========================================================================
  const [uangSakuForm, setUangSakuForm] = useState({
    santriId: activeSantriList[0]?.id || 'san_001',
    tipe: 'Setoran' as 'Setoran' | 'Penarikan',
    nominal: 100000,
    keterangan: '',
  });

  const [anggaranForm, setAnggaranForm] = useState<Partial<AnggaranPondok>>({
    kategori: kategoriPengeluaran[0] || 'Konsumsi & Dapur Umum',
    divisi: 'Dapur & Konsumsi',
    periode: bendaharaCfg.periodeSyahriyahAktif || 'November 2026',
    nominalAnggaran: 5000000,
    keterangan: '',
  });

  // =========================================================================
  // STATE OPTION PANEL BENDAHARA (EDIT SEMUA FITUR TAB BENDAHARA SAJA)
  // =========================================================================
  const [optionSection, setOptionSection] = useState<OptionSectionKey>('umum');
  const [draftConfig, setDraftConfig] = useState<BendaharaConfig>(bendaharaCfg);
  const [newCatMasuk, setNewCatMasuk] = useState('');
  const [newCatKeluar, setNewCatKeluar] = useState('');

  useEffect(() => {
    setDraftConfig(bendaharaCfg);
  }, [bendaharaCfg]);

  // Manual CRUD Transaksi di Option Panel
  const [editingTrxId, setEditingTrxId] = useState<string | null>(null);
  const [optTrxForm, setOptTrxForm] = useState<Partial<TransaksiKeuangan>>({
    tanggal: new Date().toISOString().split('T')[0],
    waktu: '09:00 WIB',
    tipe: 'Pemasukan',
    kategori: kategoriPemasukan[0] || 'Syahriah & Makan Santri',
    deskripsi: '',
    nominal: 0,
    metodePembayaran: 'Transfer Bank',
    pihakTerkait: '',
    statusVerifikasi: 'Terverifikasi',
  });

  // Manual CRUD Anggaran di Option Panel
  const [editingAnggaranId, setEditingAnggaranId] = useState<string | null>(null);
  const [optAnggaranForm, setOptAnggaranForm] = useState<Partial<AnggaranPondok>>({
    kategori: kategoriPengeluaran[0] || 'Konsumsi & Dapur Umum',
    divisi: 'Dapur & Konsumsi',
    periode: bendaharaCfg.periodeSyahriyahAktif || 'November 2026',
    nominalAnggaran: 5000000,
    keterangan: '',
  });

  // Manual Edit Syahriyah record di Option Panel
  const [editingSyahriyahId, setEditingSyahriyahId] = useState<string | null>(null);
  const [optSyhDraft, setOptSyhDraft] = useState<{
    nominal: number;
    status: 'Lunas' | 'Menunggak';
    tanggalBayar: string;
    metodeBayar: 'Tunai' | 'Transfer Bank' | 'QRIS';
    catatan: string;
  }>({
    nominal: 650000,
    status: 'Menunggak',
    tanggalBayar: '',
    metodeBayar: 'Tunai',
    catatan: '',
  });

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  // Filtered Transaksi Buku Kas (Semua / Harian / Bulanan / Tahunan)
  const filteredTransaksi = useMemo(() => {
    return transaksiKeuangan.filter((t) => {
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

  // Real-time Analytics & D3 Candlestick Data connected to Bendahara
  const financeAnalytics = useMemo(() => {
    return computeFinanceAnalytics(transaksiKeuangan, systemConfig.bendaharaConfig);
  }, [transaksiKeuangan, systemConfig.bendaharaConfig]);

  // Statistik Filtered Buku Kas, Line Chart, Pie Chart & Kategori Keseluruhan Periode
  const financeCharts = useMemo(() => {
    const totalMasuk = filteredTransaksi
      .filter((t) => t.tipe === 'Pemasukan')
      .reduce((a, b) => a + b.nominal, 0);
    const totalKeluar = filteredTransaksi
      .filter((t) => t.tipe === 'Pengeluaran')
      .reduce((a, b) => a + b.nominal, 0);
    const saldoAwalRp = (Number(bendaharaCfg.saldoAwalJuta) || 0) * 1_000_000;
    const saldo = saldoAwalRp + totalMasuk - totalKeluar;

    const catMap: Record<string, number> = {};
    let grandTotal = 0;
    transaksiKeuangan.forEach((t) => {
      catMap[t.kategori] = (catMap[t.kategori] || 0) + t.nominal;
      grandTotal += t.nominal;
    });
    const pieData = Object.entries(catMap).map(([name, value]) => ({
      name,
      value,
      persen: grandTotal > 0 ? Math.round((value / grandTotal) * 100) : 0,
    }));

    const allCatMap: Record<string, { kategori: string; pemasukan: number; pengeluaran: number }> = {};
    transaksiKeuangan.forEach((t) => {
      if (!allCatMap[t.kategori]) {
        allCatMap[t.kategori] = { kategori: t.kategori, pemasukan: 0, pengeluaran: 0 };
      }
      if (t.tipe === 'Pemasukan') allCatMap[t.kategori].pemasukan += t.nominal;
      else allCatMap[t.kategori].pengeluaran += t.nominal;
    });

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
      pieData,
      categoryBarData: Object.values(allCatMap),
      lineData,
    };
  }, [filteredTransaksi, transaksiKeuangan, bendaharaCfg.saldoAwalJuta]);

  // =========================================================================
  // HANDLERS: BUKU KAS, SYAHRIYAH MANUAL, KWITANSI, UANG SAKU & OPTION PANEL
  // =========================================================================
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
      kategori: formData.kategori || kategoriPemasukan[0] || 'Pemasukan Lainnya',
      deskripsi: formData.deskripsi,
      nominal: Number(formData.nominal),
      metodePembayaran: (formData.metodePembayaran as TransaksiKeuangan['metodePembayaran']) || 'Tunai',
      pihakTerkait: formData.pihakTerkait || '-',
      pencatatNama: currentUser.nama,
      statusVerifikasi: 'Terverifikasi',
      createdAt: new Date().toISOString().split('T')[0],
    };
    storageService.saveTransaksiKeuangan(trx);
    showToast(`Transaksi ${trx.kodeTransaksi} berhasil dicatat & Candlestick diperbarui real-time!`);
    setFormData({ ...formData, deskripsi: '', nominal: 0, pihakTerkait: '' });
  };

  // Handler Input Pembayaran Manual Syahriyah oleh Bendahara saat Wali Santri membayar
  const handleSubmitManualSyahriyah = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSantri = activeSantriList.find((s) => s.id === manualBayarForm.santriId);
    if (!targetSantri) {
      showToast('Pilih santri dari Data Santri terlebih dahulu.');
      return;
    }
    const nominalVal = Number(manualBayarForm.nominal) || bendaharaCfg.nominalDefaultSyahriyah;
    const tanggalStr = manualBayarForm.tanggalBayar || new Date().toISOString().split('T')[0];
    const periodeStr = manualBayarForm.bulanTahun || periodeSyahriyahFilter;
    const nomorKwitansi = `KWT-SYH-${Date.now().toString().slice(-6)}`;
    const penyetor = manualBayarForm.penyetorNama.trim() || targetSantri.namaWali;

    const currentList = [...(storageService.getSystemConfig().syahriyahList || [])];
    const idx = currentList.findIndex(
      (r) =>
        (r.santriId === targetSantri.id || r.santriNis === targetSantri.nis) &&
        r.bulanTahun === periodeStr
    );

    const updatedRecord: SyahriyahSantri = {
      id:
        idx >= 0
          ? currentList[idx].id
          : `syh_${targetSantri.id}_${periodeStr.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      santriId: targetSantri.id,
      santriNama: targetSantri.nama,
      santriNis: targetSantri.nis,
      kelas: targetSantri.kelas,
      gender: targetSantri.gender,
      kamar: targetSantri.kamar,
      bulanTahun: periodeStr,
      nominal: nominalVal,
      status: 'Lunas',
      tanggalBayar: tanggalStr,
      metodeBayar: manualBayarForm.metodeBayar,
      namaWali: targetSantri.namaWali,
      noWaWali: targetSantri.noWaWali,
      penyetorNama: penyetor,
      catatan: manualBayarForm.catatan.trim() || 'Pembayaran manual diterima Bendahara',
      dicatatOleh: currentUser.nama,
      nomorKwitansi,
    };

    if (idx >= 0) currentList[idx] = updatedRecord;
    else currentList.unshift(updatedRecord);

    storageService.updateSystemConfig({ syahriyahList: currentList });
    setPeriodeSyahriyahFilter(periodeStr);

    if (manualBayarForm.autoCatatBukuKas) {
      storageService.saveTransaksiKeuangan({
        id: `trx_syh_${Date.now()}`,
        kodeTransaksi: `SYH-${Date.now().toString().slice(-5)}`,
        tanggal: tanggalStr,
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
        tipe: 'Pemasukan',
        kategori: kategoriPemasukan[0] || 'Syahriah & Makan Santri',
        deskripsi: `Pembayaran Syahriyah ${periodeStr} — ${targetSantri.nama} (${targetSantri.nis}) [${nomorKwitansi}]`,
        nominal: nominalVal,
        metodePembayaran: manualBayarForm.metodeBayar,
        pihakTerkait: `${penyetor} (Wali ${targetSantri.nama})`,
        pencatatNama: currentUser.nama,
        statusVerifikasi: 'Terverifikasi',
        createdAt: tanggalStr,
      });
    }

    storageService.addLog(
      'Pembayaran Syahriyah Manual',
      `${targetSantri.nama} (${targetSantri.nis}) periode ${periodeStr} sebesar ${formatRupiah(nominalVal)} via ${manualBayarForm.metodeBayar} oleh ${penyetor}`,
      'admin'
    );

    showToast(
      `Pembayaran Syahriyah ${targetSantri.nama} (${periodeStr}) LUNAS (${nomorKwitansi}) & tersinkronisasi!`
    );
    setManualBayarForm((prev) => ({
      ...prev,
      catatan: '',
    }));
  };

  // Pelunasan Cepat dari Baris Tabel
  const handleLunasiSyahriyah = (item: SyahriyahSantri) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nomorKwitansi = item.nomorKwitansi || `KWT-SYH-${Date.now().toString().slice(-6)}`;
    const currentList = [...(storageService.getSystemConfig().syahriyahList || [])];
    const idx = currentList.findIndex(
      (s) =>
        s.id === item.id ||
        ((s.santriId === item.santriId || s.santriNis === item.santriNis) &&
          s.bulanTahun === item.bulanTahun)
    );

    const lunasRecord: SyahriyahSantri = {
      ...item,
      status: 'Lunas',
      tanggalBayar: todayStr,
      metodeBayar: item.metodeBayar || 'Tunai',
      penyetorNama: item.penyetorNama || item.namaWali,
      dicatatOleh: currentUser.nama,
      nomorKwitansi,
    };

    if (idx >= 0) currentList[idx] = lunasRecord;
    else currentList.unshift(lunasRecord);

    storageService.updateSystemConfig({ syahriyahList: currentList });

    storageService.saveTransaksiKeuangan({
      id: `trx_syh_${Date.now()}`,
      kodeTransaksi: `SYH-${Date.now().toString().slice(-5)}`,
      tanggal: todayStr,
      waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      tipe: 'Pemasukan',
      kategori: kategoriPemasukan[0] || 'Syahriah & Makan Santri',
      deskripsi: `Pelunasan Syahriyah ${item.bulanTahun} Santri ${item.santriNama} (${item.santriNis})`,
      nominal: item.nominal,
      metodePembayaran: 'Tunai',
      pihakTerkait: item.namaWali,
      pencatatNama: currentUser.nama,
      statusVerifikasi: 'Terverifikasi',
      createdAt: todayStr,
    });

    showToast(`Syahriyah ${item.santriNama} LUNAS & otomatis tercatat pada Buku Kas Pemasukan!`);
  };

  // Prefill Manual Payment Form dari Baris Santri
  const handleSelectSantriForManualPay = (item: SyahriyahSantri) => {
    setManualBayarForm((prev) => ({
      ...prev,
      santriId: item.santriId,
      bulanTahun: item.bulanTahun,
      nominal: item.nominal || bendaharaCfg.nominalDefaultSyahriyah,
      penyetorNama: item.namaWali,
    }));
    syahriyahFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Cetak Kwitansi Resmi Syahriyah (A4 / Print Preview)
  const handleCetakKwitansiSyahriyah = (item: SyahriyahSantri) => {
    const noKwt = item.nomorKwitansi || `KWT-SYH-${item.santriNis}`;
    const html = `
      <div style="border: 2px solid #064e3b; padding: 24px; max-width: 720px; margin: 0 auto; font-family: 'Times New Roman', serif; color: #0f172a;">
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom: 3px double #064e3b; padding-bottom: 12px; margin-bottom: 16px;">
          <div style="display:flex; align-items:center; gap: 14px;">
            ${
              systemConfig.logoUrl
                ? `<img src="${escapeHtml(systemConfig.logoUrl)}" alt="Logo" style="width:62px; height:62px; object-fit:contain;" />`
                : ''
            }
            <div>
              <h2 style="margin:0; font-size:16px; font-weight:800; color:#064e3b; text-transform:uppercase;">${escapeHtml(systemConfig.namaPondok)}</h2>
              <p style="margin:2px 0 0; font-size:12px; font-weight:700; color:#334155;">${escapeHtml(bendaharaCfg.namaUnitKeuangan)}</p>
              <p style="margin:2px 0 0; font-size:11px; color:#475569;">${escapeHtml(bendaharaCfg.namaBankPondok)} · Rek: ${escapeHtml(bendaharaCfg.noRekeningPondok)}</p>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="background:#064e3b; color:#fff; padding:4px 10px; font-size:12px; font-weight:bold; border-radius:4px;">KWITANSI RESMI</div>
            <div style="font-size:11px; margin-top:4px; font-family:monospace;">No: ${escapeHtml(noKwt)}</div>
          </div>
        </div>

        <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:16px;">
          <tr><td style="padding:6px 4px; width:190px; font-weight:bold;">Telah Diterima Dari</td><td style="padding:6px 4px;">: ${escapeHtml(item.penyetorNama || item.namaWali)} (Wali Santri)</td></tr>
          <tr><td style="padding:6px 4px; font-weight:bold;">Nama Santri / NIS</td><td style="padding:6px 4px;">: <strong>${escapeHtml(item.santriNama)}</strong> (NIS: ${escapeHtml(item.santriNis)})</td></tr>
          <tr><td style="padding:6px 4px; font-weight:bold;">Kelas / Asrama</td><td style="padding:6px 4px;">: ${escapeHtml(item.kelas)}${item.kamar ? ' — ' + escapeHtml(item.kamar) : ''}</td></tr>
          <tr><td style="padding:6px 4px; font-weight:bold;">Untuk Pembayaran</td><td style="padding:6px 4px;">: Syahriyah &amp; Makan Santri Periode <strong>${escapeHtml(item.bulanTahun)}</strong></td></tr>
          <tr><td style="padding:6px 4px; font-weight:bold;">Tanggal &amp; Metode Bayar</td><td style="padding:6px 4px;">: ${escapeHtml(item.tanggalBayar || '-')} · ${escapeHtml(item.metodeBayar || 'Tunai')}</td></tr>
          <tr><td style="padding:6px 4px; font-weight:bold;">Catatan</td><td style="padding:6px 4px;">: ${escapeHtml(item.catatan || 'Lunas Terverifikasi')}</td></tr>
        </table>

        <div style="background:#ecfdf5; border:1.5px solid #059669; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; margin-bottom:22px;">
          <span style="font-size:13px; font-weight:bold; text-transform:uppercase; color:#065f46;">Jumlah Dibayarkan (LUNAS)</span>
          <span style="font-size:20px; font-weight:900; font-family:monospace; color:#064e3b;">${escapeHtml(formatRupiah(item.nominal))}</span>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:12px;">
          <div style="max-width:340px; color:#475569; font-style:italic;">
            ${escapeHtml(bendaharaCfg.catatanKwitansi)}
          </div>
          <div style="text-align:center; min-width:210px;">
            <p style="margin:0;">Penerima / ${escapeHtml(bendaharaCfg.jabatanBendahara)},</p>
            <div style="height:56px;"></div>
            <p style="margin:0; font-weight:bold; text-decoration:underline;">${escapeHtml(item.dicatatOleh || bendaharaCfg.namaBendaharaUmum)}</p>
          </div>
        </div>
      </div>
    `;
    openPrintWindow(`Kwitansi Syahriyah - ${item.santriNama}`, html, 14);
  };

  // Pengingat Otomatis Syahriyah Menunggak
  const handleKirimPengingatSyahriyah = (item: SyahriyahSantri) => {
    storageService.addNotification({
      judul: `Pengingat Syahriyah: ${item.santriNama}`,
      pesan: `Notifikasi pengingat syahriyah bulan ${item.bulanTahun} (${formatRupiah(item.nominal)}) telah dikirim ke Wali Santri ${item.namaWali} (${item.noWaWali}).`,
      tipe: 'warning',
      noWaTujuan: item.noWaWali,
    });
    showToast(`Pengingat otomatis WhatsApp & Notifikasi dikirim ke Wali ${item.namaWali} (${item.noWaWali})!`);
  };

  // Uang Saku Santri: Setoran & Penarikan
  const handleSimpanUangSaku = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSantri = santriList.find((s) => s.id === uangSakuForm.santriId);
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
    showToast(`${newMutasi.tipe} uang saku ${targetSantri.nama} sebesar ${formatRupiah(newMutasi.nominal)} berhasil dicatat!`);
    setUangSakuForm({ ...uangSakuForm, keterangan: '' });
  };

  const saldoUangSakuPerSantri = useMemo(() => {
    const list = systemConfig.uangSakuList || [];
    return activeSantriList.map((s) => {
      const mutasiSantri = list.filter((m) => m.santriId === s.id);
      const setoran = mutasiSantri.filter((m) => m.tipe === 'Setoran').reduce((a, b) => a + b.nominal, 0);
      const penarikan = mutasiSantri.filter((m) => m.tipe === 'Penarikan').reduce((a, b) => a + b.nominal, 0);
      return {
        santri: s,
        setoran,
        penarikan,
        saldo: setoran - penarikan,
      };
    });
  }, [activeSantriList, systemConfig.uangSakuList]);

  // Tambah Anggaran Pondok
  const handleSimpanAnggaran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!anggaranForm.nominalAnggaran) return;
    const item: AnggaranPondok = {
      id: `ang_${Date.now()}`,
      kategori: anggaranForm.kategori || kategoriPengeluaran[0] || 'Pengeluaran Lainnya',
      divisi: (anggaranForm.divisi as AnggaranPondok['divisi']) || 'Bendahara',
      periode: anggaranForm.periode || bendaharaCfg.periodeSyahriyahAktif || 'November 2026',
      nominalAnggaran: Number(anggaranForm.nominalAnggaran),
      keterangan: anggaranForm.keterangan || '-',
    };
    storageService.updateSystemConfig({
      anggaranList: [...(systemConfig.anggaranList || []), item],
    });
    showToast(`Pos anggaran "${item.kategori}" berhasil ditambahkan!`);
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
      kategori: kategoriPengeluaran[3] || 'Sarpras & Pemeliharaan',
      deskripsi: `Pencairan Pengajuan Divisi ${pgj.divisi}: ${pgj.judul} (${pgj.nomorPengajuan})`,
      nominal: pgj.nominalEstimasi || 1000000,
      metodePembayaran: 'Transfer Bank',
      pihakTerkait: `${pgj.pengajuNama} (${pgj.divisi})`,
      pencatatNama: currentUser.nama,
      statusVerifikasi: 'Terverifikasi',
      createdAt: todayStr,
    });
    showToast(`Dana untuk "${pgj.judul}" berhasil dicairkan & tercatat di Buku Kas Pengeluaran!`);
  };

  // =========================================================================
  // HANDLERS: OPTION PANEL BENDAHARA
  // =========================================================================
  const handleSaveBendaharaConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDarurat = Math.max(1, Number(draftConfig.ambangDaruratJuta) || 12);
    const cleanStabil = Math.max(cleanDarurat + 1, Number(draftConfig.ambangStabilJuta) || 22);
    const cleanGrow = Math.max(cleanStabil + 1, Number(draftConfig.ambangPerkembanganPesatJuta) || 32);

    const sanitized: BendaharaConfig = {
      ...draftConfig,
      nominalDefaultSyahriyah: Math.max(0, Number(draftConfig.nominalDefaultSyahriyah) || 650000),
      tanggalJatuhTempoSyahriyah: Math.min(28, Math.max(1, Number(draftConfig.tanggalJatuhTempoSyahriyah) || 10)),
      saldoAwalJuta: Number(draftConfig.saldoAwalJuta) || 0,
      ambangDaruratJuta: cleanDarurat,
      ambangStabilJuta: cleanStabil,
      ambangPerkembanganPesatJuta: cleanGrow,
      kategoriPemasukan: draftConfig.kategoriPemasukan.length
        ? draftConfig.kategoriPemasukan
        : bendaharaCfg.kategoriPemasukan,
      kategoriPengeluaran: draftConfig.kategoriPengeluaran.length
        ? draftConfig.kategoriPengeluaran
        : bendaharaCfg.kategoriPengeluaran,
    };

    storageService.updateSystemConfig({ bendaharaConfig: sanitized });
    showToast('Pengaturan Option Panel Bendahara & Ambang Candlestick berhasil disimpan!');
  };

  const handleOptionSaveTransaksi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!optTrxForm.deskripsi || !optTrxForm.nominal) return;
    const isEdit = Boolean(editingTrxId);
    const existing = isEdit
      ? transaksiKeuangan.find((t) => t.id === editingTrxId)
      : undefined;
    const prefix = optTrxForm.tipe === 'Pemasukan' ? 'KAS-IN' : 'KAS-OUT';

    const trx: TransaksiKeuangan = {
      id: existing ? existing.id : `trx_${Date.now()}`,
      kodeTransaksi: existing ? existing.kodeTransaksi : `${prefix}-${Date.now().toString().slice(-5)}`,
      tanggal: optTrxForm.tanggal || new Date().toISOString().split('T')[0],
      waktu:
        optTrxForm.waktu ||
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      tipe: (optTrxForm.tipe as TipeTransaksiKeuangan) || 'Pemasukan',
      kategori: optTrxForm.kategori || kategoriPemasukan[0] || 'Pemasukan Lainnya',
      deskripsi: optTrxForm.deskripsi,
      nominal: Number(optTrxForm.nominal),
      metodePembayaran:
        (optTrxForm.metodePembayaran as TransaksiKeuangan['metodePembayaran']) || 'Transfer Bank',
      pihakTerkait: optTrxForm.pihakTerkait || '-',
      pencatatNama: currentUser.nama,
      statusVerifikasi:
        (optTrxForm.statusVerifikasi as TransaksiKeuangan['statusVerifikasi']) || 'Terverifikasi',
      createdAt: existing?.createdAt || new Date().toISOString().split('T')[0],
    };

    storageService.saveTransaksiKeuangan(trx);
    setEditingTrxId(null);
    setOptTrxForm({
      tanggal: new Date().toISOString().split('T')[0],
      waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
      tipe: 'Pemasukan',
      kategori: kategoriPemasukan[0] || 'Syahriah & Makan Santri',
      deskripsi: '',
      nominal: 0,
      metodePembayaran: 'Transfer Bank',
      pihakTerkait: '',
      statusVerifikasi: 'Terverifikasi',
    });
    showToast(
      isEdit
        ? `Transaksi ${trx.kodeTransaksi} diperbarui & Candlestick real-time terupdate!`
        : `Transaksi baru ${trx.kodeTransaksi} ditambahkan!`
    );
  };

  const handleOptionDeleteTransaksi = (id: string, kode: string) => {
    storageService.deleteTransaksiKeuangan(id);
    if (editingTrxId === id) setEditingTrxId(null);
    showToast(`Transaksi ${kode} dihapus & Candlestick real-time diperbarui.`);
  };

  const handleOptionSaveAnggaran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!optAnggaranForm.nominalAnggaran) return;
    const current = [...(systemConfig.anggaranList || [])];
    if (editingAnggaranId) {
      const updated = current.map((a) =>
        a.id === editingAnggaranId
          ? {
              ...a,
              kategori: optAnggaranForm.kategori || a.kategori,
              divisi: (optAnggaranForm.divisi as AnggaranPondok['divisi']) || a.divisi,
              periode: optAnggaranForm.periode || a.periode,
              nominalAnggaran: Number(optAnggaranForm.nominalAnggaran),
              keterangan: optAnggaranForm.keterangan || '-',
            }
          : a
      );
      storageService.updateSystemConfig({ anggaranList: updated });
      setEditingAnggaranId(null);
      showToast('Pos anggaran RAPBP berhasil diperbarui!');
    } else {
      const item: AnggaranPondok = {
        id: `ang_${Date.now()}`,
        kategori: optAnggaranForm.kategori || kategoriPengeluaran[0] || 'Pengeluaran Lainnya',
        divisi: (optAnggaranForm.divisi as AnggaranPondok['divisi']) || 'Dapur & Konsumsi',
        periode: optAnggaranForm.periode || bendaharaCfg.periodeSyahriyahAktif || 'November 2026',
        nominalAnggaran: Number(optAnggaranForm.nominalAnggaran),
        keterangan: optAnggaranForm.keterangan || '-',
      };
      storageService.updateSystemConfig({ anggaranList: [...current, item] });
      showToast('Pos anggaran RAPBP baru ditambahkan!');
    }
    setOptAnggaranForm({
      kategori: kategoriPengeluaran[0] || 'Konsumsi & Dapur Umum',
      divisi: 'Dapur & Konsumsi',
      periode: bendaharaCfg.periodeSyahriyahAktif || 'November 2026',
      nominalAnggaran: 5000000,
      keterangan: '',
    });
  };

  const handleOptionDeleteAnggaran = (id: string) => {
    const updated = (systemConfig.anggaranList || []).filter((a) => a.id !== id);
    storageService.updateSystemConfig({ anggaranList: updated });
    showToast('Pos anggaran RAPBP dihapus.');
  };

  const handleSyncGenerateTagihanSyahriyah = () => {
    const periode = bendaharaCfg.periodeSyahriyahAktif || 'November 2026';
    const slug = periode.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const current = [...(systemConfig.syahriyahList || [])];
    let addedCount = 0;

    activeSantriList.forEach((s) => {
      const exists = current.some(
        (r) =>
          (r.santriId === s.id || (r.santriNis && r.santriNis === s.nis)) &&
          r.bulanTahun === periode
      );
      if (!exists) {
        current.push({
          id: `syh_${s.id}_${slug}`,
          santriId: s.id,
          santriNama: s.nama,
          santriNis: s.nis,
          kelas: s.kelas,
          gender: s.gender,
          kamar: s.kamar,
          bulanTahun: periode,
          nominal: bendaharaCfg.nominalDefaultSyahriyah,
          status: 'Menunggak',
          namaWali: s.namaWali,
          noWaWali: s.noWaWali,
        });
        addedCount++;
      }
    });

    storageService.updateSystemConfig({ syahriyahList: current });
    showToast(
      addedCount > 0
        ? `Berhasil menyinkronkan ${addedCount} tagihan Syahriyah baru dari Data Santri (${periode}).`
        : `Seluruh ${activeSantriList.length} santri aktif sudah tersinkron untuk periode ${periode}.`
    );
  };

  const handleOptionSaveSyahriyahRow = (item: SyahriyahSantri) => {
    const current = [...(systemConfig.syahriyahList || [])];
    const idx = current.findIndex(
      (r) =>
        r.id === item.id ||
        ((r.santriId === item.santriId || r.santriNis === item.santriNis) &&
          r.bulanTahun === item.bulanTahun)
    );

    const updatedItem: SyahriyahSantri = {
      ...item,
      nominal: Number(optSyhDraft.nominal) || bendaharaCfg.nominalDefaultSyahriyah,
      status: optSyhDraft.status,
      tanggalBayar:
        optSyhDraft.status === 'Lunas'
          ? optSyhDraft.tanggalBayar || new Date().toISOString().split('T')[0]
          : undefined,
      metodeBayar: optSyhDraft.status === 'Lunas' ? optSyhDraft.metodeBayar : undefined,
      catatan: optSyhDraft.catatan,
      dicatatOleh: currentUser.nama,
    };

    if (idx >= 0) current[idx] = updatedItem;
    else current.unshift(updatedItem);

    storageService.updateSystemConfig({ syahriyahList: current });
    setEditingSyahriyahId(null);
    showToast(`Tagihan Syahriyah ${item.santriNama} berhasil diperbarui!`);
  };

  const handleOptionDeleteUangSaku = (id: string) => {
    const updated = (systemConfig.uangSakuList || []).filter((m) => m.id !== id);
    storageService.updateSystemConfig({ uangSakuList: updated });
    showToast('Mutasi uang saku dihapus.');
  };

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER BENDAHARA */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-[#041d14]/95 border border-[#d4af37]/40 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f3d266]">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
              BENDAHARA &amp; MANAJEMEN KEUANGAN PUSAT
            </span>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-1">
              Sistem Keuangan, Syahriyah, Uang Saku, Anggaran &amp; Option Panel Bendahara
            </h1>
            <p className="text-xs text-emerald-200/75">
              Candlestick D3.js Real-Time · Syahriyah Terhubung Data Santri · Buku Kas Harian/Bulanan/Tahunan · Option Panel Bendahara
            </p>
          </div>
        </div>

        {/* Sub-Tab Navigasi Bendahara */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#02100a] p-1.5 rounded-2xl border border-emerald-800/70">
          {[
            { id: 'kotak_masuk', label: `Kotak Masuk (${koordinasiList.length})` },
            { id: 'syahriyah', label: 'Tab Syahriyah' },
            { id: 'uang_saku', label: 'Tab Uang Saku' },
            { id: 'pengajuan_dana', label: `Pengajuan Dana (${pengajuanDivisi.length})` },
            { id: 'pemasukan_pengeluaran', label: 'Pemasukan & Pengeluaran' },
            { id: 'option_bendahara', label: 'Option Panel Bendahara' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as BendaharaTabKey)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === t.id
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] shadow-md'
                  : 'text-emerald-200 hover:text-white hover:bg-[#06281c]'
              }`}
            >
              {t.id === 'option_bendahara' && <Sliders className="w-3.5 h-3.5" />}
              <span>{t.label}</span>
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

      {/* ===================================================================== */}
      {/* TAB 1: PEMASUKAN DAN PENGELUARAN                                      */}
      {/* ===================================================================== */}
      {activeTab === 'pemasukan_pengeluaran' && (
        <div className="space-y-6">
          {/* 3 Ringkasan Saldo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#041d14]/95 border border-emerald-500/35 shadow-lg">
              <p className="text-[10px] font-mono uppercase text-emerald-300">Total Pemasukan Kas</p>
              <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {formatRupiah(financeCharts.totalMasuk)}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#041d14]/95 border border-rose-500/35 shadow-lg">
              <p className="text-[10px] font-mono uppercase text-rose-300">Total Pengeluaran Kas</p>
              <p className="text-2xl font-black text-rose-400 font-mono mt-1">
                {formatRupiah(financeCharts.totalKeluar)}
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/45 shadow-lg">
              <p className="text-[10px] font-mono uppercase text-[#f3d266]">Saldo Akhir Kas Pondok</p>
              <p className="text-2xl font-black text-[#f3d266] font-mono mt-1">
                {formatRupiah(financeCharts.saldo)}
              </p>
            </div>
          </div>

          {/* D3.js Trader Candlestick Real-Time + Line Chart + Pie Chart */}
          <div className="rounded-3xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#f3d266]" />
                  Grafik Candlestick D3.js Kondisi Keuangan Pondok (Real-Time)
                </h2>
                <p className="text-[11px] text-emerald-200/75">
                  Terhubung langsung ke Dashboard Admin · Zona Darurat (≤ Rp {financeAnalytics.thresholds.darurat} Jt), Stabil (≥ Rp {financeAnalytics.thresholds.stabil} Jt), Grow (≥ Rp {financeAnalytics.thresholds.perkembanganPesat} Jt)
                </p>
              </div>
              <button
                onClick={() => setActiveTab('option_bendahara')}
                className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-[#03160f] hover:bg-[#072c1e] border border-[#d4af37]/45 text-[11px] font-mono font-bold text-[#f3d266] flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Atur Ambang &amp; Edit Manual di Option Panel</span>
              </button>
            </div>

            <D3CandlestickChart
              candlesBulanan={financeAnalytics.candlestickBulanan}
              candlesMingguan={financeAnalytics.candlestickMingguan}
              candlesHarian={financeAnalytics.candlestickHarian}
              thresholds={financeAnalytics.thresholds}
              height={300}
              compact={true}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Line Chart Arus Kas */}
            <div className="lg:col-span-6 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl">
              <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-1">
                Grafik Line Chart Tren Arus Kas
              </h2>
              <p className="text-[11px] text-emerald-200/70 mb-3">Tren Pemasukan vs Pengeluaran Mingguan</p>
              <div className="h-52 w-full">
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
            <div className="lg:col-span-6 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl">
              <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider mb-1">
                Pie Chart Proporsi Kategori &amp; Persentase (%)
              </h2>
              <p className="text-[11px] text-emerald-200/70 mb-2">Distribusi persentase transaksi per kategori</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={financeCharts.pieData} dataKey="value" nameKey="name" outerRadius={64} innerRadius={32}>
                        {financeCharts.pieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#02120a', borderColor: '#d4af37', borderRadius: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {financeCharts.pieData.map((p, idx) => (
                    <div key={p.name} className="flex items-center justify-between text-[11px] font-mono bg-[#03160f] px-2.5 py-1.5 rounded-lg border border-emerald-900/60">
                      <span className="text-emerald-100 truncate pr-2">{idx + 1}. {p.name}</span>
                      <span className="text-[#f3d266] font-bold shrink-0">{p.persen}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grafik Kategori Pemasukan & Pengeluaran */}
          <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
              Grafik Kategori Pemasukan &amp; Pengeluaran (Keseluruhan Periode)
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
                  onChange={(e) => {
                    const t = e.target.value as TipeTransaksiKeuangan;
                    setFormData({
                      ...formData,
                      tipe: t,
                      kategori:
                        t === 'Pemasukan'
                          ? kategoriPemasukan[0] || 'Pemasukan Lainnya'
                          : kategoriPengeluaran[0] || 'Pengeluaran Lainnya',
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
                  onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                  className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              >
                {(formData.tipe === 'Pemasukan' ? kategoriPemasukan : kategoriPengeluaran).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="number"
                  required
                  placeholder="Nominal Rupiah..."
                  value={formData.nominal || ''}
                  onChange={(e) => setFormData({ ...formData, nominal: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                />
                <select
                  value={formData.metodePembayaran}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      metodePembayaran: e.target.value as TransaksiKeuangan['metodePembayaran'],
                    })
                  }
                  className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                >
                  <option value="Tunai">Tunai</option>
                  <option value="Transfer Bank">Transfer Bank</option>
                  <option value="QRIS">QRIS</option>
                </select>
              </div>
              <input
                type="text"
                required
                placeholder="Uraian / Keterangan Transaksi..."
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Pihak Terkait / Penyetor / Penerima..."
                value={formData.pihakTerkait}
                onChange={(e) => setFormData({ ...formData, pihakTerkait: e.target.value })}
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
                  {(['semua', 'harian', 'bulanan', 'tahunan'] as const).map((p) => (
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
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-[#03160f] border border-emerald-700 text-xs text-white"
                    />
                  )}
                  {filterPeriode === 'bulanan' && (
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-[#03160f] border border-emerald-700 text-xs text-white"
                    />
                  )}
                  {filterPeriode === 'tahunan' && (
                    <input
                      type="number"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-24 px-2.5 py-1 rounded-lg bg-[#03160f] border border-emerald-700 text-xs text-white"
                    />
                  )}
                  <select
                    value={filterTipe}
                    onChange={(e) => setFilterTipe(e.target.value as 'Semua' | TipeTransaksiKeuangan)}
                    className="px-2.5 py-1.5 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-emerald-200 font-bold"
                  >
                    <option value="Semua">Semua Tipe</option>
                    <option value="Pemasukan">Pemasukan</option>
                    <option value="Pengeluaran">Pengeluaran</option>
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Cari transaksi / kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#03160f]">
                      <th className="py-3 px-3">Kode &amp; Tanggal</th>
                      <th className="py-3 px-3">Kategori &amp; Uraian</th>
                      <th className="py-3 px-3">Nominal</th>
                      <th className="py-3 px-3">Diinput Oleh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/50">
                    {filteredTransaksi.map((t) => (
                      <tr key={t.id} className="hover:bg-[#06281c]/50">
                        <td className="py-3 px-3 font-mono text-white">
                          {t.kodeTransaksi}
                          <span className="block text-[10px] text-emerald-400">
                            {t.tanggal} · {t.waktu}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#d4af37]/15 text-[#f3d266]">
                            {t.kategori}
                          </span>
                          <p className="font-bold text-white mt-0.5">{t.deskripsi}</p>
                        </td>
                        <td
                          className={`py-3 px-3 font-mono font-bold ${
                            t.tipe === 'Pemasukan' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {t.tipe === 'Pemasukan' ? '+' : '-'}
                          {formatRupiah(t.nominal)}
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

          {/* ANGGARAN DAN REALISASINYA */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form onSubmit={handleSimpanAnggaran} className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-3 h-fit">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Tambah Alokasi Anggaran Pondok (RAPBP)
              </h2>
              <select
                value={anggaranForm.kategori}
                onChange={(e) => setAnggaranForm({ ...anggaranForm, kategori: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              >
                {kategoriPengeluaran.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <input
                type="number"
                required
                placeholder="Pagu Anggaran (Rp)..."
                value={anggaranForm.nominalAnggaran || ''}
                onChange={(e) => setAnggaranForm({ ...anggaranForm, nominalAnggaran: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
              />
              <input
                type="text"
                placeholder="Keterangan peruntukan..."
                value={anggaranForm.keterangan}
                onChange={(e) => setAnggaranForm({ ...anggaranForm, keterangan: e.target.value })}
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
                Anggaran &amp; Realisasinya (Indikator Pos yang Hampir Habis)
              </h2>
              <div className="space-y-3">
                {(systemConfig.anggaranList || []).map((ang) => {
                  const realisasi = transaksiKeuangan
                    .filter((t) => t.tipe === 'Pengeluaran' && t.kategori === ang.kategori)
                    .reduce((a, b) => a + b.nominal, 0);
                  const persen =
                    ang.nominalAnggaran > 0
                      ? Math.min(100, Math.round((realisasi / ang.nominalAnggaran) * 100))
                      : 0;
                  const hampirHabis = persen >= 80;
                  return (
                    <div key={ang.id} className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          {ang.kategori} ({ang.divisi})
                        </span>
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

      {/* ===================================================================== */}
      {/* TAB 2: SYAHRIYAH (TERHUBUNG LANGSUNG DATA SANTRI + INPUT MANUAL)      */}
      {/* ===================================================================== */}
      {activeTab === 'syahriyah' && (
        <div className="space-y-6">
          {/* Grafik Statistik Line Chart Syahriyah & Perbandingan Bulan Lalu */}
          <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Grafik Statistik Line Chart Syahriyah &amp; Perbandingan Bulan Lalu (%)
                </h2>
                <p className="text-xs text-emerald-200/75">
                  Terkonfigurasi langsung dengan {activeSantriList.length} Santri Aktif dari Data Santri Sekretaris · Periode {periodeSyahriyahFilter}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-emerald-400 font-mono">
                  {syahriyahStats.pctNow}% Lunas ({syahriyahStats.lunasCount}/{syahriyahStats.total})
                </p>
                <p className="text-[10px] font-mono text-[#f3d266]">
                  {syahriyahStats.diff >= 0 ? `+${syahriyahStats.diff}%` : `${syahriyahStats.diff}%`} dibanding Bulan Lalu ({syahriyahStats.pctLast}%)
                </p>
              </div>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={syahriyahStats.chartData}
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

          {/* FORM INPUT MANUAL PEMBAYARAN SYAHRIYAH (SAAT WALI SANTRI BAYAR) */}
          <form
            ref={syahriyahFormRef}
            onSubmit={handleSubmitManualSyahriyah}
            className="rounded-3xl bg-gradient-to-br from-[#06291c] via-[#041d14] to-[#02120b] border-2 border-[#d4af37]/50 p-5 sm:p-6 shadow-2xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/60 pb-3">
              <div>
                <span className="px-2.5 py-0.5 rounded-md bg-[#d4af37]/20 border border-[#d4af37]/45 text-[10px] font-mono font-bold text-[#f3d266] uppercase">
                  LOKET PEMBAYARAN SYAHRIYAH SANTRI · REAL-TIME DATA SANTRI
                </span>
                <h2 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wide flex items-center gap-2 mt-1">
                  <Receipt className="w-4 h-4 text-[#f3d266]" />
                  Input Manual Pembayaran Syahriyah dari Wali Santri
                </h2>
                <p className="text-xs text-emerald-200/75">
                  Pilih santri langsung dari Data Santri Sekretaris, isi nominal &amp; metode bayar (Tunai/Transfer/QRIS), otomatis terverifikasi &amp; masuk ke Buku Kas Pondok.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-600/45 text-emerald-300">
                  Terkumpul: <strong>{formatRupiah(syahriyahStats.totalTerkumpul)}</strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-600/45 text-rose-300">
                  Tunggakan: <strong>{formatRupiah(syahriyahStats.totalTunggakan)}</strong>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Kolom Kiri: Pilih Santri + Preview Kartu Data Santri */}
              <div className="lg:col-span-5 space-y-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#f3d266] mb-1">
                    1. Cari &amp; Pilih Santri (Terhubung Data Santri Sekretaris)
                  </label>
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ketik nama santri / NIS / nama wali..."
                      value={santriPickerQuery}
                      onChange={(e) => setSantriPickerQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-xs text-white"
                    />
                  </div>
                  <select
                    value={manualBayarForm.santriId}
                    onChange={(e) => {
                      const nextSantri = activeSantriList.find((s) => s.id === e.target.value);
                      setManualBayarForm((prev) => ({
                        ...prev,
                        santriId: e.target.value,
                        penyetorNama: nextSantri?.namaWali || prev.penyetorNama,
                      }));
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#02100a] border border-[#d4af37]/45 text-xs text-white font-bold"
                  >
                    {pickerSantriOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} — NIS {s.nis} ({s.kelas})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedManualSantri && (
                  <div className="p-3.5 rounded-2xl bg-[#02100a]/90 border border-emerald-700/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                        {selectedManualSantri.nama}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] border border-emerald-700/40">
                        {selectedManualSantri.gender === 'putra' ? 'Putra (Banin)' : 'Putri (Banat)'}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-emerald-300">
                      NIS: {selectedManualSantri.nis} · {selectedManualSantri.kelas} · {selectedManualSantri.kamar}
                    </p>
                    <p className="text-[11px] text-emerald-100/85">
                      Wali Santri: <strong>{selectedManualSantri.namaWali}</strong> ({selectedManualSantri.noWaWali})
                    </p>
                  </div>
                )}
              </div>

              {/* Kolom Kanan: Rincian Pembayaran Manual */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    2. Periode Syahriyah (Bulan/Tahun)
                  </label>
                  <input
                    type="text"
                    required
                    list="syahriyah-periode-list"
                    value={manualBayarForm.bulanTahun}
                    onChange={(e) => setManualBayarForm({ ...manualBayarForm, bulanTahun: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-xs text-white font-bold"
                  />
                  <datalist id="syahriyah-periode-list">
                    {availableSyahriyahPeriods.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    3. Nominal Pembayaran (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={manualBayarForm.nominal}
                    onChange={(e) => setManualBayarForm({ ...manualBayarForm, nominal: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-xs text-[#f3d266] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    4. Tanggal Bayar
                  </label>
                  <input
                    type="date"
                    required
                    value={manualBayarForm.tanggalBayar}
                    onChange={(e) => setManualBayarForm({ ...manualBayarForm, tanggalBayar: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    5. Metode Pembayaran
                  </label>
                  <select
                    value={manualBayarForm.metodeBayar}
                    onChange={(e) =>
                      setManualBayarForm({
                        ...manualBayarForm,
                        metodeBayar: e.target.value as 'Tunai' | 'Transfer Bank' | 'QRIS',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-xs text-white font-bold"
                  >
                    <option value="Tunai">Tunai (Loket Bendahara)</option>
                    <option value="Transfer Bank">Transfer Bank ({bendaharaCfg.namaBankPondok})</option>
                    <option value="QRIS">QRIS Pondok</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    6. Nama Penyetor / Wali Santri
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Wali / Pengantar..."
                    value={manualBayarForm.penyetorNama}
                    onChange={(e) => setManualBayarForm({ ...manualBayarForm, penyetorNama: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    7. Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Lunas via transfer / dititipkan..."
                    value={manualBayarForm.catatan}
                    onChange={(e) => setManualBayarForm({ ...manualBayarForm, catatan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-xs text-white"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <label className="flex items-center gap-2 text-xs text-emerald-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualBayarForm.autoCatatBukuKas}
                      onChange={(e) =>
                        setManualBayarForm({ ...manualBayarForm, autoCatatBukuKas: e.target.checked })
                      }
                      className="accent-[#d4af37] w-4 h-4"
                    />
                    <span>Otomatis catat ke Buku Kas Pemasukan &amp; perbarui Candlestick D3.js</span>
                  </label>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-lg shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Simpan Pembayaran Manual (LUNAS)</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Tabel Syahriyah per Santri (Tersambung Langsung dengan Data Santri) */}
          <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Daftar Syahriyah Seluruh Santri Aktif (Sinkron Data Santri Sekretaris)
                </h2>
                <p className="text-xs text-emerald-200/75">
                  Menampilkan {filteredSyahriyahRows.length} dari {mergedSyahriyahList.length} santri aktif pada periode {periodeSyahriyahFilter}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <select
                  value={periodeSyahriyahFilter}
                  onChange={(e) => setPeriodeSyahriyahFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#03160f] border border-[#d4af37]/45 text-[#f3d266] font-bold"
                >
                  {availableSyahriyahPeriods.map((p) => (
                    <option key={p} value={p}>
                      Periode: {p}
                    </option>
                  ))}
                </select>
                <select
                  value={syahriyahStatusFilter}
                  onChange={(e) => setSyahriyahStatusFilter(e.target.value as 'Semua' | 'Lunas' | 'Menunggak')}
                  className="px-3 py-1.5 rounded-xl bg-[#03160f] border border-emerald-800 text-emerald-200 font-bold"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Lunas">Lunas ({syahriyahStats.lunasCount})</option>
                  <option value="Menunggak">Menunggak ({syahriyahStats.menunggakCount})</option>
                </select>
                <input
                  type="text"
                  placeholder="Cari nama/NIS/wali..."
                  value={syahriyahSearch}
                  onChange={(e) => setSyahriyahSearch(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#03160f]">
                    <th className="py-3 px-3">Santri &amp; NIS</th>
                    <th className="py-3 px-3">Periode &amp; Nominal</th>
                    <th className="py-3 px-3">Wali Santri &amp; WA</th>
                    <th className="py-3 px-3">Status Pembayaran</th>
                    <th className="py-3 px-3">Tindakan Bendahara</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-900/50">
                  {filteredSyahriyahRows.map((syh) => (
                    <tr key={syh.id} className="hover:bg-[#06281c]/50">
                      <td className="py-3 px-3 font-bold text-white">
                        {syh.santriNama}
                        <span className="block text-[10px] font-mono text-emerald-400">
                          NIS: {syh.santriNis} · {syh.kelas}
                          {syh.kamar ? ` · ${syh.kamar}` : ''}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-white">
                        {syh.bulanTahun}
                        <span className="block text-[#f3d266] font-bold">{formatRupiah(syh.nominal)}</span>
                      </td>
                      <td className="py-3 px-3 text-emerald-100">
                        {syh.penyetorNama || syh.namaWali}
                        <span className="block text-[10px] font-mono text-emerald-400">{syh.noWaWali}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold inline-block ${
                            syh.status === 'Lunas'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {syh.status.toUpperCase()} {syh.tanggalBayar ? `(${syh.tanggalBayar})` : ''}
                        </span>
                        {syh.status === 'Lunas' && (
                          <span className="block text-[10px] font-mono text-emerald-300/80 mt-0.5">
                            {syh.metodeBayar || 'Tunai'} {syh.nomorKwitansi ? `· ${syh.nomorKwitansi}` : ''}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {syh.status === 'Menunggak' ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              onClick={() => handleSelectSantriForManualPay(syh)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#062f20] hover:bg-[#09422d] border border-[#d4af37]/50 text-[#f3d266] text-[11px] font-bold cursor-pointer"
                            >
                              Input Bayar
                            </button>
                            <button
                              onClick={() => handleLunasiSyahriyah(syh)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                            >
                              Lunas Cepat
                            </button>
                            <button
                              onClick={() => handleKirimPengingatSyahriyah(syh)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e5c158] text-[#02120a] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Bell className="w-3.5 h-3.5" /> Pengingat WA
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-mono text-emerald-400">✓ Terverifikasi</span>
                            <button
                              onClick={() => handleCetakKwitansiSyahriyah(syh)}
                              className="px-2.5 py-1 rounded-xl bg-[#03160f] hover:bg-[#072c1e] border border-[#d4af37]/45 text-[#f3d266] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Printer className="w-3 h-3" /> Cetak Kwitansi
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Catatan Log Aktivitas Transparansi */}
          <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-[#f3d266]" />
              Catatan Siapa yang Menginput atau Mengubah Data (Log Aktivitas Transparansi)
            </h2>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {transaksiKeuangan.map((trx) => (
                <div
                  key={trx.id}
                  className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-mono text-[#f3d266] font-bold">{trx.kodeTransaksi}</span> ·{' '}
                    <span className="font-bold text-white">{trx.deskripsi}</span>
                    <p className="text-[11px] text-emerald-300 mt-0.5">
                      Diinput oleh: <strong>{trx.pencatatNama}</strong> pada {trx.tanggal} ({trx.waktu}) · Metode: {trx.metodePembayaran}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-bold ${
                      trx.tipe === 'Pemasukan' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {trx.tipe === 'Pemasukan' ? '+' : '-'}
                    {formatRupiah(trx.nominal)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: UANG SAKU SANTRI                                               */}
      {/* ===================================================================== */}
      {activeTab === 'uang_saku' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSimpanUangSaku}
            className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-3 h-fit"
          >
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#f3d266]" />
              Input Setoran / Penarikan Uang Saku
            </h2>
            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                Pilih Santri (Data Santri Sekretaris)
              </label>
              <select
                value={uangSakuForm.santriId}
                onChange={(e) => setUangSakuForm({ ...uangSakuForm, santriId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              >
                {activeSantriList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.nis})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <select
                value={uangSakuForm.tipe}
                onChange={(e) => setUangSakuForm({ ...uangSakuForm, tipe: e.target.value as 'Setoran' | 'Penarikan' })}
                className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-bold"
              >
                <option value="Setoran">Setoran (+)</option>
                <option value="Penarikan">Penarikan (-)</option>
              </select>
              <input
                type="number"
                required
                value={uangSakuForm.nominal}
                onChange={(e) => setUangSakuForm({ ...uangSakuForm, nominal: Number(e.target.value) })}
                className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
              />
            </div>
            <input
              type="text"
              placeholder="Keperluan / Keterangan..."
              value={uangSakuForm.keterangan}
              onChange={(e) => setUangSakuForm({ ...uangSakuForm, keterangan: e.target.value })}
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
                  <div
                    key={santri.id}
                    className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800/70 flex items-center justify-between"
                  >
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

            <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl space-y-3">
              <h2 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider">
                Riwayat Setoran &amp; Penarikan Uang Saku Santri ({(systemConfig.uangSakuList || []).length})
              </h2>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {(systemConfig.uangSakuList || []).map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-[#03160f] border border-emerald-800/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">
                        {m.santriNama} ({m.santriNis})
                      </p>
                      <p className="text-[11px] text-emerald-200/80">
                        {m.keterangan} · {m.tanggal} · Petugas: {m.petugas}
                      </p>
                    </div>
                    <span className={`font-mono font-bold ${m.tipe === 'Setoran' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {m.tipe === 'Setoran' ? '+' : '-'}
                      {formatRupiah(m.nominal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: PENGAJUAN DANA DIVISI                                          */}
      {/* ===================================================================== */}
      {activeTab === 'pengajuan_dana' && (
        <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Daftar Pengajuan Dana &amp; Pengadaan dari Seluruh Divisi Pengurus ({pengajuanDivisi.length})
          </h2>
          <div className="space-y-3">
            {pengajuanDivisi.map((pgj) => (
              <div
                key={pgj.id}
                className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#d4af37]/20 text-[#f3d266]">
                      {pgj.divisi} · {pgj.nomorPengajuan}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300">
                      Status Persetujuan Ketua Pondok: {pgj.status}
                    </span>
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
                    Cairkan Dana &amp; Catat Kas
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: KOTAK MASUK & PESAN                                            */}
      {/* ===================================================================== */}
      {activeTab === 'kotak_masuk' && (
        <DivisiKotakMasuk
          currentUser={currentUser}
          koordinasiList={koordinasiList}
          viewerDivision="Bendahara"
        />
      )}

      {/* ===================================================================== */}
      {/* TAB 6: OPTION PANEL BENDAHARA (KHUSUS MENGEDIT FITUR TAB BENDAHARA)   */}
      {/* ===================================================================== */}
      {activeTab === 'option_bendahara' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-gradient-to-r from-[#072b1d] via-[#041d14] to-[#03150e] border border-[#d4af37]/50 p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded bg-[#d4af37]/20 border border-[#d4af37]/45 text-[10px] font-mono font-bold text-[#f3d266] uppercase">
                OPTION PANEL KHUSUS BENDAHARA
              </span>
              <h2 className="text-base sm:text-lg font-extrabold text-white mt-1 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#f3d266]" />
                <span>Pengaturan &amp; Editor Manual Seluruh Fitur Bendahara</span>
              </h2>
              <p className="text-xs text-emerald-200/75 mt-0.5">
                Khusus mengelola data tab Bendahara: Pemasukan &amp; Pengeluaran manual, Ambang Pita Candlestick D3.js, Tarif Syahriyah, Kategori Kas, RAPBP &amp; Uang Saku.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 bg-[#02100a] p-1.5 rounded-2xl border border-emerald-800/70">
              {[
                { id: 'umum', label: '1. Ambang Candlestick, Tarif & Kategori' },
                { id: 'transaksi', label: '2. Edit Pemasukan & Pengeluaran Manual' },
                { id: 'anggaran', label: '3. Edit Anggaran (RAPBP)' },
                { id: 'syahriyah_uangsaku', label: '4. Edit Syahriyah & Uang Saku' },
              ].map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setOptionSection(sec.id as OptionSectionKey)}
                  className={`px-3 py-2 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                    optionSection === sec.id
                      ? 'bg-[#d4af37] text-[#02120a]'
                      : 'text-emerald-200 hover:text-white hover:bg-[#06281c]'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 1: PENGATURAN UMUM, TARIF SYAHRIYAH, AMBANG CANDLESTICK & KATEGORI */}
          {optionSection === 'umum' && (
            <form onSubmit={handleSaveBendaharaConfig} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl space-y-4">
                <h3 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider">
                  Ambang Batas Candlestick D3.js &amp; Parameter Syahriyah
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                      Saldo Awal Kas Pondok (Juta Rp)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={draftConfig.saldoAwalJuta}
                      onChange={(e) => setDraftConfig({ ...draftConfig, saldoAwalJuta: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                      Tarif Default Syahriyah (Rp/Bln)
                    </label>
                    <input
                      type="number"
                      step="5000"
                      value={draftConfig.nominalDefaultSyahriyah}
                      onChange={(e) =>
                        setDraftConfig({ ...draftConfig, nominalDefaultSyahriyah: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-[#f3d266] font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                      Periode Syahriyah Aktif
                    </label>
                    <input
                      type="text"
                      value={draftConfig.periodeSyahriyahAktif}
                      onChange={(e) => setDraftConfig({ ...draftConfig, periodeSyahriyahAktif: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                      Tanggal Jatuh Tempo (1-28)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={draftConfig.tanggalJatuhTempoSyahriyah}
                      onChange={(e) =>
                        setDraftConfig({ ...draftConfig, tanggalJatuhTempoSyahriyah: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-800/60 space-y-3">
                  <p className="text-[11px] font-mono text-emerald-200 font-bold uppercase">
                    Ambang Pita Tren Candlestick D3.js (Dalam Juta Rp)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-rose-300 mb-1">
                        Pita Darurat (≤ Jt)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={draftConfig.ambangDaruratJuta}
                        onChange={(e) =>
                          setDraftConfig({ ...draftConfig, ambangDaruratJuta: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-rose-950/30 border border-rose-500/50 text-xs text-rose-200 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-[#f3d266] mb-1">
                        Pita Stabil (≥ Jt)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={draftConfig.ambangStabilJuta}
                        onChange={(e) =>
                          setDraftConfig({ ...draftConfig, ambangStabilJuta: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-amber-950/30 border border-[#d4af37]/50 text-xs text-[#f3d266] font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-emerald-300 mb-1">
                        Pita Grow / Pesat (≥ Jt)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={draftConfig.ambangPerkembanganPesatJuta}
                        onChange={(e) =>
                          setDraftConfig({
                            ...draftConfig,
                            ambangPerkembanganPesatJuta: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-xs text-emerald-200 font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-800/60 space-y-2.5">
                  <p className="text-[11px] font-mono text-emerald-200 font-bold uppercase">
                    Identitas Kwitansi &amp; Rekening Resmi Pondok
                  </p>
                  <input
                    type="text"
                    placeholder="Nama Unit Keuangan"
                    value={draftConfig.namaUnitKeuangan}
                    onChange={(e) => setDraftConfig({ ...draftConfig, namaUnitKeuangan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="Nama Bendahara Umum"
                      value={draftConfig.namaBendaharaUmum}
                      onChange={(e) => setDraftConfig({ ...draftConfig, namaBendaharaUmum: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Jabatan Penandatangan"
                      value={draftConfig.jabatanBendahara}
                      onChange={(e) => setDraftConfig({ ...draftConfig, jabatanBendahara: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="Nama Bank"
                      value={draftConfig.namaBankPondok}
                      onChange={(e) => setDraftConfig({ ...draftConfig, namaBankPondok: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="No. Rekening Pondok"
                      value={draftConfig.noRekeningPondok}
                      onChange={(e) => setDraftConfig({ ...draftConfig, noRekeningPondok: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Catatan kaki kwitansi..."
                    value={draftConfig.catatanKwitansi}
                    onChange={(e) => setDraftConfig({ ...draftConfig, catatanKwitansi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>
              </div>

              {/* Kelola Kategori Pemasukan & Pengeluaran */}
              <div className="lg:col-span-6 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-5 flex flex-col justify-between">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider mb-2">
                      Daftar Kategori Pemasukan Kas
                    </h3>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Tambah kategori pemasukan baru..."
                        value={newCatMasuk}
                        onChange={(e) => setNewCatMasuk(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = newCatMasuk.trim();
                          if (!val || draftConfig.kategoriPemasukan.includes(val)) return;
                          setDraftConfig({
                            ...draftConfig,
                            kategoriPemasukan: [...draftConfig.kategoriPemasukan, val],
                          });
                          setNewCatMasuk('');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {draftConfig.kategoriPemasukan.map((k) => (
                        <div
                          key={k}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800/60 text-xs text-white"
                        >
                          <span>{k}</span>
                          {draftConfig.kategoriPemasukan.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setDraftConfig({
                                  ...draftConfig,
                                  kategoriPemasukan: draftConfig.kategoriPemasukan.filter((x) => x !== k),
                                })
                              }
                              className="text-rose-400 hover:text-rose-300 cursor-pointer"
                              title="Hapus kategori"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-emerald-800/60">
                    <h3 className="text-sm font-bold text-rose-300 uppercase tracking-wider mb-2">
                      Daftar Kategori Pengeluaran Kas
                    </h3>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Tambah kategori pengeluaran baru..."
                        value={newCatKeluar}
                        onChange={(e) => setNewCatKeluar(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = newCatKeluar.trim();
                          if (!val || draftConfig.kategoriPengeluaran.includes(val)) return;
                          setDraftConfig({
                            ...draftConfig,
                            kategoriPengeluaran: [...draftConfig.kategoriPengeluaran, val],
                          });
                          setNewCatKeluar('');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {draftConfig.kategoriPengeluaran.map((k) => (
                        <div
                          key={k}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800/60 text-xs text-white"
                        >
                          <span>{k}</span>
                          {draftConfig.kategoriPengeluaran.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setDraftConfig({
                                  ...draftConfig,
                                  kategoriPengeluaran: draftConfig.kategoriPengeluaran.filter((x) => x !== k),
                                })
                              }
                              className="text-rose-400 hover:text-rose-300 cursor-pointer"
                              title="Hapus kategori"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Pengaturan Option Panel Bendahara</span>
                </button>
              </div>
            </form>
          )}

          {/* SECTION 2: EDIT / TAMBAH / HAPUS PEMASUKAN & PENGELUARAN MANUAL */}
          {optionSection === 'transaksi' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleOptionSaveTransaksi}
                className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/45 p-5 shadow-xl space-y-3 h-fit"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider">
                    {editingTrxId ? 'Edit Transaksi Kas' : 'Tambah Transaksi Manual'}
                  </h3>
                  {editingTrxId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTrxId(null);
                        setOptTrxForm({
                          tanggal: new Date().toISOString().split('T')[0],
                          waktu: '09:00 WIB',
                          tipe: 'Pemasukan',
                          kategori: kategoriPemasukan[0] || 'Syahriah & Makan Santri',
                          deskripsi: '',
                          nominal: 0,
                          metodePembayaran: 'Transfer Bank',
                          pihakTerkait: '',
                          statusVerifikasi: 'Terverifikasi',
                        });
                      }}
                      className="text-[11px] font-mono text-rose-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Batal Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <select
                    value={optTrxForm.tipe}
                    onChange={(e) => {
                      const t = e.target.value as TipeTransaksiKeuangan;
                      setOptTrxForm({
                        ...optTrxForm,
                        tipe: t,
                        kategori:
                          t === 'Pemasukan'
                            ? kategoriPemasukan[0] || 'Pemasukan Lainnya'
                            : kategoriPengeluaran[0] || 'Pengeluaran Lainnya',
                      });
                    }}
                    className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-bold"
                  >
                    <option value="Pemasukan">Pemasukan (+)</option>
                    <option value="Pengeluaran">Pengeluaran (-)</option>
                  </select>
                  <input
                    type="date"
                    required
                    value={optTrxForm.tanggal}
                    onChange={(e) => setOptTrxForm({ ...optTrxForm, tanggal: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                </div>

                <select
                  value={optTrxForm.kategori}
                  onChange={(e) => setOptTrxForm({ ...optTrxForm, kategori: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                >
                  {(optTrxForm.tipe === 'Pemasukan' ? kategoriPemasukan : kategoriPengeluaran).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="number"
                    required
                    placeholder="Nominal (Rp)"
                    value={optTrxForm.nominal || ''}
                    onChange={(e) => setOptTrxForm({ ...optTrxForm, nominal: Number(e.target.value) })}
                    className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-[#f3d266] font-mono font-bold"
                  />
                  <select
                    value={optTrxForm.metodePembayaran}
                    onChange={(e) =>
                      setOptTrxForm({
                        ...optTrxForm,
                        metodePembayaran: e.target.value as TransaksiKeuangan['metodePembayaran'],
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  >
                    <option value="Tunai">Tunai</option>
                    <option value="Transfer Bank">Transfer Bank</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>

                <input
                  type="text"
                  required
                  placeholder="Uraian / Deskripsi Transaksi..."
                  value={optTrxForm.deskripsi}
                  onChange={(e) => setOptTrxForm({ ...optTrxForm, deskripsi: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />

                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Pihak Terkait..."
                    value={optTrxForm.pihakTerkait}
                    onChange={(e) => setOptTrxForm({ ...optTrxForm, pihakTerkait: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Waktu (09:00 WIB)"
                    value={optTrxForm.waktu}
                    onChange={(e) => setOptTrxForm({ ...optTrxForm, waktu: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-black text-xs uppercase cursor-pointer"
                >
                  {editingTrxId ? 'Simpan Perubahan Transaksi' : 'Tambah Transaksi ke Buku Kas'}
                </button>
              </form>

              <div className="lg:col-span-8 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Kelola Seluruh Data Pemasukan &amp; Pengeluaran ({transaksiKeuangan.length})
                  </h3>
                  <span className="text-[11px] font-mono text-emerald-300">
                    Perubahan langsung memperbarui Grafik Candlestick D3.js
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#03160f] sticky top-0">
                        <th className="py-2.5 px-3">Kode &amp; Tanggal</th>
                        <th className="py-2.5 px-3">Kategori &amp; Deskripsi</th>
                        <th className="py-2.5 px-3">Nominal</th>
                        <th className="py-2.5 px-3 text-right">Aksi Manual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-900/50">
                      {transaksiKeuangan.map((t) => (
                        <tr key={t.id} className="hover:bg-[#06281c]/50">
                          <td className="py-2.5 px-3 font-mono text-white">
                            {t.kodeTransaksi}
                            <span className="block text-[10px] text-emerald-400">
                              {t.tanggal} · {t.waktu}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#d4af37]/15 text-[#f3d266]">
                              {t.kategori}
                            </span>
                            <p className="font-bold text-white mt-0.5">{t.deskripsi}</p>
                            <span className="text-[10px] text-emerald-300/75">
                              {t.metodePembayaran} · {t.pihakTerkait}
                            </span>
                          </td>
                          <td
                            className={`py-2.5 px-3 font-mono font-bold ${
                              t.tipe === 'Pemasukan' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {t.tipe === 'Pemasukan' ? '+' : '-'}
                            {formatRupiah(t.nominal)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingTrxId(t.id);
                                  setOptTrxForm({
                                    tanggal: t.tanggal,
                                    waktu: t.waktu,
                                    tipe: t.tipe,
                                    kategori: t.kategori,
                                    deskripsi: t.deskripsi,
                                    nominal: t.nominal,
                                    metodePembayaran: t.metodePembayaran,
                                    pihakTerkait: t.pihakTerkait,
                                    statusVerifikasi: t.statusVerifikasi,
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-[#03160f] hover:bg-[#072c1e] border border-[#d4af37]/40 text-[#f3d266] cursor-pointer"
                                title="Edit transaksi"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOptionDeleteTransaksi(t.id, t.kodeTransaksi)}
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 cursor-pointer"
                                title="Hapus transaksi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: KELOLA MANUAL ANGGARAN RAPBP */}
          {optionSection === 'anggaran' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleOptionSaveAnggaran}
                className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/45 p-5 shadow-xl space-y-3 h-fit"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider">
                    {editingAnggaranId ? 'Edit Pos Anggaran' : 'Tambah Pos Anggaran'}
                  </h3>
                  {editingAnggaranId && (
                    <button
                      type="button"
                      onClick={() => setEditingAnggaranId(null)}
                      className="text-[11px] font-mono text-rose-300 cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
                <select
                  value={optAnggaranForm.kategori}
                  onChange={(e) => setOptAnggaranForm({ ...optAnggaranForm, kategori: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                >
                  {kategoriPengeluaran.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <select
                  value={optAnggaranForm.divisi}
                  onChange={(e) =>
                    setOptAnggaranForm({
                      ...optAnggaranForm,
                      divisi: e.target.value as AnggaranPondok['divisi'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                >
                  <option value="Dapur & Konsumsi">Dapur &amp; Konsumsi</option>
                  <option value="Sekretaris">Sekretaris</option>
                  <option value="Bendahara">Bendahara</option>
                  <option value="Perlengkapan">Perlengkapan</option>
                  <option value="Keamanan">Keamanan</option>
                  <option value="Ketua Pondok">Ketua Pondok</option>
                </select>
                <input
                  type="text"
                  placeholder="Periode (mis. November 2026)"
                  value={optAnggaranForm.periode}
                  onChange={(e) => setOptAnggaranForm({ ...optAnggaranForm, periode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
                <input
                  type="number"
                  required
                  placeholder="Pagu Anggaran (Rp)"
                  value={optAnggaranForm.nominalAnggaran || ''}
                  onChange={(e) => setOptAnggaranForm({ ...optAnggaranForm, nominalAnggaran: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-[#f3d266] font-mono font-bold"
                />
                <input
                  type="text"
                  placeholder="Keterangan..."
                  value={optAnggaranForm.keterangan}
                  onChange={(e) => setOptAnggaranForm({ ...optAnggaranForm, keterangan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-black text-xs uppercase cursor-pointer"
                >
                  {editingAnggaranId ? 'Simpan Perubahan RAPBP' : 'Tambah Pos Anggaran'}
                </button>
              </form>

              <div className="lg:col-span-8 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Daftar Pos Anggaran RAPBP ({(systemConfig.anggaranList || []).length})
                </h3>
                <div className="space-y-2.5">
                  {(systemConfig.anggaranList || []).map((ang) => (
                    <div
                      key={ang.id}
                      className="p-3.5 rounded-2xl bg-[#03160f] border border-emerald-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-bold text-white">
                          {ang.kategori} · <span className="text-[#f3d266]">{ang.divisi}</span>
                        </p>
                        <p className="text-[11px] font-mono text-emerald-300 mt-0.5">
                          Periode: {ang.periode} · Pagu: <strong>{formatRupiah(ang.nominalAnggaran)}</strong>
                        </p>
                        <p className="text-[11px] text-emerald-200/75">{ang.keterangan}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setEditingAnggaranId(ang.id);
                            setOptAnggaranForm({ ...ang });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#06281c] border border-[#d4af37]/40 text-[#f3d266] text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleOptionDeleteAnggaran(ang.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: KELOLA MANUAL SYAHRIYAH & MUTASI UANG SAKU */}
          {optionSection === 'syahriyah_uangsaku' && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Kelola Manual Tagihan &amp; Status Syahriyah Santri ({mergedSyahriyahList.length})
                    </h3>
                    <p className="text-xs text-emerald-200/75">
                      Ubah nominal khusus (mis. keringanan/beasiswa santri), ubah status Lunas/Menunggak, atau sinkronkan tagihan periode aktif dari Data Santri Sekretaris.
                    </p>
                  </div>
                  <button
                    onClick={handleSyncGenerateTagihanSyahriyah}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sinkron Tagihan Semua Santri Aktif</span>
                  </button>
                </div>

                <div className="overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-emerald-800 text-[10px] font-mono uppercase text-[#f3d266] bg-[#03160f] sticky top-0">
                        <th className="py-2.5 px-3">Santri &amp; Periode</th>
                        <th className="py-2.5 px-3">Nominal</th>
                        <th className="py-2.5 px-3">Status &amp; Metode</th>
                        <th className="py-2.5 px-3 text-right">Edit Manual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-900/50">
                      {mergedSyahriyahList.map((syh) => {
                        const isEditing = editingSyahriyahId === syh.id;
                        return (
                          <tr key={syh.id} className="hover:bg-[#06281c]/50">
                            <td className="py-2.5 px-3 font-bold text-white">
                              {syh.santriNama} ({syh.santriNis})
                              <span className="block text-[10px] font-mono text-emerald-400">
                                {syh.bulanTahun} · {syh.kelas}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={optSyhDraft.nominal}
                                  onChange={(e) =>
                                    setOptSyhDraft({ ...optSyhDraft, nominal: Number(e.target.value) })
                                  }
                                  className="w-32 px-2 py-1 rounded bg-[#02100a] border border-[#d4af37] text-xs text-[#f3d266]"
                                />
                              ) : (
                                <span className="text-[#f3d266] font-bold">{formatRupiah(syh.nominal)}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {isEditing ? (
                                <div className="flex flex-wrap gap-1.5">
                                  <select
                                    value={optSyhDraft.status}
                                    onChange={(e) =>
                                      setOptSyhDraft({
                                        ...optSyhDraft,
                                        status: e.target.value as 'Lunas' | 'Menunggak',
                                      })
                                    }
                                    className="px-2 py-1 rounded bg-[#02100a] border border-emerald-700 text-xs text-white"
                                  >
                                    <option value="Lunas">Lunas</option>
                                    <option value="Menunggak">Menunggak</option>
                                  </select>
                                  {optSyhDraft.status === 'Lunas' && (
                                    <>
                                      <input
                                        type="date"
                                        value={optSyhDraft.tanggalBayar}
                                        onChange={(e) =>
                                          setOptSyhDraft({ ...optSyhDraft, tanggalBayar: e.target.value })
                                        }
                                        className="px-2 py-1 rounded bg-[#02100a] border border-emerald-700 text-xs text-white"
                                      />
                                      <select
                                        value={optSyhDraft.metodeBayar}
                                        onChange={(e) =>
                                          setOptSyhDraft({
                                            ...optSyhDraft,
                                            metodeBayar: e.target.value as 'Tunai' | 'Transfer Bank' | 'QRIS',
                                          })
                                        }
                                        className="px-2 py-1 rounded bg-[#02100a] border border-emerald-700 text-xs text-white"
                                      >
                                        <option value="Tunai">Tunai</option>
                                        <option value="Transfer Bank">Transfer Bank</option>
                                        <option value="QRIS">QRIS</option>
                                      </select>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                    syh.status === 'Lunas'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-rose-500/20 text-rose-300'
                                  }`}
                                >
                                  {syh.status} {syh.metodeBayar ? `(${syh.metodeBayar})` : ''}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {isEditing ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleOptionSaveSyahriyahRow(syh)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                                  >
                                    Simpan
                                  </button>
                                  <button
                                    onClick={() => setEditingSyahriyahId(null)}
                                    className="px-2.5 py-1 rounded-lg bg-rose-950 text-rose-200 text-[11px] cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingSyahriyahId(syh.id);
                                    setOptSyhDraft({
                                      nominal: syh.nominal,
                                      status: syh.status,
                                      tanggalBayar: syh.tanggalBayar || new Date().toISOString().split('T')[0],
                                      metodeBayar: syh.metodeBayar || 'Tunai',
                                      catatan: syh.catatan || '',
                                    });
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-[#03160f] border border-[#d4af37]/40 text-[#f3d266] text-[11px] font-bold cursor-pointer"
                                >
                                  Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Kelola Mutasi Uang Saku */}
              <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Kelola &amp; Koreksi Mutasi Uang Saku Santri ({(systemConfig.uangSakuList || []).length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {(systemConfig.uangSakuList || []).map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-[#03160f] border border-emerald-800/60 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">
                          {m.santriNama} ({m.santriNis}) ·{' '}
                          <span className={m.tipe === 'Setoran' ? 'text-emerald-400' : 'text-amber-400'}>
                            {m.tipe} {formatRupiah(m.nominal)}
                          </span>
                        </p>
                        <p className="text-[11px] text-emerald-200/75">
                          {m.keterangan} · {m.tanggal} · Petugas: {m.petugas}
                        </p>
                      </div>
                      <button
                        onClick={() => handleOptionDeleteUangSaku(m.id)}
                        className="p-1.5 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-300 cursor-pointer"
                        title="Hapus mutasi uang saku"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
