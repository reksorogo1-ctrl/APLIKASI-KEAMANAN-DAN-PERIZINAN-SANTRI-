import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Moon, 
  Sun, 
  Bell, 
  Clock, 
  Menu, 
  LogOut,
  Radio,
  Sliders,
  ChevronDown,
  ShieldAlert
} from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { storageService } from '../services/storageService';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentUser: UserAccount;
  logoUrl?: string;
  namaPondok?: string;
  onToggleSidebar: () => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  logoUrl,
  namaPondok,
  onToggleSidebar,
  onOpenNotifications,
  onLogout,
  unreadCount,
}) => {
  const [theme, setThemeState] = useState<'dark' | 'light'>(storageService.getTheme());
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentTime(timeStr);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    storageService.setTheme(next);
    setThemeState(next);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-lg border border-amber-400/40 shadow-xs shadow-amber-400/20">SUPER ADMIN</span>;
      case 'ketua_keamanan':
        return <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-600/20 px-2.5 py-0.5 rounded-lg border border-cyan-500/40 shadow-xs shadow-cyan-500/20">COMMAND CHIEF</span>;
      case 'petugas_gerbang':
        return <span className="text-[10px] font-mono font-bold text-red-300 bg-red-600/20 px-2.5 py-0.5 rounded-lg border border-red-500/40 shadow-xs shadow-red-500/20">GATE SENTRY</span>;
      default:
        return <span className="text-[10px] font-mono font-bold text-blue-300 bg-blue-900/40 px-2.5 py-0.5 rounded-lg border border-blue-600/40">SECURITY FORCE</span>;
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 bg-slate-950/95 border-b border-slate-800/80 text-white shadow-2xl backdrop-blur-xl w-full max-w-full">
      
      {/* 3D Top Specular Highlight Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 via-amber-400/40 to-transparent pointer-events-none" />

      {/* Zone 1: Mobile Hamburger & 3D Brand Insignia (Screenshot 2: Top-Left Branding) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-zinc-400 hover:text-cyan-400 hover:bg-slate-900/80 rounded-xl transition-all cursor-pointer border border-transparent hover:border-slate-700 shrink-0"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 group cursor-default min-w-0">
          <div className="relative shrink-0">
            {/* 3D Glow Ring Behind Crest */}
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-cyan-500 via-amber-400 to-blue-600 opacity-60 blur-[3px] group-hover:opacity-100 transition-opacity" />
            <img
              src={logoUrl || "/src/assets/images/logo_pesantren_almaliki_1794050742981.jpg"}
              alt="Logo Al-Maliki"
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-amber-400/80 shadow-lg object-cover"
            />
            {/* Live Secure Telemetry Node */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-cyan-400 rounded-full border-2 border-slate-950 shadow-sm shadow-cyan-400/60" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-nowrap">
              <span className="text-xs sm:text-sm font-black tracking-tight text-white font-sans uppercase truncate">
                SIM-KAMTIB
              </span>
              <span className="hidden xs:inline-flex text-[9px] font-mono text-amber-400 font-bold px-1.5 py-0.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 rounded border border-amber-400/40 shadow-xs shrink-0">
                3D SEC-OPS
              </span>
            </div>
            <span className="text-[10px] block font-mono text-slate-400 uppercase tracking-wider -mt-0.5 truncate max-w-[140px] sm:max-w-xs">
              {namaPondok || 'Pesantren Salaf Al-Maliki'}
            </span>
          </div>
        </div>
      </div>

      {/* Zone 2: Live International Security Radar & Telemetry (Hidden on tablet/smaller to avoid crowding) */}
      <div className="hidden xl:flex items-center gap-3 text-xs shrink min-w-0">
        {/* Central DB Uplink */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner font-mono text-slate-300 hover-rainbow-edge shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span className="text-[11px] text-slate-400">DATABASE PUSAT:</span>
          <span className="font-bold text-cyan-300">ONLINE ENCRYPTED</span>
        </div>

        {/* Live Jakarta Precision Clock */}
        <div className="flex items-center gap-2 text-slate-300 font-mono bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner shrink-0">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="tabular-nums font-bold text-amber-300 tracking-wider">{currentTime} WIB</span>
        </div>
      </div>

      {/* Zone 3: Notification, Theme, Officer Profile Badge, Logout (Screenshot 1: Right Edge Clipping Fix) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
        
        {/* Compact Clock on Medium screens */}
        <div className="hidden sm:flex xl:hidden items-center gap-1.5 text-slate-300 font-mono bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800 text-[11px] shrink-0">
          <Clock className="w-3 h-3 text-amber-400" />
          <span className="tabular-nums font-bold text-amber-300">{currentTime}</span>
        </div>

        {/* PWA Install Button */}
        <PWAInstallButton variant="header" />

        {/* Notifications Button */}
        <button
          onClick={onOpenNotifications}
          className="relative p-1.5 sm:p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-900/80 rounded-xl transition-all border border-slate-800/80 hover:border-slate-700 cursor-pointer shadow-xs shrink-0"
          title="Notifikasi Sistem"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full font-mono shadow-xs shadow-amber-400/60">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-900/80 rounded-xl transition-all border border-slate-800/80 hover:border-slate-700 cursor-pointer shadow-xs shrink-0"
          title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* 3D Active Officer Identity Card (Prevent overflow) */}
        <div className="flex items-center gap-2 pl-2 pr-2.5 py-1 bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-xl shadow-md hover-rainbow-edge shrink-0 max-w-[170px] sm:max-w-xs">
          <div className="relative shrink-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.nama}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-amber-400/80 shrink-0 shadow-sm"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 rounded-full border border-slate-950" />
          </div>
          <div className="hidden sm:block text-left min-w-0">
            <div className="flex items-center gap-1.5 flex-nowrap">
              <span className="text-xs font-bold text-white max-w-[80px] md:max-w-[110px] lg:max-w-[130px] truncate leading-tight">
                {currentUser.nama}
              </span>
              <div className="shrink-0">{getRoleBadge(currentUser.role)}</div>
            </div>
            <p className="text-[10px] font-mono text-slate-400 leading-none mt-0.5 truncate">
              NRP: <span className="text-cyan-400 font-semibold">{currentUser.nrp || 'SECOP-01'}</span>
            </p>
          </div>
        </div>

      </div>

    </header>
  );
};
