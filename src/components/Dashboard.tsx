import React from 'react';
import { 
  Users, 
  DoorOpen, 
  Clock, 
  AlertTriangle, 
  FileCheck, 
  ArrowUpRight, 
  ShieldCheck, 
  Calendar, 
  Send, 
  Eye, 
  ChevronRight,
  Sparkles,
  Radio,
  Sliders,
  Server,
  AlertOctagon
} from 'lucide-react';
import { Santri, Perizinan, Pelanggaran, Sanksi, UserAccount } from '../types';
import { ActiveMenu } from './Sidebar';
import { WhatsAppTemplates, createWhatsAppUrl } from '../services/waService';
import { RadarMonitoringPerizinan } from './RadarMonitoringPerizinan';
import { AdvancedDataVisualization, AnimatedCounter } from './AdvancedDataVisualization';
import { DashboardRekapitulasiTables } from './DashboardRekapitulasiTables';
import { storageService } from '../services/storageService';
import { getWIBDateTime } from '../utils/timeUtils';

interface DashboardProps {
  santriList: Santri[];
  perizinanList: Perizinan[];
  pelanggaranList: Pelanggaran[];
  sanksiList: Sanksi[];
  currentUser: UserAccount;
  onNavigate: (menu: ActiveMenu) => void;
  onViewSuratIzin: (izin: Perizinan) => void;
  onOpenQRScanner?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  santriList,
  perizinanList,
  pelanggaranList,
  sanksiList,
  currentUser,
  onNavigate,
  onViewSuratIzin,
  onOpenQRScanner,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [activeCardId, setActiveCardId] = React.useState<string | null>(null);
  const [wibTime, setWibTime] = React.useState(getWIBDateTime());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setWibTime(getWIBDateTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCardClick = (id: string, action?: () => void) => {
    setActiveCardId(prev => prev === id ? null : id);
    if (action) {
      setTimeout(() => action(), 150);
    }
  };

  const sedangDiLuar = perizinanList.filter(i => (i.status === 'Sedang Keluar' || i.status === 'Disetujui') && !i.actualKembali);
  const terlambatList = perizinanList.filter(i => (i.status === 'Terlambat' || (i.menitKeterlambatan && i.menitKeterlambatan > 0)) && !i.actualKembali);
  const menungguPersetujuan = perizinanList.filter(i => (i.status === 'Diajukan' || i.status === 'Diverifikasi') && !i.actualKembali);
  const sanksiAktif = sanksiList.filter(s => s.status === 'Sedang Berjalan' || s.status === 'Belum Dikerjakan');

  // Real-time internal coordination telemetry
  const koordinasiList = storageService.getKoordinasiList();
  const unreadKoordinasi = koordinasiList.filter(k => !k.dibacaOleh.includes(currentUser.id));
  const mendesakKoordinasi = koordinasiList.find(k => k.prioritas === 'Mendesak' && k.status !== 'Ditindaklanjuti');

  const handleSendWaAlert = (izin: Perizinan) => {
    const text = WhatsAppTemplates.peringatanKeterlambatan(izin, izin.menitKeterlambatan || 30);
    const url = createWhatsAppUrl(izin.noWaPenjemput, text);
    window.open(url, '_blank');
  };

  const systemConfig = storageService.getSystemConfig();
  const logoBerlaku = systemConfig.logoUrl || "/src/assets/images/logo_pesantren_almaliki_1794050742981.jpg";

  return (
    <div className="space-y-6">
      
      {/* 3D International Security Command Center Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/60 shadow-2xl metallic-glass-card hover-rainbow-edge">
        <img
          src="/src/assets/images/tactical_hq_background_1794052517484.jpg"
          alt="International Command Room"
          className="absolute inset-0 w-full h-full object-cover opacity-20 filter contrast-150 brightness-75"
        />
        {/* Specular Top Line */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-cyan-500 via-amber-400 to-blue-600 opacity-70" />
        
        {/* Glow Scrim & 3D Lighting */}
        <div className="relative z-10 p-5 sm:p-7 md:p-8 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-blue-950/40">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 max-w-3xl min-w-0">
              
              {/* Logo Berlaku Resmi Pesantren Salaf Al-Maliki (Admin & Pengurus) - Ukuran Lebih Besar & Jelas */}
              <div className="relative shrink-0 group self-center sm:self-start">
                <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-tr from-cyan-400 via-amber-400 to-emerald-400 opacity-90 blur-[5px] group-hover:opacity-100 transition-opacity" />
                <div className="relative p-2 sm:p-2.5 rounded-3xl bg-slate-950/95 border-2 border-amber-400 shadow-2xl overflow-hidden glow-gold">
                  <img
                    src={logoBerlaku}
                    alt="Logo Pondok Pesantren Salaf Al-Maliki"
                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-2xl object-cover filter contrast-125 brightness-110 shadow-2xl"
                  />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-slate-950 animate-ping" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-slate-950 shadow-md shadow-cyan-400/80" />
                </div>
              </div>

              {/* Detail Identitas Pusat Komando & Otoritas */}
              <div className="space-y-2.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-xs glow-cyan uppercase tracking-wider">
                    <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    {isAdmin ? 'CENTRAL SECURITY COMMAND GRID' : 'TACTICAL SECTOR DISPATCH'}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                    NRP: {currentUser.nrp || 'SECOP-01'}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    DEFCON 4 (NORMAL)
                  </span>
                </div>

                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase font-sans drop-shadow-md">
                  {isAdmin ? 'Pusat Komando Keamanan Terpadu Al-Maliki' : `Sektor Operasional Keamanan - ${currentUser.nama}`}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {isAdmin
                    ? 'Pengawasan terpusat mutasi gerbang, penegakan tata tertib qanun, audit izin real-time, dan manajemen hak akses sistem terenkripsi.'
                    : 'Sistem operasional keamanan santri per kelas, pencatatan perizinan terkonfigurasi langsung ke database pusat, dan pengawasan gerbang.'}
                </p>
              </div>
            </div>

            {/* Real-time Synced WIB Clock & Quick Perizinan Access */}
            <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-2.5">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 shadow-xl flex flex-col items-start sm:items-end">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-300 uppercase">
                    WAKTU RESMI KAMTIB (WIB / UTC+7)
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono tracking-wider text-amber-300 tabular-nums drop-shadow-md">
                  {wibTime.timeWithSeconds} <span className="text-xs text-cyan-400 font-sans font-bold">WIB</span>
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                  {wibTime.dateStr} · Asia/Jakarta Real-Time
                </div>
              </div>

              <button
                onClick={() => onNavigate('perizinan')}
                className="tactile-interactive flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-600/30 hover:from-cyan-500/30 hover:to-blue-600/40 text-cyan-200 hover:text-white font-bold text-xs font-mono tracking-wider border border-cyan-400/40 cursor-pointer glow-cyan transition-transform active:scale-95"
              >
                <Clock className="w-3.5 h-3.5 text-cyan-300" />
                <span>Administrasi Perizinan Santri</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* REAL-TIME KOORDINASI NOTIFICATION ALERT (MENDESAK OR UNREAD) */}
      {mendesakKoordinasi && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950 via-slate-900 to-red-950/80 border-2 border-red-500 text-red-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xl hover-rainbow-edge animate-pulse glow-red">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-600 text-white shrink-0 shadow-lg shadow-red-600/50">
              <Radio className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-red-600 text-white">
                  🚨 DISPOSISI KOORDINASI MENDESAK
                </span>
                <span className="text-[10px] font-mono text-red-300 font-bold">{mendesakKoordinasi.nomorTiket}</span>
              </div>
              <p className="text-xs font-black text-white uppercase tracking-wide">
                {mendesakKoordinasi.judul}
              </p>
              <p className="text-xs text-red-200/90 mt-0.5 font-sans">
                Dari: <strong className="text-white">{mendesakKoordinasi.pengirimNama}</strong> ({mendesakKoordinasi.pengirimJabatan || mendesakKoordinasi.pengirimRole}) · {mendesakKoordinasi.waktu}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('koordinasi')}
            className="tactile-interactive inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 rounded-xl transition-colors cursor-pointer shrink-0 shadow-xl border border-amber-300"
          >
            <span>Buka & Tindak Lanjut</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-950" />
          </button>
        </div>
      )}

