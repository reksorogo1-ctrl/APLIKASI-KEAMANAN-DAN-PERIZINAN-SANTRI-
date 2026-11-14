import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  GraduationCap,
  Users,
  FileCheck,
  QrCode,
  Activity,
  BookOpen,
  ShieldAlert,
  Gavel,
  ShieldCheck,
  BarChart3,
  Database,
  Calendar,
  Printer,
  Sliders,
  Megaphone,
  Award,
  TrendingUp,
  CheckCircle2,
  Save,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  GlowingDot,
  GlowingActiveDot,
  LuxuryChartTooltip,
} from './LuxuryChartComponents';
import {
  Santri,
  DewanKeamanan,
  Perizinan,
  TataTertib,
  Pelanggaran,
  Sanksi,
  UserAccount,
  LogAktivitas,
  PesanKoordinasi,
  SystemConfig,
  AgendaPengurus,
} from '../types';
import { KeamananSubTab } from './Sidebar';
import { Dashboard } from './Dashboard';
import { KoordinasiList } from './KoordinasiList';
import { SantriPerKelas } from './SantriPerKelas';
import { SantriList } from './SantriList';
import { DewanKeamananList } from './DewanKeamananList';
import { PerizinanList } from './PerizinanList';
import { GateScanner } from './GateScanner';
import { MonitoringRealtime } from './MonitoringRealtime';
import { TataTertibList } from './TataTertibList';
import { PelanggaranList } from './PelanggaranList';
import { SanksiList } from './SanksiList';
import { LaporanStatistik } from './LaporanStatistik';
import { DatabaseSettings } from './DatabaseSettings';
import { openPrintWindow } from '../utils/printDocument';
import { storageService } from '../services/storageService';

interface KeamananModuleProps {
  subTab: KeamananSubTab;
  onChangeSubTab: (tab: KeamananSubTab) => void;
  currentUser: UserAccount;
  systemConfig?: SystemConfig;
  agendaPengurus?: AgendaPengurus[];
  genderScope: 'all' | 'putra' | 'putri';
  santriList: Santri[];
  scopedSantriList: Santri[];
  dewanList: DewanKeamanan[];
  perizinanList: Perizinan[];
  scopedPerizinanList: Perizinan[];
  tataTertibList: TataTertib[];
  pelanggaranList: Pelanggaran[];
  scopedPelanggaranList: Pelanggaran[];
  sanksiList: Sanksi[];
  scopedSanksiList: Sanksi[];
  logsList: LogAktivitas[];
  koordinasiList: PesanKoordinasi[];
  pendingApprovalsCount: number;
  lateSantriCount: number;
  unreadKoordinasiCount: number;
  preSelectedPelanggaran: Pelanggaran | null;
  onClearPreSelectedPelanggaran: () => void;
  onOpenSanksiFromPelanggaran: (pelanggaran: Pelanggaran) => void;
  onViewSuratIzin: (izin: Perizinan) => void;
  onOpenQRScanner: () => void;
}

