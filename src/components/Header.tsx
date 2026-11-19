import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Moon,
  Sun,
  Bell,
  Clock,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react';
import { UserAccount } from '../types';
import { storageService } from '../services/storageService';
import { PWAInstallButton } from './PWAInstallButton';
import {
  isSoundMuted,
  toggleSoundMuted,
  playClickSound,
  speakWelcomeMessage,
  unlockAudioAndSpeech,
} from '../utils/soundEffects';

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
  namaPendekAplikasi,
  onToggleSidebar,
  onOpenNotifications,
  unreadCount,
}) => {
  const [theme, setThemeState] = useState<'dark' | 'light'>(storageService.getTheme());
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(() => isSoundMuted());

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
    unlockAudioAndSpeech();
    playClickSound();
    const next = theme === 'dark' ? 'light' : 'dark';
    storageService.setTheme(next);
    setThemeState(next);
  };

  const handleToggleMute = () => {
    unlockAudioAndSpeech();
    const nextMuted = toggleSoundMuted();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      playClickSound();
    }
  };

  const handleReplayWelcome = () => {
    unlockAudioAndSpeech();
    setIsMuted(false);
    playClickSound();
    speakWelcomeMessage(currentUser.nama, { force: true });
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-4 px-2.5 sm:px-6 py-2 sm:py-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] pl-[max(0.625rem,env(safe-area-inset-left))] pr-[max(0.625rem,env(safe-area-inset-right))] sm:px-6 bg-[#041A13]/92 sm:bg-emerald-950/60 border-b border-emerald-500/25 text-white shadow-2xl backdrop-blur-md w-full max-w-full">
      {/* Subtle Top Gold & Emerald Specular Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/70 to-transparent pointer-events-none" />

      {/* Zone 1: Official Pesantren Brand Identity */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-1 md:flex-initial min-w-0">
        {(() => {
          const isKeamananLogo = Boolean(
            logoUrl && (logoUrl.includes('2026-11-11-7ffd46ad') || logoUrl.includes('logo-keamanan'))
          );
          const resolvedSrc = isKeamananLogo
            ? '/logo-keamanan.png'
            : !logoUrl ||
              logoUrl.includes('2026-11-14-03361e24') ||
              logoUrl.includes('logo_pesantren_almaliki')
            ? '/logo-fit.png'
            : logoUrl;
          return (
            <div
              className={`relative shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] border border-[#D4AF37]/85 shadow-lg overflow-hidden ${
                isKeamananLogo ? 'bg-white p-0.5' : 'bg-[#041A13]'
              }`}
            >
              <img
                src={resolvedSrc}
                alt={isKeamananLogo ? 'Logo Keamanan Pondok Pesantren Salaf Al-Maliki' : 'Logo Pondok Pesantren Salaf Al-Maliki'}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (!img.dataset.fallbackApplied) {
                    img.dataset.fallbackApplied = '1';
                    img.src = isKeamananLogo ? '/logo-keamanan.png' : '/logo-fit.png';
                  }
                }}
                className={isKeamananLogo ? 'w-full h-full object-contain' : 'w-full h-full object-cover scale-[1.03]'}
              />
            </div>
          );
        })()}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-nowrap min-w-0">
            <span className="text-[11px] sm:text-sm font-black tracking-tight text-white uppercase truncate">
              {namaPendekAplikasi || 'SIM PENGURUS'}
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-[#D4AF37] font-bold shrink-0">
              · SALAF AL-MALIKI
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] block text-[#D1FAE5] truncate">
            {namaPondok || 'Pondok Pesantren Salaf Al-Maliki'}
          </span>
        </div>
      </div>

      {/* Zone 2: Live Sync & Official WIB Clock (Desktop) */}
      <div className="hidden lg:flex items-center gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#041A13]/80 border border-emerald-500/25 font-mono text-[#D1FAE5]">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[11px] text-[#D1FAE5]">Database Pusat:</span>
          <span className="font-bold text-[#10B981]">Tersinkronisasi</span>
        </div>

        <div className="flex items-center gap-2 font-mono bg-[#041A13]/80 px-3 py-1.5 rounded-xl border border-emerald-500/25">
          <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span className="tabular-nums font-bold text-[#D4AF37] tracking-wider">{currentTime} WIB</span>
        </div>
      </div>

      {/* Zone 3: Actions & Mobile 3-Line Menu Drawer Trigger */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <div className="hidden sm:flex lg:hidden items-center gap-1.5 font-mono bg-[#041A13]/80 px-2.5 py-1 rounded-xl border border-emerald-500/25 text-[11px] shrink-0">
          <Clock className="w-3 h-3 text-[#D4AF37]" />
          <span className="tabular-nums font-bold text-[#D4AF37]">{currentTime}</span>
        </div>

        <PWAInstallButton variant="header" className="hidden sm:flex" />

        {/* Speaker Mute / Replay Welcome Speech Controls */}
        <div className="flex items-center rounded-xl border border-emerald-500/25 bg-[#041A13]/60 overflow-hidden shrink-0">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleToggleMute}
            className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-colors cursor-pointer touch-manipulation ${
              isMuted
                ? 'text-red-300 hover:bg-red-950/50'
                : 'text-[#10B981] hover:text-[#D4AF37] hover:bg-emerald-950/80'
            }`}
            title={isMuted ? 'Aktifkan Suara & Efek Klik' : 'Bisukan Suara & Efek Klik'}
            aria-label={isMuted ? 'Aktifkan Suara' : 'Bisukan Suara'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </motion.button>
          <div className="hidden sm:block w-[1px] h-4 bg-emerald-500/25" />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleReplayWelcome}
            className="hidden sm:flex w-10 h-10 items-center justify-center text-[#D1FAE5] hover:text-[#D4AF37] hover:bg-emerald-950/80 transition-colors cursor-pointer touch-manipulation"
            title="Putar Ulang Suara Sambutan"
            aria-label="Putar Ulang Suara Sambutan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            unlockAudioAndSpeech();
            playClickSound();
            onOpenNotifications();
          }}
          className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#D1FAE5] hover:text-[#D4AF37] hover:bg-emerald-950/80 rounded-xl transition-colors border border-emerald-500/25 cursor-pointer shrink-0 touch-manipulation"
          title="Notifikasi Sistem"
          aria-label="Notifikasi Sistem"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold text-[#041A13] bg-[#D4AF37] rounded-full font-mono">
              {unreadCount}
            </span>
          )}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={toggleTheme}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-[#D1FAE5] hover:text-[#D4AF37] hover:bg-emerald-950/80 rounded-xl transition-colors border border-emerald-500/25 cursor-pointer shrink-0 touch-manipulation"
          title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          aria-label="Ganti Tema"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </motion.button>

        {/* Mobile 3-Line Hamburger Button */}
        <button
          type="button"
          onClick={() => {
            unlockAudioAndSpeech();
            playClickSound();
            onToggleSidebar();
          }}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          className="md:hidden flex items-center justify-center gap-1.5 min-w-[46px] min-h-[44px] px-3 py-2.5 sm:px-3.5 text-[#D4AF37] hover:text-white active:scale-95 bg-emerald-950/85 hover:bg-emerald-900/80 rounded-xl transition-all cursor-pointer border border-[#D4AF37]/60 shadow-lg shrink-0 touch-manipulation select-none"
          aria-label="Buka Menu Navigasi"
          title="Buka Menu"
        >
          <div className="flex flex-col justify-between items-center w-5 h-3.5 shrink-0 pointer-events-none">
            <span className="w-5 h-[2.5px] bg-[#D4AF37] rounded-full" />
            <span className="w-5 h-[2.5px] bg-[#D4AF37] rounded-full" />
            <span className="w-5 h-[2.5px] bg-[#D4AF37] rounded-full" />
          </div>
          <span className="hidden min-[410px]:inline text-[10px] font-mono font-bold tracking-wider whitespace-nowrap pointer-events-none">MENU</span>
        </button>
      </div>
    </header>
  );
};
