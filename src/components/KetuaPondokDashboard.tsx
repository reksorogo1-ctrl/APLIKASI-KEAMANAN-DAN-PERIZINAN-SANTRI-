import React, { useMemo, useState } from 'react';
import {
  Crown,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  ClipboardCheck,
  FileText,
  Wallet,
  Package,
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  Send,
  AlertCircle,
  TrendingUp,
  Printer,
  Users,
  Target,
  MessageSquare,
  Award,
  Activity
} from 'lucide-react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import {
  GlowingDot,
  GlowingActiveDot,
  LuxuryChartTooltip,
} from './LuxuryChartComponents';
import {
  AgendaPengurus,
  EvaluasiKepengurusan,
  PengajuanDivisi,
  ArsipSurat,
  TransaksiKeuangan,
  BarangInventaris,
  Perizinan,
  Pelanggaran,
  Santri,
  UserAccount,
  DivisiPondok,
  SystemConfig,
  StrukturOrganisasiNode,
  DewanKeamanan,
  PesanKoordinasi,
  ProgramKerja,
  IzinPengurus,
  NotulenRapat
} from '../types';
import { storageService } from '../services/storageService';
import { openPrintWindow } from '../utils/printDocument';

interface KetuaPondokDashboardProps {
  currentUser: UserAccount;
  systemConfig: SystemConfig;
  santriList: Santri[];
  perizinanList: Perizinan[];
  pelanggaranList: Pelanggaran[];
  arsipSurat: ArsipSurat[];
  transaksiKeuangan: TransaksiKeuangan[];
  barangInventaris: BarangInventaris[];
  agendaPengurus: AgendaPengurus[];
  evaluasiKepengurusan: EvaluasiKepengurusan[];
  pengajuanDivisi: PengajuanDivisi[];
  strukturList: StrukturOrganisasiNode[];
  dewanList: DewanKeamanan[];
  koordinasiList: PesanKoordinasi[];
  initialSubTab?: 'ringkasan' | 'persetujuan' | 'pengurus_piket' | 'proker' | 'evaluasi_rapat' | 'sk_koordinasi' | 'laporan_bulanan';
}

