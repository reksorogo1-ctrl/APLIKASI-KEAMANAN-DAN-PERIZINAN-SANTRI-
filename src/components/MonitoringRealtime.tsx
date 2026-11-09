import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  Phone, 
  Search, 
  DoorOpen, 
  Eye, 
  ArrowUpRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Perizinan, Pelanggaran, Sanksi, UserAccount } from '../types';
import { WhatsAppTemplates, createWhatsAppUrl } from '../services/waService';
import { LiveSecurityMonitoring } from './LiveSecurityMonitoring';
import { RadarMonitoringPerizinan } from './RadarMonitoringPerizinan';
import { storageService } from '../services/storageService';

interface MonitoringRealtimeProps {
  perizinanList: Perizinan[];
  pelanggaranList?: Pelanggaran[];
  sanksiList?: Sanksi[];
  currentUser?: UserAccount;
  onViewSuratIzin: (izin: Perizinan) => void;
}

export const MonitoringRealtime: React.FC<MonitoringRealtimeProps> = ({
  perizinanList,
  pelanggaranList = [],
  sanksiList = [],
  currentUser,
  onViewSuratIzin,
}) => {
  const activeUser = currentUser || storageService.getCurrentUser() || {
    id: 'usr_default',
    username: 'admin',
    nama: 'Administrator Kamtib',
    role: 'admin',
    nrp: 'KAMTIB-ADMIN-01',
    jabatan: 'Admin Keamanan Pusat',
    divisi: 'Komando Pusat',
    genderAccess: 'all',
    noWa: '081234567800',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    statusAktif: true,
  };

  const [viewMode, setViewMode] = useState<'sentry' | 'activity_log'>('sentry');
  const [filterType, setFilterType] = useState<'all' | 'terlambat' | 'aman'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Real-time ticking every 10 seconds for countdown calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Filter santri who are currently outside
  const outsideList = perizinanList.filter(p => p.status === 'Sedang Keluar' || p.status === 'Terlambat');
  const returnedList = perizinanList.filter(p => p.status === 'Sudah Kembali');

  // Helper to compute remaining time or tardiness
  const getTimingData = (izin: Perizinan) => {
    const deadlineString = `${izin.tglKembali}T${izin.jamKembali}:00`;
    const deadlineDate = new Date(deadlineString);
    const diffMs = deadlineDate.getTime() - currentTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 0) {
      // Overdue
      const overdueMinutes = Math.abs(diffMinutes);
      const hours = Math.floor(overdueMinutes / 60);
      const mins = overdueMinutes % 60;
      return {
        isOverdue: true,
        text: hours > 0 ? `Terlambat ${hours} jam ${mins} menit` : `Terlambat ${mins} menit`,
        minutesLeft: diffMinutes,
        badgeClass: 'text-red-400 font-bold bg-red-950/80 border border-red-500/40 animate-pulse',
      };
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      const isUrgent = diffMinutes <= 60;
      return {
        isOverdue: false,
        text: hours > 0 ? `Sisa ${hours} jam ${mins} menit` : `Sisa ${mins} menit`,
        minutesLeft: diffMinutes,
        badgeClass: isUrgent 
          ? 'text-amber-300 font-semibold bg-amber-950/80 border border-amber-500/40' 
          : 'text-emerald-400 font-medium bg-emerald-950/50 border border-emerald-500/30',
      };
    }
  };

  const processedList = outsideList.map(item => ({
    ...item,
    timing: getTimingData(item),
  }));

  const overdueCount = processedList.filter(p => p.timing.isOverdue).length;
  const safeCount = processedList.filter(p => !p.timing.isOverdue).length;

  const filtered = processedList.filter(item => {
    if (filterType === 'terlambat' && !item.timing.isOverdue) return false;
    if (filterType === 'aman' && item.timing.isOverdue) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.santriNama.toLowerCase().includes(q) ||
        item.santriNis.toLowerCase().includes(q) ||
        item.tujuan.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSendWaWarning = (izin: Perizinan, minutesLate: number) => {
    const text = WhatsAppTemplates.peringatanKeterlambatan(izin, Math.max(1, Math.abs(minutesLate)));
    const url = createWhatsAppUrl(izin.noWaPenjemput, text);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Title & 3D Command Telemetry Header */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/60 shadow-2xl metallic-glass-card hover-rainbow-edge p-6">
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyan-400 via-amber-400 to-blue-600 opacity-70" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-xs glow-cyan uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                RADAR SECTOR SCAN
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                ACTIVE SENTRY
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 font-sans uppercase">
              Monitoring Real-Time Santri di Luar Asrama
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Pengawasan aktif batas jam izin, perhitungan mundur keterlambatan otomatis, dan peringatan darurat terintegrasi.
            </p>
          </div>

          {/* Live Status indicator */}
          <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl text-xs shadow-inner font-mono hover-rainbow-edge">
            <span className="text-cyan-300 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Live Sync
            </span>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-amber-300 font-bold">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
            </span>
          </div>
        </div>

        {/* View Mode Switch */}
        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-800/80 font-mono text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setViewMode('sentry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'sentry'
                ? 'bg-gradient-to-r from-blue-900/80 to-slate-900 text-amber-300 border border-amber-400/50 shadow-md rainbow-active-border'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
            }`}
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Radar Sentry & Countdown Santri di Luar ({outsideList.length})</span>
          </button>

          <button
            onClick={() => setViewMode('activity_log')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'activity_log'
                ? 'bg-gradient-to-r from-blue-900/80 to-slate-900 text-amber-300 border border-amber-400/50 shadow-md rainbow-active-border'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
            }`}
          >
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Live Security Activity & Accountability Log</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/40">D3 RADAR</span>
          </button>
        </div>
      </div>

      {viewMode === 'activity_log' ? (
        <LiveSecurityMonitoring
          currentUser={activeUser}
          perizinanList={perizinanList}
          pelanggaranList={pelanggaranList}
          sanksiList={sanksiList}
          onViewSuratIzin={onViewSuratIzin}
        />
      ) : (
        <>
          {/* Rotating Military Radar Controller (Medium Size) */}
          <RadarMonitoringPerizinan
            perizinanList={perizinanList}
            onViewSuratIzin={onViewSuratIzin}
            size="medium"
          />

          {/* 3D KPI Overviews */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div 
          onClick={() => setFilterType('all')}
          className={`tactile-interactive p-5 rounded-2xl metallic-glass-card cursor-pointer hover-rainbow-edge ${
            filterType === 'all'
              ? 'rainbow-active-border'
              : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono font-medium uppercase tracking-wider">Total Santri di Luar</span>
            <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/30 glow-gold">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-black font-mono text-white tabular-nums drop-shadow-sm">
            {outsideList.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Belum melakukan check-in</p>
        </div>

        <div 
          onClick={() => setFilterType('terlambat')}
          className={`tactile-interactive p-5 rounded-2xl metallic-glass-card cursor-pointer hover-rainbow-edge ${
            filterType === 'terlambat'
              ? 'rainbow-active-border'
              : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-red-300 font-mono font-medium uppercase tracking-wider">Santri Melewati Batas</span>
            <div className="p-2.5 rounded-xl bg-red-600/15 text-red-400 border border-red-500/30 glow-red">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-black font-mono text-red-400 tabular-nums animate-pulse drop-shadow-sm">
            {overdueCount}
          </div>
          <p className="text-[11px] text-red-300/80 mt-1 font-mono">Perlu peringatan & takzir edukatif</p>
        </div>

        <div 
          onClick={() => setFilterType('aman')}
          className={`tactile-interactive p-5 rounded-2xl metallic-glass-card cursor-pointer hover-rainbow-edge ${
            filterType === 'aman'
              ? 'rainbow-active-border'
              : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-mono font-medium uppercase tracking-wider">Dalam Masa Izin</span>
            <div className="p-2.5 rounded-xl bg-emerald-600/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-black font-mono text-emerald-400 tabular-nums drop-shadow-sm">
            {safeCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Sisa waktu aman terkendali</p>
        </div>

      </div>

      {/* 3D Filter & Search */}
      <div className="p-4 metallic-glass-card border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl hover-rainbow-edge">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari santri yang sedang keluar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-xs bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto p-1 bg-slate-900/90 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 text-xs rounded-lg font-mono font-bold transition-all cursor-pointer ${
              filterType === 'all' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua ({outsideList.length})
          </button>
          <button
            onClick={() => setFilterType('terlambat')}
            className={`px-3.5 py-1.5 text-xs rounded-lg font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'terlambat' ? 'bg-red-600 text-white shadow-md shadow-red-600/40 glow-red' : 'text-red-400 hover:text-red-300'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            Terlambat ({overdueCount})
          </button>
          <button
            onClick={() => setFilterType('aman')}
            className={`px-3.5 py-1.5 text-xs rounded-lg font-mono font-bold transition-all cursor-pointer ${
              filterType === 'aman' ? 'bg-emerald-600 text-white shadow-md' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            Aman ({safeCount})
          </button>
        </div>
      </div>

      {/* 3D Live Monitoring Table */}
      <div className="metallic-glass-card border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl hover-rainbow-edge">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="table-header-metallic text-slate-300 uppercase text-[10px] font-mono tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Santri</th>
                <th className="px-4 py-3.5">Jenis & Tujuan</th>
                <th className="px-4 py-3.5">Waktu Check-Out</th>
                <th className="px-4 py-3.5">Batas Maksimal</th>
                <th className="px-4 py-3.5">Countdown Sisa Waktu</th>
                <th className="px-4 py-3.5">Penjemput & WA</th>
                <th className="px-6 py-3.5 text-right">Peringatan Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                    Tidak ada santri pada kategori ini.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="table-row-rainbow transition-all cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white tracking-wide font-sans">{item.santriNama}</div>
                      <div className="text-[11px] text-slate-400">
                        NIS: <span className="text-cyan-300">{item.santriNis}</span> · {item.santriKelas}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30 text-[11px]">
                        {item.jenisIzin}
                      </span>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px] mt-1">{item.tujuan}</div>
                    </td>
                    <td className="px-4 py-4 tabular-nums text-slate-200">
                      {item.actualKeluar || `${item.tglKeluar} ${item.jamKeluar}`}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-red-400 tabular-nums">
                        {item.jamKembali} WIB
                      </div>
                      <div className="text-[10px] text-slate-400">{item.tglKembali}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-mono tracking-wider ${item.timing.badgeClass}`}>
                        {item.timing.text}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-sans">
                      <div className="text-slate-200 font-medium">{item.namaPenjemput}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">{item.noWaPenjemput}</div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewSuratIzin(item);
                        }}
                        className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer border border-transparent hover:border-cyan-500/40"
                        title="Lihat Surat Izin Digital"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendWaWarning(item, item.timing.minutesLeft);
                        }}
                        className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer border border-transparent hover:border-emerald-500/40"
                        title="Kirim Peringatan WA"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

    </div>
  );
};