      {/* Unread Regular Dispatches Notice */}
      {!mendesakKoordinasi && unreadKoordinasi.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-950 border border-cyan-500/50 text-cyan-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl hover-rainbow-edge">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 shrink-0 glow-cyan">
              <Radio className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <span>PEMBERITAHUAN KOORDINASI: {unreadKoordinasi.length} PESAN / DISPOSISI BARU</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">REAL-TIME SYNC</span>
              </p>
              <p className="text-xs text-slate-300 mt-0.5 font-sans">
                Terbaru dari {unreadKoordinasi[0]?.pengirimNama}: "{unreadKoordinasi[0]?.judul}"
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('koordinasi')}
            className="tactile-interactive inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider text-white bg-slate-800 hover:bg-slate-700 border border-cyan-500/40 rounded-xl transition-colors cursor-pointer shrink-0 shadow-md"
          >
            <span>Buka Tab Koordinasi</span>
            <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      )}

      {/* Urgent Warning if any Santri is Late - 3D Alert Card */}
      {terlambatList.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/90 via-red-900/40 to-slate-950 border border-red-500/70 text-red-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xl hover-rainbow-edge">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-red-900/80 border border-red-500/50 text-red-200 shrink-0 shadow-inner glow-red">
              <AlertOctagon className="w-6 h-6 text-red-400 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>SECURITY ALERT: {terlambatList.length} SANTRI TERLAMBAT MELEWATI BATAS WAKTU!</span>
              </p>
              <p className="text-xs text-red-300/90 mt-0.5">
                Segera periksa data di modul Monitoring Real-Time dan kirim pesan darurat ke wali santri.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('monitoring')}
            className="tactile-interactive inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors cursor-pointer shrink-0 shadow-lg shadow-red-600/40 border border-red-400"
          >
            <span>Buka Monitoring</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Primary KPI Grid (High-Tech 3D International Command Center) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        
        {/* Card 1: Santri Sedang di Luar */}
        <div 
          onClick={() => handleCardClick('kpi-diluar', () => onNavigate('monitoring'))}
          className={`tactile-interactive p-5 rounded-2xl metallic-glass-card cursor-pointer group shadow-xl hover-rainbow-edge ${
            activeCardId === 'kpi-diluar' ? 'rainbow-active-border' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">Sedang di Luar</span>
            <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/30 group-hover:bg-amber-400/20 group-hover:scale-110 transition-all glow-gold">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tabular-nums text-white drop-shadow-sm">
              <AnimatedCounter value={sedangDiLuar.length} />
            </span>
            <span className="text-xs text-slate-400 font-mono">santri aktif</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-amber-300 font-bold font-mono">
            <span>LIVE MONITORING</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: Santri Terlambat */}
        <div 
          onClick={() => handleCardClick('kpi-terlambat', () => onNavigate('monitoring'))}
          className={`tactile-interactive p-5 rounded-2xl metallic-glass-card cursor-pointer group shadow-xl hover-rainbow-edge ${
            activeCardId === 'kpi-terlambat' ? 'rainbow-active-border' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">Santri Terlambat</span>
            <div className="p-2.5 rounded-xl bg-red-600/15 text-red-400 border border-red-500/30 group-hover:bg-red-600/25 group-hover:scale-110 transition-all glow-red">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tabular-nums text-red-400 drop-shadow-sm">
              <AnimatedCounter value={terlambatList.length} />
            </span>
            <span className="text-xs text-slate-400 font-mono">lewat jadwal</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-red-400 font-bold font-mono">
            <span>DISPATCH PROTOKOL</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Izin Perlu Verifikasi */}
        <div 
          onClick={() => handleCardClick('kpi-verif', () => onNavigate('perizinan'))}
          className={`tactile-interactive p-5 rounded-2xl metallic-glass-card cursor-pointer group shadow-xl hover-rainbow-edge ${
            activeCardId === 'kpi-verif' ? 'rainbow-active-border' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">Verifikasi Izin</span>
            <div className="p-2.5 rounded-xl bg-cyan-600/15 text-cyan-300 border border-cyan-500/30 group-hover:bg-cyan-600/25 group-hover:scale-110 transition-all glow-cyan">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tabular-nums text-white drop-shadow-sm">
              <AnimatedCounter value={menungguPersetujuan.length} />
            </span>
            <span className="text-xs text-slate-400 font-mono">menunggu audit</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-300 font-bold font-mono">
            <span>AUDIT BERKAS</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Sanksi Edukatif */}
        <div 
          onClick={() => handleCardClick('kpi-sanksi', () => onNavigate('sanksi'))}
          className={`tactile-interactive p-5 rounded-2xl metallic-glass-card cursor-pointer group shadow-xl hover-rainbow-edge ${
            activeCardId === 'kpi-sanksi' ? 'rainbow-active-border' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">Takzir Edukatif</span>
            <div className="p-2.5 rounded-xl bg-purple-600/15 text-purple-300 border border-purple-500/30 group-hover:bg-purple-600/25 group-hover:scale-110 transition-all">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono tabular-nums text-amber-300 drop-shadow-sm">
              <AnimatedCounter value={sanksiAktif.length} />
            </span>
            <span className="text-xs text-slate-400 font-mono">santri dibina</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300 font-bold font-mono">
            <span>HAFALAN & KHIDMAH</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* RADAR MONITORING PERIZINAN & DETEKSI KETERLAMBATAN MILITER */}
      <div 
        onClick={() => handleCardClick('patrol-radar-chart')}
        className={`tactile-interactive transition-all rounded-3xl overflow-hidden ${
          activeCardId === 'patrol-radar-chart' ? 'rainbow-active-border' : ''
        }`}
      >
        <RadarMonitoringPerizinan
          perizinanList={perizinanList}
          currentUser={currentUser}
          onViewSuratIzin={onViewSuratIzin}
          onSendWaAlert={handleSendWaAlert}
        />
      </div>

      {/* 1. ADVANCED DATA VISUALIZATION (STATISTIK PELANGGARAN, TREN PERIZINAN, KEDISIPLINAN, LAPORAN BULANAN) */}
      <div className="pt-2">
        <AdvancedDataVisualization
          santriList={santriList}
          perizinanList={perizinanList}
          pelanggaranList={pelanggaranList}
          sanksiList={sanksiList}
          currentUser={currentUser}
        />
      </div>

      {/* 2. DUA TABEL REKAPITULASI UTAMA: PERIZINAN & PELANGGARAN SANTRI (MENGGANTIKAN LOG AKTIVITAS) */}
      <div className="pt-3">
        <DashboardRekapitulasiTables
          perizinanList={perizinanList}
          pelanggaranList={pelanggaranList}
          sanksiList={sanksiList}
          currentUser={currentUser}
          onViewSuratIzin={onViewSuratIzin}
        />
      </div>

    </div>
  );
};
