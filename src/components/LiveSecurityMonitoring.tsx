import React, { useState, useMemo, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  FileCheck2, 
  DoorOpen, 
  UserCheck, 
  History, 
  Fingerprint, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  ChevronRight, 
  Eye, 
  ShieldAlert, 
  Sparkles, 
  Info, 
  ArrowRight, 
  Scale, 
  Compass, 
  Radar,
  FileSpreadsheet,
  Download,
  Lock,
  RefreshCw,
  X
} from 'lucide-react';
import { LogAktivitas, UserAccount, Perizinan, Pelanggaran, Sanksi, Gender } from '../types';
import { storageService } from '../services/storageService';
import { InterpolPatrolRadarChart, PatrolSector } from './InterpolCharts';
import { RadarMonitoringPerizinan } from './RadarMonitoringPerizinan';

interface LiveSecurityMonitoringProps {
  currentUser: UserAccount;
  perizinanList: Perizinan[];
  pelanggaranList: Pelanggaran[];
  sanksiList: Sanksi[];
  onViewSuratIzin?: (izin: Perizinan) => void;
}

export const LiveSecurityMonitoring: React.FC<LiveSecurityMonitoringProps> = ({
  currentUser,
  perizinanList,
  pelanggaranList,
  sanksiList,
  onViewSuratIzin,
}) => {
  const [logs, setLogs] = useState<LogAktivitas[]>(storageService.getLogs());
  const [activeTab, setActiveTab] = useState<'timeline' | 'perizinan' | 'takzir' | 'radar'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPetugas, setSelectedPetugas] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [selectedLogForInspection, setSelectedLogForInspection] = useState<LogAktivitas | null>(null);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionEntity, setRevisionEntity] = useState<'izin' | 'takzir'>('izin');
  const [revisionTargetId, setRevisionTargetId] = useState('');
  const [revisionReason, setRevisionReason] = useState('');
  const [revisionNewNotes, setRevisionNewNotes] = useState('');
  const [livePulse, setLivePulse] = useState(false);

  // Subscribe to storageService updates in real-time
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setLogs(storageService.getLogs());
      setLivePulse(true);
      setTimeout(() => setLivePulse(false), 1200);
    });
    return () => unsubscribe();
  }, []);

  // List of distinct officers for filtering
  const officerOptions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => {
      if (l.user) set.add(l.user);
      if (l.petugasPencatat) set.add(l.petugasPencatat);
      if (l.petugasPenyetujui) set.add(l.petugasPenyetujui);
      if (l.petugasPelapor) set.add(l.petugasPelapor);
      if (l.petugasPenetapHukuman) set.add(l.petugasPenetapHukuman);
    });
    return Array.from(set);
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const now = Date.now();
    return logs.filter(log => {
      // 1. Gender scope check
      if (currentUser.genderAccess !== 'all' && log.santriGender && log.santriGender !== currentUser.genderAccess) {
        return false;
      }

      // 2. Search query (santri name, NIS, action, detail, officer)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSantri = log.santriNama?.toLowerCase().includes(q) || log.santriNis?.includes(q);
        const matchAction = log.aksi?.toLowerCase().includes(q) || log.detail?.toLowerCase().includes(q);
        const matchUser = log.user?.toLowerCase().includes(q) || log.nrp?.toLowerCase().includes(q);
        const matchKind = log.jenisIzin?.toLowerCase().includes(q) || log.jenisPelanggaran?.toLowerCase().includes(q);
        if (!matchSantri && !matchAction && !matchUser && !matchKind) return false;
      }

      // 3. Officer filter
      if (selectedPetugas !== 'all') {
        const matchOfficer = 
          log.user === selectedPetugas ||
          log.petugasPencatat === selectedPetugas ||
          log.petugasPenyetujui === selectedPetugas ||
          log.petugasPelapor === selectedPetugas ||
          log.petugasPenetapHukuman === selectedPetugas;
        if (!matchOfficer) return false;
      }

      // 4. Type filter
      if (selectedType !== 'all') {
        if (selectedType === 'izin' && log.tipe !== 'izin' && log.tipe !== 'gerbang') return false;
        if (selectedType === 'takzir' && log.tipe !== 'sanksi' && log.tipe !== 'pelanggaran') return false;
        if (selectedType === 'koreksi' && !log.isRevisi && log.tipe !== 'koreksi') return false;
      }

      // 5. Date range filter
      if (dateRange !== 'all') {
        const logTime = log.timestamp || 0;
        if (logTime > 0) {
          const diffMs = now - logTime;
          if (dateRange === 'today' && diffMs > 24 * 3600 * 1000) return false;
          if (dateRange === '7days' && diffMs > 7 * 24 * 3600 * 1000) return false;
          if (dateRange === '30days' && diffMs > 30 * 24 * 3600 * 1000) return false;
        }
      }

      return true;
    });
  }, [logs, currentUser, searchQuery, selectedPetugas, selectedType, dateRange]);

  // Subsets for Dedicated Tabs
  const perizinanLogs = useMemo(() => {
    return filteredLogs.filter(l => l.tipe === 'izin' || l.tipe === 'gerbang' || (l.isRevisi && l.izinId));
  }, [filteredLogs]);

  const takzirLogs = useMemo(() => {
    return filteredLogs.filter(l => l.tipe === 'sanksi' || l.tipe === 'pelanggaran' || (l.isRevisi && l.sanksiId));
  }, [filteredLogs]);

  // Quick stats
  const totalLogsCount = logs.length;
  const izinActivityCount = logs.filter(l => l.tipe === 'izin' || l.tipe === 'gerbang').length;
  const takzirActivityCount = logs.filter(l => l.tipe === 'sanksi' || l.tipe === 'pelanggaran').length;
  const auditRevisionsCount = logs.filter(l => l.isRevisi || l.tipe === 'koreksi').length;

  // Handle Submit Official Revision/Correction
  const handleSaveOfficialRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionTargetId || !revisionReason.trim()) return;

    if (revisionEntity === 'izin') {
      const targetIzin = perizinanList.find(i => i.id === revisionTargetId);
      if (targetIzin) {
        const updatedIzin: Perizinan = {
          ...targetIzin,
          alasan: revisionNewNotes ? `${targetIzin.alasan} (Revisi: ${revisionNewNotes})` : targetIzin.alasan,
        };
        storageService.savePerizinan(updatedIzin, revisionReason);
      }
    } else {
      const targetSanksi = sanksiList.find(s => s.id === revisionTargetId);
      if (targetSanksi) {
        const updatedSanksi: Sanksi = {
          ...targetSanksi,
          catatanPembinaan: revisionNewNotes ? `${targetSanksi.catatanPembinaan || ''} (Catatan Koreksi: ${revisionNewNotes})` : targetSanksi.catatanPembinaan,
        };
        storageService.saveSanksi(updatedSanksi, revisionReason);
      }
    }

    setIsRevisionModalOpen(false);
    setRevisionTargetId('');
    setRevisionReason('');
    setRevisionNewNotes('');
  };

  // Helper for status badge
  const renderStatusBadge = (log: LogAktivitas) => {
    if (log.isRevisi || log.tipe === 'koreksi') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-purple-950/80 text-purple-300 border border-purple-500/50 shadow-xs">
          <Edit3 className="w-3 h-3 text-purple-400" />
          KOREKSI RESMI
        </span>
      );
    }
    if (log.tipe === 'izin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-xs">
          <FileCheck2 className="w-3 h-3 text-cyan-400" />
          {log.statusIzin || 'PERIZINAN'}
        </span>
      );
    }
    if (log.tipe === 'gerbang') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-500/40 shadow-xs">
          <DoorOpen className="w-3 h-3 text-blue-400" />
          MUTASI GERBANG
        </span>
      );
    }
    if (log.tipe === 'sanksi') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40 shadow-xs">
          <Scale className="w-3 h-3 text-amber-400" />
          {log.statusHukuman ? `TAKZIR: ${log.statusHukuman.toUpperCase()}` : 'PENETAPAN SANKSI'}
        </span>
      );
    }
    if (log.tipe === 'pelanggaran') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-red-950/80 text-red-300 border border-red-500/40 shadow-xs">
          <AlertTriangle className="w-3 h-3 text-red-400" />
          KASUS DISIPLIN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-700">
        ADMIN LOG
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner & Live Telemetry Engine */}
      <div className="relative rounded-3xl overflow-hidden border border-cyan-500/40 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/70 p-6 sm:p-8 shadow-2xl metallic-glass-card hover-rainbow-edge">
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyan-400 via-amber-400 via-purple-500 to-blue-500 opacity-90" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-xs tracking-wider uppercase">
                <span className={`w-2 h-2 rounded-full bg-cyan-400 ${livePulse ? 'animate-ping' : 'animate-pulse'}`} />
                LIVE SECURITY ACTIVITY MONITORING & ACCOUNTABILITY
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                IMMUTABLE AUDIT TRAIL
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                VERIFIED LOG ENGINE
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight font-sans drop-shadow-md">
              Monitoring Aktivitas & Log Akuntabilitas Keamanan Real-Time
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Pusat audit digital komando santri: pengawasan kronologis seluruh mutasi perizinan, penetapan dan pelaksanaan takzir, pencatatan personil penanggung jawab, serta riwayat koreksi data terenkripsi.
            </p>
          </div>

          {/* Quick Actions & Official Correction Trigger */}
          <div className="flex flex-wrap sm:flex-col gap-2.5 shrink-0">
            <button
              onClick={() => setIsRevisionModalOpen(true)}
              className="tactile-interactive inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 rounded-xl transition-all shadow-lg shadow-purple-950 cursor-pointer whitespace-nowrap font-mono uppercase tracking-wider border border-purple-400/50"
            >
              <Edit3 className="w-4 h-4 text-purple-200" />
              <span>Buat Koreksi / Revisi Resmi</span>
            </button>
            
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center justify-between gap-4 shadow-inner">
              <span className="text-slate-400">STATUS LOG:</span>
              <span className="text-cyan-300 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3 text-cyan-400" />
                APPEND-ONLY LOCKED
              </span>
            </div>
          </div>
        </div>

        {/* Top 4 KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">TOTAL LOG DIAUDIT</p>
            <p className="text-xl sm:text-2xl font-black font-mono text-white mt-1">{totalLogsCount}</p>
            <span className="text-[9px] font-mono text-cyan-400">Riwayat Terenkripsi</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-cyan-500/20">
            <p className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider">AKTIVITAS PERIZINAN</p>
            <p className="text-xl sm:text-2xl font-black font-mono text-cyan-300 mt-1">{izinActivityCount}</p>
            <span className="text-[9px] font-mono text-slate-400">Pengajuan & Mutasi Gerbang</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-amber-500/20">
            <p className="text-[10px] font-mono text-amber-300 uppercase tracking-wider">AKTIVITAS TAKZIR & SANKSI</p>
            <p className="text-xl sm:text-2xl font-black font-mono text-amber-300 mt-1">{takzirActivityCount}</p>
            <span className="text-[9px] font-mono text-slate-400">Disiplin & Pembinaan</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-purple-500/20">
            <p className="text-[10px] font-mono text-purple-300 uppercase tracking-wider">CATATAN KOREKSI / REVISI</p>
            <p className="text-xl sm:text-2xl font-black font-mono text-purple-300 mt-1">{auditRevisionsCount}</p>
            <span className="text-[9px] font-mono text-slate-400">Transparansi Audit</span>
          </div>
        </div>
      </div>

      {/* 2. Navigation Segments / Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar font-mono text-xs">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'bg-gradient-to-r from-blue-900/70 to-slate-900 text-amber-300 border border-amber-400/50 shadow-lg shadow-cyan-950 rainbow-active-border'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
          }`}
        >
          <History className="w-4 h-4 text-cyan-400" />
          <span>Tabel Log Aktivitas Real-Time</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">{filteredLogs.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('perizinan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'perizinan'
              ? 'bg-gradient-to-r from-blue-900/70 to-slate-900 text-amber-300 border border-amber-400/50 shadow-lg shadow-cyan-950 rainbow-active-border'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-cyan-400" />
          <span>A. Monitoring Perizinan</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">{perizinanLogs.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('takzir')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'takzir'
              ? 'bg-gradient-to-r from-blue-900/70 to-slate-900 text-amber-300 border border-amber-400/50 shadow-lg shadow-cyan-950 rainbow-active-border'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
          }`}
        >
          <Scale className="w-4 h-4 text-amber-400" />
          <span>B. Monitoring Takzir & Hukuman</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">{takzirLogs.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('radar')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'radar'
              ? 'bg-gradient-to-r from-blue-900/70 to-slate-900 text-amber-300 border border-amber-400/50 shadow-lg shadow-cyan-950 rainbow-active-border'
              : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
          }`}
        >
          <Radar className="w-4 h-4 text-cyan-400" />
          <span>D3 Spatial Patrol Radar</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40">INTERPOL</span>
        </button>
      </div>

      {/* 3. Filter Bar (D. Sistem Audit Multi-Filter) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-3 hover-rainbow-edge">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Search box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari santri, NIS, tindakan, pelanggaran, atau no izin..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors font-sans"
            />
          </div>

          {/* Filter by Officer */}
          <div className="w-full md:w-60">
            <select
              value={selectedPetugas}
              onChange={(e) => setSelectedPetugas(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="all">Semua Pengurus / Petugas</option>
              {officerOptions.map((off, idx) => (
                <option key={idx} value={off}>{off}</option>
              ))}
            </select>
          </div>

          {/* Filter by Activity Type */}
          <div className="w-full md:w-48">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="all">Semua Jenis Aktivitas</option>
              <option value="izin">Aktivitas Perizinan</option>
              <option value="takzir">Takzir & Kasus Disiplin</option>
              <option value="koreksi">Koreksi & Revisi Audit</option>
            </select>
          </div>

          {/* Filter by Date Range */}
          <div className="w-full md:w-44">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            >
              <option value="all">Semua Rentang Waktu</option>
              <option value="today">Hari Ini (24 Jam)</option>
              <option value="7days">7 Hari Terakhir</option>
              <option value="30days">30 Hari Terakhir</option>
            </select>
          </div>

        </div>

        {/* Filter results summary */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80 flex-wrap gap-2">
          <span>Menampilkan <strong className="text-cyan-300">{filteredLogs.length}</strong> entri aktivitas terverifikasi</span>
          {(searchQuery || selectedPetugas !== 'all' || selectedType !== 'all' || dateRange !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedPetugas('all');
                setSelectedType('all');
                setDateRange('all');
              }}
              className="text-amber-400 hover:underline cursor-pointer flex items-center gap-1 font-bold"
            >
              <X className="w-3.5 h-3.5" />
              Reset Semua Filter
            </button>
          )}
        </div>
      </div>

      {/* 4. TAB CONTENT 1: Model Tabel Log Aktivitas & Akuntabilitas */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
            <span className="flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Model Tabel Sederhana: Menampilkan seluruh riwayat perizinan, takzir, dan koreksi data secara terpusat & kronologis.</span>
            </span>
            <span className="font-mono text-cyan-300 font-bold">{filteredLogs.length} Aktivitas Terverifikasi</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl hover-rainbow-edge">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-300 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5 whitespace-nowrap">Waktu & Hash</th>
                    <th className="p-3.5 whitespace-nowrap">Status & Kategori</th>
                    <th className="p-3.5 whitespace-nowrap">Identitas Santri</th>
                    <th className="p-3.5">Tindakan / Kronologi</th>
                    <th className="p-3.5 whitespace-nowrap">Petugas Bertanggung Jawab</th>
                    <th className="p-3.5 text-center whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-200">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-sans">
                        <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="font-bold text-slate-400 font-mono">TIDAK ADA AKTIVITAS YANG SESUAI FILTER</p>
                        <p className="text-xs text-slate-500 mt-1">Gunakan kata kunci lain atau reset filter untuk melihat log komando.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const isCorrection = log.isRevisi || log.tipe === 'koreksi';
                      return (
                        <tr 
                          key={log.id} 
                          className={`hover:bg-slate-900/70 transition-colors ${
                            isCorrection ? 'bg-purple-950/20' : ''
                          }`}
                        >
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-bold text-amber-300 block">{log.waktu}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {log.hashAudit ? `HASH: ${log.hashAudit}` : 'SEC-VERIFIED'}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            {renderStatusBadge(log)}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            {log.santriNama ? (
                              <div>
                                <strong className="text-white block font-sans text-xs">{log.santriNama}</strong>
                                <span className="text-[10px] text-cyan-300 font-mono">
                                  NIS: {log.santriNis || '-'} · {log.santriGender === 'putra' ? 'Banin' : 'Banat'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic font-sans">- Sistem Terpusat -</span>
                            )}
                          </td>
                          <td className="p-3.5 max-w-sm">
                            <p className="text-white font-bold font-sans text-xs">{log.aksi}</p>
                            <p className="text-[11px] text-slate-400 font-sans line-clamp-2 mt-0.5">{log.detail}</p>
                            {log.jenisIzin && (
                              <span className="inline-block mt-1 text-[10px] bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/60 font-mono">
                                Izin: {log.jenisIzin}
                              </span>
                            )}
                            {log.jenisPelanggaran && (
                              <span className="inline-block mt-1 text-[10px] bg-red-950/80 text-red-300 px-1.5 py-0.5 rounded border border-red-800/60 font-mono">
                                Pelanggaran: {log.jenisPelanggaran}
                              </span>
                            )}
                            {log.isRevisi && (
                              <span className="inline-block mt-1 text-[10px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/60 font-mono">
                                Koreksi: {log.alasanRevisi}
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-[11px]">
                            <div className="space-y-0.5">
                              <div>
                                <span className="text-slate-500 text-[10px]">Pencatat: </span>
                                <strong className="text-amber-300 font-mono">{log.petugasPencatat || log.petugasPelapor || log.user}</strong>
                              </div>
                              {(log.petugasPenyetujui || log.petugasPenetapHukuman) && (
                                <div>
                                  <span className="text-slate-500 text-[10px]">Otoritas: </span>
                                  <strong className="text-emerald-300 font-mono">{log.petugasPenyetujui || log.petugasPenetapHukuman}</strong>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-center">
                            <button
                              onClick={() => setSelectedLogForInspection(log)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold font-mono text-cyan-300 hover:text-white bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 rounded-lg transition-colors cursor-pointer"
                              title="Inspeksi Detail & Audit Trail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Inspeksi</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT 2: A. Monitoring Perizinan Khusus */}
      {activeTab === 'perizinan' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-950/40 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-200">
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              Menampilkan seluruh rekaman perizinan: waktu pengajuan, pengurus yang memproses, pengurus yang menyetujui, serta mutasi keluar-kembali.
            </span>
            <span className="font-mono font-bold text-amber-300">{perizinanLogs.length} Aktivitas Perizinan</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-300 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Waktu & Hash</th>
                    <th className="p-3.5">Santri (NIS)</th>
                    <th className="p-3.5">Jenis Izin</th>
                    <th className="p-3.5">Waktu Pengajuan</th>
                    <th className="p-3.5">Pengurus Pemroses</th>
                    <th className="p-3.5">Pengurus Penyetujui</th>
                    <th className="p-3.5">Waktu Keluar/Kembali</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-200">
                  {perizinanLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-bold text-amber-300 block">{log.waktu}</span>
                        <span className="text-[9px] text-slate-500">{log.hashAudit || 'SEC-VERIFIED'}</span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <strong className="text-white block font-sans">{log.santriNama || '-'}</strong>
                        <span className="text-[10px] text-cyan-300">NIS: {log.santriNis || '-'}</span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-bold text-cyan-200">
                        {log.jenisIzin || 'Izin Pondok'}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-300">
                        {log.waktuPengajuan || log.waktu}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-amber-300 font-semibold">
                        {log.petugasPencatat || log.user}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-emerald-300 font-semibold">
                        {log.petugasPenyetujui || 'Dalam Proses'}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-[11px]">
                        <span className="block text-slate-300">Keluar: {log.waktuKeluar || '-'}</span>
                        <span className="block text-slate-400">Kembali: {log.waktuKembali || '-'}</span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {renderStatusBadge(log)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedLogForInspection(log)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-900 text-cyan-300 transition-colors cursor-pointer"
                          title="Inspeksi Audit"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT 3: B. Monitoring Takzir & Hukuman Khusus */}
      {activeTab === 'takzir' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
            <span className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              Menampilkan seluruh rekaman penegakan disiplin takzir: jenis pelanggaran, kronologi, bentuk sanksi edukatif, pengurus pencatat, pengurus penetap, dan status pelaksanaan.
            </span>
            <span className="font-mono font-bold text-white">{takzirLogs.length} Catatan Takzir</span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-300 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Waktu & Hash</th>
                    <th className="p-3.5">Santri (NIS)</th>
                    <th className="p-3.5">Pelanggaran & Kronologi</th>
                    <th className="p-3.5">Bentuk Takzir / Sanksi</th>
                    <th className="p-3.5">Pengurus Pelapor</th>
                    <th className="p-3.5">Pengurus Penetap</th>
                    <th className="p-3.5">Status Pelaksanaan</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-200">
                  {takzirLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-bold text-amber-300 block">{log.waktu}</span>
                        <span className="text-[9px] text-slate-500">{log.hashAudit || 'SEC-VERIFIED'}</span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <strong className="text-white block font-sans">{log.santriNama || '-'}</strong>
                        <span className="text-[10px] text-cyan-300">NIS: {log.santriNis || '-'}</span>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <span className="text-red-300 font-bold block">{log.jenisPelanggaran || log.aksi}</span>
                        <span className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{log.kronologi || log.detail}</span>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <span className="text-amber-300 font-bold block">{log.jenisHukuman || 'Khidmah Edukatif'}</span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-300 font-semibold">
                        {log.petugasPelapor || log.petugasPencatat || log.user}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-emerald-300 font-bold">
                        {log.petugasPenetapHukuman || log.user}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {renderStatusBadge(log)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <button
                          onClick={() => setSelectedLogForInspection(log)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-900 text-cyan-300 transition-colors cursor-pointer"
                          title="Inspeksi Audit"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB CONTENT 4: Spatial Security Patrol (Radar Monitoring Perizinan Militer) */}
      {activeTab === 'radar' && (
        <div className="space-y-4">
          <RadarMonitoringPerizinan
            perizinanList={perizinanList}
            currentUser={currentUser}
            onViewSuratIzin={onViewSuratIzin}
          />
        </div>
      )}

      {/* ==========================================
          MODAL 1: INSPEKSI AUDIT & AKUNTABILITAS (Diff Viewer)
         ========================================== */}
      {selectedLogForInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-cyan-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-amber-400 to-purple-500" />
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                  <Fingerprint className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white uppercase font-mono">
                    Audit & Accountability Inspector
                  </h3>
                  <p className="text-[10px] font-mono text-cyan-300">
                    HASH VERIFIKASI: {selectedLogForInspection.hashAudit || 'SEC-OFFICIAL-VALID'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLogForInspection(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Snapshot Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">Waktu Entri / Timestamp:</span>
                <span className="text-amber-300 font-bold text-sm block mt-0.5">{selectedLogForInspection.waktu}</span>
                <span className="text-[10px] text-slate-500 block">ID Log: {selectedLogForInspection.id}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">Pengurus Penanggung Jawab:</span>
                <span className="text-white font-bold text-sm block mt-0.5">{selectedLogForInspection.user}</span>
                <span className="text-[10px] text-cyan-400 block">NRP: {selectedLogForInspection.nrp || 'SECOP-OFFICIAL'} · Role: {selectedLogForInspection.role}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <p className="text-xs font-bold text-cyan-300 font-mono uppercase">Deskripsi Tindakan:</p>
              <p className="text-xs text-white font-sans leading-relaxed">{selectedLogForInspection.detail}</p>
            </div>

            {/* Change History: Data Sebelum vs Data Sesudah (if revision occurred) */}
            {selectedLogForInspection.isRevisi && (selectedLogForInspection.dataSebelum || selectedLogForInspection.dataSesudah) && (
              <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-purple-400" />
                    RIWAYAT PERUBAHAN DATA (AUDIT DIFF)
                  </span>
                  <span className="text-[10px] text-purple-400 font-bold bg-purple-900/50 px-2 py-0.5 rounded">
                    Koreksi Resmi
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-sans">
                  Alasan Koreksi: <strong className="text-white">{selectedLogForInspection.alasanRevisi}</strong>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-black/60 border border-red-500/30">
                    <span className="text-[10px] text-red-400 font-bold block mb-1">Data Sebelum Koreksi:</span>
                    <pre className="text-[10px] text-slate-300 overflow-x-auto p-1 bg-slate-950 rounded">
                      {JSON.stringify(selectedLogForInspection.dataSebelum, null, 2)}
                    </pre>
                  </div>
                  <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-400 font-bold block mb-1">Data Sesudah Koreksi:</span>
                    <pre className="text-[10px] text-slate-300 overflow-x-auto p-1 bg-slate-950 rounded">
                      {JSON.stringify(selectedLogForInspection.dataSesudah, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Immutability Seal */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                IMMUTABLE APPEND-ONLY ARCHIVE · RECORD SEALED
              </span>
              <button
                onClick={() => setSelectedLogForInspection(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                Tutup Inspeksi
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: BUAT KOREKSI / REVISI RESMI (Accountability Workflow)
         ========================================== */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-purple-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-400 via-indigo-500 to-cyan-400" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-950 border border-purple-500/40 text-purple-300">
                  <Edit3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase font-mono">
                    Formulir Koreksi / Revisi Resmi
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Setiap revisi akan dicatat permanen dalam audit trail tanpa menghapus data sebelumnya.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRevisionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOfficialRevision} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Entitas yang Ingin Dikoreksi:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setRevisionEntity('izin'); setRevisionTargetId(''); }}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      revisionEntity === 'izin'
                        ? 'bg-purple-950/80 border-purple-400 text-purple-200 font-bold shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Data Perizinan Santri
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRevisionEntity('takzir'); setRevisionTargetId(''); }}
                    className={`py-2 px-3 rounded-xl border text-center transition-all ${
                      revisionEntity === 'takzir'
                        ? 'bg-purple-950/80 border-purple-400 text-purple-200 font-bold shadow-xs'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Data Sanksi / Takzir
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Pilih Rekaman Target:</label>
                <select
                  value={revisionTargetId}
                  onChange={(e) => setRevisionTargetId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="">-- Pilih Berkas Target Koreksi --</option>
                  {revisionEntity === 'izin' ? (
                    perizinanList.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nomorIzin} - {i.santriNama} ({i.jenisIzin} - {i.status})
                      </option>
                    ))
                  ) : (
                    sanksiList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.kodeSanksi} - {s.santriNama} ({s.bentukSanksi.substring(0, 30)}...)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Alasan Koreksi Resmi <span className="text-red-400">* (Wajib Diisi untuk Audit)</span>:
                </label>
                <textarea
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  required
                  placeholder="Contoh: Klarifikasi jadwal ujian, penyesuaian penjemput resmi oleh wali santri..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-sans text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Catatan Tambahan / Nilai Baru (Opsional):
                </label>
                <input
                  type="text"
                  value={revisionNewNotes}
                  onChange={(e) => setRevisionNewNotes(e.target.value)}
                  placeholder="Rincian catatan penyesuaian berkas..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-sans text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-[11px] text-purple-200">
                Catatan: Penanggung jawab koreksi otomatis tersimpan sebagai <strong>{currentUser.nama} (NRP: {currentUser.nrp || 'SECOP'})</strong> beserta timestamp presisi.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-950 cursor-pointer"
                >
                  Simpan Catatan Koreksi Resmi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
