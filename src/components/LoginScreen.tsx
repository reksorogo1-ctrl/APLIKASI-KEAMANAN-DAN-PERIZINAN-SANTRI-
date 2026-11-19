import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronRight,
  Delete,
  KeyRound,
  Smartphone
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { UserAccount } from '../types';
import {
  unlockAudioAndSpeech,
  playClickSound,
  playSuccessChime,
  playErrorTone,
  speakWelcomeMessage,
} from '../utils/soundEffects';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [loginMode, setLoginMode] = useState<'pin' | 'classic'>('pin');
  const [pinDigits, setPinDigits] = useState<string>('');
  const [pinShake, setPinShake] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [nowTime, setNowTime] = useState(new Date());

  const systemConfig = storageService.getSystemConfig();

  // Live clock for iPhone Lock Screen header
  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const verifyPinCode = useCallback((code: string) => {
    setErrorMessage('');
    setIsLoading(true);

    const res = storageService.authenticateByPin(code);
    if (res.success && res.user) {
      playSuccessChime();
      onLoginSuccess(res.user);
      speakWelcomeMessage(res.user.nama, { delayMs: 300 });
    } else {
      playErrorTone();
      setErrorMessage(res.message || 'PIN 6 Digit tidak dikenali.');
      setPinShake(true);
      setTimeout(() => {
        setPinShake(false);
        setPinDigits('');
        setIsLoading(false);
      }, 450);
    }
  }, [onLoginSuccess]);

  // Monitor PIN digit length in real-time so the final digit verifies & enters Dashboard automatically
  useEffect(() => {
    if (loginMode !== 'pin' || isLoading || pinShake) return;
    if (pinDigits.length === 6) {
      verifyPinCode(pinDigits);
    }
  }, [pinDigits, loginMode, isLoading, pinShake, verifyPinCode]);

  const handleDigitPress = useCallback((digit: string) => {
    unlockAudioAndSpeech();
    if (isLoading || pinShake) return;
    playClickSound();
    setErrorMessage('');
    setPinDigits((prev) => (prev.length >= 6 ? prev : prev + digit));
  }, [isLoading, pinShake]);

  const handleBackspace = useCallback(() => {
    unlockAudioAndSpeech();
    if (isLoading || pinShake) return;
    playClickSound();
    setErrorMessage('');
    setPinDigits((prev) => prev.slice(0, -1));
  }, [isLoading, pinShake]);

  const handleClearPin = useCallback(() => {
    unlockAudioAndSpeech();
    if (isLoading || pinShake) return;
    playClickSound();
    setErrorMessage('');
    setPinDigits('');
  }, [isLoading, pinShake]);

  // Physical keyboard support for 6-digit PIN Lock Screen
  useEffect(() => {
    if (loginMode !== 'pin') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClearPin();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [loginMode, handleDigitPress, handleBackspace, handleClearPin]);

  const handleClassicLogin = (e: React.FormEvent) => {
    e.preventDefault();
    unlockAudioAndSpeech();
    playClickSound();
    setErrorMessage('');
    setIsLoading(true);

    const res = storageService.authenticate(username, password);
    if (res.success && res.user) {
      playSuccessChime();
      onLoginSuccess(res.user);
      speakWelcomeMessage(res.user.nama, { delayMs: 300 });
    } else {
      playErrorTone();
      setErrorMessage(res.message || 'Kredensial tidak valid.');
      setIsLoading(false);
    }
  };

  const timeFormatted = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(nowTime);

  const dateFormatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(nowTime);

  const hijriFormatted = (() => {
    try {
      return new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      }).format(nowTime);
    } catch {
      return 'Kalender Hijriah Ponpes Al-Maliki';
    }
  })();

  const keypadButtons: { num: string; sub: string }[] = [
    { num: '1', sub: '' },
    { num: '2', sub: 'ABC' },
    { num: '3', sub: 'DEF' },
    { num: '4', sub: 'GHI' },
    { num: '5', sub: 'JKL' },
    { num: '6', sub: 'MNO' },
    { num: '7', sub: 'PQRS' },
    { num: '8', sub: 'TUV' },
    { num: '9', sub: 'WXYZ' },
  ];

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center p-3 sm:p-4 bg-[#041A13] overflow-x-hidden overflow-y-auto font-sans selection:bg-[#D4AF37] selection:text-[#041A13] bg-luxury-grid">
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {systemConfig.bgUrl && (
          <img
            src={systemConfig.bgUrl}
            alt="Pondok Pesantren Salaf Al-Maliki"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter contrast-125 brightness-50"
            style={{ opacity: Math.min(20, systemConfig.bgOpacity || 20) / 100 }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#041A13] via-[#041A13]/85 to-[#041A13]/75" />
      </div>

      {/* Main Container: Centered iPhone Lock Screen */}
      <div className="relative z-10 w-full max-w-md my-2 sm:my-4 mx-auto">
        
        {/* CENTER: IPHONE LOCK SCREEN 6-DIGIT PIN PAD */}
        <div className="flex justify-center">
          <div className="w-full max-w-[400px] p-5 sm:p-8 bg-emerald-950/60 backdrop-blur-md border border-emerald-500/25 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative overflow-hidden">
            {/* iPhone Dynamic Island / Top Speaker Bar */}
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="w-28 h-5 rounded-full bg-black/90 border border-[#d4af37]/30 flex items-center justify-between px-3 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-mono text-[#e5c158] tracking-widest uppercase">WIB LIVE</span>
              </div>
            </div>

            {/* Lock Screen Clock & Crest */}
            <div className="text-center space-y-1.5 sm:space-y-2">
              <div className="inline-flex items-center justify-center relative mb-1">
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-[22%] bg-[#041d13] border-2 border-[#d4af37]/80 p-0 shadow-[0_12px_35px_rgba(0,0,0,0.8),0_0_24px_rgba(212,175,55,0.3)] flex items-center justify-center overflow-hidden">
                  <img
                    src={
                      !systemConfig.logoUrl ||
                      systemConfig.logoUrl.includes('2026-11-11-7ffd46ad') ||
                      systemConfig.logoUrl.includes('2026-11-14-03361e24') ||
                      systemConfig.logoUrl.includes('logo_pesantren_almaliki')
                        ? '/logo-fit.png'
                        : systemConfig.logoUrl
                    }
                    alt="Logo Pondok Pesantren Salaf Al-Maliki"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (!img.dataset.fallbackApplied) {
                        img.dataset.fallbackApplied = '1';
                        img.src = '/logo-fit.png';
                      }
                    }}
                    className="w-full h-full object-cover scale-[1.03]"
                  />
                </div>
              </div>
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono drop-shadow-[0_2px_12px_rgba(212,175,55,0.35)]">
                {timeFormatted}
              </div>
              <p className="text-xs font-semibold text-[#D1FAE5]">{dateFormatted}</p>
              <p className="text-[11px] font-mono text-[#D4AF37]">{hijriFormatted}</p>
              <div className="pt-0.5">
                <p className="text-[10px] font-serif text-[#D4AF37] tracking-widest font-bold uppercase">
                  {systemConfig.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI'}
                </p>
              </div>
            </div>

            {/* Mode Switcher Pill */}
            <div className="mt-4 flex p-1 rounded-2xl bg-[#041A13]/85 border border-emerald-500/25 touch-manipulation select-none">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  unlockAudioAndSpeech();
                  playClickSound();
                  setLoginMode('pin');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer touch-manipulation select-none ${
                  loginMode === 'pin'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#b58e24] text-[#041A13] shadow-md'
                    : 'text-[#D1FAE5] hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>PIN 6 Digit (Lock Screen)</span>
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  unlockAudioAndSpeech();
                  playClickSound();
                  setLoginMode('classic');
                  setErrorMessage('');
                }}
                className={`flex-1 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer touch-manipulation select-none ${
                  loginMode === 'classic'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#b58e24] text-[#041A13] shadow-md'
                    : 'text-[#D1FAE5] hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Username & Sandi</span>
              </motion.button>
            </div>

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 p-2.5 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 text-[11px] flex items-center justify-center gap-2 text-center"
              >
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {loginMode === 'pin' ? (
              <div className="mt-4 sm:mt-5 space-y-4 sm:space-y-5">
                {/* Prompt & 6 PIN Dots with smooth shake animation on wrong PIN */}
                <div className="text-center space-y-2.5 sm:space-y-3">
                  <p className="text-xs font-semibold text-[#f4f9f5] tracking-wide flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Masukkan Kode PIN 6 Digit Pengurus</span>
                  </p>
                  <motion.div
                    animate={
                      pinShake
                        ? { x: [0, -11, 11, -8, 8, -4, 4, 0] }
                        : { x: 0 }
                    }
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="flex items-center justify-center gap-3.5 py-1"
                  >
                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                      const filled = idx < pinDigits.length;
                      return (
                        <div
                          key={idx}
                          className={`w-3.5 h-3.5 rounded-full transition-all duration-150 border ${
                            pinShake
                              ? 'bg-red-500 border-red-300 scale-110 shadow-[0_0_12px_rgba(239,68,68,0.85)]'
                              : filled
                                ? 'bg-[#e5c158] border-[#f9e29c] scale-110 shadow-[0_0_12px_rgba(229,193,88,0.9)]'
                                : 'bg-transparent border-[#d4af37]/50'
                          }`}
                        />
                      );
                    })}
                  </motion.div>
                </div>

                {/* iPhone Circular Glass Keypad (Responsive max-w-xs mx-auto, touch-action: manipulation) */}
                <div
                  className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xs mx-auto w-full place-items-center select-none touch-manipulation"
                  style={{ touchAction: 'manipulation', WebkitUserSelect: 'none' }}
                >
                  {keypadButtons.map((btn) => (
                    <motion.button
                      key={btn.num}
                      type="button"
                      data-no-tap="true"
                      whileTap={{ scale: 0.92 }}
                      disabled={isLoading}
                      onClick={() => handleDigitPress(btn.num)}
                      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                      aria-label={`Angka ${btn.num}`}
                      className="w-16 h-16 sm:w-[74px] sm:h-[74px] aspect-square rounded-full bg-emerald-950/65 backdrop-blur-md hover:bg-[#10B981]/20 active:bg-[#10B981]/30 border border-emerald-500/30 hover:border-[#D4AF37] active:border-[#D4AF37] flex flex-col items-center justify-center transition-colors cursor-pointer touch-manipulation select-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.14),0_6px_16px_rgba(0,0,0,0.45)] group"
                    >
                      <span className="text-2xl font-bold text-white group-hover:text-[#D4AF37] leading-none font-sans pointer-events-none">
                        {btn.num}
                      </span>
                      {btn.sub && (
                        <span className="text-[8px] font-mono tracking-[0.2em] text-[#D1FAE5] group-hover:text-[#D4AF37] mt-1 pointer-events-none">
                          {btn.sub}
                        </span>
                      )}
                    </motion.button>
                  ))}

                  {/* Bottom Row: Reset / 0 / Backspace */}
                  <motion.button
                    type="button"
                    data-no-tap="true"
                    whileTap={{ scale: 0.92 }}
                    disabled={isLoading}
                    onClick={handleClearPin}
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                    aria-label="Ulangi PIN"
                    className="w-16 h-16 sm:w-[74px] sm:h-[74px] aspect-square rounded-full bg-[#041A13]/80 hover:bg-red-950/50 active:bg-red-950/70 border border-emerald-500/25 hover:border-red-500/50 flex flex-col items-center justify-center text-[10px] font-mono font-bold text-[#D1FAE5] hover:text-red-300 transition-colors cursor-pointer touch-manipulation select-none"
                  >
                    <span className="pointer-events-none">ULANG</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    data-no-tap="true"
                    whileTap={{ scale: 0.92 }}
                    disabled={isLoading}
                    onClick={() => handleDigitPress('0')}
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                    aria-label="Angka 0"
                    className="w-16 h-16 sm:w-[74px] sm:h-[74px] aspect-square rounded-full bg-emerald-950/65 backdrop-blur-md hover:bg-[#10B981]/20 active:bg-[#10B981]/30 border border-emerald-500/30 hover:border-[#D4AF37] active:border-[#D4AF37] flex flex-col items-center justify-center transition-colors cursor-pointer touch-manipulation select-none shadow-[inset_0_1px_1px_rgba(255,255,255,0.14),0_6px_16px_rgba(0,0,0,0.45)] group"
                  >
                    <span className="text-2xl font-bold text-white group-hover:text-[#D4AF37] leading-none pointer-events-none">
                      0
                    </span>
                    <span className="text-[8px] font-mono text-[#D1FAE5] mt-1 pointer-events-none">+</span>
                  </motion.button>

                  <motion.button
                    type="button"
                    data-no-tap="true"
                    whileTap={{ scale: 0.92 }}
                    disabled={isLoading}
                    onClick={handleBackspace}
                    style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
                    aria-label="Hapus 1 Digit"
                    title="Hapus 1 Digit"
                    className="w-16 h-16 sm:w-[74px] sm:h-[74px] aspect-square rounded-full bg-[#041A13]/80 hover:bg-[#10B981]/20 active:bg-[#10B981]/30 border border-emerald-500/25 hover:border-[#D4AF37]/60 flex flex-col items-center justify-center text-[#D1FAE5] hover:text-[#D4AF37] transition-colors cursor-pointer touch-manipulation select-none"
                  >
                    <Delete className="w-5 h-5 pointer-events-none" />
                    <span className="text-[8px] font-mono mt-0.5 pointer-events-none">HAPUS</span>
                  </motion.button>
                </div>

                <div className="pt-1 sm:pt-2 text-center">
                  <div className="w-32 h-1 rounded-full bg-white/30 mx-auto" />
                </div>
              </div>
            ) : (
              /* Classic Username & Password Form */
              <form onSubmit={handleClassicLogin} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-white">
                    Username Pengurus
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-[#D4AF37]" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username..."
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#041A13]/85 border border-emerald-500/30 rounded-xl text-white placeholder-[#D1FAE5]/50 focus:outline-none focus:border-[#10B981] transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-white">
                    Kata Sandi Akses
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#D4AF37]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#041A13]/85 border border-emerald-500/30 rounded-xl text-white placeholder-[#D1FAE5]/50 focus:outline-none focus:border-[#10B981] transition-colors font-mono"
                    />
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-[#D1FAE5] hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </motion.button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.97 }}
                  disabled={isLoading}
                  className="tactile-interactive w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider luxury-gold-btn flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isLoading ? 'Memverifikasi Akses...' : 'Masuk ke Sistem Manajemen'}</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
