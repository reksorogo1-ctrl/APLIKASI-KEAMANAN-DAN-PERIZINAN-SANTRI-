import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronRight,
  Fingerprint,
  Delete,
  KeyRound,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { UserAccount } from '../types';

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
  const [showQuickAccess, setShowQuickAccess] = useState(true);
  const [nowTime, setNowTime] = useState(new Date());

  const availableUsers = storageService.getUsers();
  const systemConfig = storageService.getSystemConfig();
  const OFFICIAL_LOGO = 'https://cdn.phototourl.com/member/2026-11-11-7ffd46ad-6406-4c9c-8043-01c37a880156.png';

  // Live clock for iPhone Lock Screen header
  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const verifyPinCode = useCallback((code: string) => {
    setErrorMessage('');
    setIsLoading(true);
    setTimeout(() => {
      const res = storageService.authenticateByPin(code);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'PIN 6 Digit tidak dikenali.');
        setPinShake(true);
        setTimeout(() => {
          setPinShake(false);
          setPinDigits('');
          setIsLoading(false);
        }, 450);
      }
    }, 180);
  }, [onLoginSuccess]);

  const handleDigitPress = useCallback((digit: string) => {
    if (isLoading) return;
    setErrorMessage('');
    setPinDigits((prev) => {
      if (prev.length >= 6) return prev;
      const next = prev + digit;
      if (next.length === 6) {
        verifyPinCode(next);
      }
      return next;
    });
  }, [isLoading, verifyPinCode]);

  const handleBackspace = useCallback(() => {
    if (isLoading) return;
    setErrorMessage('');
    setPinDigits((prev) => prev.slice(0, -1));
  }, [isLoading]);

  const handleClearPin = useCallback(() => {
    if (isLoading) return;
    setErrorMessage('');
    setPinDigits('');
  }, [isLoading]);

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
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = storageService.authenticate(username, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'Kredensial tidak valid.');
        setIsLoading(false);
      }
    }, 250);
  };

  const handleQuickSelectUser = (user: UserAccount) => {
    setErrorMessage('');
    if (loginMode === 'pin') {
      const targetPin = user.pin || '111111';
      setPinDigits(targetPin);
      verifyPinCode(targetPin);
    } else {
      setUsername(user.username);
      setPassword(user.password || 'admin123');
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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#02100a] overflow-x-hidden font-sans selection:bg-[#d4af37] selection:text-[#031810] bg-luxury-grid">
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
        <div className="absolute inset-0 bg-gradient-to-t from-[#02100a] via-[#02100a]/85 to-[#031810]/80" />
      </div>

      {/* Main Container: iPhone Lock Screen + Quick PIN Directory */}
      <div className="relative z-10 w-full max-w-5xl my-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* LEFT / CENTER: IPHONE LOCK SCREEN 6-DIGIT PIN PAD */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-[400px] p-6 sm:p-8 luxury-3d-card rounded-[42px] border-2 border-[#d4af37]/40 shadow-[0_25px_70px_rgba(0,0,0,0.85)] relative overflow-hidden">
            {/* iPhone Dynamic Island / Top Speaker Bar */}
            <div className="flex justify-center mb-4">
              <div className="w-28 h-5 rounded-full bg-black/90 border border-[#d4af37]/30 flex items-center justify-between px-3 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-mono text-[#e5c158] tracking-widest uppercase">WIB LIVE</span>
              </div>
            </div>

            {/* Lock Screen Clock & Crest */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center justify-center relative mb-1">
                <img
                  src={systemConfig.logoUrl || OFFICIAL_LOGO}
                  alt="Logo Pondok Pesantren Salaf Al-Maliki"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#d4af37] shadow-xl bg-[#031810]"
                />
              </div>
              <div className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono drop-shadow-[0_2px_12px_rgba(212,175,55,0.35)]">
                {timeFormatted}
              </div>
              <p className="text-xs font-semibold text-emerald-100">{dateFormatted}</p>
              <p className="text-[11px] font-mono text-[#e5c158]">{hijriFormatted}</p>
              <div className="pt-1">
                <p className="text-[10px] font-serif text-[#e5c158] tracking-widest font-bold uppercase">
                  {systemConfig.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI'}
                </p>
              </div>
            </div>

            {/* Mode Switcher Pill */}
            <div className="mt-4 flex p-1 rounded-2xl bg-[#02120b]/90 border border-[#d4af37]/25">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('pin');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  loginMode === 'pin'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#b58e24] text-[#02120a] shadow-md'
                    : 'text-emerald-200/75 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>PIN 6 Digit (Lock Screen)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('classic');
                  setErrorMessage('');
                }}
                className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  loginMode === 'classic'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#b58e24] text-[#02120a] shadow-md'
                    : 'text-emerald-200/75 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Username & Sandi</span>
              </button>
            </div>

            {errorMessage && (
              <div className="mt-3 p-2.5 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 text-[11px] flex items-center justify-center gap-2 text-center">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {loginMode === 'pin' ? (
              <div className="mt-5 space-y-5">
                {/* Prompt & 6 PIN Dots */}
                <div className="text-center space-y-3">
                  <p className="text-xs font-semibold text-[#f4f9f5] tracking-wide flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Masukkan Kode PIN 6 Digit Pengurus</span>
                  </p>
                  <div
                    className={`flex items-center justify-center gap-3.5 py-1 transition-transform ${
                      pinShake ? 'translate-x-2' : ''
                    }`}
                  >
                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                      const filled = idx < pinDigits.length;
                      return (
                        <div
                          key={idx}
                          className={`w-3.5 h-3.5 rounded-full transition-all duration-150 border ${
                            filled
                              ? 'bg-[#e5c158] border-[#f9e29c] scale-110 shadow-[0_0_12px_rgba(229,193,88,0.9)]'
                              : 'bg-transparent border-[#d4af37]/50'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* iPhone Circular Glass Keypad */}
                <div className="grid grid-cols-3 gap-3.5 max-w-[280px] mx-auto select-none">
                  {keypadButtons.map((btn) => (
                    <button
                      key={btn.num}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleDigitPress(btn.num)}
                      className="w-18 h-18 sm:w-20 sm:h-20 mx-auto rounded-full bg-[#06291c]/75 hover:bg-[#d4af37]/25 active:scale-95 border border-[#d4af37]/35 hover:border-[#e5c158] flex flex-col items-center justify-center transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_6px_16px_rgba(0,0,0,0.4)] group"
                    >
                      <span className="text-2xl font-bold text-white group-hover:text-[#f9e29c] leading-none font-sans">
                        {btn.num}
                      </span>
                      {btn.sub && (
                        <span className="text-[8px] font-mono tracking-[0.2em] text-emerald-200/70 group-hover:text-[#e5c158] mt-1">
                          {btn.sub}
                        </span>
                      )}
                    </button>
                  ))}

                  {/* Bottom Row: Reset / 0 / Backspace */}
                  <button
                    type="button"
                    onClick={handleClearPin}
                    className="w-18 h-18 sm:w-20 sm:h-20 mx-auto rounded-full bg-[#041b12]/60 hover:bg-red-950/50 active:scale-95 border border-emerald-800/50 hover:border-red-500/40 flex flex-col items-center justify-center text-[10px] font-mono font-bold text-emerald-200/80 hover:text-red-300 transition-all cursor-pointer"
                  >
                    ULANG
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleDigitPress('0')}
                    className="w-18 h-18 sm:w-20 sm:h-20 mx-auto rounded-full bg-[#06291c]/75 hover:bg-[#d4af37]/25 active:scale-95 border border-[#d4af37]/35 hover:border-[#e5c158] flex flex-col items-center justify-center transition-all cursor-pointer shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_6px_16px_rgba(0,0,0,0.4)] group"
                  >
                    <span className="text-2xl font-bold text-white group-hover:text-[#f9e29c] leading-none">
                      0
                    </span>
                    <span className="text-[8px] font-mono text-emerald-200/70 mt-1">+</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="w-18 h-18 sm:w-20 sm:h-20 mx-auto rounded-full bg-[#041b12]/60 hover:bg-[#d4af37]/20 active:scale-95 border border-emerald-800/50 hover:border-[#d4af37]/50 flex flex-col items-center justify-center text-emerald-200/90 hover:text-[#e5c158] transition-all cursor-pointer"
                    title="Hapus 1 Digit"
                  >
                    <Delete className="w-5 h-5" />
                    <span className="text-[8px] font-mono mt-0.5">HAPUS</span>
                  </button>
                </div>

                <div className="pt-2 text-center">
                  <div className="w-32 h-1 rounded-full bg-white/30 mx-auto" />
                </div>
              </div>
            ) : (
              /* Classic Username & Password Form */
              <form onSubmit={handleClassicLogin} className="mt-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#f4f9f5]">
                    Username Pengurus
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-[#d4af37]" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username..."
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5] placeholder-[#8c7a65] focus:outline-none focus:border-[#d4af37] transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#f4f9f5]">
                    Kata Sandi Akses
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#d4af37]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#031810] border border-[#d4af37]/30 rounded-xl text-[#f4f9f5] placeholder-[#8c7a65] focus:outline-none focus:border-[#d4af37] transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-[#d1e7da] hover:text-[#f4f9f5] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="tactile-interactive w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider luxury-gold-btn flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isLoading ? 'Memverifikasi Akses...' : 'Masuk ke Sistem Manajemen'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT: RBAC DIVISION DIRECTORY & PIN REFERENCE PANEL */}
        <div className="lg:col-span-6">
          <div className="p-6 sm:p-7 luxury-3d-card rounded-3xl border border-[#d4af37]/35 space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-[#d4af37]/20 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-[10px] font-mono font-bold text-[#e5c158] mb-1.5">
                  <Sparkles className="w-3 h-3" />
                  <span>ROLE-BASED ACCESS CONTROL (RBAC)</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Portal Akses Divisi Pengurus Pondok
                </h2>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  Ketik <strong className="text-[#e5c158]">PIN 6 Digit</strong> pada layar kunci atau klik salah satu kartu divisi di bawah untuk langsung masuk sesuai hak akses.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAccess(!showQuickAccess)}
                className="px-2.5 py-1 rounded-lg bg-[#041d13] border border-[#d4af37]/30 text-[10px] font-mono text-[#e5c158] hover:text-white cursor-pointer shrink-0"
              >
                {showQuickAccess ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
              </button>
            </div>

            {showQuickAccess && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[430px] overflow-y-auto pr-1">
                {availableUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelectUser(u)}
                    className="p-3.5 rounded-2xl bg-[#031810]/90 hover:bg-[#083524] border border-[#d4af37]/25 hover:border-[#d4af37] text-left transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-[#f9e29c] truncate">
                          {u.nama}
                        </p>
                        <p className="text-[11px] text-[#e5c158] font-medium truncate">
                          {u.jabatan}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f9e29c] font-mono font-black text-xs shrink-0">
                        PIN: {u.pin || '111111'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-emerald-200/75 pt-1.5 border-t border-emerald-800/40 w-full">
                      <span>Role: <strong className="text-emerald-300 uppercase">{u.role}</strong></span>
                      <span className="text-[#e5c158] group-hover:translate-x-0.5 transition-transform">
                        Masuk Instan →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-[#02120b]/90 border border-[#d4af37]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-emerald-200/80 font-mono">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-[#e5c158] shrink-0" />
                <span>PIN 6 Digit, Password & Role dapat diubah melalui <strong className="text-[#e5c158]">Options Panel Admin</strong></span>
              </div>
              <span className="text-emerald-400 font-bold shrink-0">● Cloud Sync Aktif</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