export const KeamananModule: React.FC<KeamananModuleProps> = ({
  subTab,
  onChangeSubTab,
  currentUser,
  systemConfig: propSystemConfig,
  agendaPengurus: propAgendaPengurus,
  genderScope,
  santriList,
  scopedSantriList,
  dewanList,
  perizinanList,
  scopedPerizinanList,
  tataTertibList,
  pelanggaranList,
  scopedPelanggaranList,
  sanksiList,
  scopedSanksiList,
  logsList,
  koordinasiList,
  pendingApprovalsCount,
  lateSantriCount,
  unreadKoordinasiCount,
  preSelectedPelanggaran,
  onClearPreSelectedPelanggaran,
  onOpenSanksiFromPelanggaran,
  onViewSuratIzin,
  onOpenQRScanner,
}) => {
  const systemConfig = propSystemConfig || storageService.getSystemConfig();
  const agendaPengurus = propAgendaPengurus || storageService.getAgendaPengurus();
  const isAdminOrKetua = currentUser.role === 'admin' || currentUser.role === 'ketua_pondok';

  // State for Laporan Periodik (Harian / Mingguan / Bulanan)
  const [periodeLaporan, setPeriodeLaporan] = useState<'Harian' | 'Mingguan' | 'Bulanan'>('Bulanan');

  // State for Option Panel Keamanan (Format Surat Pelanggaran & Sanksi Edukatif)
  const [formatSanksiForm, setFormatSanksiForm] = useState({
    kopSuratBaris1: systemConfig.kopSuratBaris1 || 'PONDOK PESANTREN SALAF AL-MALIKI',
    kopSuratBaris2: systemConfig.kopSuratBaris2 || 'DEWAN KEAMANAN DAN KETERTIBAN SANTRI (KAMTIB)',
    alamatKopSurat: systemConfig.alamatKopSurat || 'Jl. Pesantren Luhur No. 99, Karawang',
    judulSuratSanksi:
      systemConfig.judulSuratSanksi || 'SURAT KEPUTUSAN PELANGGARAN & SANKSI EDUKATIF (TAKZIR)',
    pembukaSuratSanksi:
      systemConfig.pembukaSuratSanksi ||
      'Berdasarkan hasil pemeriksaan Dewan Keamanan dan Ketertiban Pondok Pesantren Salaf Al-Maliki, ditetapkan bahwa santri berikut:',
    penutupSuratSanksi:
      systemConfig.penutupSuratSanksi ||
      'Demikian Surat Sanksi Edukatif (Takzir) ini diterbitkan sebagai sarana pembinaan akhlaq dan kedisiplinan santri.',
    catatanKakiSuratSanksi:
      systemConfig.catatanKakiSuratSanksi ||
      'Wajib ditandatangani oleh Santri, Ustadz Pembina, dan Ketua Dewan Keamanan.',
    ketuaKeamananPutra: systemConfig.ketuaKeamananPutra || 'Ust. H. Mahrus Ali, S.Pd.I',
    ketuaKeamananPutri: systemConfig.ketuaKeamananPutri || 'Ustzh. Hj. Nabilah Al-Maliki',
    hotlineWa: systemConfig.hotlineWa || '0812-9988-7766',
  });
  const [optionSavedMsg, setOptionSavedMsg] = useState('');

  const handleSaveFormatSanksi = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.updateSystemConfig(formatSanksiForm);
    setOptionSavedMsg('Format Dokumen Surat Pelanggaran & Sanksi Edukatif berhasil disimpan!');
    setTimeout(() => setOptionSavedMsg(''), 4000);
  };

  // Metrics for Tab Dashboard Utama Keamanan
  const santriStats = useMemo(() => {
    const aktif = santriList.filter((s) => s.status !== 'Alumni');
    const putra = aktif.filter((s) => s.gender === 'putra').length;
    const putri = aktif.filter((s) => s.gender === 'putri').length;
    const izinAktif = perizinanList.filter(
      (p) => p.status === 'Sedang Keluar' || p.status === 'Terlambat'
    );
    const sakitCount = izinAktif.filter((p) => p.jenisIzin === 'Izin Berobat').length;
    const pulangCount = izinAktif.filter((p) => p.jenisIzin === 'Izin Pulang').length;
    const diPondokCount = Math.max(0, aktif.length - izinAktif.length);
    const ustadzList = systemConfig.ustadzList || systemConfig.dataUstadzList || [];
    const ustadzPutra = ustadzList.filter((u) => u.statusAktif && u.gender === 'ustadz').length || 18;
    const ustadzahPutri = ustadzList.filter((u) => u.statusAktif && u.gender === 'ustadzah').length || 14;

    return {
      totalSantri: aktif.length,
      putra,
      putri,
      sakitCount,
      pulangCount,
      diPondokCount,
      ustadzPutra,
      ustadzahPutri,
      totalUstadz: ustadzPutra + ustadzahPutri,
    };
  }, [santriList, perizinanList, systemConfig.ustadzList, systemConfig.dataUstadzList]);

  // Indikator Penilaian Kinerja Keamanan (Pie Chart & %)
  const kinerjaKeamananScore = useMemo(() => {
    const totalIzin = Math.max(1, scopedPerizinanList.length);
    const tepatWaktu = scopedPerizinanList.filter((p) => p.status !== 'Terlambat').length;
    const sanksiSelesai = scopedSanksiList.filter((s) => s.status === 'Selesai').length;
    const totalSanksi = Math.max(1, scopedSanksiList.length);
    const score = Math.min(
      99,
      Math.max(78, Math.round((tepatWaktu / totalIzin) * 60 + (sanksiSelesai / totalSanksi) * 40))
    );
    return score;
  }, [scopedPerizinanList, scopedSanksiList]);

  const kedisiplinanComparison = useMemo(() => {
    const list = systemConfig.kinerjaBulananList || [
      { bulan: 'Jul', skorKinerjaPengurus: 86, skorKedisiplinanSantri: 88 },
      { bulan: 'Agu', skorKinerjaPengurus: 88, skorKedisiplinanSantri: 90 },
      { bulan: 'Sep', skorKinerjaPengurus: 89, skorKedisiplinanSantri: 87 },
      { bulan: 'Okt', skorKinerjaPengurus: 91, skorKedisiplinanSantri: 91 },
      { bulan: 'Nov', skorKinerjaPengurus: 94, skorKedisiplinanSantri: 95 },
    ];
    const curr = list[list.length - 1]?.skorKedisiplinanSantri ?? 95;
    const prev = list[list.length - 2]?.skorKedisiplinanSantri ?? 91;
    const diff = curr - prev;
    return { list, curr, prev, diff };
  }, [systemConfig.kinerjaBulananList]);

  const pertumbuhanTahunan = useMemo(() => {
    return (
      systemConfig.pertumbuhanSantriTahunan || [
        { tahun: '2022', putra: 210, putri: 175, total: 385 },
        { tahun: '2023', putra: 245, putri: 205, total: 450 },
        { tahun: '2024', putra: 280, putri: 240, total: 520 },
        { tahun: '2025', putra: 320, putri: 275, total: 595 },
        { tahun: '2026', putra: 365, putri: 315, total: 680 },
      ]
    );
  }, [systemConfig.pertumbuhanSantriTahunan]);

  const tabs: {
    id: KeamananSubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeTone?: 'red' | 'amber' | 'gold';
    adminOnly?: boolean;
  }[] = [
    { id: 'ringkasan', label: 'Dashboard Utama', icon: LayoutDashboard },
    {
      id: 'koordinasi',
      label: 'Kotak Masuk & Pesan',
      icon: MessageSquare,
      badge: unreadKoordinasiCount > 0 ? unreadKoordinasiCount : undefined,
      badgeTone: 'gold',
    },
    {
      id: 'perizinan',
      label: 'Perizinan Santri',
      icon: FileCheck,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeTone: 'amber',
    },
    {
      id: 'monitoring',
      label: 'Radar Monitoring',
      icon: Activity,
      badge: lateSantriCount > 0 ? lateSantriCount : undefined,
      badgeTone: 'red',
    },
    { id: 'pelanggaran', label: 'Pelanggaran', icon: ShieldAlert },
    { id: 'sanksi', label: 'Sanksi', icon: Gavel },
    { id: 'santri', label: 'Data Santri', icon: Users },
    { id: 'tata_tertib', label: 'Tata Tertib & Piket', icon: BookOpen },
    { id: 'laporan', label: 'Laporan', icon: BarChart3 },
    { id: 'option_keamanan', label: 'Option Panel Keamanan', icon: Sliders },
    { id: 'pos_gerbang', label: 'Pos Gerbang', icon: QrCode },
    { id: 'santri_per_kelas', label: 'Santri Kelas', icon: GraduationCap },
    { id: 'database', label: 'Audit & DB', icon: Database, adminOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdminOrKetua);

  return (
    <div className="space-y-5">
      {/* Sub-Navigation Bar for Dashboard Keamanan */}
      <div className="luxury-3d-card rounded-2xl p-3 sm:p-4 border border-[#d4af37]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-emerald-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/45 text-[#e5c158]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#f4f9f5] tracking-wide uppercase">
                Dashboard Dewan Keamanan &amp; Ketertiban Pondok (SIM-KAMTIB)
              </h2>
              <p className="text-[11px] text-emerald-200/75">
                Dashboard Utama Keamanan, Kotak Masuk, Perizinan Real-Time WIB, Radar Monitoring, Pelanggaran, Sanksi, Tata Tertib &amp; Option Panel Keamanan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#e5c158]">
            <span>{scopedSantriList.length} Santri Terpantau</span>
            <span aria-hidden="true">·</span>
            <span>{scopedPerizinanList.length} Arsip Izin</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeSubTab(tab.id)}
                className={`tactile-interactive inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer border transition-all ${
                  active
                    ? 'bg-gradient-to-r from-[#0b422d] to-[#06281c] text-white border-[#d4af37] shadow-[0_4px_14px_-4px_rgba(212,175,55,0.35)]'
                    : 'bg-[#03160f]/80 text-emerald-100/80 hover:text-white hover:bg-[#072c1e] border-emerald-800/45 hover:border-[#d4af37]/45'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#f3d266]' : 'text-emerald-300'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded ${
                      tab.badgeTone === 'red'
                        ? 'bg-red-950/90 text-red-300 border border-red-500/50'
                        : 'bg-[#d4af37]/25 text-[#f3d266] border border-[#d4af37]/50'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Keamanan Sub-View */}
      <div>
        {/* 1. TAB DASHBOARD UTAMA KEAMANAN (MENGGANTIKAN DASBOR KAMTIB) */}
        {subTab === 'ringkasan' && (
          <div className="space-y-6">
            {/* Ucapan Selamat Datang & Notifikasi Permintaan Surat / Pesan dari Divisi Lain */}
            <div className="rounded-3xl bg-gradient-to-r from-[#062c1e] via-[#041d14] to-[#03150e] border border-[#d4af37]/45 p-5 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.nama}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-[#d4af37]"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center text-[#f3d266]">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                  )}
                  <div>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-widest bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
                      DASHBOARD UTAMA DEWAN KEAMANAN PONDOK
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                      Ahlan wa Sahlan, {currentUser.nama} ({currentUser.jabatan})
                    </h2>
                    <p className="text-xs text-emerald-200/80">
                      Pantau indikator kinerja keamanan, berita terkini pondok, kedisiplinan santri, kalender kegiatan, & operasional Kamtib secara real-time.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onChangeSubTab('koordinasi')}
                    className="px-3.5 py-2 rounded-xl bg-[#d4af37] text-[#02120a] font-bold text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Kotak Masuk ({koordinasiList.length})
                  </button>
                  <button
                    onClick={() => onChangeSubTab('perizinan')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-800/70 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                  >
                    Perizinan ({pendingApprovalsCount} Menunggu)
                  </button>
                </div>
              </div>

              {/* Notifikasi Pesan dari Divisi Lain */}
              {koordinasiList.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-emerald-800/50">
                  {koordinasiList.slice(0, 3).map((k) => (
                    <div
                      key={k.id}
                      onClick={() => onChangeSubTab('koordinasi')}
                      className="p-3 rounded-xl bg-[#03160f]/90 border border-emerald-800/70 hover:border-[#d4af37]/60 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#f3d266]">
                        <span>Dari: {k.pengirimNama}</span>
                        <span>{k.prioritas}</span>
                      </div>
                      <p className="text-xs font-bold text-white truncate mt-0.5">{k.judul}</p>
                      <p className="text-[11px] text-emerald-200/75 line-clamp-1">{k.isi}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Kartu Berita yang Sama pada Dashboard Admin */}
            <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/35 p-4 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Megaphone className="w-4 h-4 text-[#f3d266]" />
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  Kartu Berita &amp; Informasi Terkini Pondok Pesantren Salaf Al-Maliki
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {(systemConfig.beritaTerkini || systemConfig.beritaTerkiniList || []).map((b, idx) => {
                  const defaultImages = [
                    'https://images.unsplash.com/photo-1584286595398-a59f21d313f5?auto=format&fit=crop&w=900&q=80',
                    'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=900&q=80',
                    'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=900&q=80',
                  ];
                  const imgSrc = b.gambarUrl || defaultImages[idx % defaultImages.length];
                  return (
                    <div
                      key={b.id}
                      className="rounded-xl bg-[#03160f] border border-emerald-800/60 overflow-hidden flex flex-col justify-between group"
                    >
                      <div className="relative h-32 w-full overflow-hidden bg-[#02100a] border-b border-emerald-800/50">
                        <img
                          src={imgSrc}
                          alt={b.judul}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#03160f] via-transparent to-black/35 pointer-events-none" />
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-[#f3d266]">
                          <span className="px-2 py-0.5 rounded bg-[#02120a]/85 border border-[#d4af37]/45">
                            {b.kategori}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#02120a]/80 text-emerald-200">
                            {b.tanggal}
                          </span>
                        </div>
                      </div>
                      <div className="p-3.5 space-y-1">
                        <h4 className="text-xs font-bold text-white">{b.judul}</h4>
                        <p className="text-[11px] text-emerald-100/80 line-clamp-2">{b.isi}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kartu Ringkasan Jumlah Santri Putra, Putri, Santri Muqim, Izin, Sakit & Ustadz/Ustadzah Aktif (Di Atas Pie Chart Kinerja) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#041d14] border border-emerald-700/50">
                <p className="text-[10px] font-mono uppercase text-emerald-300">Total Santri Aktif</p>
                <p className="text-xl font-extrabold font-mono text-white mt-1">
                  {santriStats.totalSantri}
                </p>
                <p className="text-[10px] text-emerald-200/75">
                  Putra: {santriStats.putra} · Putri: {santriStats.putri}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#041d14] border border-emerald-700/50">
                <p className="text-[10px] font-mono uppercase text-emerald-300">Santri Putra &amp; Putri</p>
                <p className="text-xl font-extrabold font-mono text-[#f3d266] mt-1">
                  {santriStats.putra} / {santriStats.putri}
                </p>
                <p className="text-[10px] text-emerald-200/75">Asrama Banin &amp; Banat</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#041d14] border border-emerald-700/50">
                <p className="text-[10px] font-mono uppercase text-emerald-300">Santri Muqim</p>
                <p className="text-xl font-extrabold font-mono text-emerald-400 mt-1">
                  {santriStats.diPondokCount}
                </p>
                <p className="text-[10px] text-emerald-200/75">Berada di Pondok</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#041d14] border border-amber-500/40">
                <p className="text-[10px] font-mono uppercase text-amber-300">Santri Izin Pulang</p>
                <p className="text-xl font-extrabold font-mono text-[#f3d266] mt-1">
                  {santriStats.pulangCount}
                </p>
                <p className="text-[10px] text-emerald-200/75">Izin bermalam aktif</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#041d14] border border-rose-500/40">
                <p className="text-[10px] font-mono uppercase text-rose-300">Santri Sakit</p>
                <p className="text-xl font-extrabold font-mono text-rose-300 mt-1">
                  {santriStats.sakitCount}
                </p>
                <p className="text-[10px] text-emerald-200/75">Rawat jalan / berobat</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#041d14] border border-[#d4af37]/50">
                <p className="text-[10px] font-mono uppercase text-[#f3d266]">
                  Ustadz &amp; Ustadzah
                </p>
                <p className="text-xl font-extrabold font-mono text-[#f3d266] mt-1">
                  {santriStats.totalUstadz} Aktif
                </p>
                <p className="text-[10px] text-emerald-200/75">
                  Ustadz: {santriStats.ustadzPutra} · Ustadzah: {santriStats.ustadzahPutri}
                </p>
              </div>
            </div>

            {/* Pie Chart Indikator Penilaian Kinerja Keamanan (Di Bawah Kartu Ringkasan Santri & Ustadz) */}
            <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl flex flex-col sm:flex-row items-center gap-5">
              <div className="w-36 h-36 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Kinerja Keamanan', value: kinerjaKeamananScore },
                        { name: 'Ruang Evaluasi', value: Math.max(0, 100 - kinerjaKeamananScore) },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#06281c" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black font-mono text-white">
                    {kinerjaKeamananScore}%
                  </span>
                  <span className="text-[9px] font-mono uppercase text-[#f3d266]">SANGAT BAIK</span>
                </div>
              </div>
              <div className="space-y-1.5 text-center sm:text-left">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  PIE CHART INDIKATOR KINERJA PENGURUS KEAMANAN
                </span>
                <h3 className="text-sm font-extrabold text-white uppercase">
                  Indikator Penilaian Kinerja Keamanan Secara Keseluruhan
                </h3>
                <p className="text-xs text-emerald-200/80">
                  Dihitung otomatis dari ketepatan waktu kepulangan izin santri, pengawasan pos gerbang, dan ketuntasan pembinaan sanksi edukatif.
                </p>
              </div>
            </div>

            {/* Grafik Line Chart Kedisiplinan Santri + Diagram Santri dari Tahun ke Tahun */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Line Chart Kedisiplinan Santri */}
              <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white uppercase">
                      Grafik Line Chart Kedisiplinan Santri
                    </h3>
                    <p className="text-[11px] text-emerald-200/75">
                      Bulan Ini: <strong className="text-white">{kedisiplinanComparison.curr}%</strong> vs Bulan Lalu:{' '}
                      <strong className="text-emerald-300">{kedisiplinanComparison.prev}%</strong>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">
                    {kedisiplinanComparison.diff >= 0 ? `+${kedisiplinanComparison.diff}%` : `${kedisiplinanComparison.diff}%`}
                  </span>
                </div>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={kedisiplinanComparison.list}
                      margin={{ top: 12, right: 16, left: -12, bottom: 4 }}
                    >
                      <defs>
                        <filter id="glowKamDisiplin" x="-25%" y="-25%" width="150%" height="150%">
                          <feGaussianBlur stdDeviation="3.5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        <linearGradient id="kamDisiplinLine" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="55%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#f3d266" />
                        </linearGradient>
                        <linearGradient id="kamDisiplinArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="55%" stopColor="#10b981" stopOpacity={0.14} />
                          <stop offset="100%" stopColor="#041d14" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0b3b28" opacity={0.45} />
                      <XAxis dataKey="bulan" stroke="#a7f3d0" fontSize={11} tickLine={false} />
                      <YAxis domain={[70, 100]} stroke="#a7f3d0" fontSize={11} unit="%" tickLine={false} />
                      <Tooltip
                        content={<LuxuryChartTooltip unit="%" subtitle="Indeks Kedisiplinan Santri" />}
                        cursor={{ stroke: '#34d399', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="skorKedisiplinanSantri"
                        name="Indeks Kedisiplinan (%)"
                        fill="url(#kamDisiplinArea)"
                        stroke="none"
                        legendType="none"
                        isAnimationActive={true}
                        animationDuration={1500}
                      />
                      <Line
                        type="monotone"
                        dataKey="skorKedisiplinanSantri"
                        name="Indeks Kedisiplinan (%)"
                        stroke="url(#kamDisiplinLine)"
                        strokeWidth={3.5}
                        filter="url(#glowKamDisiplin)"
                        dot={<GlowingDot color="#10b981" accentColor="#f3d266" />}
                        activeDot={<GlowingActiveDot color="#10b981" accentColor="#f3d266" />}
                        isAnimationActive={true}
                        animationDuration={1700}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Diagram Santri dari Tahun ke Tahun */}
              <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white uppercase">
                      Grafik Diagram Santri dari Tahun ke Tahun
                    </h3>
                    <p className="text-[11px] text-emerald-200/75">
                      Pertumbuhan jumlah santri putra &amp; putri Pondok Pesantren Salaf Al-Maliki
                    </p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-[#f3d266]" />
                </div>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pertumbuhanTahunan}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0b3b28" />
                      <XAxis dataKey="tahun" stroke="#a7f3d0" fontSize={11} />
                      <YAxis stroke="#a7f3d0" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#03150e',
                          borderColor: '#d4af37',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="putra" name="Santri Putra" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="putri" name="Santri Putri" fill="#d4af37" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Kalender Kegiatan (Hijriah dan Masehi) */}
            <div className="rounded-2xl bg-[#041d14]/95 border border-emerald-700/45 p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#f3d266]" />
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                  Kalender Kegiatan Pondok Pesantren (Hijriah &amp; Masehi)
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {agendaPengurus.slice(0, 6).map((ag) => (
                  <div
                    key={ag.id}
                    className="p-3.5 rounded-xl bg-[#03160f] border border-emerald-800/60 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#f3d266] font-bold">{ag.tanggal} M</span>
                      <span className="text-emerald-300">{ag.tanggalHijriah || '1448 H'}</span>
                    </div>
                    <p className="text-xs font-bold text-white">{ag.judul}</p>
                    <p className="text-[11px] text-emerald-200/75">
                      {ag.waktu} · {ag.lokasi}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mengelola Seluruh Sistem Keamanan yang Sudah Ada Sebelumnya */}
            <Dashboard
              santriList={scopedSantriList}
              perizinanList={scopedPerizinanList}
              pelanggaranList={scopedPelanggaranList}
              sanksiList={scopedSanksiList}
              currentUser={currentUser}
              onNavigate={(nextSub) => onChangeSubTab(nextSub)}
              onViewSuratIzin={onViewSuratIzin}
              onOpenQRScanner={onOpenQRScanner}
            />
          </div>
        )}

        {/* 2. TAB KOTAK MASUK & PESAN */}
        {subTab === 'koordinasi' && (
          <KoordinasiList currentUser={currentUser} koordinasiList={koordinasiList} />
        )}

        {/* 3. TAB SANTRI PER KELAS */}
        {subTab === 'santri_per_kelas' && (
          <SantriPerKelas
            santriList={scopedSantriList}
            perizinanList={scopedPerizinanList}
            pelanggaranList={scopedPelanggaranList}
            currentUser={currentUser}
            onNavigateToPermitWithSantri={() => onChangeSubTab('perizinan')}
            onNavigateToPelanggaranWithSantri={() => onChangeSubTab('pelanggaran')}
          />
        )}

        {/* 4. TAB DATA SANTRI (TERHUBUNG KE DASHBOARD SEKRETARIS) */}
        {subTab === 'santri' && (
          <SantriList santriList={scopedSantriList} currentGenderScope={genderScope} />
        )}

        {/* 5. TAB DEWAN PIKET */}
        {subTab === 'dewan_keamanan' && <DewanKeamananList dewanList={dewanList} />}

        {/* 6. TAB PERIZINAN SANTRI */}
        {subTab === 'perizinan' && (
          <PerizinanList
            perizinanList={scopedPerizinanList}
            santriList={scopedSantriList}
            currentUser={currentUser}
            onViewSuratIzin={onViewSuratIzin}
          />
        )}

        {/* 7. POS GERBANG */}
        {subTab === 'pos_gerbang' && (
          <GateScanner
            perizinanList={scopedPerizinanList}
            santriList={scopedSantriList}
            currentUser={currentUser}
            onViewSuratIzin={onViewSuratIzin}
            onOpenQRScanner={onOpenQRScanner}
          />
        )}

        {/* 8. TAB RADAR MONITORING */}
        {subTab === 'monitoring' && (
          <MonitoringRealtime
            perizinanList={scopedPerizinanList}
            pelanggaranList={scopedPelanggaranList}
            sanksiList={scopedSanksiList}
            currentUser={currentUser}
            onViewSuratIzin={onViewSuratIzin}
          />
        )}

        {/* 9. TAB TATA TERTIB + JADWAL PIKET DAN ABSENSI KEHADIRAN KEAMANAN */}
        {subTab === 'tata_tertib' && (
          <div className="space-y-8">
            <TataTertibList tataTertibList={tataTertibList} />
            <div className="pt-4 border-t border-[#d4af37]/30">
              <DewanKeamananList dewanList={dewanList} />
            </div>
          </div>
        )}

        {/* 10. TAB PELANGGARAN */}
        {subTab === 'pelanggaran' && (
          <PelanggaranList
            pelanggaranList={scopedPelanggaranList}
            santriList={scopedSantriList}
            tataTertibList={tataTertibList}
            currentUser={currentUser}
            onOpenSanksiModalForPelanggaran={onOpenSanksiFromPelanggaran}
          />
        )}

        {/* 11. TAB SANKSI */}
        {subTab === 'sanksi' && (
          <SanksiList
            sanksiList={scopedSanksiList}
            pelanggaranList={scopedPelanggaranList}
            santriList={scopedSantriList}
            currentUser={currentUser}
            preSelectedPelanggaran={preSelectedPelanggaran}
            onClearPreSelectedPelanggaran={onClearPreSelectedPelanggaran}
          />
        )}

        {/* 12. TAB LAPORAN (HARIAN, MINGGUAN, DAN BULANAN BESERTA GRAFIKNYA + STATISTIK KEDISIPLINAN) */}
        {(subTab === 'laporan' || subTab === 'laporan_mingguan') && (
          <div className="space-y-6">
            {/* Selector Laporan Harian, Mingguan, dan Bulanan beserta Grafiknya */}
            <div className="rounded-2xl bg-[#041d14]/95 border border-[#d4af37]/40 p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
                    LAPORAN HARIAN, MINGGUAN, &amp; BULANAN BESERTA GRAFIKNYA
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-white mt-1">
                    Laporan Statistik Kedisiplinan &amp; Indikator Keberhasilan Keamanan ({periodeLaporan})
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(['Harian', 'Mingguan', 'Bulanan'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriodeLaporan(p)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        periodeLaporan === p
                          ? 'bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a]'
                          : 'bg-[#03160f] text-emerald-200 border border-emerald-800'
                      }`}
                    >
                      Laporan {p}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      openPrintWindow(
                        'keamanan-laporan-periodik-print',
                        `Laporan_Keamanan_${periodeLaporan}_AlMaliki`
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Cetak Laporan {periodeLaporan} (A4)
                  </button>
                </div>
              </div>

              {/* Grafik Statistik Kedisiplinan & Indikator Keberhasilan Keamanan */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
                <div className="lg:col-span-7 h-56 bg-[#03160f] p-4 rounded-2xl border border-emerald-800/60">
                  <p className="text-xs font-bold text-[#f3d266] uppercase mb-2">
                    Grafik Tren Kedisiplinan &amp; Evaluasi Keamanan ({periodeLaporan})
                  </p>
                  <ResponsiveContainer width="100%" height="85%">
                    <ComposedChart
                      data={kedisiplinanComparison.list}
                      margin={{ top: 10, right: 16, left: -12, bottom: 2 }}
                    >
                      <defs>
                        <filter id="glowKamLaporan" x="-25%" y="-25%" width="150%" height="150%">
                          <feGaussianBlur stdDeviation="3.5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        <linearGradient id="kamLaporanArea1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#03160f" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="kamLaporanArea2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f3d266" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#03160f" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0b3b28" opacity={0.45} />
                      <XAxis dataKey="bulan" stroke="#a7f3d0" fontSize={11} tickLine={false} />
                      <YAxis domain={[70, 100]} stroke="#a7f3d0" fontSize={11} unit="%" tickLine={false} />
                      <Tooltip
                        content={<LuxuryChartTooltip unit="%" subtitle={`Laporan Evaluasi ${periodeLaporan}`} />}
                        cursor={{ stroke: '#f3d266', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Area
                        type="monotone"
                        dataKey="skorKinerjaPengurus"
                        name="Indikator Keberhasilan Keamanan (%)"
                        fill="url(#kamLaporanArea2)"
                        stroke="none"
                        legendType="none"
                        isAnimationActive={true}
                        animationDuration={1400}
                      />
                      <Area
                        type="monotone"
                        dataKey="skorKedisiplinanSantri"
                        name="Kedisiplinan Santri (%)"
                        fill="url(#kamLaporanArea1)"
                        stroke="none"
                        legendType="none"
                        isAnimationActive={true}
                        animationDuration={1600}
                      />
                      <Line
                        type="monotone"
                        dataKey="skorKinerjaPengurus"
                        name="Indikator Keberhasilan Keamanan (%)"
                        stroke="#f3d266"
                        strokeWidth={3}
                        filter="url(#glowKamLaporan)"
                        dot={<GlowingDot color="#d4af37" accentColor="#f3d266" />}
                        activeDot={<GlowingActiveDot color="#d4af37" accentColor="#ffffff" />}
                        isAnimationActive={true}
                        animationDuration={1500}
                      />
                      <Line
                        type="monotone"
                        dataKey="skorKedisiplinanSantri"
                        name="Kedisiplinan Santri (%)"
                        stroke="#10b981"
                        strokeWidth={3.5}
                        filter="url(#glowKamLaporan)"
                        dot={<GlowingDot color="#10b981" accentColor="#f3d266" />}
                        activeDot={<GlowingActiveDot color="#10b981" accentColor="#f3d266" />}
                        isAnimationActive={true}
                        animationDuration={1700}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="lg:col-span-5 bg-[#03160f] p-4 rounded-2xl border border-emerald-800/60 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#f3d266] uppercase flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#f3d266]" />
                      Indikator Keberhasilan Keamanan ({kinerjaKeamananScore}%)
                    </p>
                    <p className="text-[11px] text-emerald-200/80 mt-1">
                      Evaluasi capaian ketertiban perizinan, kepatuhan jam kembali WIB, dan penurunan pelanggaran santri.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 my-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#041d14] border border-emerald-800/60">
                      <span className="text-[10px] font-mono text-emerald-300">Kepatuhan Izin</span>
                      <p className="text-base font-extrabold text-white">
                        {Math.round(
                          (scopedPerizinanList.filter((p) => p.status !== 'Terlambat').length /
                            Math.max(1, scopedPerizinanList.length)) *
                            100
                        )}
                        %
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#041d14] border border-emerald-800/60">
                      <span className="text-[10px] font-mono text-emerald-300">Pembinaan Takzir</span>
                      <p className="text-base font-extrabold text-[#f3d266]">
                        {scopedSanksiList.filter((s) => s.status === 'Selesai').length}/
                        {scopedSanksiList.length} Tuntas
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] font-mono text-emerald-300">
                    Status Evaluasi: TERKENDALI &amp; KONDUSIF
                  </p>
                </div>
              </div>

              {/* Hidden / Printable Official Report Container */}
              <div
                id="keamanan-laporan-periodik-print"
                className="bg-white text-black rounded-2xl p-6 max-w-4xl mx-auto shadow-xl border border-zinc-300 space-y-4 text-xs"
              >
                <div className="text-center border-b-4 border-double border-black pb-3">
                  <h1 className="text-base font-black uppercase">
                    {systemConfig.kopSuratBaris1 || 'PONDOK PESANTREN SALAF AL-MALIKI'}
                  </h1>
                  <h2 className="text-xs font-bold uppercase">
                    DEWAN KEAMANAN DAN KETERTIBAN SANTRI (KAMTIB)
                  </h2>
                  <p className="text-[10px]">{systemConfig.alamatKopSurat}</p>
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold uppercase underline">
                    LAPORAN KEAMANAN {periodeLaporan.toUpperCase()} &amp; INDIKATOR KEDISIPLINAN
                  </h3>
                  <p className="text-[10px]">
                    Indikator Keberhasilan Keamanan: {kinerjaKeamananScore}% · Dicetak oleh:{' '}
                    {currentUser.nama}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 border border-black rounded">
                    <p className="font-bold">Total Perizinan</p>
                    <p className="text-base font-black">{scopedPerizinanList.length}</p>
                  </div>
                  <div className="p-2 border border-black rounded">
                    <p className="font-bold">Terlambat Kembali</p>
                    <p className="text-base font-black">
                      {scopedPerizinanList.filter((p) => p.status === 'Terlambat').length}
                    </p>
                  </div>
                  <div className="p-2 border border-black rounded">
                    <p className="font-bold">Insiden Pelanggaran</p>
                    <p className="text-base font-black">{scopedPelanggaranList.length}</p>
                  </div>
                  <div className="p-2 border border-black rounded">
                    <p className="font-bold">Sanksi Edukatif</p>
                    <p className="text-base font-black">{scopedSanksiList.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rekapitulasi Administrasi Perizinan Santri & Statistik Lengkap */}
            <LaporanStatistik
              santriList={scopedSantriList}
              perizinanList={scopedPerizinanList}
              pelanggaranList={scopedPelanggaranList}
              sanksiList={scopedSanksiList}
              logsList={logsList}
            />
          </div>
        )}

        {/* 13. OPTION PANEL KEAMANAN (EDITOR FORMAT SURAT SANKSI & TATA TERTIB MANUAL) */}
        {subTab === 'option_keamanan' && (
          <div className="space-y-8">
            <form
              onSubmit={handleSaveFormatSanksi}
              className="rounded-3xl bg-[#041d14]/95 border border-[#d4af37]/50 p-6 shadow-2xl space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
                    OPTION PANEL KEAMANAN
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-white mt-1">
                    Editor Layout &amp; Format Dokumen Surat Pelanggaran &amp; Sanksi Edukatif
                  </h2>
                  <p className="text-xs text-emerald-200/75">
                    Sesuaikan kop surat, judul, redaksi pembuka/penutup, dan nama penandatangan Surat Sanksi &amp; Surat Izin Keamanan
                  </p>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-extrabold text-xs flex items-center gap-2 cursor-pointer shrink-0 shadow-lg"
                >
                  <Save className="w-4 h-4" />
                  Simpan Format Surat Keamanan
                </button>
              </div>

              {optionSavedMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-950 border border-[#d4af37] text-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#f3d266]" />
                  <span>{optionSavedMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Kop Surat Baris 1 (Instansi Utama)
                  </label>
                  <input
                    type="text"
                    value={formatSanksiForm.kopSuratBaris1}
                    onChange={(e) =>
                      setFormatSanksiForm({ ...formatSanksiForm, kopSuratBaris1: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Kop Surat Baris 2 (Divisi Keamanan)
                  </label>
                  <input
                    type="text"
                    value={formatSanksiForm.kopSuratBaris2}
                    onChange={(e) =>
                      setFormatSanksiForm({ ...formatSanksiForm, kopSuratBaris2: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Judul Dokumen Surat Pelanggaran &amp; Sanksi Edukatif
                  </label>
                  <input
                    type="text"
                    value={formatSanksiForm.judulSuratSanksi}
                    onChange={(e) =>
                      setFormatSanksiForm({
                        ...formatSanksiForm,
                        judulSuratSanksi: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Alamat Kop Surat &amp; Kontak Poskamtib
                  </label>
                  <input
                    type="text"
                    value={formatSanksiForm.alamatKopSurat}
                    onChange={(e) =>
                      setFormatSanksiForm({ ...formatSanksiForm, alamatKopSurat: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Redaksi Kalimat Pembuka Surat Sanksi
                  </label>
                  <textarea
                    rows={2}
                    value={formatSanksiForm.pembukaSuratSanksi}
                    onChange={(e) =>
                      setFormatSanksiForm({
                        ...formatSanksiForm,
                        pembukaSuratSanksi: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Redaksi Kalimat Penutup Surat Sanksi
                  </label>
                  <textarea
                    rows={2}
                    value={formatSanksiForm.penutupSuratSanksi}
                    onChange={(e) =>
                      setFormatSanksiForm({
                        ...formatSanksiForm,
                        penutupSuratSanksi: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Ketua Dewan Keamanan Putra (TTD Surat)
                  </label>
                  <input
                    type="text"
                    value={formatSanksiForm.ketuaKeamananPutra}
                    onChange={(e) =>
                      setFormatSanksiForm({
                        ...formatSanksiForm,
                        ketuaKeamananPutra: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                    Ketua Dewan Keamanan Putri (TTD Surat)
                  </label>
                  <input
                    type="text"
                    value={formatSanksiForm.ketuaKeamananPutri}
                    onChange={(e) =>
                      setFormatSanksiForm({
                        ...formatSanksiForm,
                        ketuaKeamananPutri: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                  />
                </div>
              </div>
            </form>

            {/* Penambahan Pasal dan Pengurangan Tata Tertib Secara Manual */}
            <div className="space-y-3">
              <div className="px-2">
                <h3 className="text-sm font-bold text-[#f3d266] uppercase tracking-wider">
                  Penambahan Pasal &amp; Pengurangan Tata Tertib Secara Manual
                </h3>
                <p className="text-xs text-emerald-200/75">
                  Tambah pasal baru, ubah bobot poin, atau hapus pasal tata tertib di bawah ini:
                </p>
              </div>
              <TataTertibList tataTertibList={tataTertibList} />
            </div>
          </div>
        )}

        {/* 14. DATABASE & AUDIT (ADMIN / KETUA) */}
        {subTab === 'database' && isAdminOrKetua && (
          <DatabaseSettings
            santriList={santriList}
            perizinanList={perizinanList}
            pelanggaranList={pelanggaranList}
            sanksiList={sanksiList}
            dewanList={dewanList}
            logsList={logsList}
          />
        )}
      </div>
    </div>
  );
};