export const KetuaPondokDashboard: React.FC<KetuaPondokDashboardProps> = ({
  currentUser,
  systemConfig,
  santriList,
  perizinanList,
  pelanggaranList,
  arsipSurat,
  transaksiKeuangan,
  barangInventaris,
  agendaPengurus,
  evaluasiKepengurusan,
  pengajuanDivisi,
  strukturList,
  dewanList,
  koordinasiList,
  initialSubTab,
}) => {
  const [activeTab, setActiveTab] = useState<
    'ringkasan' | 'persetujuan' | 'pengurus_piket' | 'proker' | 'evaluasi_rapat' | 'sk_koordinasi' | 'laporan_bulanan'
  >(initialSubTab || 'sk_koordinasi');

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  // State Persetujuan Divisi
  const [catatanMap, setCatatanMap] = useState<Record<string, string>>({});

  // State Program Kerja Baru
  const [prokerForm, setProkerForm] = useState<Partial<ProgramKerja>>({
    divisi: 'Sekretaris',
    namaProgram: '',
    target: '',
    progresPersen: 75,
    penanggungJawab: '',
    tenggat: new Date().toISOString().split('T')[0],
    status: 'Berjalan',
  });

  // State Izin Pengurus Baru
  const [izinPengurusForm, setIzinPengurusForm] = useState<Partial<IzinPengurus>>({
    namaPengurus: '',
    jabatan: '',
    divisi: 'Sekretaris',
    keperluan: '',
    tglMulai: new Date().toISOString().split('T')[0],
    tglSelesai: new Date().toISOString().split('T')[0],
    penggantiPiket: '',
  });

  // State Evaluasi Kinerja
  const [evalForm, setEvalForm] = useState<Partial<EvaluasiKepengurusan>>({
    tanggal: new Date().toISOString().split('T')[0],
    divisi: 'Sekretaris',
    judul: '',
    catatanEvaluasi: '',
    tindakLanjut: '',
    nilaiKinerja: 'Sangat Baik',
  });

  // State Pesan Koordinasi / Instruksi Ketua Pondok
  const [instruksiForm, setInstruksiForm] = useState({
    judul: '',
    tujuan: 'Seluruh Pengurus Divisi',
    prioritas: 'Penting' as 'Normal' | 'Penting' | 'Mendesak',
    isi: '',
  });

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // 1. Ringkasan Semua Bagian & Grafik Line Chart Kinerja Pengurus + Kedisiplinan Santri
  const executiveMetrics = useMemo(() => {
    const pemasukan = transaksiKeuangan.filter(t => t.tipe === 'Pemasukan').reduce((a, b) => a + b.nominal, 0);
    const pengeluaran = transaksiKeuangan.filter(t => t.tipe === 'Pengeluaran').reduce((a, b) => a + b.nominal, 0);
    const saldoKas = pemasukan - pengeluaran;

    const prokerList = systemConfig.programKerjaList || [];
    const avgKinerja = prokerList.length > 0
      ? Math.round(prokerList.reduce((acc, p) => acc + p.progresPersen, 0) / prokerList.length)
      : 90;
    const kinerjaBulanLalu = 85;
    const kinerjaDiff = avgKinerja - kinerjaBulanLalu;

    const penaltyDisiplin = Math.min(22, pelanggaranList.length * 2 + perizinanList.filter(p => p.status === 'Terlambat').length * 2);
    const disiplinBulanIni = Math.max(76, 98 - penaltyDisiplin);
    const disiplinBulanLalu = 89;
    const disiplinDiff = disiplinBulanIni - disiplinBulanLalu;

    const kinerjaChartData = [
      { minggu: 'Pekan 1', bulanLalu: 82, bulanIni: 86 },
      { minggu: 'Pekan 2', bulanLalu: 84, bulanIni: 89 },
      { minggu: 'Pekan 3', bulanLalu: 86, bulanIni: 91 },
      { minggu: 'Pekan 4', bulanLalu: kinerjaBulanLalu, bulanIni: avgKinerja },
    ];

    const disiplinChartData = [
      { minggu: 'Pekan 1', bulanLalu: 88, bulanIni: 92 },
      { minggu: 'Pekan 2', bulanLalu: 87, bulanIni: 94 },
      { minggu: 'Pekan 3', bulanLalu: 90, bulanIni: 93 },
      { minggu: 'Pekan 4', bulanLalu: disiplinBulanLalu, bulanIni: disiplinBulanIni },
    ];

    return {
      pemasukan,
      pengeluaran,
      saldoKas,
      avgKinerja,
      kinerjaBulanLalu,
      kinerjaDiff,
      disiplinBulanIni,
      disiplinBulanLalu,
      disiplinDiff,
      kinerjaChartData,
      disiplinChartData,
    };
  }, [transaksiKeuangan, systemConfig.programKerjaList, pelanggaranList.length, perizinanList]);

  // Handlers Persetujuan
  const handleKeputusanPengajuan = (item: PengajuanDivisi, status: PengajuanDivisi['status']) => {
    storageService.savePengajuanDivisi({
      ...item,
      status,
      catatanKetua: catatanMap[item.id] || item.catatanKetua || `Diputuskan ${status} oleh Ketua Pondok.`,
      diputuskanOleh: currentUser.nama,
      tanggalKeputusan: new Date().toISOString().split('T')[0],
    });
  };

  const handleKeputusanIzinSantri = (izin: Perizinan, disetujui: boolean) => {
    storageService.savePerizinan({
      ...izin,
      status: disetujui ? 'Disetujui' : 'Ditolak',
      disetujuiOleh: currentUser.nama,
      riwayatPersetujuan: [
        ...(izin.riwayatPersetujuan || []),
        {
          role: 'Ketua Pondok',
          nama: currentUser.nama,
          tanggal: new Date().toISOString().split('T')[0],
          status: disetujui ? 'Setuju' : 'Tolak',
          catatan: disetujui ? 'Disetujui Ketua Pondok' : 'Ditolak Ketua Pondok',
        },
      ],
    });
  };

  const handleKeputusanIzinPengurus = (id: string, status: 'Disetujui' | 'Ditolak') => {
    const list = [...(systemConfig.izinPengurusList || [])];
    const updated = list.map(ip => (ip.id === id ? { ...ip, status } : ip));
    storageService.updateSystemConfig({ izinPengurusList: updated });
  };

  const handleTambahIzinPengurus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!izinPengurusForm.namaPengurus || !izinPengurusForm.keperluan) return;
    const item: IzinPengurus = {
      id: `izp_${Date.now()}`,
      namaPengurus: izinPengurusForm.namaPengurus,
      jabatan: izinPengurusForm.jabatan || 'Pengurus Pondok',
      divisi: izinPengurusForm.divisi || 'Umum',
      keperluan: izinPengurusForm.keperluan,
      tglMulai: izinPengurusForm.tglMulai || new Date().toISOString().split('T')[0],
      tglSelesai: izinPengurusForm.tglSelesai || new Date().toISOString().split('T')[0],
      penggantiPiket: izinPengurusForm.penggantiPiket || '-',
      status: 'Menunggu',
    };
    storageService.updateSystemConfig({
      izinPengurusList: [item, ...(systemConfig.izinPengurusList || [])],
    });
    setIzinPengurusForm({ ...izinPengurusForm, namaPengurus: '', keperluan: '', penggantiPiket: '' });
  };

  // Handlers Program Kerja
  const handleTambahProker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prokerForm.namaProgram || !prokerForm.target) return;
    const newProker: ProgramKerja = {
      id: `prk_${Date.now()}`,
      divisi: (prokerForm.divisi as any) || 'Sekretaris',
      namaProgram: prokerForm.namaProgram,
      target: prokerForm.target,
      progresPersen: Number(prokerForm.progresPersen) || 50,
      penanggungJawab: prokerForm.penanggungJawab || currentUser.nama,
      tenggat: prokerForm.tenggat || new Date().toISOString().split('T')[0],
      status: Number(prokerForm.progresPersen) >= 100 ? 'Tercapai' : 'Berjalan',
    };
    storageService.updateSystemConfig({
      programKerjaList: [newProker, ...(systemConfig.programKerjaList || [])],
    });
    setProkerForm({ ...prokerForm, namaProgram: '', target: '' });
  };

  const handleUpdateProkerProgress = (id: string, progresPersen: number) => {
    const updated = (systemConfig.programKerjaList || []).map(p =>
      p.id === id
        ? { ...p, progresPersen, status: (progresPersen >= 95 ? 'Tercapai' : 'Berjalan') as ProgramKerja['status'] }
        : p
    );
    storageService.updateSystemConfig({ programKerjaList: updated });
  };

  // Handler Evaluasi Kinerja
  const handleSaveEvaluasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalForm.judul || !evalForm.catatanEvaluasi) return;
    storageService.saveEvaluasiKepengurusan({
      id: `evl_${Date.now()}`,
      tanggal: evalForm.tanggal || new Date().toISOString().split('T')[0],
      divisi: (evalForm.divisi as any) || 'Umum',
      judul: evalForm.judul,
      catatanEvaluasi: evalForm.catatanEvaluasi,
      tindakLanjut: evalForm.tindakLanjut || '-',
      nilaiKinerja: (evalForm.nilaiKinerja as any) || 'Baik',
      penulisNama: currentUser.nama,
      createdAt: new Date().toISOString().split('T')[0],
    });
    setEvalForm({ ...evalForm, judul: '', catatanEvaluasi: '', tindakLanjut: '' });
  };

  // Handler Kirim Pesan Koordinasi ke Pengurus
  const handleKirimInstruksi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruksiForm.judul || !instruksiForm.isi) return;
    const msg: PesanKoordinasi = {
      id: `krd_${Date.now()}`,
      nomorTiket: `KTP-MSG-${Math.floor(1000 + Math.random() * 9000)}`,
      judul: `[INSTRUKSI KETUA PONDOK] ${instruksiForm.judul}`,
      isi: `Tujuan: ${instruksiForm.tujuan}\n\n${instruksiForm.isi}`,
      prioritas: instruksiForm.prioritas,
      kategori: 'Instruksi Admin',
      pengirimId: currentUser.id,
      pengirimNama: currentUser.nama,
      pengirimRole: currentUser.role,
      pengirimJabatan: currentUser.jabatan,
      tujuan: 'semua_dewan',
      waktu: new Date().toLocaleString('id-ID') + ' WIB',
      status: 'Terkirim',
      dibacaOleh: [currentUser.id],
      balasan: [],
    };
    storageService.saveKoordinasi(msg);
    setInstruksiForm({ judul: '', tujuan: 'Seluruh Pengurus Divisi', prioritas: 'Penting', isi: '' });
  };

  // Handler Cetak Laporan Bulanan Ketua Pondok
  const handlePrintLaporanBulanan = () => {
    openPrintWindow('ketua-laporan-bulanan-print', `Laporan_Eksekutif_Bulanan_Ketua_Pondok_AlMaliki`);
  };

  const izinPulangPending = perizinanList.filter(
    p => p.status === 'Diajukan' || p.status === 'Diverifikasi'
  );
  const pengajuanDanaList = pengajuanDivisi.filter(p => p.jenisPengajuan === 'Pengajuan Anggaran');
  const pengajuanBarangList = pengajuanDivisi.filter(p => p.jenisPengajuan === 'Pengadaan Barang');
  const izinPengurusList = systemConfig.izinPengurusList || [];
  const skDanPengumumanList = arsipSurat.filter(s => s.kodeJenis === 'SK' || s.kodeJenis === 'SPb');

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER KETUA PONDOK */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#041d14]/95 border border-[#d4af37]/40 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f3d266]">
            <Crown className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
                EXECUTIVE COMMAND CENTER
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-1">
              Dashboard Eksekutif Ketua Pondok Pesantren
            </h1>
            <p className="text-xs text-emerald-200/75">
              Monitoring lintas bagian (Sekretaris, Bendahara, Perlengkapan, Keamanan), persetujuan terpadu, evaluasi kinerja, SK, & laporan bulanan
            </p>
          </div>
        </div>

        {/* Navigasi Sub-Tab Ketua Pondok */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#02100a] p-1.5 rounded-2xl border border-emerald-800/70">
          {[
            { id: 'sk_koordinasi', label: 'Kotak Masuk & Pesan (SK)' },
            { id: 'persetujuan', label: `Persetujuan (${pengajuanDivisi.filter(p => p.status === 'Menunggu Persetujuan').length + izinPulangPending.length})` },
            { id: 'evaluasi_rapat', label: 'Evaluasi Kinerja & Rapat' },
            { id: 'proker', label: 'Program Kerja & Target' },
            { id: 'pengurus_piket', label: 'Daftar Pengurus & Piket' },
            { id: 'laporan_bulanan', label: 'Cetak Laporan Bulanan' },
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

      {/* TAB 1: RINGKASAN SEMUA BAGIAN & GRAFIK LINE CHART KINERJA + KEDISIPLINAN */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-6">
          {/* Ringkasan Semua Bagian dalam Satu Layar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#041d14]/95 border border-emerald-500/35 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">1. Bagian Keuangan</span>
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-lg font-black text-emerald-400 font-mono">{formatRupiah(executiveMetrics.saldoKas)}</p>
              <p className="text-[11px] text-emerald-200/75 mt-1">
                Masuk: {formatRupiah(executiveMetrics.pemasukan)} · Keluar: {formatRupiah(executiveMetrics.pengeluaran)}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#f3d266]">2. Bagian Sekretaris</span>
                <FileText className="w-5 h-5 text-[#f3d266]" />
              </div>
              <p className="text-lg font-black text-white font-mono">{arsipSurat.length} Dokumen Surat</p>
              <p className="text-[11px] text-emerald-200/75 mt-1">
                {arsipSurat.filter(s => s.status === 'Resmi / Terbit').length} Surat Resmi Terbit · {(systemConfig.notulenRapatList || []).length} Notulen Rapat
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#041d14]/95 border border-amber-500/35 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300">3. Bagian Keamanan</span>
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-lg font-black text-white font-mono">
                {perizinanList.filter(p => p.status === 'Sedang Keluar').length} Izin Aktif
              </p>
              <p className="text-[11px] text-emerald-200/75 mt-1">
                {perizinanList.filter(p => p.status === 'Terlambat').length} Terlambat · {pelanggaranList.length} Catatan Pelanggaran
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#041d14]/95 border border-emerald-500/35 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">4. Bagian Inventaris</span>
                <Package className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-lg font-black text-white font-mono">
                {barangInventaris.reduce((a, b) => a + b.jumlah, 0)} Unit Aset
              </p>
              <p className="text-[11px] text-emerald-200/75 mt-1">
                {barangInventaris.filter(b => b.kondisi === 'Baik').length} Jenis Baik · {barangInventaris.filter(b => b.kondisi !== 'Baik').length} Perlu Perbaikan
              </p>
            </div>
          </div>

          {/* 2 Grafik Line Chart: Kinerja Pengurus & Kedisiplinan Santri (Bulan Ini vs Bulan Lalu) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Grafik Line Chart Kinerja Pengurus
                  </h2>
                  <p className="text-xs text-emerald-200/70">Perbandingan Bulan Ini vs Bulan Lalu</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-emerald-400 font-mono">{executiveMetrics.avgKinerja}%</p>
                  <p className="text-[10px] font-mono text-emerald-300">
                    {executiveMetrics.kinerjaDiff >= 0 ? `+${executiveMetrics.kinerjaDiff}%` : `${executiveMetrics.kinerjaDiff}%`} vs Bulan Lalu ({executiveMetrics.kinerjaBulanLalu}%)
                  </p>
                </div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={executiveMetrics.kinerjaChartData}
                    margin={{ top: 12, right: 16, left: -12, bottom: 4 }}
                  >
                    <defs>
                      <filter id="glowExecKinerja" x="-25%" y="-25%" width="150%" height="150%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <linearGradient id="execKinerjaLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="55%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#f3d266" />
                      </linearGradient>
                      <linearGradient id="execKinerjaArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="55%" stopColor="#10b981" stopOpacity={0.14} />
                        <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="execKinerjaAreaPrev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4af37" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.35} />
                    <XAxis dataKey="minggu" stroke="#a7f3d0" fontSize={11} tickLine={false} />
                    <YAxis domain={[65, 100]} stroke="#a7f3d0" fontSize={11} unit="%" tickLine={false} />
                    <Tooltip
                      content={<LuxuryChartTooltip unit="%" subtitle="Indeks Kinerja Pengurus" />}
                      cursor={{ stroke: '#34d399', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Area
                      type="monotone"
                      dataKey="bulanLalu"
                      name="Bulan Lalu (%)"
                      fill="url(#execKinerjaAreaPrev)"
                      stroke="none"
                      legendType="none"
                      isAnimationActive={true}
                      animationDuration={1400}
                    />
                    <Area
                      type="monotone"
                      dataKey="bulanIni"
                      name="Bulan Ini (%)"
                      fill="url(#execKinerjaArea)"
                      stroke="none"
                      legendType="none"
                      isAnimationActive={true}
                      animationDuration={1600}
                    />
                    <Line
                      type="monotone"
                      dataKey="bulanLalu"
                      name="Bulan Lalu (%)"
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
                      name="Bulan Ini (%)"
                      stroke="url(#execKinerjaLine)"
                      strokeWidth={3.5}
                      filter="url(#glowExecKinerja)"
                      dot={<GlowingDot color="#10b981" accentColor="#f3d266" />}
                      activeDot={<GlowingActiveDot color="#10b981" accentColor="#f3d266" />}
                      isAnimationActive={true}
                      animationDuration={1700}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#f3d266]" />
                    Grafik Line Chart Kedisiplinan Santri
                  </h2>
                  <p className="text-xs text-emerald-200/70">Perbandingan Bulan Ini vs Bulan Lalu</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-[#f3d266] font-mono">{executiveMetrics.disiplinBulanIni}%</p>
                  <p className="text-[10px] font-mono text-emerald-300">
                    {executiveMetrics.disiplinDiff >= 0 ? `+${executiveMetrics.disiplinDiff}%` : `${executiveMetrics.disiplinDiff}%`} vs Bulan Lalu ({executiveMetrics.disiplinBulanLalu}%)
                  </p>
                </div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={executiveMetrics.disiplinChartData}
                    margin={{ top: 12, right: 16, left: -12, bottom: 4 }}
                  >
                    <defs>
                      <filter id="glowExecDisiplin" x="-25%" y="-25%" width="150%" height="150%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                      <linearGradient id="execDisiplinLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#f3d266" />
                        <stop offset="50%" stopColor="#d4af37" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                      <linearGradient id="execDisiplinArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4af37" stopOpacity={0.38} />
                        <stop offset="55%" stopColor="#10b981" stopOpacity={0.14} />
                        <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="execDisiplinAreaPrev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.35} />
                    <XAxis dataKey="minggu" stroke="#a7f3d0" fontSize={11} tickLine={false} />
                    <YAxis domain={[65, 100]} stroke="#a7f3d0" fontSize={11} unit="%" tickLine={false} />
                    <Tooltip
                      content={<LuxuryChartTooltip unit="%" subtitle="Indeks Kedisiplinan Santri" />}
                      cursor={{ stroke: '#f3d266', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                    <Area
                      type="monotone"
                      dataKey="bulanLalu"
                      name="Bulan Lalu (%)"
                      fill="url(#execDisiplinAreaPrev)"
                      stroke="none"
                      legendType="none"
                      isAnimationActive={true}
                      animationDuration={1400}
                    />
                    <Area
                      type="monotone"
                      dataKey="bulanIni"
                      name="Bulan Ini (%)"
                      fill="url(#execDisiplinArea)"
                      stroke="none"
                      legendType="none"
                      isAnimationActive={true}
                      animationDuration={1600}
                    />
                    <Line
                      type="monotone"
                      dataKey="bulanLalu"
                      name="Bulan Lalu (%)"
                      stroke="#34d399"
                      strokeWidth={2.2}
                      strokeDasharray="5 5"
                      dot={<GlowingDot color="#34d399" accentColor="#a7f3d0" />}
                      activeDot={<GlowingActiveDot color="#34d399" accentColor="#ffffff" />}
                      isAnimationActive={true}
                      animationDuration={1500}
                    />
                    <Line
                      type="monotone"
                      dataKey="bulanIni"
                      name="Bulan Ini (%)"
                      stroke="url(#execDisiplinLine)"
                      strokeWidth={3.5}
                      filter="url(#glowExecDisiplin)"
                      dot={<GlowingDot color="#d4af37" accentColor="#34d399" />}
                      activeDot={<GlowingActiveDot color="#d4af37" accentColor="#f3d266" />}
                      isAnimationActive={true}
                      animationDuration={1700}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERSETUJUAN TERPADU (GRAFIK LINE CHART KEDISIPLINAN SANTRI, IZIN PENGURUS, IZIN SANTRI PULANG, PENGAJUAN DANA, PENGAJUAN BARANG) */}
      {activeTab === 'persetujuan' && (
        <div className="space-y-6">
          {/* Grafik Line Chart Kedisiplinan Santri & Perbandingan Bulan Ini vs Bulan Lalu */}
          <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#f3d266]" />
                  Grafik Line Chart Kedisiplinan Santri (Indikator Persetujuan Izin)
                </h2>
                <p className="text-xs text-emerald-200/70">
                  Persentase kepatuhan santri dan perbandingan Bulan Ini vs Bulan Lalu sebagai dasar pertimbangan persetujuan izin
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-[#f3d266] font-mono">{executiveMetrics.disiplinBulanIni}%</p>
                <p className="text-[10px] font-mono text-emerald-300">
                  {executiveMetrics.disiplinDiff >= 0 ? `+${executiveMetrics.disiplinDiff}%` : `${executiveMetrics.disiplinDiff}%`} dari Bulan Lalu ({executiveMetrics.disiplinBulanLalu}%)
                </p>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={executiveMetrics.disiplinChartData}
                  margin={{ top: 12, right: 18, left: -12, bottom: 4 }}
                >
                  <defs>
                    <filter id="glowKpDisiplin" x="-25%" y="-25%" width="150%" height="150%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient id="kpDisiplinLineCurr" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f3d266" />
                      <stop offset="50%" stopColor="#d4af37" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <linearGradient id="kpDisiplinAreaCurr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4af37" stopOpacity={0.38} />
                      <stop offset="55%" stopColor="#10b981" stopOpacity={0.14} />
                      <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="kpDisiplinAreaPrev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.35} />
                  <XAxis dataKey="minggu" stroke="#a7f3d0" fontSize={11} tickLine={false} />
                  <YAxis domain={[65, 100]} stroke="#a7f3d0" fontSize={11} unit="%" tickLine={false} />
                  <Tooltip
                    content={<LuxuryChartTooltip unit="%" subtitle="Indeks Kedisiplinan Santri" />}
                    cursor={{ stroke: '#f3d266', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Area
                    type="monotone"
                    dataKey="bulanLalu"
                    name="Kedisiplinan Bulan Lalu (%)"
                    fill="url(#kpDisiplinAreaPrev)"
                    stroke="none"
                    legendType="none"
                    isAnimationActive={true}
                    animationDuration={1400}
                  />
                  <Area
                    type="monotone"
                    dataKey="bulanIni"
                    name="Kedisiplinan Bulan Ini (%)"
                    fill="url(#kpDisiplinAreaCurr)"
                    stroke="none"
                    legendType="none"
                    isAnimationActive={true}
                    animationDuration={1600}
                  />
                  <Line
                    type="monotone"
                    dataKey="bulanLalu"
                    name="Kedisiplinan Bulan Lalu (%)"
                    stroke="#34d399"
                    strokeWidth={2.2}
                    strokeDasharray="5 5"
                    dot={<GlowingDot color="#34d399" accentColor="#a7f3d0" />}
                    activeDot={<GlowingActiveDot color="#34d399" accentColor="#ffffff" />}
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="bulanIni"
                    name="Kedisiplinan Bulan Ini (%)"
                    stroke="url(#kpDisiplinLineCurr)"
                    strokeWidth={3.5}
                    filter="url(#glowKpDisiplin)"
                    dot={<GlowingDot color="#d4af37" accentColor="#34d399" />}
                    activeDot={<GlowingActiveDot color="#d4af37" accentColor="#f3d266" />}
                    isAnimationActive={true}
                    animationDuration={1700}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* A. Persetujuan Pengajuan Dana & Pengajuan Barang dari Divisi */}
          <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#f3d266]" />
              1. Persetujuan Pengajuan Dana & Pengajuan Barang dari Divisi
            </h2>
            <div className="space-y-3">
              {pengajuanDivisi.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
                        {item.divisi} · {item.jenisPengajuan}
                      </span>
                      <span className="text-[11px] font-mono text-emerald-300/80">{item.nomorPengajuan} · {item.tanggal}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        item.status === 'Disetujui'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : item.status === 'Ditolak'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{item.judul}</h3>
                    <p className="text-xs text-emerald-100/80">{item.deskripsi}</p>
                    {item.nominalEstimasi ? (
                      <p className="text-xs font-mono font-bold text-[#f3d266]">
                        Estimasi Anggaran: {formatRupiah(item.nominalEstimasi)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder="Catatan Ketua Pondok..."
                      value={catatanMap[item.id] ?? item.catatanKetua ?? ''}
                      onChange={(e) => setCatatanMap({ ...catatanMap, [item.id]: e.target.value })}
                      className="px-3 py-2 rounded-xl bg-black/60 border border-emerald-800 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                    <button
                      onClick={() => handleKeputusanPengajuan(item, 'Disetujui')}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                    </button>
                    <button
                      onClick={() => handleKeputusanPengajuan(item, 'Ditolak')}
                      className="px-3 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* B. Persetujuan Izin Santri Pulang & Izin Pengurus */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Izin Santri Pulang */}
            <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                2. Persetujuan Izin Santri Pulang / Keluar
              </h2>
              <div className="space-y-3">
                {perizinanList.slice(0, 6).map((iz) => (
                  <div key={iz.id} className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800/60 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{iz.santriNama}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-[#f3d266] border border-[#d4af37]/30">
                          {iz.jenisIzin}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-200/75 mt-0.5">{iz.alasan} ({iz.tglKeluar} s/d {iz.tglKembali})</p>
                      <span className="text-[10px] font-mono text-emerald-400">Status: {iz.status}</span>
                    </div>
                    {(iz.status === 'Diajukan' || iz.status === 'Diverifikasi') && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleKeputusanIzinSantri(iz, true)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => handleKeputusanIzinSantri(iz, false)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Izin Pengurus */}
            <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-[#f3d266]" />
                3. Persetujuan Izin Pengurus Pondok
              </h2>

              <form onSubmit={handleTambahIzinPengurus} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-[#03160f] border border-emerald-800/60">
                <input
                  type="text"
                  placeholder="Nama Pengurus..."
                  value={izinPengurusForm.namaPengurus}
                  onChange={e => setIzinPengurusForm({ ...izinPengurusForm, namaPengurus: e.target.value })}
                  className="px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-800 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Pengganti Piket..."
                  value={izinPengurusForm.penggantiPiket}
                  onChange={e => setIzinPengurusForm({ ...izinPengurusForm, penggantiPiket: e.target.value })}
                  className="px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-800 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Keperluan Izin..."
                  value={izinPengurusForm.keperluan}
                  onChange={e => setIzinPengurusForm({ ...izinPengurusForm, keperluan: e.target.value })}
                  className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-black/60 border border-emerald-800 text-xs text-white"
                />
                <button
                  type="submit"
                  className="sm:col-span-2 py-1.5 rounded-lg bg-[#d4af37] text-[#02120a] font-bold text-xs cursor-pointer"
                >
                  + Catat Permohonan Izin Pengurus
                </button>
              </form>

              <div className="space-y-2.5">
                {izinPengurusList.map((ip) => (
                  <div key={ip.id} className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800/60 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-white">{ip.namaPengurus} ({ip.divisi})</p>
                      <p className="text-[11px] text-emerald-200/75">{ip.keperluan} · Pengganti: {ip.penggantiPiket}</p>
                      <span className="text-[10px] font-mono text-[#f3d266]">
                        {ip.tglMulai} s/d {ip.tglSelesai} · Status: {ip.status}
                      </span>
                    </div>
                    {ip.status === 'Menunggu' && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleKeputusanIzinPengurus(ip.id, 'Disetujui')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => handleKeputusanIzinPengurus(ip.id, 'Ditolak')}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DAFTAR PENGURUS BESERTA TUGAS (TUPOKSI) DAN JADWAL PIKETNYA */}
      {activeTab === 'pengurus_piket' && (
        <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#f3d266]" />
              Daftar Pengurus Pondok, Tugas Pokok (Tupoksi), & Jadwal Piket
            </h2>
            <p className="text-xs text-emerald-200/75">
              Monitoring tanggung jawab setiap personil pengurus dan asatidz di seluruh bagian
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-emerald-800/80 text-[10px] font-mono uppercase text-[#f3d266] bg-[#03160f]">
                  <th className="py-3 px-4">Nama Pengurus / Asatidz</th>
                  <th className="py-3 px-4">Jabatan & Divisi</th>
                  <th className="py-3 px-4">Tugas Pokok / Bidang Kitab</th>
                  <th className="py-3 px-4">Jadwal Piket</th>
                  <th className="py-3 px-4">Kontak WA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/50 text-xs">
                {(systemConfig.ustadzList || []).map((u) => {
                  const orgNode = strukturList.find(s => s.namaPengurus === u.nama);
                  return (
                    <tr key={u.id} className="hover:bg-[#06281c]/50">
                      <td className="py-3 px-4 font-bold text-white">
                        {u.nama}
                        <span className="block text-[10px] font-mono text-emerald-400">{u.nip}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-emerald-100 font-semibold">{u.jabatan}</span>
                        <span className="block text-[10px] font-mono text-[#f3d266]">{u.divisi}</span>
                      </td>
                      <td className="py-3 px-4 text-emerald-100/85 max-w-md">
                        {orgNode ? orgNode.tupoksi : `Pengampu ${u.bidangKitab} & pembinaan santri`}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-emerald-300">
                        {u.jadwalPiket}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-200">{u.noWa}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PROGRAM KERJA, TARGET, DAN PROGRESNYA */}
      {activeTab === 'proker' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form onSubmit={handleTambahProker} className="lg:col-span-4 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl space-y-4 h-fit">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-[#f3d266]" />
              Tambah Program Kerja & Target
            </h2>
            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Divisi Pelaksana</label>
              <select
                value={prokerForm.divisi}
                onChange={e => setProkerForm({ ...prokerForm, divisi: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              >
                <option value="Sekretaris">Sekretaris</option>
                <option value="Bendahara">Bendahara</option>
                <option value="Perlengkapan">Perlengkapan</option>
                <option value="Keamanan">Keamanan</option>
                <option value="Pendidikan & Taklim">Pendidikan & Taklim</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Nama Program Kerja</label>
              <input
                type="text"
                required
                value={prokerForm.namaProgram}
                onChange={e => setProkerForm({ ...prokerForm, namaProgram: e.target.value })}
                placeholder="Contoh: Digitalisasi Arsip Surat..."
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Indikator Target Capaian</label>
              <input
                type="text"
                required
                value={prokerForm.target}
                onChange={e => setProkerForm({ ...prokerForm, target: e.target.value })}
                placeholder="Contoh: 100% terdata sebelum akhir semester"
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Penanggung Jawab</label>
              <input
                type="text"
                value={prokerForm.penanggungJawab}
                onChange={e => setProkerForm({ ...prokerForm, penanggungJawab: e.target.value })}
                placeholder="Nama Kepala Divisi..."
                className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs cursor-pointer"
            >
              Simpan Program Kerja Baru
            </button>
          </form>

          <div className="lg:col-span-8 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Daftar Program Kerja, Target, & Progres Realisasi
            </h2>
            <div className="space-y-3">
              {(systemConfig.programKerjaList || []).map((pk) => (
                <div key={pk.id} className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
                      DIVISI {pk.divisi.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      Progres: {pk.progresPersen}% ({pk.status})
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{pk.namaProgram}</h3>
                  <p className="text-xs text-emerald-200/80">Target: {pk.target} · PJ: {pk.penanggungJawab}</p>
                  <div className="w-full h-2.5 rounded-full bg-emerald-950 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#d4af37] transition-all"
                      style={{ width: `${pk.progresPersen}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-emerald-400/75">Tenggat: {pk.tenggat}</span>
                    <div className="flex items-center gap-1.5">
                      {[50, 75, 90, 100].map(pct => (
                        <button
                          key={pct}
                          onClick={() => handleUpdateProkerProgress(pk.id, pct)}
                          className="px-2 py-0.5 rounded bg-[#06281c] hover:bg-[#0b422d] text-[10px] font-mono text-emerald-200 border border-emerald-700/50 cursor-pointer"
                        >
                          Set {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: EVALUASI KINERJA PENGURUS & CATATAN RAPAT (NOTULEN) */}
      {activeTab === 'evaluasi_rapat' && (
        <div className="space-y-6">
          {/* Grafik Line Chart Kinerja Pengurus & Perbandingan Bulan Ini vs Bulan Lalu */}
          <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Grafik Line Chart Kinerja Pengurus & Perbandingan Bulan Ini vs Bulan Lalu
                </h2>
                <p className="text-xs text-emerald-200/70">
                  Persentase capaian program kerja & evaluasi seluruh divisi pengurus
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-emerald-400 font-mono">{executiveMetrics.avgKinerja}%</p>
                <p className="text-[10px] font-mono text-emerald-300">
                  {executiveMetrics.kinerjaDiff >= 0 ? `+${executiveMetrics.kinerjaDiff}%` : `${executiveMetrics.kinerjaDiff}%`} dari Bulan Lalu ({executiveMetrics.kinerjaBulanLalu}%)
                </p>
              </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={executiveMetrics.kinerjaChartData}
                  margin={{ top: 12, right: 18, left: -12, bottom: 4 }}
                >
                  <defs>
                    <filter id="glowKpKinerja" x="-25%" y="-25%" width="150%" height="150%">
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <linearGradient id="kpKinerjaLineCurr" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="55%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#f3d266" />
                    </linearGradient>
                    <linearGradient id="kpKinerjaAreaCurr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.42} />
                      <stop offset="55%" stopColor="#10b981" stopOpacity={0.14} />
                      <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="kpKinerjaAreaPrev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4af37" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" opacity={0.35} />
                  <XAxis dataKey="minggu" stroke="#a7f3d0" fontSize={11} tickLine={false} />
                  <YAxis domain={[65, 100]} stroke="#a7f3d0" fontSize={11} unit="%" tickLine={false} />
                  <Tooltip
                    content={<LuxuryChartTooltip unit="%" subtitle="Evaluasi Kinerja Pengurus Pondok" />}
                    cursor={{ stroke: '#34d399', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Area
                    type="monotone"
                    dataKey="bulanLalu"
                    name="Kinerja Bulan Lalu (%)"
                    fill="url(#kpKinerjaAreaPrev)"
                    stroke="none"
                    legendType="none"
                    isAnimationActive={true}
                    animationDuration={1400}
                  />
                  <Area
                    type="monotone"
                    dataKey="bulanIni"
                    name="Kinerja Bulan Ini (%)"
                    fill="url(#kpKinerjaAreaCurr)"
                    stroke="none"
                    legendType="none"
                    isAnimationActive={true}
                    animationDuration={1600}
                  />
                  <Line
                    type="monotone"
                    dataKey="bulanLalu"
                    name="Kinerja Bulan Lalu (%)"
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
                    name="Kinerja Bulan Ini (%)"
                    stroke="url(#kpKinerjaLineCurr)"
                    strokeWidth={3.5}
                    filter="url(#glowKpKinerja)"
                    dot={<GlowingDot color="#10b981" accentColor="#f3d266" />}
                    activeDot={<GlowingActiveDot color="#10b981" accentColor="#f3d266" />}
                    isAnimationActive={true}
                    animationDuration={1700}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evaluasi Kinerja Pengurus */}
            <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Evaluasi Kinerja Pengurus per Divisi
              </h2>
            <form onSubmit={handleSaveEvaluasi} className="space-y-3 p-3.5 rounded-2xl bg-[#03160f] border border-emerald-800/70">
              <div className="grid grid-cols-2 gap-2.5">
                <select
                  value={evalForm.divisi}
                  onChange={e => setEvalForm({ ...evalForm, divisi: e.target.value as any })}
                  className="px-3 py-2 rounded-xl bg-black/60 border border-emerald-800 text-xs text-white"
                >
                  <option value="Sekretaris">Sekretaris</option>
                  <option value="Bendahara">Bendahara</option>
                  <option value="Perlengkapan">Perlengkapan</option>
                  <option value="Keamanan">Keamanan</option>
                  <option value="Umum">Seluruh Divisi</option>
                </select>
                <select
                  value={evalForm.nilaiKinerja}
                  onChange={e => setEvalForm({ ...evalForm, nilaiKinerja: e.target.value as any })}
                  className="px-3 py-2 rounded-xl bg-black/60 border border-emerald-800 text-xs text-white"
                >
                  <option value="Sangat Baik">Sangat Baik</option>
                  <option value="Baik">Baik</option>
                  <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                </select>
              </div>
              <input
                type="text"
                required
                placeholder="Judul Evaluasi..."
                value={evalForm.judul}
                onChange={e => setEvalForm({ ...evalForm, judul: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-emerald-800 text-xs text-white"
              />
              <textarea
                rows={2}
                required
                placeholder="Catatan Evaluasi & Rekomendasi..."
                value={evalForm.catatanEvaluasi}
                onChange={e => setEvalForm({ ...evalForm, catatanEvaluasi: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-emerald-800 text-xs text-white"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-[#d4af37] text-[#02120a] font-bold text-xs cursor-pointer"
              >
                Simpan Evaluasi Kinerja
              </button>
            </form>

            <div className="space-y-2.5">
              {evaluasiKepengurusan.map((ev) => (
                <div key={ev.id} className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#f3d266] font-bold">
                      Divisi {ev.divisi} · {ev.tanggal}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                      {ev.nilaiKinerja}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white">{ev.judul}</p>
                  <p className="text-[11px] text-emerald-100/80">{ev.catatanEvaluasi}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Catatan Rapat (Notulen Rapat) */}
          <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Catatan & Notulen Rapat Pleno Pengurus
            </h2>
            <div className="space-y-3">
              {(systemConfig.notulenRapatList || []).map((nt) => (
                <div key={nt.id} className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#f3d266]">
                    <span>{nt.tanggal} · {nt.waktu}</span>
                    <span>{nt.jumlahPeserta} Peserta Hadir</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{nt.judulRapat}</h3>
                  <p className="text-xs text-emerald-200/80">Agenda: {nt.agendaBahasan}</p>
                  <div className="p-3 rounded-xl bg-black/50 border border-emerald-900/70 text-[11px] text-emerald-100 whitespace-pre-line">
                    {nt.hasilKeputusan}
                  </div>
                  <p className="text-[10px] font-mono text-emerald-400">
                    Pimpinan: {nt.pimpinanRapat} · Notulis: {nt.notulis}
                  </p>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      )}

      {/* TAB 6: SURAT KEPUTUSAN (SK), PENGUMUMAN RESMI & PESAN KOORDINASI KE SETIAP PENGURUS */}
      {activeTab === 'sk_koordinasi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#f3d266]" />
              Kirim Pesan Koordinasi / Instruksi ke Pengurus
            </h2>
            <form onSubmit={handleKirimInstruksi} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Tujuan Pengurus / Divisi</label>
                <select
                  value={instruksiForm.tujuan}
                  onChange={e => setInstruksiForm({ ...instruksiForm, tujuan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                >
                  <option value="Seluruh Pengurus Divisi">Seluruh Pengurus Divisi</option>
                  <option value="Sekretaris Umum">Sekretaris Umum</option>
                  <option value="Bendahara Umum">Bendahara Umum</option>
                  <option value="Kepala Perlengkapan & Sarpras">Kepala Perlengkapan & Sarpras</option>
                  <option value="Ketua Dewan Keamanan">Ketua Dewan Keamanan</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Judul Pesan Koordinasi</label>
                <input
                  type="text"
                  required
                  value={instruksiForm.judul}
                  onChange={e => setInstruksiForm({ ...instruksiForm, judul: e.target.value })}
                  placeholder="Contoh: Persiapan Audit Akhir Bulan..."
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">Isi Instruksi / Koordinasi</label>
                <textarea
                  rows={3}
                  required
                  value={instruksiForm.isi}
                  onChange={e => setInstruksiForm({ ...instruksiForm, isi: e.target.value })}
                  placeholder="Tuliskan arahan resmi Ketua Pondok..."
                  className="w-full px-3 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Kirim Pesan Koordinasi
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Arsip Surat Keputusan (SK) & Pengumuman Resmi Pondok
            </h2>
            <div className="space-y-3">
              {skDanPengumumanList.map((sk) => (
                <div key={sk.id} className="p-4 rounded-2xl bg-[#03160f] border border-emerald-800/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
                      {sk.namaJenis}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300">{sk.nomorSurat} · {sk.tanggalSurat}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{sk.perihal}</h3>
                  <p className="text-xs text-emerald-100/80 line-clamp-3">{sk.isiSurat}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: LAPORAN BULANAN YANG BISA DICETAK (A4) */}
      {activeTab === 'laporan_bulanan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#041d14] border border-[#d4af37]/40 rounded-2xl p-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase">Laporan Eksekutif Bulanan Ketua Pondok (Siap Cetak A4)</h2>
              <p className="text-xs text-emerald-200/75">Rekapitulasi menyeluruh kinerja divisi, keuangan, sekretariat, perlengkapan, dan keamanan</p>
            </div>
            <button
              onClick={handlePrintLaporanBulanan}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Printer className="w-4 h-4" /> Cetak Laporan Bulanan (A4)
            </button>
          </div>

          <div
            id="ketua-laporan-bulanan-print"
            className="bg-white text-black rounded-2xl p-8 max-w-4xl mx-auto shadow-2xl border border-zinc-300"
          >
            <div className="text-center border-b-4 border-double border-black pb-4 mb-6">
              <h1 className="text-lg font-black uppercase">YAYASAN PENDIDIKAN ISLAM SALAF AL-MALIKI</h1>
              <h2 className="text-xl font-black uppercase">PONDOK PESANTREN SALAF AL-MALIKI</h2>
              <p className="text-xs">Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361</p>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-base font-bold uppercase underline">LAPORAN EKSEKUTIF BULANAN KETUA PONDOK PESANTREN</h3>
              <p className="text-xs mt-1">Periode Laporan: Bulan November 2026 / Jumadil Awal 1448 H</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold uppercase mb-1">I. Ringkasan Kinerja & Kedisiplinan</h4>
                <p>1. Indeks Capaian Kinerja Pengurus Bulan Ini: <strong>{executiveMetrics.avgKinerja}%</strong> (Bulan Lalu: {executiveMetrics.kinerjaBulanLalu}%)</p>
                <p>2. Indeks Kedisiplinan Santri Bulan Ini: <strong>{executiveMetrics.disiplinBulanIni}%</strong> (Bulan Lalu: {executiveMetrics.disiplinBulanLalu}%)</p>
                <p>3. Total Santri Aktif: <strong>{santriList.length} Santri</strong> · Total Ustadz/Ustadzah Aktif: <strong>{(systemConfig.ustadzList || []).length} Asatidz</strong></p>
              </div>

              <div>
                <h4 className="font-bold uppercase mb-1">II. Rekapitulasi Kas & Keuangan (Bendahara)</h4>
                <p>1. Total Pemasukan Kas Pondok: <strong>{formatRupiah(executiveMetrics.pemasukan)}</strong></p>
                <p>2. Total Pengeluaran Operasional: <strong>{formatRupiah(executiveMetrics.pengeluaran)}</strong></p>
                <p>3. Saldo Akhir Kas Pondok: <strong>{formatRupiah(executiveMetrics.saldoKas)}</strong></p>
              </div>

              <div>
                <h4 className="font-bold uppercase mb-1">III. Administrasi Sekretariat, Perlengkapan & Keamanan</h4>
                <p>1. Total Arsip Surat Resmi: <strong>{arsipSurat.length} Berkas</strong> ({arsipSurat.filter(s => s.arah === 'Keluar').length} Keluar, {arsipSurat.filter(s => s.arah === 'Masuk').length} Masuk)</p>
                <p>2. Total Inventaris Sarpras: <strong>{barangInventaris.reduce((a, b) => a + b.jumlah, 0)} Unit</strong></p>
                <p>3. Catatan Perizinan & Ketertiban: <strong>{perizinanList.length} Perizinan</strong> · <strong>{pelanggaranList.length} Catatan Pelanggaran</strong></p>
              </div>

              <div className="pt-8 flex justify-end">
                <div className="text-center w-64">
                  <p>Karawang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-bold mt-1">Ketua Pondok Pesantren Salaf Al-Maliki</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{currentUser.nama}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
