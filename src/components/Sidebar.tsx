import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Network,
  Crown,
  FileSignature,
  Wallet,
  Package,
  ShieldCheck,
  Sliders,
  LogOut,
  X,
  User,
  Inbox,
  CheckCircle2,
  TrendingUp,
  ClipboardList,
  Users,
  GraduationCap,
  Calendar,
  ArrowDownUp,
  ShoppingCart,
  BedDouble,
  Activity,
  ShieldAlert,
  Gavel,
  BookOpen,
  BarChart3,
  UserCircle,
  History,
  BookOpenCheck,
  ClipboardCheck,
  Award,
  UserCheck,
} from 'lucide-react';
import { UserRole, UserAccount } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

export type ActiveMenu =
  | 'dashboard'
  | 'struktur_organisasi'
  | 'murotil_tahfidz'
  | 'ketua_pondok'
  | 'sekretaris'
  | 'bendahara'
  | 'perlengkapan'
  | 'keamanan'
  | 'biodata_profil'
  | 'admin_options';

export type KeamananSubTab =
  | 'ringkasan'
  | 'koordinasi'
  | 'santri_per_kelas'
  | 'santri'
  | 'perizinan'
  | 'pos_gerbang'
  | 'monitoring'
  | 'tata_tertib'
  | 'pelanggaran'
  | 'sanksi'
  | 'dewan_keamanan'
  | 'laporan'
  | 'laporan_mingguan'
  | 'option_keamanan'
  | 'database';

interface SidebarProps {
  activeMenu: ActiveMenu;
  activeSubTab?: string;
  onSelectMenu: (menu: ActiveMenu, subTab?: string) => void;
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  pendingPengajuanCount?: number;
  pendingSecurityCount?: number;
  lateSantriCount?: number;
  unreadKoordinasiCount?: number;
  onLogout?: () => void;
  currentUser?: UserAccount | null;
}

export function canAccessMainMenu(role: UserRole, menu: ActiveMenu): boolean {
  if (role === 'admin') return true;
  if (menu === 'dashboard' || menu === 'struktur_organisasi' || menu === 'biodata_profil') return true;
  if (role === 'ketua_pondok') {
    return menu !== 'admin_options';
  }
  if (role === 'pengurus_murotil') return menu === 'murotil_tahfidz';
  if (role === 'sekretaris') return menu === 'sekretaris';
  if (role === 'bendahara') return menu === 'bendahara';
  if (role === 'perlengkapan') return menu === 'perlengkapan';
  if (role === 'ketua_keamanan' || role === 'anggota_keamanan' || role === 'petugas_gerbang') {
    return menu === 'keamanan';
  }
  return false;
}

