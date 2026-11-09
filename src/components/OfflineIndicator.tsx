import React from 'react';
import { WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 animate-bounce-subtle">
      <div className="metallic-glass-card rounded-2xl border border-amber-500/50 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-xl flex items-start gap-3 glow-gold">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
          <WifiOff className="w-4 h-4 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-xs font-bold text-amber-300 uppercase tracking-wider">
              Mode Offline Aktif
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Koneksi internet terputus. Data perizinan dan keamanan tetap tersimpan di penyimpanan lokal dan akan disinkronkan otomatis saat online.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          title="Cek ulang koneksi"
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
