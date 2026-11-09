import React, { useState } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck,
  Server
} from 'lucide-react';
import { storageService } from '../services/storageService';
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

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const success = storageService.importFullBackup(content);
      if (success) {
        setStatusMessage('Alhamdulillah, pemulihan database dari file JSON berhasil diterapkan.');
      } else {
        alert('Gagal memulihkan database: Format file tidak valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetToDefault = () => {
    if (confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh data ke setelan awal pabrik (Data Awal Pesantren Al-Maliki)? Semua perubahan manual akan dikembalikan ke awal.')) {
      storageService.resetToDefault();
      setStatusMessage('Database telah diatur ulang ke data awal pesantren.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 3D Command Header Banner */}
      <div className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 shadow-2xl hover-rainbow-edge relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 glow-cyan">
                Central Storage Architecture
              </span>
              <span className="text-[10px] font-mono text-slate-500">· Persistent DB Node</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3 font-sans">
              <Database className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              Pengaturan Basis Data & Cadangan Sistem
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Manajemen penyimpanan data permanen, ekspor/impor cadangan JSON, dan sinkronisasi real-time
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-950/90 border border-slate-800 px-4 py-2 rounded-2xl text-xs font-mono shadow-inner glow-cyan">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-cyan-300 font-bold tracking-wide">STATUS NODE: TERHUBUNG</span>
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

      {/* Database Statistics Cards - 3D Styled */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="metallic-glass-card rounded-2xl p-4 border border-slate-800/80 text-center hover-rainbow-edge card-3d-floating shadow-lg">
          <p className="text-[11px] font-mono font-bold text-slate-400 uppercase">Total Santri</p>
          <p className="text-2xl font-black text-white font-mono mt-1 tabular-nums">{santriList.length}</p>
        </div>
        <div className="metallic-glass-card rounded-2xl p-4 border border-slate-800/80 text-center hover-rainbow-edge card-3d-floating shadow-lg">
          <p className="text-[11px] font-mono font-bold text-slate-400 uppercase">Pengurus Keamanan</p>
          <p className="text-2xl font-black text-amber-300 font-mono mt-1 tabular-nums glow-gold">{dewanList.length}</p>
        </div>
        <div className="metallic-glass-card rounded-2xl p-4 border border-slate-800/80 text-center hover-rainbow-edge card-3d-floating shadow-lg">
          <p className="text-[11px] font-mono font-bold text-slate-400 uppercase">Arsip Perizinan</p>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1 tabular-nums glow-cyan">{perizinanList.length}</p>
        </div>
        <div className="metallic-glass-card rounded-2xl p-4 border border-slate-800/80 text-center hover-rainbow-edge card-3d-floating shadow-lg">
          <p className="text-[11px] font-mono font-bold text-slate-400 uppercase">Buku Pelanggaran</p>
          <p className="text-2xl font-black text-rose-400 font-mono mt-1 tabular-nums glow-red">{pelanggaranList.length}</p>
        </div>
        <div className="metallic-glass-card rounded-2xl p-4 border border-slate-800/80 text-center hover-rainbow-edge card-3d-floating shadow-lg">
          <p className="text-[11px] font-mono font-bold text-slate-400 uppercase">Sanksi Edukatif</p>
          <p className="text-2xl font-black text-amber-300 font-mono mt-1 tabular-nums glow-gold">{sanksiList.length}</p>
        </div>
        <div className="metallic-glass-card rounded-2xl p-4 border border-slate-800/80 text-center hover-rainbow-edge card-3d-floating shadow-lg">
          <p className="text-[11px] font-mono font-bold text-slate-400 uppercase">Log Aktivitas</p>
          <p className="text-2xl font-black text-cyan-300 font-mono mt-1 tabular-nums glow-cyan">{logsList.length}</p>
        </div>
      </div>

      {/* Main Action Panels - 3D Styled */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Panel 1: Backup & Restore */}
        <div className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 space-y-4 shadow-2xl hover-rainbow-edge card-3d-floating">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/30 glow-gold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-sans uppercase tracking-wide">Unduh Cadangan Database Lengkap</h3>
              <p className="text-xs text-slate-400 font-mono">Simpan seluruh arsip santri, perizinan, dan tata tertib dalam format JSON</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Cadangan ini dapat disimpan di komputer sekretariat pondok atau flashdisk sebagai arsip keamanan berkala. Data terenkripsi rapi dan dapat dipulihkan sewaktu-waktu.
          </p>

          <button
            onClick={handleDownloadBackup}
            className="tactile-interactive w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold font-mono text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl border border-amber-300/60"
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>Unduh File Cadangan JSON</span>
          </button>
        </div>

        {/* Panel 2: Restore from File */}
        <div className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 space-y-4 shadow-2xl hover-rainbow-edge card-3d-floating">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 glow-cyan">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-sans uppercase tracking-wide">Pulihkan Data dari File Cadangan</h3>
              <p className="text-xs text-slate-400 font-mono">Unggah file .json hasil cadangan sebelumnya</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Fitur ini akan memperbarui dan menyelaraskan seluruh tabel database dengan berkas arsip yang Anda pilih.
          </p>

          <label className="tactile-interactive w-full py-3 px-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white font-bold font-mono text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl hover-rainbow-edge">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Pilih File Cadangan JSON</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>

        {/* Panel 3: Reset to Factory Initial Data */}
        <div className="metallic-glass-card rounded-3xl p-6 border border-slate-800/80 space-y-4 shadow-2xl md:col-span-2 hover-rainbow-edge card-3d-floating">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30 glow-red">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-sans uppercase tracking-wide">Reset ke Data Awal Pesantren Al-Maliki</h3>
              <p className="text-xs text-slate-400 font-mono">Kembalikan basis data ke data master awal sistem</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 font-mono">
            Gunakan opsi ini jika Anda ingin mengembalikan sampel data santri, jadwal dewan keamanan, dan daftar perizinan ke konfigurasi bawaan pertama kali.
          </p>

          <button
            onClick={handleResetToDefault}
            className="tactile-interactive py-3 px-5 rounded-2xl bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-200 font-bold font-mono text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover-rainbow-edge"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Reset Database ke Setelan Awal</span>
          </button>
        </div>

      </div>

    </div>
  );
};