interface NavItemConfig {
  key: string;
  menu: ActiveMenu;
  subTab?: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeTone?: 'gold' | 'red' | 'caramel';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  activeSubTab,
  onSelectMenu,
  isOpen,
  onClose,
  userRole,
  pendingPengajuanCount = 0,
  pendingSecurityCount = 0,
  lateSantriCount = 0,
  unreadKoordinasiCount = 0,
  onLogout,
  currentUser,
}) => {
  const isAdmin = userRole === 'admin';
  const isKetuaPondok = userRole === 'ketua_pondok';

  // Mobile background scroll lock when drawer is open
  React.useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
      const scrollY = window.scrollY;
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;

      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        document.body.style.overflow = originalOverflow;
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  const roleDisplayLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'SUPER ADMIN';
      case 'ketua_pondok':
        return 'KETUA PONDOK';
      case 'sekretaris':
        return 'SEKRETARIS';
      case 'bendahara':
        return 'BENDAHARA';
      case 'perlengkapan':
        return 'PERLENGKAPAN';
      case 'ketua_keamanan':
        return 'KETUA KEAMANAN';
      case 'anggota_keamanan':
        return 'KEAMANAN';
      case 'petugas_gerbang':
        return 'POS GERBANG';
      case 'pengurus_murotil':
        return 'MUROTIL & TAHFIDZ';
      default:
        return 'PENGURUS';
    }
  };

  // Build Role-Specific Sidebar Menu Items according to RBAC specification
  const getRoleMenuItems = (): NavItemConfig[] => {
    const inboxBadge = unreadKoordinasiCount > 0 ? `${unreadKoordinasiCount}` : undefined;

    if (userRole === 'ketua_pondok') {
      return [
        {
          key: 'kp_dashboard',
          menu: 'dashboard',
          label: 'Tab Dashboard Utama',
          subtitle: 'Indikator Pie Chart & Laporan',
          icon: LayoutDashboard,
        },
        {
          key: 'kp_kotak_masuk',
          menu: 'ketua_pondok',
          subTab: 'kotak_masuk',
          label: 'Tab Kotak Masuk & Pesan',
          subtitle: 'SK, Pengumuman & Koordinasi',
          icon: Inbox,
          badge: inboxBadge,
          badgeTone: 'gold',
        },
        {
          key: 'kp_struktur',
          menu: 'struktur_organisasi',
          label: 'Tab Struktur Organisasi',
          subtitle: 'Bagan Jajaran Pengurus',
          icon: Network,
        },
        {
          key: 'kp_murotil',
          menu: 'murotil_tahfidz',
          subTab: 'dashboard_murotil',
          label: 'Tab Murotilil Qur\'an & Tahfidz',
          subtitle: 'Absensi Kelompok, 6 Tingkatan & PJ',
          icon: BookOpenCheck,
        },
        {
          key: 'kp_persetujuan',
          menu: 'ketua_pondok',
          subTab: 'persetujuan',
          label: 'Tab Persetujuan',
          subtitle: 'Izin, Dana, Barang & Grafik Disiplin',
          icon: CheckCircle2,
          badge: pendingPengajuanCount > 0 ? `${pendingPengajuanCount}` : undefined,
          badgeTone: 'gold',
        },
        {
          key: 'kp_evaluasi',
          menu: 'ketua_pondok',
          subTab: 'evaluasi',
          label: 'Tab Evaluasi Kinerja',
          subtitle: 'Grafik Kinerja & Catatan Rapat',
          icon: TrendingUp,
        },
        {
          key: 'kp_proker',
          menu: 'ketua_pondok',
          subTab: 'proker',
          label: 'Tab Program Kerja',
          subtitle: 'Progres & Target Kepengurusan',
          icon: ClipboardList,
        },
        {
          key: 'kp_sekretaris',
          menu: 'sekretaris',
          subTab: 'buat_surat',
          label: 'Tab Sekretaris',
          subtitle: 'Surat, Data Santri, Ustadz & Arsip',
          icon: FileSignature,
        },
        {
          key: 'kp_option_panel',
          menu: 'ketua_pondok',
          subTab: 'option_ketua_pondok',
          label: 'Options Panel Ketua Pondok',
          subtitle: 'Edit Proker, Evaluasi, Rapat & Piket',
          icon: Sliders,
        },
        {
          key: 'kp_biodata',
          menu: 'biodata_profil',
          label: 'Tab Biodata dan Profil',
          subtitle: 'Edit Foto, Nama, Jabatan & WA',
          icon: UserCircle,
        },
      ];
    }

    if (userRole === 'sekretaris') {
      return [
        {
          key: 'sek_dashboard',
          menu: 'dashboard',
          label: 'Tab Dashboard Utama',
          subtitle: 'Indikator Kinerja & Statistik',
          icon: LayoutDashboard,
        },
        {
          key: 'sek_kotak_masuk',
          menu: 'sekretaris',
          subTab: 'kotak_masuk',
          label: 'Tab Kotak Masuk & Pesan',
          subtitle: 'Permintaan Surat dari Pengurus',
          icon: Inbox,
          badge: inboxBadge,
          badgeTone: 'gold',
        },
        {
          key: 'sek_struktur',
          menu: 'struktur_organisasi',
          label: 'Tab Struktur Organisasi',
          subtitle: 'Bagan & Jajaran Pengurus',
          icon: Network,
        },
        {
          key: 'sek_buat_surat',
          menu: 'sekretaris',
          subTab: 'buat_surat',
          label: 'Tab Sekretaris & Surat',
          subtitle: '15 Jenis Surat & Data Santri',
          icon: FileSignature,
        },
        {
          key: 'sek_riwayat_surat',
          menu: 'sekretaris',
          subTab: 'riwayat_surat',
          label: 'Tab Riwayat Surat',
          subtitle: 'Surat Masuk, Scan OCR & Keluar',
          icon: History,
        },
        {
          key: 'sek_data_ustadz',
          menu: 'sekretaris',
          subTab: 'data_ustadz',
          label: 'Tab Data Ustadz & Ustadzah',
          subtitle: 'Status Mukim, Laju & Pengurus',
          icon: GraduationCap,
        },
        {
          key: 'sek_notulen',
          menu: 'sekretaris',
          subTab: 'notulen_agenda',
          label: 'Tab Notulen Rapat & Agenda',
          subtitle: 'Sinkron Kalender Kegiatan Pondok',
          icon: Calendar,
        },
        {
          key: 'sek_format_surat',
          menu: 'sekretaris',
          subTab: 'format_surat',
          label: 'Option Format Pokok Surat',
          subtitle: 'Edit Kop Surat, Logo & TTD',
          icon: Sliders,
        },
        {
          key: 'sek_biodata',
          menu: 'biodata_profil',
          label: 'Tab Biodata dan Profil',
          subtitle: 'Edit Foto, Nama, Jabatan & WA',
          icon: UserCircle,
        },
      ];
    }

    if (userRole === 'bendahara') {
      return [
        {
          key: 'ben_dashboard',
          menu: 'dashboard',
          label: 'Tab Dashboard Utama',
          subtitle: 'Candlestick Kas & Indikator',
          icon: LayoutDashboard,
        },
        {
          key: 'ben_kotak_masuk',
          menu: 'bendahara',
          subTab: 'kotak_masuk',
          label: 'Tab Kotak Masuk & Pesan',
          subtitle: 'Permintaan dari Seluruh Pengurus',
          icon: Inbox,
          badge: inboxBadge,
          badgeTone: 'gold',
        },
        {
          key: 'ben_struktur',
          menu: 'struktur_organisasi',
          label: 'Tab Struktur Organisasi',
          subtitle: 'Bagan & Jajaran Pengurus',
          icon: Network,
        },
        {
          key: 'ben_syahriyah',
          menu: 'bendahara',
          subTab: 'syahriyah',
          label: 'Tab Syahriyah',
          subtitle: 'Line Chart, Tagihan & Log Audit',
          icon: Wallet,
        },
        {
          key: 'ben_uang_saku',
          menu: 'bendahara',
          subTab: 'uang_saku',
          label: 'Tab Uang Saku',
          subtitle: 'Saldo, Setoran, Penarikan & Riwayat',
          icon: Users,
        },
        {
          key: 'ben_pengajuan_dana',
          menu: 'bendahara',
          subTab: 'pengajuan_dana',
          label: 'Tab Pengajuan Dana',
          subtitle: 'Kebutuhan Divisi Pengurus',
          icon: CheckCircle2,
          badge: pendingPengajuanCount > 0 ? `${pendingPengajuanCount}` : undefined,
          badgeTone: 'gold',
        },
        {
          key: 'ben_pemasukan_pengeluaran',
          menu: 'bendahara',
          subTab: 'pemasukan_pengeluaran',
          label: 'Tab Pemasukan & Pengeluaran',
          subtitle: 'Candlestick D3, Pie Chart & Buku Kas',
          icon: BarChart3,
        },
        {
          key: 'ben_option_bendahara',
          menu: 'bendahara',
          subTab: 'option_bendahara',
          label: 'Option Panel Bendahara',
          subtitle: 'Edit Kas, Syahriyah, RAPBP & Ambang',
          icon: Sliders,
        },
        {
          key: 'ben_biodata',
          menu: 'biodata_profil',
          label: 'Tab Biodata dan Profil',
          subtitle: 'Edit Foto, Nama, Jabatan & WA',
          icon: UserCircle,
        },
      ];
    }

    if (userRole === 'perlengkapan') {
      return [
        {
          key: 'prl_dashboard',
          menu: 'dashboard',
          label: 'Tab Dashboard Utama',
          subtitle: 'Indikator Kinerja & Statistik Aset',
          icon: LayoutDashboard,
        },
        {
          key: 'prl_kotak_masuk',
          menu: 'perlengkapan',
          subTab: 'kotak_masuk',
          label: 'Tab Kotak Masuk & Pesan',
          subtitle: 'Permintaan dari Seluruh Pengurus',
          icon: Inbox,
          badge: inboxBadge,
          badgeTone: 'gold',
        },
        {
          key: 'prl_struktur',
          menu: 'struktur_organisasi',
          label: 'Tab Struktur Organisasi',
          subtitle: 'Bagan & Jajaran Pengurus',
          icon: Network,
        },
        {
          key: 'prl_inventaris',
          menu: 'perlengkapan',
          subTab: 'inventaris',
          label: 'Tab Inventaris',
          subtitle: 'Daftar Barang, Kondisi & Lokasi',
          icon: Package,
        },
        {
          key: 'prl_keluar_masuk',
          menu: 'perlengkapan',
          subTab: 'barang_masuk_keluar',
          label: 'Tab Keluar Masuk Barang',
          subtitle: 'Tanggal, Bulan & Petugas Input',
          icon: ArrowDownUp,
        },
        {
          key: 'prl_peminjaman',
          menu: 'perlengkapan',
          subTab: 'peminjaman',
          label: 'Tab Peminjaman Barang',
          subtitle: 'Cetak Surat & Ajukan ke Sekretaris',
          icon: FileSignature,
        },
        {
          key: 'prl_pembelian',
          menu: 'perlengkapan',
          subTab: 'pengajuan_pembelian',
          label: 'Tab Pengajuan Pembelian',
          subtitle: 'Stok Minimal & Persetujuan Ketua',
          icon: ShoppingCart,
        },
        {
          key: 'prl_kamar',
          menu: 'perlengkapan',
          subTab: 'kamar_santri',
          label: 'Tab Data Fasilitas',
          subtitle: 'Data Fasilitas per Gedung & Ringkasan',
          icon: BedDouble,
        },
        {
          key: 'prl_option',
          menu: 'perlengkapan',
          subTab: 'option_perlengkapan',
          label: 'Tab Option Panel Perlengkapan',
          subtitle: 'Atur Gedung, Fasilitas & Semua Fitur',
          icon: Sliders,
        },
        {
          key: 'prl_biodata',
          menu: 'biodata_profil',
          label: 'Tab Biodata dan Profil',
          subtitle: 'Edit Foto, Nama, Jabatan & WA',
          icon: UserCircle,
        },
      ];
    }

    if (
      userRole === 'ketua_keamanan' ||
      userRole === 'anggota_keamanan' ||
      userRole === 'petugas_gerbang'
    ) {
      return [
        {
          key: 'kam_dashboard',
          menu: 'keamanan',
          subTab: 'ringkasan',
          label: 'Tab Dashboard Utama',
          subtitle: 'Pie Chart Kinerja, Berita & Kamtib',
          icon: LayoutDashboard,
        },
        {
          key: 'kam_kotak_masuk',
          menu: 'keamanan',
          subTab: 'koordinasi',
          label: 'Tab Kotak Masuk & Pesan',
          subtitle: 'Pemberitahuan Seluruh Pengurus',
          icon: Inbox,
          badge: inboxBadge,
          badgeTone: 'gold',
        },
        {
          key: 'kam_perizinan',
          menu: 'keamanan',
          subTab: 'perizinan',
          label: 'Tab Perizinan Santri',
          subtitle: 'Izin Real-time WIB & Tabel Rekapan',
          icon: FileSignature,
          badge: pendingSecurityCount > 0 ? `${pendingSecurityCount}` : undefined,
          badgeTone: 'caramel',
        },
        {
          key: 'kam_radar',
          menu: 'keamanan',
          subTab: 'monitoring',
          label: 'Tab Radar & Pos Gerbang',
          subtitle: 'Pantau Izin Aktif, Keluar & Check-In',
          icon: Activity,
          badge: lateSantriCount > 0 ? `${lateSantriCount} ALERT` : undefined,
          badgeTone: 'red',
        },
        {
          key: 'kam_pelanggaran',
          menu: 'keamanan',
          subTab: 'pelanggaran',
          label: 'Tab Pelanggaran & Sanksi',
          subtitle: 'Catat Pelanggaran, Takzir & Cetak Surat',
          icon: ShieldAlert,
        },
        {
          key: 'kam_santri',
          menu: 'keamanan',
          subTab: 'santri_per_kelas',
          label: 'Tab Data Santri & Kelas',
          subtitle: 'Data Per Kelas, KTS, CSV & Takzir',
          icon: Users,
        },
        {
          key: 'kam_tatatertib',
          menu: 'keamanan',
          subTab: 'tata_tertib',
          label: 'Tab Tata Tertib',
          subtitle: 'Qanun, Jadwal Piket & Absensi',
          icon: BookOpen,
        },
        {
          key: 'kam_laporan',
          menu: 'keamanan',
          subTab: 'laporan',
          label: 'Tab Laporan',
          subtitle: 'Harian, Mingguan, Bulanan & Grafik',
          icon: BarChart3,
        },
        {
          key: 'kam_option',
          menu: 'keamanan',
          subTab: 'option_keamanan',
          label: 'Option Panel Keamanan',
          subtitle: 'Format Surat Sanksi & Pasal Manual',
          icon: Sliders,
        },
        {
          key: 'kam_biodata',
          menu: 'biodata_profil',
          label: 'Tab Biodata dan Profil',
          subtitle: 'Edit Foto, Nama, Jabatan & WA',
          icon: UserCircle,
        },
      ];
    }

    if (userRole === 'pengurus_murotil') {
      return [
        {
          key: 'mrt_dashboard',
          menu: 'murotil_tahfidz',
          subTab: 'dashboard_murotil',
          label: 'Tab Dashboard Utama',
          subtitle: 'Grafik Kehadiran, Setoran & Biodata',
          icon: LayoutDashboard,
        },
        {
          key: 'mrt_kotak_masuk',
          menu: 'murotil_tahfidz',
          subTab: 'kotak_masuk',
          label: 'Kotak Masuk & Koordinasi',
          subtitle: 'Informasi & Koordinasi Pengurus',
          icon: Inbox,
          badge: inboxBadge,
          badgeTone: 'gold',
        },
        {
          key: 'mrt_struktur',
          menu: 'struktur_organisasi',
          label: 'Tab Struktur Organisasi',
          subtitle: 'Bagan & Jajaran Pengurus',
          icon: Network,
        },
        {
          key: 'mrt_absensi_santri',
          menu: 'murotil_tahfidz',
          subTab: 'absensi_santri',
          label: 'Absensi Santri & Rekapan',
          subtitle: 'Tabel Per Kelompok & Download Word',
          icon: ClipboardCheck,
        },
        {
          key: 'mrt_setoran',
          menu: 'murotil_tahfidz',
          subTab: 'setoran_hafalan',
          label: 'Setoran Hafalan (6 Tingkatan)',
          subtitle: 'Juz 30 s/d Juz 8 Per Kelompok',
          icon: Award,
        },
        {
          key: 'mrt_absensi_pj',
          menu: 'murotil_tahfidz',
          subTab: 'absensi_pj',
          label: 'Absensi Ustadz/ah PJ',
          subtitle: 'Kehadiran Penanggung Jawab',
          icon: UserCheck,
        },
        {
          key: 'mrt_option',
          menu: 'murotil_tahfidz',
          subTab: 'option_murotil',
          label: 'Option Panel Murotil',
          subtitle: 'Login Per Kelompok & 6 Tingkatan',
          icon: Sliders,
        },
        {
          key: 'mrt_biodata',
          menu: 'biodata_profil',
          label: 'Tab Biodata dan Profil',
          subtitle: 'Edit Foto, Nama, Jabatan & PIN',
          icon: UserCircle,
        },
      ];
    }

    // Default: SUPER ADMIN (Full Access to all Divisions + Option Panel + Biodata)
    return [
      {
        key: 'adm_dashboard',
        menu: 'dashboard',
        label: 'Dashboard Utama',
        subtitle: 'Ringkasan Eksekutif & Grafik',
        icon: LayoutDashboard,
      },
      {
        key: 'adm_struktur',
        menu: 'struktur_organisasi',
        label: 'Struktur Organisasi',
        subtitle: 'Bagan & Jajaran Pengurus',
        icon: Network,
      },
      {
        key: 'adm_murotil',
        menu: 'murotil_tahfidz',
        subTab: 'dashboard_murotil',
        label: 'Murotilil Qur\'an & Tahfidz',
        subtitle: 'Absensi Kelompok, 6 Tingkatan & PJ',
        icon: BookOpenCheck,
      },
      {
        key: 'adm_ketua',
        menu: 'ketua_pondok',
        label: 'Ketua Pondok',
        subtitle: 'Persetujuan, Evaluasi & Proker',
        icon: Crown,
        badge: pendingPengajuanCount > 0 ? `${pendingPengajuanCount}` : undefined,
        badgeTone: 'gold',
      },
      {
        key: 'adm_sekretaris',
        menu: 'sekretaris',
        subTab: 'buat_surat',
        label: 'Sekretaris',
        subtitle: '15 Surat, Data Santri, Ustadz & Arsip',
        icon: FileSignature,
      },
      {
        key: 'adm_bendahara',
        menu: 'bendahara',
        label: 'Bendahara',
        subtitle: 'Syahriyah, Uang Saku & Kas',
        icon: Wallet,
      },
      {
        key: 'adm_perlengkapan',
        menu: 'perlengkapan',
        label: 'Perlengkapan',
        subtitle: 'Inventaris, Pinjam & Kamar',
        icon: Package,
      },
      {
        key: 'adm_keamanan',
        menu: 'keamanan',
        subTab: 'ringkasan',
        label: 'Keamanan',
        subtitle: 'Perizinan, Radar & Sanksi',
        icon: ShieldCheck,
        badge:
          lateSantriCount > 0
            ? `${lateSantriCount} ALERT`
            : pendingSecurityCount > 0
              ? `${pendingSecurityCount}`
              : undefined,
        badgeTone: lateSantriCount > 0 ? 'red' : 'caramel',
      },
      {
        key: 'adm_biodata',
        menu: 'biodata_profil',
        label: 'Tab Biodata dan Profil',
        subtitle: 'Edit Profil, Foto, WA & Alamat',
        icon: UserCircle,
      },
    ];
  };

  const navItems = getRoleMenuItems();

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          onTouchMove={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onWheel={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md md:hidden touch-none overscroll-none"
        />
      )}

      {/* Cyber-Emerald Glassmorphism Sidebar Container */}
      <aside
        className={`fixed md:relative top-0 right-0 md:right-auto md:left-0 z-50 h-[100dvh] md:h-full md:min-h-full md:max-h-full w-72 sm:w-80 md:w-64 lg:w-72 bg-[#041A13]/95 md:bg-emerald-950/60 backdrop-blur-md border-l md:border-l-0 md:border-r border-emerald-500/25 shadow-[0_0_40px_rgba(0,0,0,0.85)] flex flex-col justify-between shrink-0 self-stretch transition-transform duration-300 ease-in-out font-sans ${
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* Subtle Gold & Emerald Rim Light */}
        <div className="hidden md:block absolute top-0 right-0 bottom-0 w-[1px] bg-gradient-to-b from-[#D4AF37]/50 via-[#10B981]/30 to-[#D4AF37]/35 pointer-events-none" />

        {/* Editable Profile Photo, Name & Jabatan Card at Top of Sidebar */}
        <div className="p-3.5 border-b border-emerald-500/25 bg-emerald-950/60 backdrop-blur-md space-y-2.5">
          <div className="flex items-center justify-between gap-2.5">
            <div
              onClick={() => {
                onSelectMenu('biodata_profil');
                onClose();
              }}
              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
              title="Klik untuk mengedit Foto Profil, Nama & Jabatan di Tab Biodata dan Profil"
            >
              <div className="relative shrink-0">
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.nama}
                    className="w-11 h-11 rounded-xl border-2 border-[#D4AF37]/80 object-cover shadow-md group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl border-2 border-[#D4AF37]/65 bg-[#041A13] flex items-center justify-center shadow-md text-[#D4AF37]">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white group-hover:text-[#D4AF37] truncate leading-snug transition-colors">
                  {currentUser?.nama || 'Pengurus Pondok'}
                </p>
                <p className="text-[10px] font-semibold text-[#D4AF37] truncate mt-0.5">
                  {currentUser?.jabatan || roleDisplayLabel(userRole)}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-mono text-[#D1FAE5]">
                  <span>{roleDisplayLabel(userRole)}</span>
                  <span aria-hidden="true">·</span>
                  <span>PIN: {currentUser?.pin || '******'}</span>
                </div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="md:hidden p-2 text-[#D4AF37] hover:text-white rounded-xl hover:bg-emerald-900/60 transition-colors cursor-pointer shrink-0 border border-emerald-500/30"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Scrollable Primary Navigation */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-3 py-3.5 space-y-4">
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <p className="text-[10px] font-semibold tracking-wider text-[#D4AF37] uppercase">
                Menu {roleDisplayLabel(userRole)}
              </p>
              {isKetuaPondok && (
                <span className="text-[10px] font-mono text-[#10B981]">Pimpinan</span>
              )}
            </div>

            <nav className="space-y-1.5 pb-4">
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = item.subTab
                  ? activeMenu === item.menu && activeSubTab === item.subTab
                  : activeMenu === item.menu;

                return (
                  <motion.button
                    key={item.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.28) }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      onSelectMenu(item.menu, item.subTab);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-left transition-colors cursor-pointer group border ${
                      isActive
                        ? 'bg-emerald-950/80 backdrop-blur-md text-white border-[#D4AF37]/70 shadow-[0_6px_18px_-4px_rgba(16,185,129,0.28)]'
                        : 'text-[#D1FAE5] hover:text-white hover:bg-emerald-950/60 border-transparent hover:border-emerald-500/25'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-xl shrink-0 transition-colors ${
                          isActive
                            ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/50'
                            : 'bg-[#041A13]/80 text-[#10B981] group-hover:text-[#D4AF37] border border-emerald-500/25'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span
                          className={`block text-xs truncate whitespace-nowrap ${
                            isActive ? 'font-bold text-white' : 'font-semibold text-white'
                          }`}
                        >
                          {item.label}
                        </span>
                        <span className="block text-[10px] text-[#D1FAE5]/85 truncate">
                          {item.subtitle}
                        </span>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`ml-2 px-2 py-0.5 text-[10px] font-mono font-bold rounded-md shrink-0 whitespace-nowrap ${
                          item.badgeTone === 'red'
                            ? 'bg-red-950/90 text-red-300 border border-red-500/50'
                            : item.badgeTone === 'gold'
                              ? 'bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/55'
                              : 'bg-emerald-900/80 text-[#D1FAE5] border border-[#10B981]/40'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </motion.button>
                );
              })}

              {/* Unified Option Panel Admin inside the same Sidebar navigation list */}
              {isAdmin && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onSelectMenu('admin_options');
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-left transition-colors cursor-pointer group border ${
                    activeMenu === 'admin_options'
                      ? 'bg-emerald-950/80 backdrop-blur-md text-white border-[#D4AF37]/70 shadow-[0_6px_18px_-4px_rgba(16,185,129,0.28)]'
                      : 'text-[#D1FAE5] hover:text-white hover:bg-emerald-950/60 border-transparent hover:border-emerald-500/25'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 transition-colors ${
                        activeMenu === 'admin_options'
                          ? 'bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/50'
                          : 'bg-[#041A13]/80 text-[#D4AF37] group-hover:text-[#f3d266] border border-[#D4AF37]/35'
                      }`}
                    >
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs truncate whitespace-nowrap font-bold text-white">
                        Options Panel
                      </span>
                      <span className="block text-[10px] text-[#D1FAE5]/85 truncate">
                        Kelola PIN 6 Digit, Berita &amp; Sistem
                      </span>
                    </div>
                  </div>
                  <span className="ml-2 px-2 py-0.5 text-[10px] font-mono font-bold rounded-md shrink-0 whitespace-nowrap bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/55">
                    ADMIN
                  </span>
                </motion.button>
              )}

              {/* Unified PWA Install Button inside the same Sidebar navigation list */}
              <div className="pt-0.5">
                <PWAInstallButton variant="sidebar" />
              </div>

              {/* Unified Tombol Keluar (Logout) inside the same Sidebar navigation list */}
              {onLogout && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-left transition-colors cursor-pointer group bg-red-950/40 hover:bg-red-900/60 border border-red-500/35 hover:border-red-400/70"
                  title="Keluar dari Sistem"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl shrink-0 bg-red-950/80 text-red-300 group-hover:text-white border border-red-500/40">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-red-200 group-hover:text-white truncate whitespace-nowrap">
                        Keluar (Logout)
                      </span>
                      <span className="block text-[10px] text-red-200/80 truncate">
                        Akhiri sesi &amp; kunci PIN layar
                      </span>
                    </div>
                  </div>
                </motion.button>
              )}
            </nav>
          </div>

          {/* Executive Monitoring Shortcuts for Ketua Pondok */}
          {isKetuaPondok && (
            <div className="pt-2 pb-4 border-t border-emerald-500/25">
              <p className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-[#10B981] uppercase">
                Monitoring Lintas Divisi
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { menu: 'sekretaris' as ActiveMenu, label: 'Sekretaris' },
                  { menu: 'bendahara' as ActiveMenu, label: 'Bendahara' },
                  { menu: 'perlengkapan' as ActiveMenu, label: 'Perlengkapan' },
                  { menu: 'keamanan' as ActiveMenu, label: 'Keamanan' },
                ].map((div) => (
                  <motion.button
                    key={div.menu}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      onSelectMenu(div.menu);
                      onClose();
                    }}
                    className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border text-center cursor-pointer transition-colors ${
                      activeMenu === div.menu
                        ? 'bg-[#D4AF37]/25 text-[#D4AF37] border-[#D4AF37]'
                        : 'bg-emerald-950/60 text-[#D1FAE5] hover:text-white border-emerald-500/25'
                    }`}
                  >
                    {div.label}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
