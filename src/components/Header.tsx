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
import { UserAccount } from '../types';
import { storageService } from '../services/storageService';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentUser: UserAccount;
  logoUrl?: string;
  namaPondok?: string;
  namaAplikasi?: string;
  namaPendekAplikasi?: string;
  onToggleSidebar: () => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
  unreadCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  logoUrl,
  namaPondok,
  namaAplikasi,
  namaPendekAplikasi,
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

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 bg-slate-950/95 border-b border-slate-800/80 text-white shadow-2xl backdrop-blur-xl w-full max-w-full">
      
      {/* 3D Top Specular Highlight Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 via-amber-400/40 to-transparent pointer-events-none" />

      {/* Zone 1: 3D Brand Insignia */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
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
                {namaPendekAplikasi || 'SIM-KAMTIB'}
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

        {/* Tombol Garis Tiga (Mobile Hamburger Menu) - Jelas, Tebal, & Sangat Kontras di Pojok Kanan */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden flex items-center justify-center gap-1.5 px-3 py-2 text-amber-300 hover:text-white bg-gradient-to-r from-amber-500/25 via-yellow-400/30 to-amber-500/25 hover:from-amber-400/40 hover:to-yellow-400/50 rounded-xl transition-all cursor-pointer border-2 border-amber-400 shadow-xl shadow-amber-500/30 shrink-0 glow-gold ml-1 active:scale-95"
          aria-label="Buka Menu Navigasi (Garis Tiga)"
          title="Buka Menu Navigasi (Garis 3)"
        >
          {/* Tiga Garis Horizontal Tebal dan Terang */}
          <div className="flex flex-col justify-between items-center w-5 h-4 py-0.5">
            <span className="w-5 h-[2.5px] bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.95)]"></span>
            <span className="w-5 h-[2.5px] bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.95)]"></span>
            <span className="w-5 h-[2.5px] bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.95)]"></span>
          </div>
          <span className="text-[10px] font-mono font-black text-amber-300 tracking-wider">MENU</span>
        </button>

      </div>

    </header>
  );
};
