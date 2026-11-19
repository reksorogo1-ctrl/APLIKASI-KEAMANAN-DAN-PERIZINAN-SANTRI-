import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Download, Smartphone, Monitor, Share, PlusSquare, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { METALLIC_EASE } from './MotionPrimitives';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'full';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'header', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already installed as standalone PWA, hide ambient button unless forced
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 4000);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {variant === 'header' && (
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-emerald-950 via-[#041d13] to-emerald-950 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 hover:glow-gold shadow-sm active:scale-95 ${className}`}
          title="Pasang Aplikasi Ke Layar Utama (PWA Desktop / Android / iOS)"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
          <span className="hidden sm:inline uppercase tracking-wider font-mono text-[11px]">Install App</span>
          <span className="sm:hidden font-mono text-[10px] uppercase">PWA</span>
        </button>
      )}

      {variant === 'sidebar' && (
        <button
          onClick={handleInstallClick}
          className={`w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-[#041d13]/90 to-emerald-950/60 border border-emerald-500/30 hover:border-emerald-400/60 text-slate-200 transition-all hover:glow-gold group ${className}`}
        >
          <div className="flex items-center gap-2.5 text-left">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:scale-105 transition-transform">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider font-sans group-hover:text-emerald-300 transition-colors">
                Install Aplikasi
              </p>
              <p className="text-[10px] text-emerald-200/75 font-mono">
                Pasang di HP / Komputer (PWA)
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            {isInstallable ? 'SIAP' : 'PANDUAN'}
          </span>
        </button>
      )}

      {/* SUCCESS BANNER TOAST */}
      {installSuccess && (
        <div className="fixed top-20 right-4 z-50 metallic-glass-card rounded-2xl border border-emerald-500/60 bg-[#02100a]/95 p-4 shadow-2xl flex items-center gap-3 glow-emerald animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-bold text-white uppercase font-sans">Aplikasi Berhasil Dipasang!</p>
            <p className="text-[11px] text-emerald-100/90">Ikon Al-Maliki Security telah ditambahkan ke layar perangkat Anda.</p>
          </div>
        </div>
      )}

      {/* MODAL GUIDE FOR INSTALLATION (ANDROID, WINDOWS, MAC, IOS) */}
      {showGuideModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, ease: METALLIC_EASE }}
          onClick={() => setShowGuideModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.24, ease: METALLIC_EASE }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#06241B]/95 backdrop-blur-xl border border-emerald-400/30 rounded-2xl shadow-2xl overflow-hidden my-8"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-emerald-500/25 flex items-center justify-between bg-[#041A13]/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[#10B981] shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white font-sans uppercase tracking-tight">
                    Instalasi Aplikasi Keamanan
                  </h3>
                  <p className="text-[11px] font-mono text-[#D1FAE5] tracking-wider">
                    PWA STANDALONE • PONPES SALAF AL-MALIKI
                  </p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowGuideModal(false)}
                className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-[#D1FAE5] hover:text-white border border-emerald-500/25 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 text-slate-200">
              <div className="p-3.5 rounded-2xl bg-[#041d13]/90 border border-emerald-800 flex items-center gap-3.5">
                <img
                  src="/pwa-192x192.png"
                  alt="Al-Maliki Icon"
                  className="w-14 h-14 rounded-2xl border border-amber-500/40 shadow-md p-1 bg-[#02100a]"
                />
                <div>
                  <h4 className="font-bold text-white text-sm">KEAMANAN SANTRI AL-MALIKI</h4>
                  <p className="text-xs text-emerald-200/75">Aplikasi Komando & Pengawasan Keamanan Santri</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Mode Standalone Tersedia
                  </span>
                </div>
              </div>

              {/* TABS PER PLATFORM */}
              <div className="space-y-3.5">
                {/* 1. Android / Chrome */}
                <div className="p-4 rounded-2xl bg-[#02100a]/80 border border-emerald-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs font-mono uppercase">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span>Android (Google Chrome / Edge)</span>
                  </div>
                  <ol className="list-decimal list-inside text-xs text-emerald-100/90 space-y-1.5 pl-1 leading-relaxed">
                    <li>Buka menu browser (ikon titik tiga <strong className="text-white">⋮</strong> di kanan atas).</li>
                    <li>Pilih menu <strong className="text-emerald-300">"Install app"</strong> atau <strong className="text-emerald-300">"Tambahkan ke Layar Utama"</strong>.</li>
                    <li>Klik konfirmasi <strong className="text-white">"Install"</strong>. Aplikasi langsung muncul di daftar aplikasi HP Anda.</li>
                  </ol>
                </div>

                {/* 2. iOS (iPhone / iPad) */}
                <div className="p-4 rounded-2xl bg-[#02100a]/80 border border-emerald-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs font-mono uppercase">
                    <Share className="w-4 h-4 text-amber-400" />
                    <span>iPhone / iPad (Safari)</span>
                  </div>
                  <ol className="list-decimal list-inside text-xs text-emerald-100/90 space-y-1.5 pl-1 leading-relaxed">
                    <li>Buka website ini di browser <strong className="text-white">Safari</strong>.</li>
                    <li>Ketuk tombol <strong className="text-amber-300">Bagikan (Share)</strong> <span className="inline-block px-1 py-0.5 rounded bg-[#072c1e] text-[10px] font-mono border border-emerald-800">⎋ / [↑]</span> di bagian bawah layar.</li>
                    <li>Gulir ke bawah lalu pilih opsi <strong className="text-amber-300">"Tambah ke Layar Utama" (Add to Home Screen)</strong>.</li>
                    <li>Ketuk <strong className="text-white">"Tambah" (Add)</strong> di pojok kanan atas.</li>
                  </ol>
                </div>

                {/* 3. PC / Laptop (Windows, Mac, Linux) */}
                <div className="p-4 rounded-2xl bg-[#02100a]/80 border border-emerald-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs font-mono uppercase">
                    <Monitor className="w-4 h-4 text-amber-400" />
                    <span>Komputer / Laptop (Chrome / Edge)</span>
                  </div>
                  <ol className="list-decimal list-inside text-xs text-emerald-100/90 space-y-1.5 pl-1 leading-relaxed">
                    <li>Klik ikon <strong className="text-emerald-300">Install</strong> di address bar browser sebelah kanan (ikon monitor dengan panah bawah).</li>
                    <li>Atau buka menu titik tiga <strong className="text-white">⋮</strong> &gt; <strong className="text-emerald-300">"Simpan dan Bagikan" &gt; "Install SIM-KAMTIB"</strong>.</li>
                    <li>Aplikasi akan berjalan di jendela terpisah tanpa bar browser (mode native desktop).</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-emerald-500/25 bg-[#041A13]/80 flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#D1FAE5]">
                Aplikasi ringan &bull; Offline Ready &bull; Hemat Kuota
              </span>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#10B981] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-colors cursor-pointer"
              >
                Mengerti & Tutup
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};
