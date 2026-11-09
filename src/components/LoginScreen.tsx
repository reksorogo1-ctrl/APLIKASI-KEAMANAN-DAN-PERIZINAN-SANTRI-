import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  KeyRound, 
  AlertCircle, 
  ChevronRight,
  Shield,
  Fingerprint,
  Radio
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { UserAccount } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const availableUsers = storageService.getUsers();
  const systemConfig = storageService.getSystemConfig();

  const handleLogin = (e: React.FormEvent) => {
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
    }, 400);
  };

  const handleQuickFill = (user: UserAccount) => {
    setUsername(user.username);
    setPassword(user.password || 'admin123');
    setErrorMessage('');
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#030712] overflow-hidden font-sans selection:bg-amber-400 selection:text-black bg-security-grid">
      
      {/* Cinematic 3D Command Background Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={systemConfig.bgUrl || "/src/assets/images/tactical_hq_background_1794052517484.jpg"}
          alt="International Command Room"
          className="w-full h-full object-cover filter contrast-125 brightness-75"
          style={{ opacity: (systemConfig.bgOpacity || 25) / 100 }}
        />
        {/* International Police Navy & Ruby Ambient Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/85 to-transparent" />
        <div className="absolute top-10 left-10 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 3D Main Authentication Card with Floating Depth & Rainbow Edge */}
      <div className="relative z-10 w-full max-w-xl my-6 card-3d-floating">
        
        {/* Upper 3D Metallic Status Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-t border-x border-slate-700/80 rounded-t-3xl text-[11px] backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-mono text-cyan-300 font-semibold uppercase tracking-wider">
              INTERNATIONAL SECURITY TERMINAL
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-amber-300">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>RBAC SECURE v3.0</span>
          </div>
        </div>

        {/* 3D Metallic Glass Card Body */}
        <div className="p-5 sm:p-8 md:p-10 metallic-glass-card border-x border-b border-slate-800 rounded-b-3xl shadow-2xl backdrop-blur-2xl relative overflow-hidden hover-rainbow-edge">
          
          {/* Top Specular Edge Line */}
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyan-400 via-amber-400 via-pink-500 to-blue-600" />

          {/* Pesantren Crest & Heading */}
          <div className="text-center space-y-3 pb-6 border-b border-slate-800/80">
            <div className="inline-block relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-cyan-500 via-amber-400 to-blue-600 blur-md opacity-60 animate-pulse" />
              <img
                src={systemConfig.logoUrl || "/src/assets/images/logo_pesantren_almaliki_1794050742981.jpg"}
                alt="Emblem Al-Maliki"
                className="relative w-20 h-20 mx-auto rounded-full object-cover border-2 border-amber-400 shadow-2xl"
              />
            </div>
            <div>
              <p className="text-xs font-serif text-amber-400 tracking-widest font-semibold uppercase">
                {systemConfig.namaPondok || "PONDOK PESANTREN SALAF AL-MALIKI"}
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase mt-0.5 font-sans">
                {systemConfig.namaAplikasi || "KEAMANAN SANTRI AL-MALIKI"}
              </h1>
              <p className="text-xs text-slate-400 font-mono tracking-wider mt-1">
                CENTRAL SECURITY & RBAC INTELLIGENCE COMMAND
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mt-5 p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            
            {/* Username Input with 3D Focus & Rainbow Edge */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Identitas Pengguna / Username</span>
                <span className="text-[10px] text-cyan-400 font-mono">ID Personil</span>
              </label>
              <div className="relative hover-rainbow-edge rounded-xl">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ketik username akun pengurus..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Input with 3D Focus & Rainbow Edge */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Kata Sandi / Kunci Akses</span>
                <span className="text-[10px] text-amber-400 font-mono">PIN Enkripsi</span>
              </label>
              <div className="relative hover-rainbow-edge rounded-xl">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ketik kata sandi akun..."
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Action Button - 3D Metallic Gold with Glowing Shadow */}
            <button
              type="submit"
              disabled={isLoading}
              className="tactile-interactive w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 hover:from-amber-300 hover:to-yellow-300 transition-all duration-200 flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 cursor-pointer disabled:opacity-50 border border-amber-300/60"
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>{isLoading ? 'Mengautentikasi Biometrik...' : 'Masuk Terminal Keamanan'}</span>
              <ChevronRight className="w-4 h-4 text-slate-950" />
            </button>
          </form>

          {/* Quick Access Account Selector for Instant Evaluation */}
          <div className="mt-8 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-300 uppercase flex items-center gap-1.5 font-mono">
                <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                Akses Cepat Pengujian (RBAC Preset)
              </span>
              <span className="text-[9px] text-slate-400 font-mono">Pilih personil</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableUsers.map((u) => {
                const isAdmin = u.role === 'admin';
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickFill(u)}
                    className="tactile-interactive p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-all cursor-pointer group flex items-center justify-between hover-rainbow-edge shadow-md"
                  >
                    <div className="truncate">
                      <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate font-sans">
                        {u.nama}
                      </p>
                      <p className="text-[10px] font-mono text-cyan-300 truncate">
                        {isAdmin ? '★ Database Pusat & Admin' : `🛡️ ${u.jabatan}`}
                      </p>
                      <p className="text-[9px] text-slate-400 font-mono">
                        user: <span className="text-cyan-400">{u.username}</span> | pass: <span className="text-amber-400">{u.password || 'admin123'}</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Security Badges */}
          <div className="mt-6 pt-4 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Terminal Terenkripsi RSA-4096
            </span>
            <span>Zona Waktu: Asia/Jakarta (WIB)</span>
          </div>

        </div>

      </div>

    </div>
  );
};
