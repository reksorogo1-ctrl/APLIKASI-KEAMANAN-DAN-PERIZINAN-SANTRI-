import React, { useMemo, useState } from 'react';
import { StaggeredTabPanel } from './MotionPrimitives';
import {
  LayoutDashboard,
  MessageSquare,
  GraduationCap,
  FileCheck,
  Activity,
  BookOpen,
  ShieldAlert,
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
  Image as ImageIcon,
  Upload,
  FileText,
  Gavel as GavelIcon,
} from 'lucide-react';
import {
  BarChart3D,
  Extruded3DValue,
  KpiStatCard3D,
  LineChart3D,
  PieChart3D,
} from './Charts3D';
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
  EvaluasiKepengurusan,
  PengajuanDivisi,
  SuratIzinLayoutConfig,
  SuratSanksiLayoutConfig,
} from '../types';
import { KeamananSubTab } from './Sidebar';
import { Dashboard } from './Dashboard';
import { DivisiKotakMasuk } from './DivisiKotakMasuk';
import { SantriPerKelas } from './SantriPerKelas';
import { DewanKeamananList } from './DewanKeamananList';
import { PerizinanList } from './PerizinanList';
import { RadarPosGerbang } from './RadarPosGerbang';
import { TataTertibList } from './TataTertibList';
import { PelanggaranSanksiPanel } from './PelanggaranSanksiPanel';
import { LaporanStatistik } from './LaporanStatistik';
import { DatabaseSettings } from './DatabaseSettings';
import { openPrintWindow } from '../utils/printDocument';
import { storageService } from '../services/storageService';
import { computeRealtimePondokAnalytics } from '../utils/realtimeAnalytics';

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
  evaluasiKepengurusan?: EvaluasiKepengurusan[];
  pengajuanDivisi?: PengajuanDivisi[];
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
  evaluasiKepengurusan: propEvaluasiList,
  pengajuanDivisi: propPengajuanDivisi,
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
  const evaluasiKepengurusan = propEvaluasiList || storageService.getEvaluasiKepengurusan();
  const pengajuanDivisi = propPengajuanDivisi || storageService.getPengajuanDivisi();
  const isAdminOrKetua = currentUser.role === 'admin' || currentUser.role === 'ketua_pondok';

  // State for Laporan Periodik (Harian / Mingguan / Bulanan)
  const [periodeLaporan, setPeriodeLaporan] = useState<'Harian' | 'Mingguan' | 'Bulanan'>('Bulanan');

  const OFFICIAL_KEAMANAN_LOGO =
    'https://cdn.phototourl.com/member/2026-11-11-7ffd46ad-6406-4c9c-8043-01c37a880156.png';

  const resolveKeamananDisplayLogo = (url?: string) => {
    if (
      !url ||
      url.includes('2026-11-11-7ffd46ad') ||
      url.includes('2026-11-14-03361e24') ||
      url.includes('logo_pesantren_almaliki')
    ) {
      return '/logo-keamanan.png';
    }
    return url;
  };

  // Sub-tab inside Option Panel Keamanan
  const [keamananOptionTab, setKeamananOptionTab] = useState<
    'logo_keamanan' | 'surat_izin' | 'surat_sanksi' | 'tata_tertib_manual'
  >('logo_keamanan');

  // State for Option Panel Keamanan: Separate Logos + Surat Izin + Surat Sanksi
  const [logoKeamananForm, setLogoKeamananForm] = useState({
    logoDashboardKeamananUrl:
      systemConfig.logoDashboardKeamananUrl &&
      !systemConfig.logoDashboardKeamananUrl.includes('2026-11-14-03361e24')
        ? systemConfig.logoDashboardKeamananUrl
        : OFFICIAL_KEAMANAN_LOGO,
    logoSuratPerizinanUrl:
      systemConfig.logoSuratPerizinanUrl &&
      !systemConfig.logoSuratPerizinanUrl.includes('2026-11-14-03361e24')
        ? systemConfig.logoSuratPerizinanUrl
        : OFFICIAL_KEAMANAN_LOGO,
  });

  const [suratIzinLayoutForm, setSuratIzinLayoutForm] = useState<SuratIzinLayoutConfig>({
    teksBismillah: systemConfig.suratIzinLayout?.teksBismillah || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    kopNamaInstansi: systemConfig.suratIzinLayout?.kopNamaInstansi || systemConfig.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI',
    kopSubInstansi: systemConfig.suratIzinLayout?.kopSubInstansi || 'DEWAN KEAMANAN DAN KETERTIBAN SANTRI (KAMTIB)',
    kopAlamatKontak: systemConfig.suratIzinLayout?.kopAlamatKontak || 'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361 | Hotline: 0812-3456-7800',
    judulSurat: systemConfig.suratIzinLayout?.judulSurat || 'SURAT KETERANGAN IZIN KELUAR / PULANG',
    formatNomorSurat: systemConfig.suratIzinLayout?.formatNomorSurat || 'IZIN/MALIKI/{TAHUN}/{ROMAN}/{NOMOR}',
    kalimatPembuka: systemConfig.suratIzinLayout?.kalimatPembuka || 'Pengurus Dewan Keamanan Pondok Pesantren Salaf Al-Maliki dengan ini menerangkan bahwa santri yang tercantum di bawah ini telah mendapatkan izin resmi dengan ketentuan sebagai berikut:',
    ketentuanPoin1: systemConfig.suratIzinLayout?.ketentuanPoin1 || 'Wajib menjaga akhlaqul karimah, adab santri, dan shalat lima waktu berjamaah.',
    ketentuanPoin2: systemConfig.suratIzinLayout?.ketentuanPoin2 || 'Menunjukkan surat izin ini kepada Petugas Gerbang saat keluar dan kembali.',
    ketentuanPoin3: systemConfig.suratIzinLayout?.ketentuanPoin3 || 'Wajib kembali tepat waktu. Keterlambatan tanpa keterangan akan dikenakan takzir edukatif.',
    kotaTerbit: systemConfig.suratIzinLayout?.kotaTerbit || 'Karawang',
    jabatanPenandatangan: systemConfig.suratIzinLayout?.jabatanPenandatangan || 'Ketua Dewan Keamanan',
    namaPenandatangan: systemConfig.suratIzinLayout?.namaPenandatangan || 'Abdul Rohman',
    gelarPenandatangan: systemConfig.suratIzinLayout?.gelarPenandatangan || 'Ustadz Abdul Rohman, S.Pd.I',
    tampilkanStempelSah: systemConfig.suratIzinLayout?.tampilkanStempelSah !== false,
    tampilkanQrCode: systemConfig.suratIzinLayout?.tampilkanQrCode !== false,
  });

  const [suratSanksiLayoutForm, setSuratSanksiLayoutForm] = useState<SuratSanksiLayoutConfig>({
    teksBismillah: systemConfig.suratSanksiLayout?.teksBismillah || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    kopNamaInstansi: systemConfig.suratSanksiLayout?.kopNamaInstansi || systemConfig.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI',
    kopSubInstansi: systemConfig.suratSanksiLayout?.kopSubInstansi || 'DEWAN KEAMANAN & PENEGAKAN KODIFIKASI QANUN KETERTIBAN',
    kopAlamatKontak: systemConfig.suratSanksiLayout?.kopAlamatKontak || 'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361 | Hotline: 0812-3456-7800',
    judulSurat: systemConfig.suratSanksiLayout?.judulSurat || 'SURAT PELANGGARAN DAN SANKSI EDUKATIF',
    formatNomorSurat: systemConfig.suratSanksiLayout?.formatNomorSurat || 'SNK/MALIKI/{TAHUN}/{ROMAN}/{NOMOR}',
    kalimatPembuka: systemConfig.suratSanksiLayout?.kalimatPembuka || 'Berdasarkan sidang rekapitulasi kodifikasi qanun ketertiban santri Pondok Pesantren Salaf Al-Maliki, dengan ini diterbitkan Surat Pelanggaran dan Penetapan Sanksi Edukatif kepada santri:',
    tampilkanNis: systemConfig.suratSanksiLayout?.tampilkanNis !== false,
    tampilkanKelas: systemConfig.suratSanksiLayout?.tampilkanKelas !== false,
    tampilkanKamar: systemConfig.suratSanksiLayout?.tampilkanKamar !== false,
    tampilkanWali: systemConfig.suratSanksiLayout?.tampilkanWali !== false,
    tampilkanHariTanggal: systemConfig.suratSanksiLayout?.tampilkanHariTanggal !== false,
    tampilkanBatasWaktu: systemConfig.suratSanksiLayout?.tampilkanBatasWaktu !== false,
    formatKalimatHukuman: systemConfig.suratSanksiLayout?.formatKalimatHukuman || 'Santri yang bersangkutan diwajibkan menyelesaikan takzir edukatif dan pembinaan ibadah/keilmuan sebagai berikut:',
    pesanEdukasi: systemConfig.suratSanksiLayout?.pesanEdukasi || 'Sanksi ini bersifat edukatif dan pembinaan ruhiyah semata tanpa kekerasan fisik. Santri wajib menyelesaikan dan menyetorkan tugas pembinaan sebelum batas waktu yang telah ditentukan.',
    kotaTerbit: systemConfig.suratSanksiLayout?.kotaTerbit || 'Karawang',
    jumlahTandaTangan: systemConfig.suratSanksiLayout?.jumlahTandaTangan || 3,
    posisiTandaTangan: systemConfig.suratSanksiLayout?.posisiTandaTangan || 'sejajar',
    jabatanPihak1: systemConfig.suratSanksiLayout?.jabatanPihak1 || 'Santri Pelanggar',
    namaPihak1: systemConfig.suratSanksiLayout?.namaPihak1 || 'Santri Bersangkutan',
    gelarPihak1: systemConfig.suratSanksiLayout?.gelarPihak1 || '(Tanda Tangan & Komitmen)',
    jabatanPihak2: systemConfig.suratSanksiLayout?.jabatanPihak2 || 'Petugas / Dewan Keamanan',
    namaPihak2: systemConfig.suratSanksiLayout?.namaPihak2 || 'Ustadz Abdul Rohman, S.Pd.I',
    gelarPihak2: systemConfig.suratSanksiLayout?.gelarPihak2 || 'Ketua Dewan Keamanan',
    jabatanPihak3: systemConfig.suratSanksiLayout?.jabatanPihak3 || 'Ketua Pondok Pesantren',
    namaPihak3: systemConfig.suratSanksiLayout?.namaPihak3 || 'K.H. Syarifuddin Malik',
    gelarPihak3: systemConfig.suratSanksiLayout?.gelarPihak3 || 'Pengasuh / Pimpinan Pondok',
    footerCatatan: systemConfig.suratSanksiLayout?.footerCatatan || 'Dokumen ini sah diterbitkan secara otomatis oleh SIM Kamtib Al-Maliki dan diarsipkan dalam pangkalan data kedisiplinan pondok.',
    tampilkanStempelSah: systemConfig.suratSanksiLayout?.tampilkanStempelSah !== false,
  });

  // State for Option Panel Keamanan (Format Kop Laporan & Pejabat Sanksi)
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

  const handleUploadKeamananLogo = (
    field: 'logoDashboardKeamananUrl' | 'logoSuratPerizinanUrl',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const b64 = String(evt.target?.result || '');
      if (b64) {
        setLogoKeamananForm((prev) => ({ ...prev, [field]: b64 }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogoKeamanan = (e: React.FormEvent) => {
    e.preventDefault();
    const latest = storageService.getSystemConfig();
    storageService.updateSystemConfig({
      ...latest,
      logoDashboardKeamananUrl: logoKeamananForm.logoDashboardKeamananUrl || OFFICIAL_KEAMANAN_LOGO,
      logoSuratPerizinanUrl: logoKeamananForm.logoSuratPerizinanUrl || OFFICIAL_KEAMANAN_LOGO,
    });
    setOptionSavedMsg(
      'Logo Dashboard Keamanan & Logo Surat Perizinan berhasil disimpan terpisah dari Logo Website!'
    );
    setTimeout(() => setOptionSavedMsg(''), 4500);
  };

  const handleSaveSuratIzinLayout = (e: React.FormEvent) => {
    e.preventDefault();
    const latest = storageService.getSystemConfig();
    storageService.updateSystemConfig({
      ...latest,
      suratIzinLayout: suratIzinLayoutForm,
    });
    setOptionSavedMsg('Layout & Redaksi Surat Perizinan Santri berhasil disimpan!');
    setTimeout(() => setOptionSavedMsg(''), 4500);
  };

  const handleSaveFormatSanksi = (e: React.FormEvent) => {
    e.preventDefault();
    const latest = storageService.getSystemConfig();
    storageService.updateSystemConfig({
      ...latest,
      ...formatSanksiForm,
      suratSanksiLayout: suratSanksiLayoutForm,
    });
    setOptionSavedMsg('Format Dokumen Surat Pelanggaran & Sanksi Edukatif berhasil disimpan!');
    setTimeout(() => setOptionSavedMsg(''), 4500);
  };

  // Pusat Analitik Real-Time Keamanan (Tersinkronisasi dengan Dashboard Utama & Tab Ketua Pondok)
  const realtimeAnalytics = useMemo(
    () =>
      computeRealtimePondokAnalytics({
        santriList: scopedSantriList,
        perizinanList: scopedPerizinanList,
        pelanggaranList: scopedPelanggaranList,
        sanksiList: scopedSanksiList,
        transaksiKeuangan: [],
        arsipSurat: [],
        barangInventaris: [],
        peminjamanBarang: [],
        agendaPengurus,
        evaluasiKepengurusan,
        pengajuanDivisi,
        koordinasiList,
        dewanList,
        systemConfig,
      }),
    [
      scopedSantriList,
      scopedPerizinanList,
      scopedPelanggaranList,
      scopedSanksiList,
      agendaPengurus,
      evaluasiKepengurusan,
      pengajuanDivisi,
      koordinasiList,
      dewanList,
      systemConfig,
    ]
  );

  // Metrics for Tab Dashboard Utama Keamanan
  const santriStats = useMemo(() => {
    const s = realtimeAnalytics.santriStats;
    return {
      totalSantri: s.totalSantri,
      putra: s.santriPutra,
      putri: s.santriPutri,
      sakitCount: s.santriSakit,
      pulangCount: s.santriIzinPulang,
      diPondokCount: s.santriDiPondok,
      ustadzPutra: s.ustadzAktif,
      ustadzahPutri: s.ustadzahAktif,
      totalUstadz: s.totalAsatidz,
    };
  }, [realtimeAnalytics.santriStats]);

  // Indikator Penilaian Kinerja Keamanan (Pie Chart & %)
  const kinerjaKeamananMetric = realtimeAnalytics.divisions.keamanan;
  const kinerjaKeamananScore = kinerjaKeamananMetric.score;

  const kedisiplinanComparison = useMemo(() => {
    const d = realtimeAnalytics.kedisiplinanSantriStats;
    return {
      list: d.monthlySeries,
      curr: d.bulanIni,
      prev: d.bulanLalu,
      diff: d.selisih,
    };
  }, [realtimeAnalytics.kedisiplinanSantriStats]);

  const pertumbuhanTahunan = realtimeAnalytics.santriYearlyChart;

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
      label: 'Radar & Pos Gerbang',
      icon: Activity,
      badge: lateSantriCount > 0 ? lateSantriCount : undefined,
      badgeTone: 'red',
    },
    { id: 'pelanggaran', label: 'Pelanggaran & Sanksi', icon: ShieldAlert },
    { id: 'santri_per_kelas', label: 'Data Santri & Kelas', icon: GraduationCap },
    { id: 'tata_tertib', label: 'Tata Tertib & Piket', icon: BookOpen },
    { id: 'laporan', label: 'Laporan', icon: BarChart3 },
    { id: 'option_keamanan', label: 'Option Panel Keamanan', icon: Sliders },
    { id: 'database', label: 'Audit & DB', icon: Database, adminOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => !t.adminOnly || isAdminOrKetua);

  return (
    <div className="space-y-5">
      {/* Sub-Navigation Bar for Dashboard Keamanan */}
      <div className="luxury-3d-card rounded-2xl p-3 sm:p-4 border border-[#d4af37]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[10px] border border-[#d4af37]/75 bg-white overflow-hidden shrink-0 shadow-md p-0.5">
              <img
                src={resolveKeamananDisplayLogo(systemConfig.logoDashboardKeamananUrl)}
                alt="Logo Dashboard Keamanan"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (!img.dataset.fallbackApplied) {
                    img.dataset.fallbackApplied = '1';
                    img.src = '/logo-keamanan.png';
                  }
                }}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#f4f9f5] tracking-wide uppercase">
                Dashboard Dewan Keamanan &amp; Ketertiban Pondok (SIM-KAMTIB)
              </h2>
              <p className="text-[11px] text-emerald-200/75">
                Dashboard Utama Keamanan, Kotak Masuk, Perizinan Real-Time WIB, Radar &amp; Pos Gerbang, Pelanggaran &amp; Sanksi, Data Santri &amp; Kelas, Tata Tertib &amp; Option Panel Keamanan
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
            const active =
              subTab === tab.id ||
              (tab.id === 'monitoring' && subTab === 'pos_gerbang') ||
              (tab.id === 'pelanggaran' && subTab === 'sanksi') ||
              (tab.id === 'santri_per_kelas' && subTab === 'santri');
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
      <StaggeredTabPanel key={subTab} tabKey={subTab}>
        {/* 1. TAB DASHBOARD UTAMA KEAMANAN (MENGGANTIKAN DASBOR KAMTIB) */}
        {subTab === 'ringkasan' && (
          <div className="space-y-6">
            {/* Pusat Komando Keamanan Terpadu Al-Maliki (Dipindahkan ke Paling Atas) */}
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

            {/* Kartu Ringkasan 3D Jumlah Santri Putra, Putri, Santri Muqim, Izin, Sakit & Ustadz/Ustadzah Aktif */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
              <KpiStatCard3D
                label="Total Santri Aktif"
                value={santriStats.totalSantri}
                tone="silver"
                valueClassName="text-xl sm:text-2xl"
                subtitle={`Putra: ${santriStats.putra} · Putri: ${santriStats.putri}`}
                trendPercent={100}
                trendText="Aktif"
              />
              <div className="kpi-glass-3d p-4 rounded-2xl flex flex-col justify-between gap-2">
                <p className="text-[10px] font-mono font-bold uppercase text-emerald-200/85">Santri Putra / Putri</p>
                <div className="flex items-baseline gap-1.5">
                  <Extruded3DValue value={santriStats.putra} tone="emerald" className="text-xl sm:text-2xl" />
                  <span className="text-emerald-300/60 font-bold">/</span>
                  <Extruded3DValue value={santriStats.putri} tone="gold" className="text-xl sm:text-2xl" />
                </div>
                <p className="text-[10px] text-emerald-200/75">Asrama Banin &amp; Banat</p>
              </div>
              <KpiStatCard3D
                label="Santri Muqim"
                value={santriStats.diPondokCount}
                tone="emerald"
                valueClassName="text-xl sm:text-2xl"
                subtitle="Berada di Pondok"
                trendPercent={santriStats.totalSantri > 0 ? Number(((santriStats.diPondokCount / santriStats.totalSantri) * 100).toFixed(1)) : 100}
              />
              <KpiStatCard3D
                label="Santri Izin Pulang"
                value={santriStats.pulangCount}
                tone="gold"
                valueClassName="text-xl sm:text-2xl"
                subtitle="Izin bermalam aktif"
                trendPercent={santriStats.pulangCount > 0 ? -Number(((santriStats.pulangCount / Math.max(1, santriStats.totalSantri)) * 100).toFixed(1)) : 0}
              />
              <KpiStatCard3D
                label="Santri Sakit"
                value={santriStats.sakitCount}
                tone="rose"
                valueClassName="text-xl sm:text-2xl"
                subtitle="Rawat jalan / berobat"
                trendPercent={santriStats.sakitCount > 0 ? -Number(((santriStats.sakitCount / Math.max(1, santriStats.totalSantri)) * 100).toFixed(1)) : 0}
              />
              <KpiStatCard3D
                label="Ustadz & Ustadzah"
                value={santriStats.totalUstadz}
                suffix=" Aktif"
                tone="gold"
                valueClassName="text-xl sm:text-2xl"
                subtitle={`Ustadz: ${santriStats.ustadzPutra} · Ustadzah: ${santriStats.ustadzahPutri}`}
                trendText="Siaga"
                trendPercent={9.4}
              />
            </div>

            {/* 3D Pie Chart Indikator Penilaian Kinerja Keamanan */}
            <div className="kpi-glass-3d rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6">
              <div className="shrink-0">
                <PieChart3D
                  data={[
                    { name: 'Kinerja Keamanan', value: kinerjaKeamananScore, color: '#10b981' },
                    { name: 'Ruang Evaluasi', value: Math.max(1, 100 - kinerjaKeamananScore), color: '#093827' },
                  ]}
                  size={162}
                  innerRadiusRatio={0.5}
                  depth={14}
                  centerValue={kinerjaKeamananScore}
                  centerSuffix="%"
                  centerLabel={kinerjaKeamananMetric.ratingLabel.toUpperCase()}
                  centerTone={kinerjaKeamananScore >= 90 ? 'gold' : 'emerald'}
                  unit="%"
                />
              </div>
              <div className="space-y-1.5 text-center sm:text-left">
                <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-mono font-bold">
                  3D PIE CHART INDIKATOR KINERJA KEAMANAN · SINKRON TAB KETUA PONDOK
                </span>
                <h3 className="text-sm font-extrabold text-white uppercase">
                  Indikator Penilaian Kinerja Keamanan Secara Keseluruhan
                </h3>
                <p className="text-xs text-emerald-200/80">
                  Dihitung real-time dari kedisiplinan santri, ketepatan izin kembali, penyelesaian sanksi edukatif, serta persetujuan &amp; evaluasi Ketua Pondok.
                </p>
                <p className="text-[11px] font-mono text-[#f3d266] bg-[#02100a]/80 px-2.5 py-1 rounded-lg border border-emerald-800/60 inline-block">
                  {kinerjaKeamananMetric.detail}
                </p>
              </div>
            </div>

            {/* Grafik 3D Line Chart Kedisiplinan Santri + 3D Diagram Santri dari Tahun ke Tahun */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 3D Line Chart Kedisiplinan Santri */}
              <div className="kpi-glass-3d rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white uppercase">
                      Grafik 3D Line Chart Kedisiplinan Santri
                    </h3>
                    <p className="text-[11px] text-emerald-200/75">
                      Bulan Ini: <strong className="text-white">{kedisiplinanComparison.curr}%</strong> vs Bulan Lalu:{' '}
                      <strong className="text-emerald-300">{kedisiplinanComparison.prev}%</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <Extruded3DValue
                      value={kedisiplinanComparison.curr}
                      suffix="%"
                      tone="emerald"
                      className="text-xl sm:text-2xl"
                    />
                    <div className="mt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-extrabold tabular-nums ${
                          kedisiplinanComparison.diff >= 0 ? 'badge-3d-up text-emerald-100' : 'badge-3d-down text-rose-100'
                        }`}
                      >
                        {kedisiplinanComparison.diff >= 0 ? '▲' : '▼'}{' '}
                        {kedisiplinanComparison.diff >= 0 ? `+${kedisiplinanComparison.diff}%` : `${kedisiplinanComparison.diff}%`}
                      </span>
                    </div>
                  </div>
                </div>
                <LineChart3D
                  data={kedisiplinanComparison.list}
                  xKey="bulan"
                  height={220}
                  yDomain={[70, 100]}
                  yUnit="%"
                  tooltipUnit="%"
                  subtitle="Indeks Kedisiplinan Santri"
                  series={[
                    { key: 'skorKedisiplinanSantri', label: 'Indeks Kedisiplinan (%)', color: '#10b981', accentColor: '#f3d266' },
                  ]}
                />
              </div>

              {/* 3D Diagram Santri dari Tahun ke Tahun */}
              <div className="kpi-glass-3d rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white uppercase">
                      Grafik 3D Diagram Santri dari Tahun ke Tahun
                    </h3>
                    <p className="text-[11px] text-emerald-200/75">
                      Pertumbuhan jumlah santri putra &amp; putri Pondok Pesantren Salaf Al-Maliki
                    </p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-[#f3d266]" />
                </div>
                <BarChart3D
                  data={pertumbuhanTahunan}
                  xKey="tahun"
                  height={220}
                  unit=" santri"
                  series={[
                    { key: 'putra', label: 'Santri Putra', color: '#10b981' },
                    { key: 'putri', label: 'Santri Putri', color: '#d4af37' },
                  ]}
                />
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
          </div>
        )}

        {/* 2. TAB KOTAK MASUK & PESAN */}
        {subTab === 'koordinasi' && (
          <DivisiKotakMasuk
            currentUser={currentUser}
            koordinasiList={koordinasiList}
            viewerDivision="Keamanan"
          />
        )}

        {/* 3. TAB DATA SANTRI & KELAS TERPADU (FORMAT SANTRI KELAS + FITUR DATA SANTRI) */}
        {(subTab === 'santri_per_kelas' || subTab === 'santri') && (
          <SantriPerKelas
            santriList={scopedSantriList}
            perizinanList={scopedPerizinanList}
            pelanggaranList={scopedPelanggaranList}
            currentUser={currentUser}
            currentGenderScope={genderScope}
            onNavigateToPermitWithSantri={() => onChangeSubTab('perizinan')}
            onNavigateToPelanggaranWithSantri={() => onChangeSubTab('pelanggaran')}
          />
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

        {/* 7. TAB RADAR MONITORING & POS GERBANG TERPADU */}
        {(subTab === 'monitoring' || subTab === 'pos_gerbang') && (
          <RadarPosGerbang
            perizinanList={scopedPerizinanList}
            santriList={scopedSantriList}
            currentUser={currentUser}
            onViewSuratIzin={onViewSuratIzin}
            onOpenQRScanner={onOpenQRScanner}
            initialView={subTab === 'pos_gerbang' ? 'keluar' : 'diluar'}
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

        {/* 10. TAB PELANGGARAN & SANKSI TERPADU */}
        {(subTab === 'pelanggaran' || subTab === 'sanksi') && (
          <PelanggaranSanksiPanel
            pelanggaranList={scopedPelanggaranList}
            sanksiList={scopedSanksiList}
            santriList={scopedSantriList}
            tataTertibList={tataTertibList}
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
                <div className="lg:col-span-7 kpi-glass-3d p-4 rounded-2xl">
                  <p className="text-xs font-bold text-[#f3d266] uppercase mb-2">
                    Grafik 3D Tren Kedisiplinan &amp; Evaluasi Keamanan ({periodeLaporan})
                  </p>
                  <LineChart3D
                    data={kedisiplinanComparison.list}
                    xKey="bulan"
                    height={210}
                    yDomain={[70, 100]}
                    yUnit="%"
                    tooltipUnit="%"
                    subtitle={`Laporan Evaluasi ${periodeLaporan}`}
                    series={[
                      { key: 'skorKinerjaPengurus', label: 'Indikator Keberhasilan Keamanan (%)', color: '#f3d266', accentColor: '#fef08a' },
                      { key: 'skorKedisiplinanSantri', label: 'Kedisiplinan Santri (%)', color: '#10b981', accentColor: '#f3d266' },
                    ]}
                  />
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
                <div className="flex items-center justify-between gap-3 border-b-4 border-double border-black pb-3 text-center">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-black/30 shrink-0 bg-white p-0.5">
                    <img
                      src={resolveKeamananDisplayLogo(systemConfig.logoSuratPerizinanUrl)}
                      alt="Logo Surat Keamanan"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-base font-black uppercase">
                      {systemConfig.kopSuratBaris1 || 'PONDOK PESANTREN SALAF AL-MALIKI'}
                    </h1>
                    <h2 className="text-xs font-bold uppercase">
                      {systemConfig.kopSuratBaris2 || 'DEWAN KEAMANAN DAN KETERTIBAN SANTRI (KAMTIB)'}
                    </h2>
                    <p className="text-[10px]">{systemConfig.alamatKopSurat}</p>
                  </div>
                  <div className="w-14 shrink-0 hidden sm:block" />
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

        {/* 13. OPTION PANEL KEAMANAN (LOGO KEAMANAN TERPISAH, SURAT PERIZINAN, SURAT SANKSI & TATA TERTIB) */}
        {subTab === 'option_keamanan' && (
          <div className="space-y-6">
            {/* Header & Category Navigation (Tanpa Scrollbar Track) */}
            <div className="rounded-3xl bg-[#041d14]/95 border border-[#d4af37]/50 p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-emerald-800/60 pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40">
                    OPTION PANEL KHUSUS DIVISI KEAMANAN
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-white mt-1.5 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#f3d266]" />
                    <span>Pengaturan Independen Tab Keamanan, Logo &amp; Persuratan Kamtib</span>
                  </h2>
                  <p className="text-xs text-emerald-200/80 mt-0.5">
                    Atur Logo Dashboard Tab Keamanan, Logo Surat Perizinan Santri, Layout Surat Izin, Layout Surat Sanksi, dan Tata Tertib secara terpisah dari Option Panel Website.
                  </p>
                </div>
                <div className="px-3 py-2 rounded-xl bg-[#02120a] border border-emerald-700/60 text-[11px] font-mono text-emerald-300 shrink-0">
                  Mode: <strong className="text-[#f3d266]">Terpisah dari Website</strong>
                </div>
              </div>

              {/* Clean Wrapped Sub-Tab Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {[
                  {
                    id: 'logo_keamanan' as const,
                    title: 'Logo Dashboard & Surat Izin',
                    desc: 'Atur logo Tab Keamanan & Surat Perizinan secara terpisah',
                    icon: ImageIcon,
                  },
                  {
                    id: 'surat_izin' as const,
                    title: 'Layout Surat Perizinan',
                    desc: 'Kop, redaksi, ketentuan, QR & TTD surat izin santri',
                    icon: FileText,
                  },
                  {
                    id: 'surat_sanksi' as const,
                    title: 'Layout Surat Sanksi',
                    desc: 'Kop, redaksi takzir, kolom identitas & TTD pejabat',
                    icon: GavelIcon,
                  },
                  {
                    id: 'tata_tertib_manual' as const,
                    title: 'Pasal & Tata Tertib',
                    desc: 'Tambah, ubah poin, atau hapus pasal qanun keamanan',
                    icon: BookOpen,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = keamananOptionTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setKeamananOptionTab(item.id)}
                      className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        active
                          ? 'bg-gradient-to-br from-[#0b422d] via-[#072c1e] to-[#041b12] border-[#d4af37] shadow-[0_6px_18px_-4px_rgba(212,175,55,0.35)]'
                          : 'bg-[#03160f]/90 border-emerald-800/60 hover:border-[#d4af37]/50 hover:bg-[#06281c]'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl border shrink-0 ${
                          active
                            ? 'bg-[#d4af37]/25 text-[#f3d266] border-[#d4af37]/60'
                            : 'bg-[#052318] text-emerald-300 border-emerald-700/40'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold ${active ? 'text-white' : 'text-emerald-50'}`}>
                          {item.title}
                        </p>
                        <p className="text-[10px] text-emerald-200/75 mt-0.5 leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {optionSavedMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-950 border border-[#d4af37] text-emerald-200 text-xs font-bold flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#f3d266] shrink-0" />
                    <span>{optionSavedMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOptionSavedMsg('')}
                    className="text-[#f3d266] hover:text-white cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* SUB-PANEL 1: PENGATURAN LOGO DASHBOARD KEAMANAN & LOGO SURAT PERIZINAN (TERPISAH DARI WEBSITE) */}
            {keamananOptionTab === 'logo_keamanan' && (
              <form
                onSubmit={handleSaveLogoKeamanan}
                className="rounded-3xl bg-[#041d14]/95 border border-[#d4af37]/50 p-6 shadow-2xl space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-[#f3d266]" />
                      Pengaturan Logo Khusus Tab Keamanan &amp; Surat Perizinan
                    </h3>
                    <p className="text-xs text-emerald-200/75 mt-0.5">
                      Perubahan logo di sini hanya berlaku untuk <strong className="text-[#f3d266]">Tab Keamanan &amp; Surat Perizinan/Sanksi</strong> dan tidak mengubah Logo Website Utama.
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-extrabold text-xs flex items-center gap-2 cursor-pointer shrink-0 shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Logo Keamanan
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card 1: Logo Dashboard Tab Keamanan */}
                  <div className="p-5 rounded-2xl bg-[#03160f]/95 border border-emerald-800/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        1. Logo Dashboard Tab Keamanan
                      </h4>
                      <span className="px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40 text-[10px] font-mono font-bold">
                        DASHBOARD KAMTIB
                      </span>
                    </div>

                    <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-black/55 border border-emerald-800/80">
                      <div className="w-20 h-20 rounded-[22%] border-2 border-[#d4af37] overflow-hidden shrink-0 bg-white shadow-lg p-0.5">
                        <img
                          src={resolveKeamananDisplayLogo(logoKeamananForm.logoDashboardKeamananUrl)}
                          alt="Preview Logo Dashboard Keamanan"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-white font-mono">Pratinjau Logo Dashboard</p>
                        <p className="text-[11px] text-emerald-200/75 leading-relaxed">
                          Tampil di Header Tab Keamanan dan Banner Pusat Komando SIM-KAMTIB.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                        URL Logo Dashboard Keamanan
                      </label>
                      <input
                        type="text"
                        value={logoKeamananForm.logoDashboardKeamananUrl}
                        onChange={(e) =>
                          setLogoKeamananForm({
                            ...logoKeamananForm,
                            logoDashboardKeamananUrl: e.target.value,
                          })
                        }
                        placeholder="https://... atau unggah file gambar"
                        className="w-full px-3.5 py-2 rounded-xl bg-black border border-emerald-800 text-white font-mono text-xs focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="px-3.5 py-2 rounded-xl bg-[#072c1e] hover:bg-[#0b422d] border border-emerald-700 text-emerald-100 text-xs font-semibold flex items-center gap-2 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-[#f3d266]" />
                        <span>Unggah Gambar Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUploadKeamananLogo('logoDashboardKeamananUrl', e)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setLogoKeamananForm({
                            ...logoKeamananForm,
                            logoDashboardKeamananUrl: OFFICIAL_KEAMANAN_LOGO,
                          })
                        }
                        className="text-xs text-[#f3d266] hover:underline cursor-pointer font-mono"
                      >
                        ↺ Reset Bawaan
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Logo Surat Perizinan & Sanksi Keamanan */}
                  <div className="p-5 rounded-2xl bg-[#03160f]/95 border border-emerald-800/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        2. Logo Surat Perizinan &amp; Sanksi
                      </h4>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold">
                        KOP SURAT IZIN
                      </span>
                    </div>

                    <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white text-slate-900 border-2 border-[#d4af37]/60 shadow-inner">
                      <div className="w-16 h-16 rounded-2xl border border-amber-500 overflow-hidden shrink-0 bg-white p-0.5">
                        <img
                          src={resolveKeamananDisplayLogo(logoKeamananForm.logoSuratPerizinanUrl)}
                          alt="Preview Logo Surat Perizinan"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-serif font-bold text-emerald-900">
                          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                        </p>
                        <p className="text-xs font-black text-emerald-950 uppercase truncate">
                          {suratIzinLayoutForm.kopNamaInstansi || 'PONDOK PESANTREN SALAF AL-MALIKI'}
                        </p>
                        <p className="text-[10px] font-bold text-amber-900 truncate">
                          {suratIzinLayoutForm.kopSubInstansi || 'DEWAN KEAMANAN (KAMTIB)'}
                        </p>
                        <p className="text-[9px] text-neutral-500 truncate">
                          Pratinjau Kop Surat Perizinan, Surat Sanksi &amp; PDF A4
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                        URL Logo Surat Perizinan Santri
                      </label>
                      <input
                        type="text"
                        value={logoKeamananForm.logoSuratPerizinanUrl}
                        onChange={(e) =>
                          setLogoKeamananForm({
                            ...logoKeamananForm,
                            logoSuratPerizinanUrl: e.target.value,
                          })
                        }
                        placeholder="https://... atau unggah file gambar"
                        className="w-full px-3.5 py-2 rounded-xl bg-black border border-emerald-800 text-white font-mono text-xs focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="px-3.5 py-2 rounded-xl bg-[#072c1e] hover:bg-[#0b422d] border border-emerald-700 text-emerald-100 text-xs font-semibold flex items-center gap-2 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-[#f3d266]" />
                        <span>Unggah Gambar Logo Surat</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUploadKeamananLogo('logoSuratPerizinanUrl', e)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setLogoKeamananForm({
                            ...logoKeamananForm,
                            logoSuratPerizinanUrl: OFFICIAL_KEAMANAN_LOGO,
                          })
                        }
                        className="text-xs text-[#f3d266] hover:underline cursor-pointer font-mono"
                      >
                        ↺ Reset Bawaan
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* SUB-PANEL 2: EDITOR LAYOUT SURAT PERIZINAN SANTRI */}
            {keamananOptionTab === 'surat_izin' && (
              <form
                onSubmit={handleSaveSuratIzinLayout}
                className="rounded-3xl bg-[#041d14]/95 border border-[#d4af37]/50 p-6 shadow-2xl space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#f3d266]" />
                      Editor Layout &amp; Format Surat Perizinan Santri
                    </h3>
                    <p className="text-xs text-emerald-200/75 mt-0.5">
                      Sesuaikan kop instansi, kalimat pembuka, poin tata tertib, penomoran, stempel, QR code, &amp; penandatangan Surat Izin
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-extrabold text-xs flex items-center gap-2 cursor-pointer shrink-0 shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Format Surat Izin
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                          Teks Bismillah (Arab)
                        </label>
                        <input
                          type="text"
                          value={suratIzinLayoutForm.teksBismillah || ''}
                          onChange={(e) =>
                            setSuratIzinLayoutForm({ ...suratIzinLayoutForm, teksBismillah: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                          Judul Surat Perizinan
                        </label>
                        <input
                          type="text"
                          value={suratIzinLayoutForm.judulSurat || ''}
                          onChange={(e) =>
                            setSuratIzinLayoutForm({ ...suratIzinLayoutForm, judulSurat: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                          Nama Lembaga di Kop
                        </label>
                        <input
                          type="text"
                          value={suratIzinLayoutForm.kopNamaInstansi || ''}
                          onChange={(e) =>
                            setSuratIzinLayoutForm({ ...suratIzinLayoutForm, kopNamaInstansi: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                          Sub-Instansi / Divisi Keamanan
                        </label>
                        <input
                          type="text"
                          value={suratIzinLayoutForm.kopSubInstansi || ''}
                          onChange={(e) =>
                            setSuratIzinLayoutForm({ ...suratIzinLayoutForm, kopSubInstansi: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                        Alamat &amp; Kontak Kop Surat
                      </label>
                      <input
                        type="text"
                        value={suratIzinLayoutForm.kopAlamatKontak || ''}
                        onChange={(e) =>
                          setSuratIzinLayoutForm({ ...suratIzinLayoutForm, kopAlamatKontak: e.target.value })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                        Kalimat Pembuka Surat Izin
                      </label>
                      <textarea
                        rows={2}
                        value={suratIzinLayoutForm.kalimatPembuka || ''}
                        onChange={(e) =>
                          setSuratIzinLayoutForm({ ...suratIzinLayoutForm, kalimatPembuka: e.target.value })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono uppercase text-emerald-300">
                        Ketentuan Wajib Santri Selama Izin (Poin 1 – 3)
                      </label>
                      <input
                        type="text"
                        value={suratIzinLayoutForm.ketentuanPoin1 || ''}
                        onChange={(e) =>
                          setSuratIzinLayoutForm({ ...suratIzinLayoutForm, ketentuanPoin1: e.target.value })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                      />
                      <input
                        type="text"
                        value={suratIzinLayoutForm.ketentuanPoin2 || ''}
                        onChange={(e) =>
                          setSuratIzinLayoutForm({ ...suratIzinLayoutForm, ketentuanPoin2: e.target.value })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                      />
                      <input
                        type="text"
                        value={suratIzinLayoutForm.ketentuanPoin3 || ''}
                        onChange={(e) =>
                          setSuratIzinLayoutForm({ ...suratIzinLayoutForm, ketentuanPoin3: e.target.value })
                        }
                        className="w-full px-3.5 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                          Kota Terbit
                        </label>
                        <input
                          type="text"
                          value={suratIzinLayoutForm.kotaTerbit || ''}
                          onChange={(e) =>
                            setSuratIzinLayoutForm({ ...suratIzinLayoutForm, kotaTerbit: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                          Jabatan Penandatangan
                        </label>
                        <input
                          type="text"
                          value={suratIzinLayoutForm.jabatanPenandatangan || ''}
                          onChange={(e) =>
                            setSuratIzinLayoutForm({ ...suratIzinLayoutForm, jabatanPenandatangan: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                          Nama &amp; Gelar Lengkap
                        </label>
                        <input
                          type="text"
                          value={suratIzinLayoutForm.gelarPenandatangan || ''}
                          onChange={(e) =>
                            setSuratIzinLayoutForm({
                              ...suratIzinLayoutForm,
                              gelarPenandatangan: e.target.value,
                              namaPenandatangan: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-5 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-emerald-100">
                        <input
                          type="checkbox"
                          checked={suratIzinLayoutForm.tampilkanStempelSah !== false}
                          onChange={(e) =>
                            setSuratIzinLayoutForm({
                              ...suratIzinLayoutForm,
                              tampilkanStempelSah: e.target.checked,
                            })
                          }
                          className="accent-[#d4af37]"
                        />
                        <span>Tampilkan Stempel Sah</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-emerald-100">
                        <input
                          type="checkbox"
                          checked={suratIzinLayoutForm.tampilkanQrCode !== false}
                          onChange={(e) =>
                            setSuratIzinLayoutForm({
                              ...suratIzinLayoutForm,
                              tampilkanQrCode: e.target.checked,
                            })
                          }
                          className="accent-[#d4af37]"
                        />
                        <span>Tampilkan QR Code Verifikasi</span>
                      </label>
                    </div>
                  </div>

                  {/* Live Preview Surat Perizinan dengan Logo Khusus Keamanan */}
                  <div className="lg:col-span-5">
                    <div className="bg-white border-2 border-[#d4af37]/60 rounded-2xl p-4 text-slate-900 shadow-2xl text-[10px] space-y-2.5">
                      <div className="flex items-center gap-3 pb-2 border-b-2 border-emerald-900 text-center">
                        <div className="w-12 h-12 rounded-xl border border-amber-500 overflow-hidden shrink-0 bg-white p-0.5">
                          <img
                            src={resolveKeamananDisplayLogo(logoKeamananForm.logoSuratPerizinanUrl)}
                            alt="Logo Surat Perizinan"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-serif text-emerald-900 font-bold text-xs">
                            {suratIzinLayoutForm.teksBismillah}
                          </p>
                          <h4 className="font-black text-emerald-950 uppercase text-[11px] truncate">
                            {suratIzinLayoutForm.kopNamaInstansi}
                          </h4>
                          <p className="text-[9px] font-bold text-amber-900 truncate">
                            {suratIzinLayoutForm.kopSubInstansi}
                          </p>
                          <p className="text-[8px] text-neutral-500 truncate">
                            {suratIzinLayoutForm.kopAlamatKontak}
                          </p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-black underline uppercase text-[11px] text-emerald-950">
                          {suratIzinLayoutForm.judulSurat}
                        </p>
                        <p className="text-[9px] font-mono text-neutral-500">
                          Nomor: IZIN/MALIKI/2026/XI/042
                        </p>
                      </div>
                      <p className="text-[9px] text-neutral-700 leading-relaxed">
                        {suratIzinLayoutForm.kalimatPembuka}
                      </p>
                      <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-200 text-[8px] space-y-0.5">
                        <p className="font-bold text-neutral-800">Ketentuan Wajib:</p>
                        <p>1. {suratIzinLayoutForm.ketentuanPoin1}</p>
                        <p>2. {suratIzinLayoutForm.ketentuanPoin2}</p>
                        <p>3. {suratIzinLayoutForm.ketentuanPoin3}</p>
                      </div>
                      <div className="flex justify-between items-end pt-2 border-t border-neutral-200 text-[9px]">
                        <div className="text-center">
                          <p className="text-[8px] text-neutral-500">Wali Santri / Penjemput</p>
                          <div className="h-6" />
                          <p className="font-bold underline">( Wali Santri )</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] text-neutral-500">
                            {suratIzinLayoutForm.kotaTerbit}, Hari Ini
                          </p>
                          <p className="font-semibold text-[8px]">
                            {suratIzinLayoutForm.jabatanPenandatangan}
                          </p>
                          <div className="h-6 flex items-center justify-center">
                            {suratIzinLayoutForm.tampilkanStempelSah !== false && (
                              <span className="text-[7px] font-mono font-bold text-emerald-800/70 border border-emerald-700/50 px-1 rounded">
                                STEMPEL SAH
                              </span>
                            )}
                          </div>
                          <p className="font-bold underline text-[8px]">
                            {suratIzinLayoutForm.gelarPenandatangan}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* SUB-PANEL 3: EDITOR LAYOUT SURAT SANKSI & PELANGGARAN */}
            {keamananOptionTab === 'surat_sanksi' && (
              <form
                onSubmit={handleSaveFormatSanksi}
                className="rounded-3xl bg-[#041d14]/95 border border-[#d4af37]/50 p-6 shadow-2xl space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/60 pb-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                      <GavelIcon className="w-4 h-4 text-[#f3d266]" />
                      Editor Layout &amp; Format Dokumen Surat Pelanggaran &amp; Sanksi Edukatif
                    </h3>
                    <p className="text-xs text-emerald-200/75 mt-0.5">
                      Sesuaikan kop surat, judul, redaksi pembuka/penutup, kolom identitas santri, dan nama penandatangan Surat Sanksi
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] font-extrabold text-xs flex items-center gap-2 cursor-pointer shrink-0 shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Format Surat Sanksi
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                      Kop Surat Baris 1 (Instansi Utama)
                    </label>
                    <input
                      type="text"
                      value={formatSanksiForm.kopSuratBaris1}
                      onChange={(e) => {
                        setFormatSanksiForm({ ...formatSanksiForm, kopSuratBaris1: e.target.value });
                        setSuratSanksiLayoutForm({ ...suratSanksiLayoutForm, kopNamaInstansi: e.target.value });
                      }}
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
                      onChange={(e) => {
                        setFormatSanksiForm({ ...formatSanksiForm, kopSuratBaris2: e.target.value });
                        setSuratSanksiLayoutForm({ ...suratSanksiLayoutForm, kopSubInstansi: e.target.value });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                      Judul Dokumen Surat Pelanggaran &amp; Sanksi Edukatif
                    </label>
                    <input
                      type="text"
                      value={suratSanksiLayoutForm.judulSurat || formatSanksiForm.judulSuratSanksi}
                      onChange={(e) => {
                        setFormatSanksiForm({ ...formatSanksiForm, judulSuratSanksi: e.target.value });
                        setSuratSanksiLayoutForm({ ...suratSanksiLayoutForm, judulSurat: e.target.value });
                      }}
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
                      onChange={(e) => {
                        setFormatSanksiForm({ ...formatSanksiForm, alamatKopSurat: e.target.value });
                        setSuratSanksiLayoutForm({ ...suratSanksiLayoutForm, kopAlamatKontak: e.target.value });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                      Redaksi Kalimat Pembuka Surat Sanksi
                    </label>
                    <textarea
                      rows={2}
                      value={suratSanksiLayoutForm.kalimatPembuka || formatSanksiForm.pembukaSuratSanksi}
                      onChange={(e) => {
                        setFormatSanksiForm({ ...formatSanksiForm, pembukaSuratSanksi: e.target.value });
                        setSuratSanksiLayoutForm({ ...suratSanksiLayoutForm, kalimatPembuka: e.target.value });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                      Redaksi Pesan Edukasi &amp; Penutup Surat Sanksi
                    </label>
                    <textarea
                      rows={2}
                      value={suratSanksiLayoutForm.pesanEdukasi || formatSanksiForm.penutupSuratSanksi}
                      onChange={(e) => {
                        setFormatSanksiForm({ ...formatSanksiForm, penutupSuratSanksi: e.target.value });
                        setSuratSanksiLayoutForm({ ...suratSanksiLayoutForm, pesanEdukasi: e.target.value });
                      }}
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
                      onChange={(e) => {
                        setFormatSanksiForm({ ...formatSanksiForm, ketuaKeamananPutra: e.target.value });
                        setSuratSanksiLayoutForm({ ...suratSanksiLayoutForm, namaPihak2: e.target.value });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                      Ketua Dewan Keamanan Putri / Ketua Pondok (TTD Surat)
                    </label>
                    <input
                      type="text"
                      value={formatSanksiForm.ketuaKeamananPutri}
                      onChange={(e) => {
                        setFormatSanksiForm({ ...formatSanksiForm, ketuaKeamananPutri: e.target.value });
                        setSuratSanksiLayoutForm({ ...suratSanksiLayoutForm, namaPihak3: e.target.value });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                      Kota Terbit Surat
                    </label>
                    <input
                      type="text"
                      value={suratSanksiLayoutForm.kotaTerbit || 'Karawang'}
                      onChange={(e) =>
                        setSuratSanksiLayoutForm({ ...suratSanksiLayoutForm, kotaTerbit: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                      Catatan Kaki Surat
                    </label>
                    <input
                      type="text"
                      value={suratSanksiLayoutForm.footerCatatan || ''}
                      onChange={(e) =>
                        setSuratSanksiLayoutForm({ ...suratSanksiLayoutForm, footerCatatan: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#03160f] border border-emerald-800 text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-2 border-t border-emerald-800/60 text-xs text-emerald-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={suratSanksiLayoutForm.tampilkanNis !== false}
                      onChange={(e) =>
                        setSuratSanksiLayoutForm({ ...suratSanksiLayoutForm, tampilkanNis: e.target.checked })
                      }
                      className="accent-[#d4af37]"
                    />
                    <span>Tampilkan NIS</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={suratSanksiLayoutForm.tampilkanKelas !== false}
                      onChange={(e) =>
                        setSuratSanksiLayoutForm({ ...suratSanksiLayoutForm, tampilkanKelas: e.target.checked })
                      }
                      className="accent-[#d4af37]"
                    />
                    <span>Tampilkan Kelas</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={suratSanksiLayoutForm.tampilkanKamar !== false}
                      onChange={(e) =>
                        setSuratSanksiLayoutForm({ ...suratSanksiLayoutForm, tampilkanKamar: e.target.checked })
                      }
                      className="accent-[#d4af37]"
                    />
                    <span>Tampilkan Kamar</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={suratSanksiLayoutForm.tampilkanStempelSah !== false}
                      onChange={(e) =>
                        setSuratSanksiLayoutForm({
                          ...suratSanksiLayoutForm,
                          tampilkanStempelSah: e.target.checked,
                        })
                      }
                      className="accent-[#d4af37]"
                    />
                    <span>Tampilkan Stempel Sah</span>
                  </label>
                </div>
              </form>
            )}

            {/* SUB-PANEL 4: PENAMBAHAN PASAL & PENGURANGAN TATA TERTIB MANUAL */}
            {keamananOptionTab === 'tata_tertib_manual' && (
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
            )}
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
      </StaggeredTabPanel>
    </div>
  );
};
