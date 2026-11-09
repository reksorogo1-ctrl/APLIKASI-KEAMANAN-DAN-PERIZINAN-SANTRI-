import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Radar, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  Send, 
  Eye, 
  Target, 
  Crosshair, 
  Radio, 
  Compass, 
  UserX, 
  Users, 
  Phone,
  ZoomIn,
  RefreshCw,
  AlertOctagon,
  Volume2,
  VolumeX,
  Maximize2
} from 'lucide-react';
import { Perizinan } from '../types';
import { WhatsAppTemplates, createWhatsAppUrl } from '../services/waService';

interface RadarMonitoringPerizinanProps {
  perizinanList: Perizinan[];
  onViewSuratIzin?: (izin: Perizinan) => void;
  onSendWaAlert?: (izin: Perizinan) => void;
  size?: 'medium' | 'large';
}

interface RadarBlip {
  id: string;
  izin: Perizinan;
  isThreat: boolean; // True if terlambat (hostile enemy military detection style)
  angleDeg: number; // 0 - 360 degrees
  distanceRatio: number; // 0.2 - 0.92 from center
  distanceKm: number;
  label: string;
  nis: string;
  kelas: string;
  tujuan: string;
  jamKembali: string;
  menitKeterlambatan: number;
}

export const RadarMonitoringPerizinan: React.FC<RadarMonitoringPerizinanProps> = ({
  perizinanList,
  onViewSuratIzin,
  onSendWaAlert,
  size = 'large',
}) => {
  const isMedium = size === 'medium';
  const [filterMode, setFilterMode] = useState<'all' | 'threats_only'>('all');
  const [selectedBlip, setSelectedBlip] = useState<RadarBlip | null>(null);
  const [sweepSpeed, setSweepSpeed] = useState<'normal' | 'fast' | 'slow'>('normal');
  const [rangeScale, setRangeScale] = useState<number>(10); // in Kilometers
  const [audioFeedback, setAudioFeedback] = useState<boolean>(false);

  // Santri active permits (Sedang di Luar or Terlambat or recent)
  const activePermits = useMemo(() => {
    const list = perizinanList.filter(
      i => i.status === 'Terlambat' || i.status === 'Sedang Keluar' || i.status === 'Disetujui'
    );
    // If fewer than 4 items, include all permits to ensure radar is rich with real data
    if (list.length < 3) {
      return perizinanList.slice(0, 8);
    }
    return list;
  }, [perizinanList]);

  // Generate deterministic military coordinates based on permit ID / NIS
  const blips: RadarBlip[] = useMemo(() => {
    return activePermits.map((izin, idx) => {
      const isThreat = izin.status === 'Terlambat';
      
      // Hash NIS & ID to fixed angle and distance for visual consistency
      const hashStr = `${izin.id}_${izin.santriNis}_${idx}`;
      let hash = 0;
      for (let i = 0; i < hashStr.length; i++) {
        hash = (hash << 5) - hash + hashStr.charCodeAt(i);
        hash |= 0;
      }
      const absHash = Math.abs(hash);
      
      // Threat targets positioned with clear visibility
      const baseAngle = isThreat 
        ? (idx * 115 + 45) % 360 
        : (absHash % 360);
      
      const distanceRatio = isThreat 
        ? 0.55 + ((absHash % 35) / 100) // 0.55 to 0.90 (outer threat perimeter)
        : 0.25 + ((absHash % 50) / 100); // 0.25 to 0.75

      const distanceKm = Math.round(distanceRatio * rangeScale * 10) / 10;
      const menitTerlambat = izin.menitKeterlambatan || (isThreat ? 45 : 0);

      return {
        id: izin.id,
        izin,
        isThreat,
        angleDeg: baseAngle,
        distanceRatio,
        distanceKm,
        label: izin.santriNama,
        nis: izin.santriNis,
        kelas: izin.santriKelas,
        tujuan: izin.tujuan,
        jamKembali: izin.jamKembali,
        menitKeterlambatan: menitTerlambat,
      };
    });
  }, [activePermits, rangeScale]);

  // Filtered blips based on user mode
  const visibleBlips = useMemo(() => {
    if (filterMode === 'threats_only') {
      return blips.filter(b => b.isThreat);
    }
    return blips;
  }, [blips, filterMode]);

  const threatCount = blips.filter(b => b.isThreat).length;
  const safeCount = blips.length - threatCount;

  // Auto select threat blip on initial render if any
  useEffect(() => {
    const firstThreat = blips.find(b => b.isThreat);
    if (firstThreat && !selectedBlip) {
      setSelectedBlip(firstThreat);
    } else if (!selectedBlip && blips.length > 0) {
      setSelectedBlip(blips[0]);
    }
  }, [blips]);

  const handleSendWa = (izin: Perizinan) => {
    if (onSendWaAlert) {
      onSendWaAlert(izin);
    } else {
      const text = WhatsAppTemplates.peringatanKeterlambatan(izin, izin.menitKeterlambatan || 30);
      const url = createWhatsAppUrl(izin.noWaPenjemput, text);
      window.open(url, '_blank');
    }
  };

  const getSweepDuration = () => {
    switch (sweepSpeed) {
      case 'fast': return '2.5s';
      case 'slow': return '7s';
      default: return '4s';
    }
  };

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-black ${isMedium ? 'p-4 sm:p-5' : 'p-5 sm:p-7'} shadow-2xl metallic-glass-card hover-rainbow-edge font-sans`}>
      
      {/* Top Specular Military Cyan/Red Line */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] ${
        threatCount > 0 
          ? 'bg-gradient-to-r from-red-500 via-amber-400 to-red-600 animate-pulse' 
          : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400'
      }`} />

      {/* Military Radar Header Section */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between ${isMedium ? 'gap-3 pb-3' : 'gap-4 pb-5'} border-b border-slate-800/80`}>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-xs glow-cyan uppercase tracking-wider">
              <Radar className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              SENTRY TARGET ACQUISITION RADAR
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
              FREQ: 9.4 GHz X-BAND
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] font-mono text-slate-400">
              AZIMUTH: 360° CONTINUOUS
            </span>
          </div>

          <h3 className={`${isMedium ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} font-black text-white uppercase tracking-tight mt-1.5 flex items-center gap-2 font-sans`}>
            <Crosshair className={`w-5 h-5 ${threatCount > 0 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`} />
            Radar Kontrol Perizinan & Deteksi Santri Terlambat
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Sistem pemindai spatio-temporal militer: melacak mutasi keluar-masuk santri dan mendeteksi target keterlambatan secara otomatis
          </p>
        </div>

        {/* Threat Level HUD Telemetry */}
        <div className="flex items-center gap-3 shrink-0">
          {threatCount > 0 ? (
            <div className={`p-3 rounded-2xl bg-gradient-to-r from-red-950/90 via-red-900/50 to-slate-950 border border-red-500/80 shadow-xl glow-red flex items-center gap-3 animate-pulse`}>
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
              <div>
                <p className="text-[10px] font-mono font-black text-red-300 uppercase tracking-widest leading-none">
                  THREAT WARNING: DETEKSI TARGET
                </p>
                <p className="text-sm font-black font-mono text-white mt-0.5">
                  {threatCount} SANTRI TERLAMBAT
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-emerald-500/40 shadow-xl flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div>
                <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest leading-none">
                  PERIMETER STERIL & AMAN
                </p>
                <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                  0 TARGET TERLAMBAT DETEKSI
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Rotating Radar Screen (Left) & Tactical Target Control Desk (Right) */}
      <div className={`grid grid-cols-1 ${isMedium ? 'lg:grid-cols-12 gap-5 mt-4' : 'lg:grid-cols-12 gap-6 mt-6'} items-center`}>
        
        {/* Radar Screen Viewport */}
        <div className={`${isMedium ? 'lg:col-span-5' : 'lg:col-span-7'} flex flex-col items-center justify-center relative`}>
          
          {/* Radar Frame & Azimuth Markers */}
          <div className={`relative w-full ${isMedium ? 'max-w-[310px]' : 'max-w-[420px]'} aspect-square rounded-full p-2 bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.18)] flex items-center justify-center overflow-hidden group`}>
            
            {/* Outer Compass Degree Ring */}
            <div className="absolute inset-2 rounded-full border border-cyan-500/30 pointer-events-none" />
            <div className="absolute inset-5 rounded-full border border-cyan-500/15 border-dashed pointer-events-none" />

            {/* Compass Headings (N, S, E, W) */}
            <span className="absolute top-3 text-[10px] font-mono font-black text-amber-400 tracking-widest pointer-events-none">
              N 000°
            </span>
            <span className="absolute bottom-3 text-[10px] font-mono font-bold text-cyan-400 tracking-widest pointer-events-none">
              S 180°
            </span>
            <span className="absolute right-3.5 text-[10px] font-mono font-bold text-cyan-400 tracking-widest pointer-events-none">
              E 090°
            </span>
            <span className="absolute left-3 text-[10px] font-mono font-bold text-cyan-400 tracking-widest pointer-events-none">
              W 270°
            </span>

            {/* Circular Phosphor Screen Grid */}
            <div className="relative w-full h-full rounded-full bg-slate-950/90 overflow-hidden border border-cyan-500/40 shadow-inner flex items-center justify-center">
              
              {/* Tactical Phosphor Radial Gradient Background */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none opacity-40"
                style={{
                  background: 'radial-gradient(circle at center, rgba(6,182,212,0.25) 0%, rgba(2,6,23,0.85) 65%, rgba(0,0,0,1) 100%)'
                }}
              />

              {/* Concentric Range Rings (25%, 50%, 75%, 100%) */}
              <div className="absolute w-[25%] h-[25%] rounded-full border border-cyan-500/30 pointer-events-none" />
              <div className="absolute w-[50%] h-[50%] rounded-full border border-cyan-500/35 pointer-events-none" />
              <div className="absolute w-[75%] h-[75%] rounded-full border border-cyan-500/30 border-dashed pointer-events-none" />
              <div className="absolute w-[98%] h-[98%] rounded-full border border-cyan-500/40 pointer-events-none" />

              {/* Range Distance Labels on Ring */}
              <span className="absolute top-[38%] text-[8px] font-mono text-cyan-500/80 font-bold pointer-events-none">
                {(rangeScale * 0.25).toFixed(1)} KM
              </span>
              <span className="absolute top-[25%] text-[8px] font-mono text-cyan-500/80 font-bold pointer-events-none">
                {(rangeScale * 0.5).toFixed(1)} KM
              </span>
              <span className="absolute top-[13%] text-[8px] font-mono text-cyan-500/80 font-bold pointer-events-none">
                {(rangeScale * 0.75).toFixed(1)} KM
              </span>

              {/* Crosshair Axes */}
              <div className="absolute left-0 right-0 h-[1px] bg-cyan-500/25 pointer-events-none" />
              <div className="absolute top-0 bottom-0 w-[1px] bg-cyan-500/25 pointer-events-none" />

              {/* Diagonal 45° Guidelines */}
              <div className="absolute w-full h-[1px] bg-cyan-500/15 rotate-45 pointer-events-none" />
              <div className="absolute w-full h-[1px] bg-cyan-500/15 -rotate-45 pointer-events-none" />

              {/* 360° ROTATING MILITARY RADAR BEAM (Continuous Conic Sweep) */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  animation: `radar-sweep ${getSweepDuration()} linear infinite`,
                  transformOrigin: 'center center'
                }}
              >
                {/* Conic Gradient Sweep Trail */}
                <div 
                  className="w-full h-full rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(6,182,212,0.12) 320deg, rgba(6,182,212,0.45) 359deg, rgba(34,211,238,0.9) 360deg)'
                  }}
                />
                {/* Sharp Leading Sweep Needle */}
                <div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-1/2 bg-gradient-to-t from-cyan-400 to-white shadow-[0_0_12px_#22d3ee]"
                />
              </div>

              {/* Center Sentry Headquarters Base (PP Salaf Al-Maliki Command) */}
              <div className="relative z-20 w-8 h-8 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/40">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="sr-only">Pos Pusat Al-Maliki</span>
              </div>

              {/* RADAR TARGET BLIPS (Santri Targets) */}
              {visibleBlips.map((blip) => {
                // Convert polar coordinates (angle, radius) to Cartesian percentages
                const rad = (blip.angleDeg - 90) * (Math.PI / 180);
                // Center is 50%, 50%. Radius factor is 46% max
                const xPercent = 50 + Math.cos(rad) * (blip.distanceRatio * 46);
                const yPercent = 50 + Math.sin(rad) * (blip.distanceRatio * 46);
                const isSelected = selectedBlip?.id === blip.id;

                return (
                  <button
                    key={blip.id}
                    onClick={() => setSelectedBlip(blip)}
                    className="absolute z-30 -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                    style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                    title={`${blip.label} (${blip.isThreat ? 'TERLAMBAT' : 'AKTIF'})`}
                  >
                    {blip.isThreat ? (
                      /* MILITARY ENEMY TARGET BLIP (Flashing Red Ala Radar Deteksi Musuh) */
                      <div className="relative flex items-center justify-center">
                        {/* Red Pinging Shockwave Rings */}
                        <span className="absolute w-8 h-8 rounded-full bg-red-600/40 animate-ping border border-red-500" />
                        <span className="absolute w-6 h-6 rounded-full bg-red-500/30 animate-pulse border border-red-400/80" />
                        
                        {/* Target Reticle Crosshair Square */}
                        <div className={`w-5 h-5 rounded-md border-2 ${
                          isSelected ? 'border-yellow-400 bg-red-950/90 scale-110' : 'border-red-500 bg-red-950/80'
                        } flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.9)]`}>
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        </div>

                        {/* Floating Target Identification HUD Tag */}
                        <div className={`absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-0.5 rounded-md border font-mono text-[9px] font-bold z-40 shadow-xl pointer-events-none transition-all ${
                          isSelected 
                            ? 'bg-red-950 text-yellow-300 border-yellow-400 scale-105' 
                            : 'bg-black/90 text-red-300 border-red-500/80'
                        }`}>
                          <span className="text-red-400 font-black">! TARGET TERLAMBAT:</span> {blip.label.split(' ')[0]} ({blip.distanceKm} km)
                        </div>
                      </div>
                    ) : (
                      /* SAFE / ON-TIME SANTRI TARGET BLIP (Cyan/Emerald Steady) */
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-5 h-5 rounded-full bg-cyan-400/20 animate-ping" />
                        <div className={`w-3.5 h-3.5 rounded-full border ${
                          isSelected ? 'border-amber-400 bg-cyan-400 scale-125' : 'border-cyan-300 bg-cyan-500/80'
                        } flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.8)]`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                        {isSelected && (
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-950/95 border border-cyan-400 text-cyan-300 font-mono text-[9px] font-bold z-40 shadow-xl pointer-events-none">
                            {blip.label.split(' ')[0]} ({blip.distanceKm} km)
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}

            </div>

          </div>

          {/* Radar Controller Tuning Toolbar */}
          <div className="flex items-center justify-between w-full max-w-[420px] mt-4 pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>SCAN SPEED:</span>
              <button
                onClick={() => setSweepSpeed('normal')}
                className={`px-2 py-0.5 rounded ${sweepSpeed === 'normal' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'hover:text-white'}`}
              >
                1X
              </button>
              <button
                onClick={() => setSweepSpeed('fast')}
                className={`px-2 py-0.5 rounded ${sweepSpeed === 'fast' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'hover:text-white'}`}
              >
                2X FAST
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span>ZOOM RADIUS:</span>
              <button
                onClick={() => setRangeScale(prev => prev === 10 ? 25 : 10)}
                className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 font-bold cursor-pointer"
              >
                {rangeScale} KM
              </button>
            </div>
          </div>
        </div>

        {/* Tactical Target Control Desk */}
        <div className={`${isMedium ? 'lg:col-span-7' : 'lg:col-span-5'} space-y-4`}>
          
          {/* Target Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono">
            <button
              onClick={() => setFilterMode('all')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Target ({blips.length})
            </button>
            <button
              onClick={() => setFilterMode('threats_only')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                filterMode === 'threats_only'
                  ? 'bg-red-600 text-white shadow-md animate-pulse'
                  : 'text-red-400 hover:text-red-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Target Terlambat ({threatCount})</span>
            </button>
          </div>

          {/* Selected Target HUD Telemetry Card */}
          {selectedBlip ? (
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              selectedBlip.isThreat
                ? 'bg-gradient-to-b from-red-950/70 via-slate-900 to-slate-950 border-red-500/80 shadow-2xl glow-red'
                : 'bg-gradient-to-b from-slate-900 via-slate-950 to-black border-cyan-500/40 shadow-xl'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                    selectedBlip.isThreat
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  }`}>
                    {selectedBlip.isThreat ? 'HOSTILE LOCK: OVERDUE' : 'TARGET LOCKED: AMAN'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    AZ: {selectedBlip.angleDeg}°
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {selectedBlip.distanceKm} KM dari Pondok
                </span>
              </div>

              {/* Target Profile Info */}
              <div className="mt-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-base font-black text-white font-sans">
                      {selectedBlip.label}
                    </h4>
                    <p className="text-xs font-mono text-cyan-300">
                      NIS: {selectedBlip.nis} · {selectedBlip.kelas}
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                    {selectedBlip.izin.jenisIzin}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-mono">
                  <div className="p-2 rounded-xl bg-black/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Batas Waktu Kembali:</span>
                    <span className={`font-bold ${selectedBlip.isThreat ? 'text-red-400' : 'text-slate-200'}`}>
                      {selectedBlip.jamKembali} WIB
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Status Keterlambatan:</span>
                    <span className={`font-bold ${selectedBlip.isThreat ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                      {selectedBlip.isThreat ? `Terlambat ${selectedBlip.menitKeterlambatan} Mnt` : 'Tepat Waktu'}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-black/60 border border-slate-800 text-xs font-sans">
                  <span className="text-[10px] font-mono text-slate-400 block">Tujuan & Penjemput:</span>
                  <p className="text-slate-200 mt-0.5">
                    {selectedBlip.tujuan} · <span className="text-slate-400">Wali: {selectedBlip.izin.namaPenjemput}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons for Selected Target */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
                {onViewSuratIzin && (
                  <button
                    onClick={() => onViewSuratIzin(selectedBlip.izin)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Surat Izin</span>
                  </button>
                )}

                <button
                  onClick={() => handleSendWa(selectedBlip.izin)}
                  className={`flex-1 py-2 px-3 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md ${
                    selectedBlip.isThreat
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white border border-red-400 animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim WA Wali</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs font-mono">
              <Crosshair className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              Pilih salah satu titik blip pada radar pemindai untuk mengunci telemetri santri.
            </div>
          )}

          {/* Quick Target Acquisition List */}
          <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest px-1">
              DAFTAR SASARAN DETEKSI TERAKHIR:
            </p>
            {visibleBlips.map((blip) => {
              const isSelected = selectedBlip?.id === blip.id;
              return (
                <div
                  key={blip.id}
                  onClick={() => setSelectedBlip(blip)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono cursor-pointer transition-all ${
                    blip.isThreat
                      ? 'bg-red-950/40 hover:bg-red-950/70 border-red-500/50 text-red-200'
                      : isSelected
                      ? 'bg-cyan-950/50 border-cyan-400 text-cyan-200'
                      : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      blip.isThreat ? 'bg-red-500 animate-ping' : 'bg-cyan-400'
                    }`} />
                    <span className="font-bold truncate font-sans text-white">{blip.label}</span>
                    <span className="text-[10px] text-slate-400">{blip.kelas}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold ${blip.isThreat ? 'text-red-400' : 'text-slate-400'}`}>
                      {blip.isThreat ? `+${blip.menitKeterlambatan}m LATE` : blip.jamKembali}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-bold">{blip.distanceKm}km</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
};
