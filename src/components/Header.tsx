import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  Bell,
  Clock
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
  logoUrl,
  namaPondok,
  namaPendekAplikasi,
  onToggleSidebar,
  onOpenNotifications,
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
        second: '2-digit',
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
    <header className="sticky top-0 z-50 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 bg-[#031810]/95 border-b border-[#d4af37]/30 text-[#f4f9f5] shadow-2xl backdrop-blur-xl w-full max-w-full">
      {/* Subtle Top Gold Specular Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/70 to-transparent pointer-events-none" />

      {/* Zone 1: Official Pesantren Brand Identity */}
      <div className="flex items-center gap-2.5 shrink-0 min-w-0">
        <div className="relative shrink-0">
          <img
            src={logoUrl || 'https://cdn.phototourl.com/member/2026-11-11-7ffd46ad-6406-4c9c-8043-01c37a880156.png'}
            alt="Logo Pondok Pesantren Salaf Al-Maliki"
            referrerPolicy="no-referrer"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#d4af37]/85 shadow-lg object-cover bg-[#02100a]"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <span className="text-xs sm:text-sm font-black tracking-tight text-[#f4f9f5] uppercase truncate">
              {namaPendekAplikasi || 'SIM PENGURUS'}
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-[#e5c158] font-bold">
              · SALAF AL-MALIKI
            </span>
          </div>
          <span className="text-[10px] block text-emerald-200/80 truncate max-w-[170px] sm:max-w-sm">
            {namaPondok || 'Pondok Pesantren Salaf Al-Maliki'}
          </span>
        </div>
      </div>

      {/* Zone 2: Live Sync & Official WIB Clock (Desktop) */}
      <div className="hidden lg:flex items-center gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#052318] border border-[#d4af37]/30 font-mono text-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-emerald-200/80">Database Pusat:</span>
          <span className="font-bold text-emerald-300">Tersinkronisasi</span>
        </div>

        <div className="flex items-center gap-2 font-mono bg-[#052318] px-3 py-1.5 rounded-xl border border-[#d4af37]/30">
          <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
          <span className="tabular-nums font-bold text-[#e5c158] tracking-wider">{currentTime} WIB</span>
        </div>
      </div>

      {/* Zone 3: Actions & Mobile 3-Line Menu Drawer Trigger */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
        <div className="hidden sm:flex lg:hidden items-center gap-1.5 font-mono bg-[#052318] px-2.5 py-1 rounded-xl border border-[#d4af37]/30 text-[11px] shrink-0">
          <Clock className="w-3 h-3 text-[#d4af37]" />
          <span className="tabular-nums font-bold text-[#e5c158]">{currentTime}</span>
        </div>

        <PWAInstallButton variant="header" />

        <button
          onClick={onOpenNotifications}
          className="relative p-2 text-emerald-100 hover:text-[#e5c158] hover:bg-[#083323] rounded-xl transition-colors border border-[#d4af37]/30 cursor-pointer shrink-0"
          title="Notifikasi Sistem"
          aria-label="Notifikasi Sistem"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold text-[#02100a] bg-[#e5c158] rounded-full font-mono">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 text-emerald-100 hover:text-[#e5c158] hover:bg-[#083323] rounded-xl transition-colors border border-[#d4af37]/30 cursor-pointer shrink-0"
          title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          aria-label="Ganti Tema"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Mobile 3-Line Hamburger Button at Top Right */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden flex items-center justify-center gap-1.5 px-3 py-2 text-[#e5c158] hover:text-white bg-[#072c1e] hover:bg-[#0b422d] rounded-xl transition-all cursor-pointer border border-[#d4af37]/65 shadow-lg shrink-0 active:scale-95"
          aria-label="Buka Menu Navigasi"
          title="Buka Menu"
        >
          <div className="flex flex-col justify-between items-center w-5 h-3.5">
            <span className="w-5 h-[2.5px] bg-[#e5c158] rounded-full" />
            <span className="w-5 h-[2.5px] bg-[#e5c158] rounded-full" />
            <span className="w-5 h-[2.5px] bg-[#e5c158] rounded-full" />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-wider">MENU</span>
        </button>
      </div>
    </header>
  );
};
