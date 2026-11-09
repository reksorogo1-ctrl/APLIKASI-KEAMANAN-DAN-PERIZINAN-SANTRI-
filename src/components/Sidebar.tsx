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
import { UserRole } from '../types';

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
}) => {
  const isAdmin = userRole === 'admin';

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
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md lg:hidden"
        />
      )}

      {/* 3D Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[57px] left-0 z-40 h-screen lg:h-[calc(100vh-57px)] w-72 bg-gradient-to-b from-slate-950 via-slate-900 to-black border-r border-cyan-500/20 shadow-[2px_0_24px_rgba(6,182,212,0.12)] flex flex-col justify-between transition-transform duration-300 ease-in-out font-sans relative ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sleek Vertical Right Rim Light */}
        <div className="absolute top-0 right-0 bottom-0 w-[1.5px] bg-gradient-to-b from-cyan-400/60 via-blue-500/30 to-amber-400/40 pointer-events-none" />

        {/* Dynamic Pondok Branding Header */}
        <div className="p-3.5 border-b border-slate-800/90 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0 group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-cyan-400 via-amber-400 to-blue-500 opacity-70 blur-[2px] group-hover:opacity-100 transition-opacity" />
              <img
                src={logoUrl || "/src/assets/images/logo_pesantren_almaliki_1794050742981.jpg"}
                alt="Logo Pondok"
                className="relative w-8 h-8 rounded-full border border-amber-400 object-cover shadow-md"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
            </div>
            <div className="truncate">
              <span className="text-xs font-black text-white uppercase tracking-wider block truncate leading-tight">
                {namaPondok ? namaPondok.replace('PONDOK PESANTREN SALAF ', '') : 'AL-MALIKI'}
              </span>
              <span className="text-[9px] font-mono font-bold text-amber-300 tracking-widest block uppercase">
                {isAdmin ? '3D SEC-OPS ADMIN' : 'CONSOLE PENGURUS'}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
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

        {/* SIDEBAR FOOTER: ADMIN OPTION PANEL + TOMBOL KELUAR DI PALING BAWAH */}
        <div className="p-3.5 border-t border-slate-800/90 bg-gradient-to-b from-slate-950 to-black space-y-2.5">
          
          {/* Central Option Panel Tab for Admin (Placed at the very bottom above logout button) */}
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

          {/* Tombol Keluar (Logout) - Langsung otomatis logout ke Dashboard Login */}
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
