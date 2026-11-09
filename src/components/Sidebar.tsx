import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  FileCheck2, 
  DoorOpen, 
  BookOpenCheck, 
  AlertTriangle, 
  GraduationCap, 
  BarChart3, 
  Database,
  Sliders,
  GraduationCap as ClassIcon,
  X,
  ShieldAlert,
  Radar,
  Radio,
  LogOut
} from 'lucide-react';
import { UserRole, UserAccount } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

export type ActiveMenu = 
  | 'dashboard'
  | 'koordinasi'
  | 'admin_options'
  | 'santri_per_kelas'
  | 'santri'
  | 'dewan_keamanan'
  | 'perizinan'
  | 'pos_gerbang'
  | 'monitoring'
  | 'tata_tertib'
  | 'pelanggaran'
  | 'sanksi'
  | 'laporan'
  | 'database';

interface SidebarProps {
  activeMenu: ActiveMenu;
  onSelectMenu: (menu: ActiveMenu) => void;
  isOpen: boolean;
  onClose: () => void;
  userRole: UserRole;
  pendingApprovalsCount: number;
  lateSantriCount: number;
  unreadKoordinasiCount?: number;
  mendesakKoordinasiCount?: number;
  logoUrl?: string;
  namaPondok?: string;
  onLogout?: () => void;
  currentUser?: UserAccount | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeMenu,
  onSelectMenu,
  isOpen,
  onClose,
  userRole,
  pendingApprovalsCount,
  lateSantriCount,
  unreadKoordinasiCount = 0,
  mendesakKoordinasiCount = 0,
  logoUrl,
  namaPondok,
  onLogout,
  currentUser,
}) => {
  const isAdmin = userRole === 'admin';

  // Airtight mobile scroll lock: Ketika drawer terbuka di HP, kunci scroll latar belakang secara absolut
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

  // Navigation structure based on role
  // PENGURUS: Navigation items (Including Koordinasi, Sentry Gate & Radar Monitoring)
  const pengurusNavItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard Utama', 
      icon: LayoutDashboard,
      badge: 'OVERVIEW',
      badgeColor: 'bg-blue-600/20 text-cyan-300 border border-blue-500/40'
    },
    { 
      id: 'koordinasi', 
      label: 'Koordinasi Dewan & Admin', 
      icon: Radio,
      badge: unreadKoordinasiCount > 0 
        ? (mendesakKoordinasiCount > 0 ? `${mendesakKoordinasiCount} MENDESAK` : `${unreadKoordinasiCount} Pesan`) 
        : undefined,
      badgeColor: mendesakKoordinasiCount > 0 
        ? 'bg-red-600/30 text-red-300 border border-red-500/60 animate-pulse glow-red' 
        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
    },
    { 
      id: 'perizinan', 
      label: 'Permohonan Izin Santri', 
      icon: FileCheck2,
      badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Antrian` : 'SYNC DB',
      badgeColor: pendingApprovalsCount > 0 ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 glow-gold' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    },
    { 
      id: 'monitoring', 
      label: 'Radar Monitoring Real-Time', 
      icon: Radar,
      badge: lateSantriCount > 0 ? `${lateSantriCount} ALERT` : 'LIVE',
      badgeColor: lateSantriCount > 0 ? 'bg-red-600/25 text-red-400 border border-red-500/50 glow-red animate-pulse' : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
    },
    { 
      id: 'pos_gerbang', 
      label: 'Sentry Gate Terminal (Scan)', 
      icon: DoorOpen,
      badge: 'GATE',
      badgeColor: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
    },
    { 
      id: 'tata_tertib', 
      label: 'Qanun Tata Tertib', 
      icon: BookOpenCheck 
    },
    { 
      id: 'pelanggaran', 
      label: 'Catatan Insiden Pelanggaran', 
      icon: AlertTriangle 
    },
    { 
      id: 'sanksi', 
      label: 'Sanksi Edukatif & Pembinaan', 
      icon: GraduationCap 
    },
  ];

  // ADMIN: full command center sections (Option Panel moved to very bottom below)
  const adminNavSections = [
    {
      group: 'PUSAT KENDALI OPERASIONAL',
      items: [
        { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
        { 
          id: 'koordinasi', 
          label: 'Koordinasi Komando & Dewan', 
          icon: Radio,
          badge: unreadKoordinasiCount > 0 
            ? (mendesakKoordinasiCount > 0 ? `${mendesakKoordinasiCount} MENDESAK` : `${unreadKoordinasiCount} Pesan`) 
            : undefined,
          badgeColor: mendesakKoordinasiCount > 0 
            ? 'bg-red-600/30 text-red-300 border border-red-500/60 animate-pulse glow-red' 
            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
        },
      ]
    },
    {
      group: 'SECURITY DATABASE SANTRI',
      items: [
        { id: 'santri_per_kelas', label: 'Data Santri Per Divisi / Kelas', icon: ClassIcon },
        { id: 'santri', label: 'Master Registrasi Santri', icon: Users },
      ]
    },
    {
      group: 'ACCESS CONTROL & GERBANG',
      items: [
        { 
          id: 'perizinan', 
          label: 'Permohonan Izin Keluar-Masuk', 
          icon: FileCheck2,
          badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Antrian` : undefined,
          badgeColor: 'bg-blue-600/20 text-cyan-300 border border-blue-500/40 glow-blue'
        },
        { 
          id: 'monitoring', 
          label: 'Radar Monitoring Real-Time', 
          icon: Radar,
          badge: lateSantriCount > 0 ? `${lateSantriCount} ALERT` : 'LIVE',
          badgeColor: lateSantriCount > 0 ? 'bg-red-600/25 text-red-400 border border-red-500/50 glow-red animate-pulse' : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
        },
        { 
          id: 'pos_gerbang', 
          label: 'Sentry Gate Terminal (Scan)', 
          icon: DoorOpen 
        },
      ]
    },
    {
      group: 'KEDISIPLINAN & TATA TERTIB',
      items: [
        { id: 'tata_tertib', label: 'Kodifikasi Qanun Ketertiban', icon: BookOpenCheck },
        { id: 'pelanggaran', label: 'Pencatatan Insiden Pelanggaran', icon: AlertTriangle },
        { id: 'sanksi', label: 'Sanksi Edukatif & Pembinaan', icon: GraduationCap },
      ]
    },
    {
      group: 'PERSONIL & AUDIT INTELEJEN',
      items: [
        { id: 'dewan_keamanan', label: 'Dewan Keamanan & Piket', icon: ShieldAlert },
        { id: 'laporan', label: 'Laporan Forensik & Statistik', icon: BarChart3 },
        { id: 'database', label: 'Enkripsi & Backup Database', icon: Database },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop (Khusus HP / Tablet Portrait) dengan pembatalan sentuhan agar latar belakang tidak bisa discroll */}
      {isOpen && (
        <div 
          onClick={onClose} 
          onTouchMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onWheel={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="fixed inset-0 z-40 bg-black/85 backdrop-blur-md md:hidden touch-none overscroll-none"
        />
      )}

      {/* 3D Sidebar Container:
          - Laptop & PC (md: ke atas): Selalu terbuka (md:sticky md:top-[57px] md:left-0 md:translate-x-0)
          - HP (< md): Drawer meluncur dari kanan (fixed inset-y-0 right-0 h-[100dvh])
      */}
      <aside
        className={`fixed md:relative top-0 md:top-0 right-0 md:right-auto md:left-0 z-50 h-[100dvh] md:h-full md:min-h-full md:max-h-full w-72 sm:w-80 md:w-64 lg:w-72 bg-gradient-to-b from-slate-950 via-slate-900 to-black border-l md:border-l-0 md:border-r border-cyan-500/20 shadow-[0_0_30px_rgba(0,0,0,0.8)] md:shadow-[2px_0_24px_rgba(6,182,212,0.12)] flex flex-col justify-between shrink-0 self-stretch transition-transform duration-300 ease-in-out font-sans ${
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sleek Vertical Right Rim Light */}
        <div className="absolute top-0 right-0 bottom-0 w-[1.5px] bg-gradient-to-b from-cyan-400/60 via-blue-500/30 to-amber-400/40 pointer-events-none" />

        {/* Profil Pemilik Akun di Bagian Atas Sidebar (Menggantikan Logo Pondok Sesuai Permintaan) */}
        <div className="p-3 sm:p-3.5 border-b border-slate-800/90 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative shrink-0 group">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-cyan-400 via-amber-400 to-blue-500 opacity-70 blur-[2px] group-hover:opacity-100 transition-opacity" />
              <img
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                alt={currentUser?.nama || "Pemilik Akun"}
                className="relative w-9 h-9 rounded-xl border border-amber-400 object-cover shadow-md"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-black text-white uppercase tracking-tight block truncate leading-tight">
                {currentUser?.nama || (isAdmin ? 'KOMANDAN ADMIN' : 'PETUGAS PENGURUS')}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-mono font-bold text-amber-300 tracking-wider block uppercase px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/30 shrink-0">
                  {isAdmin ? 'SUPER ADMIN' : (currentUser?.role === 'ketua_keamanan' ? 'COMMAND CHIEF' : 'PENGURUS')}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold truncate">
                  {currentUser?.nrp || 'SECOP-01'}
                </span>
              </div>
              {currentUser?.jabatan && (
                <span className="text-[9px] text-slate-400 block truncate mt-0.5 font-sans">
                  {currentUser.jabatan}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0 border border-slate-800"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5 text-amber-400" />
          </button>
        </div>

        {/* Scrollable Navigation with overscroll-contain */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y px-3.5 py-4 space-y-6">
          {!isAdmin ? (
            /* PENGURUS NAVIGATION: ONLY 6 DEDICATED TABS */
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3">
                <p className="text-[9px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                  MENU OPERASIONAL PENGURUS
                </p>
                <div className="w-8 h-[1px] bg-cyan-800/60" />
              </div>
              <nav className="space-y-1.5">
                {pengurusNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectMenu(item.id as ActiveMenu);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl font-medium transition-all cursor-pointer relative group ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-900/60 via-slate-900 to-slate-900 text-amber-300 border border-amber-400/50 shadow-lg shadow-cyan-950/50 font-bold rainbow-active-border'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900/70 border border-transparent hover:border-slate-800 hover-rainbow-edge'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`p-1 rounded-lg ${isActive ? 'bg-amber-400/20 text-amber-300' : 'text-slate-400 group-hover:text-cyan-400 group-hover:bg-slate-800/80 transition-colors'}`}>
                          <Icon className="w-4 h-4 shrink-0" />
                        </div>
                        <span className="truncate tracking-wide">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-md ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ) : (
            /* ADMIN NAVIGATION: Full command sections */
            adminNavSections.map((section, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between px-3">
                  <p className="text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                    {section.group}
                  </p>
                  <div className="w-8 h-[1px] bg-slate-800" />
                </div>
                <nav className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeMenu === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectMenu(item.id as ActiveMenu);
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl font-medium transition-all cursor-pointer relative group ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-900/60 via-slate-900 to-slate-900 text-amber-300 border border-amber-400/50 shadow-lg shadow-cyan-950/50 font-bold rainbow-active-border'
                            : 'text-slate-300 hover:text-white hover:bg-slate-900/70 border border-transparent hover:border-slate-800 hover-rainbow-edge'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className={`p-1 rounded-lg ${isActive ? 'bg-amber-400/20 text-amber-300' : 'text-slate-400 group-hover:text-cyan-400 group-hover:bg-slate-800/80 transition-colors'}`}>
                            <Icon className="w-4 h-4 shrink-0" />
                          </div>
                          <span className="truncate tracking-wide">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-md ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))
          )}
        </div>

        {/* SIDEBAR FOOTER: OPTION PANEL, INSTALL PWA, DAN TOMBOL KELUAR PALING BAWAH SENDIRI */}
        <div className="mt-auto shrink-0 w-full p-3.5 border-t border-slate-800/90 bg-gradient-to-b from-slate-950 via-slate-950 to-black space-y-2 pb-safe pb-4 sm:pb-3.5">
          
          {/* 1. Central Option Panel Tab for Admin */}
          {isAdmin && (
            <button
              onClick={() => {
                onSelectMenu('admin_options');
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl font-bold transition-all cursor-pointer relative ${
                activeMenu === 'admin_options'
                  ? 'bg-gradient-to-r from-amber-500/30 via-yellow-500/20 to-slate-900 text-amber-300 border border-amber-400 shadow-lg shadow-amber-950/60 rainbow-active-border'
                  : 'bg-slate-900/90 text-amber-300 hover:text-yellow-200 border border-amber-400/40 hover:border-amber-400 shadow-md hover-rainbow-edge'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-300 shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div className="text-left truncate">
                  <span className="block font-bold tracking-wide text-amber-300 text-[11px] leading-tight">
                    Central Option Panel
                  </span>
                  <span className="block text-[9px] font-mono text-slate-400">
                    Konfigurasi & Database Pusat
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded bg-amber-400/20 text-amber-300 border border-amber-400/50 glow-gold shrink-0">
                MASTER
              </span>
            </button>
          )}

          {/* 2. PWA App Install Button (Mobile & Desktop) */}
          <PWAInstallButton variant="sidebar" />

          {/* 3. Tombol Keluar (Logout) - Berada di Paling Bawah Sendiri */}
          {onLogout && (
            <button
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs rounded-xl font-mono font-bold text-red-300 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 hover:border-red-400 transition-all cursor-pointer shadow-md hover:shadow-red-950/50 group"
              title="Keluar dari Sistem Keamanan"
            >
              <LogOut className="w-4 h-4 text-red-400 group-hover:rotate-12 transition-transform" />
              <span className="tracking-wider uppercase text-[11px]">Keluar dari Sistem</span>
            </button>
          )}
        </div>

      </aside>
    </>
  );
};
