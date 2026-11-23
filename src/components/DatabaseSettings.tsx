import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck,
  Server,
  Radio,
  RefreshCw,
  Smartphone,
  Laptop,
  Code2,
  Check,
  Activity,
  Trash2,
  FileSpreadsheet,
  Copy,
  FileCode2
} from 'lucide-react';
import { storageService, CloudSyncTelemetry } from '../services/storageService';
import { SUPABASE_SETUP_SQL } from '../services/supabaseSchema';
import { transferAllLegacyDataToSupabase } from '../services/supabaseMigrationService';
import { Santri, Perizinan, Pelanggaran, Sanksi, DewanKeamanan, LogAktivitas } from '../types';

interface DatabaseSettingsProps {
  santriList: Santri[];
  perizinanList: Perizinan[];
  pelanggaranList: Pelanggaran[];
  sanksiList: Sanksi[];
  dewanList: DewanKeamanan[];
  logsList: LogAktivitas[];
}

export const DatabaseSettings: React.FC<DatabaseSettingsProps> = ({
  santriList,
  perizinanList,
  pelanggaranList,
  sanksiList,
  dewanList,
  logsList,
}) => {
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [syncTelemetry, setSyncTelemetry] = useState<CloudSyncTelemetry>(storageService.getCloudSyncStatus());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isMigratingSupabase, setIsMigratingSupabase] = useState<boolean>(false);
  const [isClearingSample, setIsClearingSample] = useState<boolean>(false);
  const [confirmClearSample, setConfirmClearSample] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const isSupabase = syncTelemetry.provider === 'supabase';
  const providerLabel = isSupabase ? 'Supabase Realtime' : 'Firebase';

  useEffect(() => {
    const syncState = () => setSyncTelemetry(storageService.getCloudSyncStatus());
    syncState();
    const unsub = storageService.subscribe(syncState);
    const interval = setInterval(syncState, 4000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleDownloadBackup = () => {
    const jsonStr = storageService.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_sim_kamtib_almaliki_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMessage('Cadangan data lengkap berhasil diunduh ke file JSON.');
  };

  const handleDownloadExcelCsv = () => {
    const csvStr = storageService.exportSantriUstadzCsv();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data_santri_ustadzah_almaliki_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMessage('Data Santri & Ustadzah berhasil diunduh ke file Excel/CSV.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      const success = await storageService.importFullBackup(content);
      if (success) {
        setStatusMessage(`Alhamdulillah, pemulihan database dari file JSON berhasil diterapkan dan disinkronkan real-time ke Database Pusat ${providerLabel}.`);
        setSyncTelemetry(storageService.getCloudSyncStatus());
      } else {
        setStatusMessage('Gagal memulihkan database: Format file JSON tidak valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleForcePull = async () => {
    setIsSyncing(true);
    setStatusMessage('Menghubungkan dan menarik data terbaru dari Database Pusat...');
    const ok = await storageService.forcePullFromCloud();
    const latestTelemetry = storageService.getCloudSyncStatus();
    setSyncTelemetry(latestTelemetry);
    setIsSyncing(false);
    if (ok) {
      setStatusMessage(`Data berhasil disinkronkan langsung dari Database Pusat ${latestTelemetry.provider === 'supabase' ? 'Supabase Realtime' : 'Firestore'}.`);
    } else if (latestTelemetry.quotaExceeded) {
      setStatusMessage('Kuota baca harian gratis Firestore hari ini telah tercapai dan akan reset otomatis besok. Cache offline Firestore tetap aktif.');
    } else {
      setStatusMessage('Gagal memperbarui dari server cloud saat ini; cache lokal tetap aktif.');
    }
  };

  const handleMigrateToSupabase = async () => {
    if (isMigratingSupabase) return;
    setIsMigratingSupabase(true);
    setStatusMessage('Mentransfer seluruh data lama (Santri, Ustadzah, Fasilitas, Surat, Perizinan, Peminjaman, Jadwal, Absensi) ke Supabase...');
    try {
      const res = await transferAllLegacyDataToSupabase();
      setSyncTelemetry(storageService.getCloudSyncStatus());
      setStatusMessage(res.message);
    } finally {
      setIsMigratingSupabase(false);
    }
  };

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
      setCopiedSql(true);
      setStatusMessage('Skrip SQL CREATE TABLE + RLS + Realtime + Storage Bucket berhasil disalin ke clipboard!');
      setTimeout(() => setCopiedSql(false), 3000);
    } catch {
      setStatusMessage('Gagal menyalin otomatis. Silakan gunakan tombol Unduh File .sql.');
    }
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SUPABASE_SETUP_SQL], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'almaliki_supabase_schema_realtime.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatusMessage('File almaliki_supabase_schema_realtime.sql berhasil diunduh.');
  };

  const handleClearSampleData = async () => {
    setIsClearingSample(true);
    try {
      const res = await storageService.clearAllSampleData();
      setConfirmClearSample(false);
      setSyncTelemetry(storageService.getCloudSyncStatus());
      setStatusMessage(
        `Data sample berhasil dibersihkan (${res.removedSantri} santri sample, ${res.removedUstadz} ustadz/ustadzah sample, ${res.removedLainnya} entri contoh lainnya). Data asli pengurus tetap aman.`
      );
    } catch {
      setStatusMessage('Terjadi kendala saat membersihkan data sample.');
    } finally {
      setIsClearingSample(false);
    }
  };

  const handleResetToDefault = async () => {
    await storageService.forcePullFromCloud();
    setSyncTelemetry(storageService.getCloudSyncStatus());
    setStatusMessage(`Seluruh data perangkat telah disinkronkan ulang secara langsung dari Database Pusat ${providerLabel}.`);
  };

  return (
    <div className="space-y-6">
      
      {/* 3D Command Header Banner */}
      <div className="metallic-glass-card rounded-3xl p-6 border border-emerald-800/80 shadow-2xl hover-rainbow-edge relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 glow-gold">
                Single Database · Multi Platform
              </span>
              <span className="text-[10px] font-mono text-emerald-300/60">· Realtime Central Hub</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3 font-sans">
              <Database className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              Pusat Basis Data & Sinkronisasi Real-Time
            </h1>
            <p className="text-xs text-emerald-200/75 mt-1 font-mono">
              Satu basis data pusat terpadu untuk Laptop/PC, PWA HP Android/iOS, dan Google AI Studio
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div
              className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl text-xs font-mono shadow-inner border ${
                syncTelemetry.status === 'connected'
                  ? 'bg-[#02100a]/90 border-emerald-500/45 text-emerald-300 glow-gold'
                  : syncTelemetry.status === 'syncing'
                    ? 'bg-amber-950/80 border-amber-500/45 text-amber-200'
                    : syncTelemetry.quotaExceeded
                      ? 'bg-amber-950/90 border-amber-500/65 text-amber-200'
                      : 'bg-red-950/90 border-red-500/60 text-red-200'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  syncTelemetry.status === 'connected'
                    ? 'bg-emerald-400 animate-pulse'
                    : syncTelemetry.status === 'syncing'
                      ? 'bg-amber-400 animate-ping'
                      : syncTelemetry.quotaExceeded
                        ? 'bg-amber-400 animate-pulse'
                        : 'bg-red-500 animate-pulse'
                }`}
              />
              <span className="font-bold tracking-wide">
                {syncTelemetry.status === 'connected'
                  ? `Cloud Synced (${providerLabel})`
                  : syncTelemetry.status === 'syncing'
                    ? `Menghubungkan ${providerLabel}...`
                    : syncTelemetry.quotaExceeded
                      ? 'Mode Cache (Kuota Harian Penuh)'
                      : `Offline / Gagal Koneksi ${providerLabel}`}
              </span>
            </div>
            {syncTelemetry.quotaExceeded ? (
              <div className="px-3 py-2 rounded-xl bg-amber-950/90 border border-amber-500/50 text-amber-100 text-[11px] font-mono max-w-md space-y-1">
                <p>
                  Kuota baca/tulis harian gratis Firestore hari ini penuh dan akan reset otomatis besok. Data cache lokal tetap aktif.
                </p>
                <a
                  href={`https://console.firebase.google.com/project/${syncTelemetry.projectId}/firestore/databases/${syncTelemetry.databaseId}/data?openUpgradeDialog=true`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-amber-300 underline hover:text-amber-200 font-bold"
                >
                  Cek Kuota / Upgrade di Firebase Console &rarr;
                </a>
              </div>
            ) : (
              (syncTelemetry.status === 'error' || syncTelemetry.status === 'offline') && syncTelemetry.errorMessage && (
                <div className="px-3 py-1.5 rounded-xl bg-red-950/90 border border-red-500/50 text-red-200 text-[11px] font-mono max-w-md break-words">
                  Error {providerLabel}: {syncTelemetry.errorMessage}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 flex items-center justify-between text-xs shadow-xl font-mono">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage('')} className="text-emerald-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* ARSITEKTUR SINGLE DATABASE - MULTI PLATFORM MONITOR */}
      <div className="metallic-glass-card rounded-3xl p-6 border border-emerald-500/40 shadow-2xl space-y-4 hover-rainbow-edge card-3d-floating bg-gradient-to-r from-[#02100a] via-[#041d13] to-emerald-950/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-emerald-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 glow-gold">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  ARSITEKTUR SATU DATABASE UTAMA
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <h2 className="text-base font-black text-white uppercase tracking-tight mt-0.5">
                {isSupabase
                  ? 'Pusat Penyimpanan Supabase PostgreSQL Realtime Al-Maliki'
                  : 'Pusat Penyimpanan Cloud Terpadu Al-Maliki'}
              </h2>
              <p className="text-xs text-emerald-200/75 font-mono">
                Database: <span className="text-amber-300 font-bold">{syncTelemetry.databaseId}</span> · Host/Project: <span className="text-emerald-300 font-bold">{syncTelemetry.projectId}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleMigrateToSupabase}
              disabled={isMigratingSupabase}
              className="tactile-interactive inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono font-extrabold text-white bg-gradient-to-r from-purple-600 via-fuchsia-600 to-amber-500 hover:brightness-110 rounded-xl transition-all shadow-lg cursor-pointer border border-amber-300/60 disabled:opacity-60"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isMigratingSupabase ? 'Mentransfer...' : '🚀 Transfer Semua Data Lama ke Supabase'}</span>
            </button>
            <button
              onClick={handleForcePull}
              disabled={isSyncing}
              className="tactile-interactive inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-amber-400 hover:from-emerald-300 hover:to-amber-300 rounded-xl transition-all shadow-lg cursor-pointer border border-emerald-300 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-950 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Ulang Sekarang'}</span>
            </button>
          </div>
        </div>

        {/* 3 Platform Interconnection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          
          {/* Platform 1: Laptop & Komputer */}
          <div className="p-4 rounded-2xl bg-[#02100a]/90 border border-emerald-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-100/90 flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-emerald-400" />
                Browser Laptop & PC
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                AKTIF
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/75 leading-relaxed font-sans">
              Akses website penuh melalui laptop untuk admin & pengurus. Mutasi data otomatis sinkron ke HP.
            </p>
            <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 pt-1 border-t border-emerald-800">
              <Check className="w-3 h-3" />
              <span>Realtime Listener Active</span>
            </div>
          </div>

          {/* Platform 2: HP Android & iOS PWA */}
          <div className="p-4 rounded-2xl bg-[#02100a]/90 border border-emerald-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-100/90 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-400" />
                Web App / PWA Layar HP
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                AKTIF
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/75 leading-relaxed font-sans">
              Aplikasi terpasang di layar utama HP pengurus. Catatan izin & pelanggaran langsung muncul di laptop.
            </p>
            <div className="text-[10px] font-mono text-amber-400 flex items-center gap-1 pt-1 border-t border-emerald-800">
              <Check className="w-3 h-3" />
              <span>Bi-Directional Sync Active</span>
            </div>
          </div>

          {/* Platform 3: Google AI Studio */}
          <div className="p-4 rounded-2xl bg-[#02100a]/90 border border-emerald-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-100/90 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-purple-400" />
                Google AI Studio
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                TERHUBUNG
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/75 leading-relaxed font-sans">
              Lingkungan update kode terhubung ke basis data produksi yang sama tanpa database duplikat.
            </p>
            <div className="text-[10px] font-mono text-purple-300 flex items-center gap-1 pt-1 border-t border-emerald-800">
              <Check className="w-3 h-3" />
              <span>Single Cloud Source</span>
            </div>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-emerald-200/75 pt-2 border-t border-emerald-800">
          <div>
            Terakhir Sinkron: <span className="text-amber-300 font-bold">{syncTelemetry.lastSyncTime}</span>
          </div>
          <div>
            Total Entitas Tersinkron: <span className="text-emerald-400 font-bold">{syncTelemetry.totalSyncedItems} Dokumen</span>
          </div>
        </div>
      </div>

      {/* Database Statistics Cards - 3D Styled */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="metallic-glass-card rounded-2xl p-4 border border-emerald-800/80 text-center hover-rainbow-edge card-3d-floating shadow-lg">
          <p className="text-[11px] font-mono font-bold text-emerald-200/75 uppercase">Total Santri</p>
          <p className="text-2xl font-black text-white font-mono mt-1 tabular-nums">{santriList.length}</p>
        </div>
        <div className="metallic-glass-card rounded-2xl p-4 border border-emerald-800/80 text-center hover-rainbow-edge card-3d-floating shadow-lg">
          <p className="text-[11px] font-mono font-bold text-emerald-200/75 uppercase">Pengurus Keamanan</p>
          <p className="text-2xl font-black text-amber-300 font-mono mt-1 tabular-nums glow-gold">{dewanList.length}</p>
        </div>
        <div className="metallic-glass-card rounded-2xl p-4 border border-emerald-800/80 text-center hover-rainbow-edge card-3d-floating shadow-lg">
          <p className="text-[11px] font-mono font-bold text-emerald-200/75 uppercase">Arsip Perizinan</p>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1 tabular-nums glow-gold">{perizinanList.length}</p>
        </div>
        <div className="metallic-glass-card rounded-2xl p-4 border border-emerald-800/80 text-center hover-rainbow-edge card-3d-floating shadow-lg">
          <p className="text-[11px] font-mono font-bold text-emerald-200/75 uppercase">Buku Pelanggaran</p>
          <p className="text-2xl font-black text-rose-400 font-mono mt-1 tabular-nums glow-red">{pelanggaranList.length}</p>
        </div>
        <div className="metallic-glass-card rounded-2xl p-4 border border-emerald-800/80 text-center hover-rainbow-edge card-3d-floating shadow-lg">
          <p className="text-[11px] font-mono font-bold text-emerald-200/75 uppercase">Sanksi Edukatif</p>
          <p className="text-2xl font-black text-amber-300 font-mono mt-1 tabular-nums glow-gold">{sanksiList.length}</p>
        </div>
        <div className="metallic-glass-card rounded-2xl p-4 border border-emerald-800/80 text-center hover-rainbow-edge card-3d-floating shadow-lg">
          <p className="text-[11px] font-mono font-bold text-emerald-200/75 uppercase">Log Aktivitas</p>
          <p className="text-2xl font-black text-emerald-300 font-mono mt-1 tabular-nums glow-gold">{logsList.length}</p>
        </div>
      </div>

      {/* Main Action Panels - 3D Styled */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Panel 1: Backup & Restore */}
        <div className="metallic-glass-card rounded-3xl p-6 border border-emerald-800/80 space-y-4 shadow-2xl hover-rainbow-edge card-3d-floating">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/30 glow-gold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-sans uppercase tracking-wide">Unduh Cadangan Database Lengkap</h3>
              <p className="text-xs text-emerald-200/75 font-mono">Simpan seluruh arsip santri, perizinan, dan tata tertib dalam format JSON</p>
            </div>
          </div>

          <p className="text-xs text-emerald-100/90 leading-relaxed font-sans">
            Cadangan ini dapat disimpan di komputer sekretariat pondok atau flashdisk sebagai arsip keamanan berkala. Data terenkripsi rapi dan dapat dipulihkan sewaktu-waktu.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleDownloadBackup}
              className="tactile-interactive flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold font-mono text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl border border-amber-300/60"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>Cadangkan Data (Export JSON)</span>
            </button>
            <button
              onClick={handleDownloadExcelCsv}
              className="tactile-interactive py-3 px-4 rounded-2xl bg-[#041d13]/90 hover:bg-[#072c1e] border border-emerald-500/40 text-emerald-200 font-bold font-mono text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Excel (CSV)</span>
            </button>
          </div>
        </div>

        {/* Panel 2: Restore from File */}
        <div className="metallic-glass-card rounded-3xl p-6 border border-emerald-800/80 space-y-4 shadow-2xl hover-rainbow-edge card-3d-floating">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 glow-gold">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-sans uppercase tracking-wide">Pulihkan Data (Import JSON)</h3>
              <p className="text-xs text-emerald-200/75 font-mono">Unggah file .json hasil cadangan sebelumnya</p>
            </div>
          </div>

          <p className="text-xs text-emerald-100/90 leading-relaxed font-sans">
            Fitur ini akan memperbarui dan menyelaraskan seluruh tabel database dengan berkas arsip yang Anda pilih langsung ke Database Pusat Firestore sehingga seluruh perangkat otomatis terbarui secara real-time.
          </p>

          <label className="tactile-interactive w-full py-3 px-4 rounded-2xl bg-[#041d13]/90 hover:bg-[#072c1e] border border-emerald-800/80 text-white font-bold font-mono text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl hover-rainbow-edge">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>Pulihkan Data (Import JSON)</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>

        {/* Panel 3: Clear Sample Data & Cloud Resync */}
        <div className="metallic-glass-card rounded-3xl p-6 border border-emerald-800/80 space-y-4 shadow-2xl md:col-span-2 hover-rainbow-edge card-3d-floating">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 glow-red">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-sans uppercase tracking-wide">Pemeliharaan Data Sample &amp; Sinkronisasi Pusat</h3>
              <p className="text-xs text-emerald-200/75 font-mono">Bersihkan data contoh bawaan tanpa menghapus data santri &amp; ustadzah yang sudah diinput pengurus</p>
            </div>
          </div>

          <p className="text-xs text-emerald-200/75 font-mono">
            Seluruh data tersimpan tunggal secara real-time di Database Pusat Firestore sehingga perubahan di Laptop, HP Android, iPhone, maupun Web App langsung sinkron otomatis.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {!confirmClearSample ? (
              <button
                type="button"
                onClick={() => setConfirmClearSample(true)}
                className="tactile-interactive py-2.5 px-4 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-500/50 text-rose-200 font-bold font-mono text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Hapus Semua Data Sample</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-rose-950/60 border border-rose-500/50">
                <span className="text-[11px] font-mono text-rose-200 px-1">Yakin hapus seluruh data contoh?</span>
                <button
                  type="button"
                  disabled={isClearingSample}
                  onClick={handleClearSampleData}
                  className="tactile-interactive py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold font-mono text-[11px] cursor-pointer disabled:opacity-60"
                >
                  {isClearingSample ? 'Menghapus...' : 'Ya, Bersihkan Sample'}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearSample(false)}
                  className="py-1.5 px-3 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 font-mono text-[11px] cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleResetToDefault}
              className="tactile-interactive py-2.5 px-4 rounded-xl bg-[#041d13]/90 hover:bg-[#072c1e] border border-emerald-700/60 text-emerald-200 font-bold font-mono text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tarik Ulang dari Database Pusat</span>
            </button>
          </div>
        </div>

        {/* Panel 4: Skrip SQL Supabase Setup */}
        <div className="metallic-glass-card rounded-3xl p-6 border border-purple-500/40 space-y-4 shadow-2xl md:col-span-2 hover-rainbow-edge card-3d-floating">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-300 border border-purple-400/40">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white font-sans uppercase tracking-wide">
                  Skrip SQL Pembentukan 24 Tabel, RLS, Realtime &amp; Bucket Storage Supabase
                </h3>
                <p className="text-xs text-emerald-200/75 font-mono">
                  Salin dan jalankan di SQL Editor Supabase sebelum menekan tombol Transfer Semua Data Lama ke Supabase
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="tactile-interactive py-2 px-4 rounded-xl bg-purple-600/80 hover:bg-purple-500 text-white font-bold font-mono text-xs inline-flex items-center gap-1.5 cursor-pointer border border-purple-300/40"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'SQL Disalin!' : 'Salin Skrip SQL'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadSql}
                className="tactile-interactive py-2 px-4 rounded-xl bg-[#041d13]/90 hover:bg-[#072c1e] text-amber-300 font-bold font-mono text-xs inline-flex items-center gap-1.5 cursor-pointer border border-amber-400/40"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File .SQL</span>
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
