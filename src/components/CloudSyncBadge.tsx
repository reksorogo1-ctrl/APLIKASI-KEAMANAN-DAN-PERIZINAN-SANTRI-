import React, { useEffect, useState } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { storageService, CloudSyncTelemetry } from '../services/storageService';

interface CloudSyncBadgeProps {
  compact?: boolean;
  className?: string;
}

export const CloudSyncBadge: React.FC<CloudSyncBadgeProps> = ({
  compact = false,
  className = '',
}) => {
  const [telemetry, setTelemetry] = useState<CloudSyncTelemetry>(() =>
    storageService.getCloudSyncStatus()
  );
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const syncState = () => {
      setTelemetry(storageService.getCloudSyncStatus());
    };
    syncState();
    const unsub = storageService.subscribe(syncState);
    const handleOnline = () => syncState();
    const handleOffline = () => syncState();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const timer = setInterval(syncState, 5000);
    return () => {
      unsub();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, []);

  const handleRetrySync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      await storageService.resyncOnResume(true);
      await storageService.forcePullFromCloud();
    } finally {
      setTelemetry(storageService.getCloudSyncStatus());
      setIsRetrying(false);
    }
  };

  const isSupabase = telemetry.provider === 'supabase';
  const providerLabel = isSupabase ? 'Supabase Realtime' : 'Firebase';
  const isConnected = telemetry.status === 'connected';
  const isSyncing = telemetry.status === 'syncing';
  const isQuotaPaused = Boolean(!isSupabase && telemetry.quotaExceeded);
  const isFailed = telemetry.status === 'error' || telemetry.status === 'offline';

  return (
    <div className={`relative inline-flex flex-col items-end max-w-full ${className}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setShowDetails((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowDetails((prev) => !prev);
          }
        }}
        title={
          isQuotaPaused
            ? 'Kuota harian gratis Firestore tercapai (reset otomatis besok). Data cache lokal tetap aktif.'
            : isFailed && telemetry.errorMessage
              ? `Offline / Gagal Koneksi ${providerLabel}: ${telemetry.errorMessage}`
              : `Cloud Synced (${providerLabel}) · ${telemetry.lastSyncTime}`
        }
        className={`inline-flex items-center gap-1.5 rounded-xl border font-mono transition-all cursor-pointer select-none max-w-full ${
          compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'
        } ${
          isConnected
            ? 'bg-emerald-950/90 border-emerald-500/45 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
            : isSyncing
              ? 'bg-amber-950/85 border-amber-500/45 text-amber-200'
              : isQuotaPaused
                ? 'bg-amber-950/95 border-amber-500/70 text-amber-200 shadow-[0_0_14px_rgba(245,158,11,0.25)]'
                : 'bg-red-950/95 border-red-500/70 text-red-200 shadow-[0_0_14px_rgba(239,68,68,0.3)]'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            isConnected
              ? 'bg-[#10B981] animate-pulse shadow-[0_0_8px_#10B981]'
              : isSyncing
                ? 'bg-amber-400 animate-ping'
                : isQuotaPaused
                  ? 'bg-amber-400 animate-pulse shadow-[0_0_8px_#F59E0B]'
                  : 'bg-red-500 animate-pulse shadow-[0_0_8px_#EF4444]'
          }`}
        />
        {isConnected ? (
          <Cloud className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
        ) : isSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 text-amber-300 animate-spin shrink-0" />
        ) : isQuotaPaused ? (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        ) : (
          <CloudOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
        )}

        <span className="font-bold truncate">
          {isConnected
            ? `Cloud Synced (${providerLabel})`
            : isSyncing
              ? `Menghubungkan ${providerLabel}...`
              : isQuotaPaused
                ? 'Mode Cache (Kuota Harian Penuh)'
                : `Offline / Gagal Koneksi ${providerLabel}`}
        </span>

        {showDetails ? (
          <ChevronUp className="w-3 h-3 opacity-75 shrink-0" />
        ) : (
          <ChevronDown className="w-3 h-3 opacity-75 shrink-0" />
        )}
      </div>

      {/* Tampilkan pesan status saat gagal atau kuota harian penuh */}
      {isFailed && telemetry.errorMessage && !isQuotaPaused && (
        <div className="mt-1 px-2.5 py-1 rounded-lg bg-red-950/95 border border-red-500/60 text-red-200 text-[10px] font-mono leading-snug max-w-[300px] sm:max-w-sm break-words shadow-lg text-left">
          <span className="font-bold text-red-300">Error {providerLabel}: </span>
          <span>{telemetry.errorMessage}</span>
        </div>
      )}

      {/* Detail Popover saat diklik */}
      {showDetails && (
        <div className="absolute right-0 top-full mt-1.5 w-[280px] sm:w-[320px] p-3 rounded-2xl bg-[#041A13]/98 border border-emerald-500/35 shadow-2xl backdrop-blur-xl text-[11px] font-mono text-emerald-100 z-50 space-y-2 text-left">
          <div className="flex items-center justify-between gap-2 border-b border-emerald-500/20 pb-1.5">
            <span className="font-bold text-[#D4AF37]">
              {isSupabase ? 'STATUS SUPABASE CLOUD' : 'STATUS FIREBASE CLOUD'}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(false);
              }}
              className="text-emerald-300/70 hover:text-white p-0.5 cursor-pointer"
              aria-label="Tutup Detail Cloud"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between gap-2">
              <span className="text-emerald-300/75">{isSupabase ? 'Host:' : 'Project ID:'}</span>
              <span className="text-white font-bold truncate max-w-[180px]">{telemetry.projectId}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-emerald-300/75">Database:</span>
              <span className="text-amber-300 font-bold truncate max-w-[175px]" title={telemetry.databaseId}>
                {telemetry.databaseId}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-emerald-300/75">Sinkronisasi:</span>
              <span className={isQuotaPaused ? 'text-amber-300 font-bold' : isFailed ? 'text-red-300 font-bold' : 'text-emerald-300 font-bold'}>
                {telemetry.lastSyncTime}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-emerald-300/75">Listener Aktif:</span>
              <span className="text-emerald-200 font-bold">
                {telemetry.activeListenersCount} {isSupabase ? 'postgres_changes' : 'onSnapshot'} ({telemetry.totalSyncedItems} dok)
              </span>
            </div>
          </div>

          {!isSupabase && (
            <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-400/40 text-purple-100 text-[10px] leading-relaxed">
              Kredensial Supabase belum diisi di environment / <span className="font-bold">supabase.ts</span> (masih menggunakan mode fallback).
            </div>
          )}

          {isQuotaPaused ? (
            <div className="p-2.5 rounded-xl bg-amber-950/90 border border-amber-500/50 text-amber-100 text-[10px] space-y-1.5 leading-relaxed">
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Kuota baca/tulis harian gratis Firestore Enterprise hari ini telah penuh dan akan reset otomatis besok. Data cache lokal tetap aktif.
                </span>
              </div>
              <a
                href={`https://console.firebase.google.com/project/${telemetry.projectId}/firestore/databases/${telemetry.databaseId}/data?openUpgradeDialog=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-amber-300 underline hover:text-amber-200 font-bold"
              >
                Buka Firebase Console Firestore &rarr;
              </a>
            </div>
          ) : (
            isFailed && telemetry.errorMessage && (
              <div className="p-2 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 text-[10px] break-words flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <span>{telemetry.errorMessage}</span>
              </div>
            )
          )}

          <button
            type="button"
            onClick={handleRetrySync}
            disabled={isRetrying}
            className="w-full py-1.5 px-3 rounded-xl bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Menyinkronkan...' : `Sinkronkan Ulang ke ${providerLabel}`}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export const CloudMigrationToast: React.FC = () => {
  const [message, setMessage] = useState<string | null>(() =>
    storageService.getMigrationNotification()
  );

  useEffect(() => {
    const update = () => {
      setMessage(storageService.getMigrationNotification());
    };
    update();
    const unsub = storageService.subscribe(update);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      storageService.dismissMigrationNotification();
    }, 9000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50"
    >
      <div className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[#041A13]/95 border border-emerald-400/60 text-emerald-100 shadow-2xl backdrop-blur-xl text-xs font-mono">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
          <span className="font-bold text-emerald-200 truncate">{message}</span>
        </div>
        <button
          type="button"
          onClick={() => storageService.dismissMigrationNotification()}
          className="text-emerald-300/75 hover:text-white p-1 rounded-lg cursor-pointer shrink-0"
          aria-label="Tutup Notifikasi Migrasi"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
