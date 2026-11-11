import React, { useState, useEffect, useMemo } from 'react';
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
  Users, 
  CheckCircle2,
  AlertOctagon,
  X,
  AlertCircle,
  ChevronRight,
  DoorOpen
} from 'lucide-react';
import { Perizinan, UserAccount, Pelanggaran } from '../types';
import { WhatsAppTemplates, createWhatsAppUrl } from '../services/waService';
import { storageService } from '../services/storageService';
import { getWIBDateTime, hitungKeterlambatanWIB, getTanggalPenangguhanWIB } from '../utils/timeUtils';

export type RadarBlipStatus = 'TERLAMBAT' | 'SEGERA KEMBALI' | 'SEDANG DI LUAR' | 'MENUNGGU CHECK-OUT';

interface RadarBlip {
  id: string;
  izin: Perizinan;
  statusKamtib: RadarBlipStatus;
  isThreat: boolean; // True if terlambat (hostile threat styling)
  isWarning: boolean; // True if segera kembali (deadline <= 30 mins)
  angleDeg: number; // 0 - 360 degrees
  distanceRatio: number; // 0.2 - 0.92 from center
  distanceKm: number;
  label: string;
  nis: string;
  kelas: string;
  tujuan: string;
  jamKembali: string;
  tglKembali: string;
  menitKeterlambatan: number;
  sisaMenit: number;
}

interface RadarMonitoringPerizinanProps {
  perizinanList: Perizinan[];
  currentUser?: UserAccount;
  onViewSuratIzin?: (izin: Perizinan) => void;
  onSendWaAlert?: (izin: Perizinan) => void;
  size?: 'medium' | 'large';
}

export const RadarMonitoringPerizinan: React.FC<RadarMonitoringPerizinanProps> = ({
  perizinanList,
  currentUser,
  onViewSuratIzin,
  onSendWaAlert,
  size = 'large',
}) => {
  const isMedium = size === 'medium';
  const [filterMode, setFilterMode] = useState<'all' | 'threats_only' | 'warning_only'>('all');
  const [selectedBlip, setSelectedBlip] = useState<RadarBlip | null>(null);
  const [sweepSpeed, setSweepSpeed] = useState<'normal' | 'fast' | 'slow'>('normal');
  const [rangeScale, setRangeScale] = useState<number>(10); // in Kilometers
  const [selesaiModalIzin, setSelesaiModalIzin] = useState<Perizinan | null>(null);
  const [durasiSuspensiHari, setDurasiSuspensiHari] = useState<number>(7);

  // Live WIB clock ticking every 5 seconds to keep deadlines updated
  const [wibNow, setWibNow] = useState(getWIBDateTime());
  useEffect(() => {
    const timer = setInterval(() => {
      setWibNow(getWIBDateTime());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // 1. FILTER ACTIVE PERMITS ONLY (Single Source of Truth from Firestore)
  // Per requirements:
  // - When permit is approved (Disetujui) or out (Sedang Keluar) or late (Terlambat) -> enters Radar.
  // - Once return is confirmed (SELESAI pressed / actualKembali set / Sudah Kembali) -> automatically removed from Radar.
  // - NO dummy fallback, NO mock slicing. If empty, count is 0.
  const activePermits = useMemo(() => {
    return perizinanList.filter(i => {
      if (i.status === 'Sudah Kembali' || i.status === 'Ditolak') return false;
      if (i.actualKembali) return false;
      return i.status === 'Terlambat' || i.status === 'Sedang Keluar' || i.status === 'Disetujui';
    });
  }, [perizinanList]);

  // 2. GENERATE DETERMINISTIC RADAR COORDINATES & REAL-TIME TEMPORAL STATUS
  const blips: RadarBlip[] = useMemo(() => {
    const nowMs = wibNow.nowWIB.getTime();

    return activePermits.map((izin, idx) => {
      // Parse scheduled return date and time
      const deadlineStr = `${izin.tglKembali}T${izin.jamKembali}:00`;
      const deadline = new Date(deadlineStr);
      const isDeadLineValid = !isNaN(deadline.getTime());
      
      const diffMs = isDeadLineValid ? deadline.getTime() - nowMs : 999999;
      const diffMinutes = Math.floor(diffMs / 60000);

      let statusKamtib: RadarBlipStatus = 'MENUNGGU CHECK-OUT';
      let isThreat = false;
      let isWarning = false;
      let menitKeterlambatan = 0;
      let sisaMenit = Math.max(0, diffMinutes);

      const hasCheckedOut = Boolean(izin.actualKeluar || izin.status === 'Sedang Keluar');

      if (izin.status === 'Terlambat' || diffMinutes < 0) {
        statusKamtib = 'TERLAMBAT';
        isThreat = true;
        menitKeterlambatan = izin.menitKeterlambatan || Math.abs(diffMinutes);
      } else if (hasCheckedOut) {
        if (diffMinutes <= 30) {
          // Ketika waktu hampir habis (<= 30 menit), status berubah menjadi SEGERA KEMBALI
          statusKamtib = 'SEGERA KEMBALI';
          isWarning = true;
        } else {
          statusKamtib = 'SEDANG DI LUAR';
        }
      } else {
        // Status awal pada radar saat izin disetujui adalah MENUNGGU CHECK-OUT
        statusKamtib = 'MENUNGGU CHECK-OUT';
      }

      // Hash NIS & ID to deterministic angle and distance for visual stability
      const hashStr = `${izin.id}_${izin.santriNis}_${idx}`;
      let hash = 0;
      for (let i = 0; i < hashStr.length; i++) {
        hash = (hash << 5) - hash + hashStr.charCodeAt(i);
        hash |= 0;
      }
      const absHash = Math.abs(hash);

      const baseAngle = isThreat 
        ? (idx * 115 + 45) % 360 
        : isWarning
        ? (idx * 85 + 25) % 360
        : (absHash % 360);

      const distanceRatio = isThreat 
        ? 0.60 + ((absHash % 30) / 100) // 0.60 to 0.90 outer threat zone
        : isWarning
        ? 0.45 + ((absHash % 25) / 100) // 0.45 to 0.70 caution zone
        : 0.25 + ((absHash % 45) / 100); // 0.25 to 0.70 safe zone

      const distanceKm = Math.round(distanceRatio * rangeScale * 10) / 10;

      return {
        id: izin.id,
        izin,
        statusKamtib,
        isThreat,
        isWarning,
        angleDeg: baseAngle,
        distanceRatio,
        distanceKm,
        label: izin.santriNama,
        nis: izin.santriNis,
        kelas: izin.santriKelas,
        tujuan: izin.tujuan,
        jamKembali: izin.jamKembali,
        tglKembali: izin.tglKembali,
        menitKeterlambatan,
        sisaMenit,
      };
    });
  }, [activePermits, rangeScale, wibNow]);

  // Filtered blips based on user-selected filter mode
  const visibleBlips = useMemo(() => {
    if (filterMode === 'threats_only') {
      return blips.filter(b => b.isThreat);
    }
    if (filterMode === 'warning_only') {
      return blips.filter(b => b.isWarning);
    }
    return blips;
  }, [blips, filterMode]);

  const threatCount = blips.filter(b => b.isThreat).length;
  const warningCount = blips.filter(b => b.isWarning).length;
  const safeCount = blips.length - threatCount - warningCount;

  // Auto-select threat or first available blip if current selection is invalid
  useEffect(() => {
    if (selectedBlip) {
      const stillActive = blips.find(b => b.id === selectedBlip.id);
      if (stillActive) {
        setSelectedBlip(stillActive);
        return;
      }
    }
    const firstThreat = blips.find(b => b.isThreat);
    if (firstThreat) {
      setSelectedBlip(firstThreat);
    } else if (blips.length > 0) {
      setSelectedBlip(blips[0]);
    } else {
      setSelectedBlip(null);
    }
  }, [blips]);

  // Handle WhatsApp Notification
  const handleSendWa = (izin: Perizinan) => {
    if (onSendWaAlert) {
      onSendWaAlert(izin);
    } else {
      const text = WhatsAppTemplates.peringatanKeterlambatan(izin, izin.menitKeterlambatan || 30);
      const url = createWhatsAppUrl(izin.noWaPenjemput, text);
      window.open(url, '_blank');
    }
  };

  // Mutasi Gerbang: Catat Keluar Gerbang (Status Berubah Menjadi 'SEDANG DI LUAR')
  const handleTandaiKeluar = (izin: Perizinan) => {
    const currentWIB = getWIBDateTime();
    const actorName = currentUser ? currentUser.nama : 'Petugas Gerbang';
    const updated: Perizinan = {
      ...izin,
      status: 'Sedang Keluar',
      actualKeluar: `${currentWIB.dateStr} ${currentWIB.timeStr} WIB`,
      petugasKeluar: actorName,
      riwayatPersetujuan: [
        ...izin.riwayatPersetujuan,
        {
          role: 'Pos Gerbang',
          nama: actorName,
          tanggal: `${currentWIB.dateStr} ${currentWIB.timeStr} WIB`,
          status: 'Setuju',
          catatan: `Santri melintasi pos gerbang (SEDANG DI LUAR) pada ${currentWIB.timeStr} WIB dicatat via Radar Monitoring.`,
        }
      ]
    };
    storageService.savePerizinan(updated);
    storageService.addLog('Mutasi Gerbang', `Santri ${izin.santriNama} tercatat keluar gerbang pada ${currentWIB.timeStr} WIB (Status: SEDANG DI LUAR)`, 'gerbang');
    storageService.addNotification({
      judul: `Gerbang Keluar: ${izin.santriNama}`,
      pesan: `Santri ${izin.santriNama} telah melintasi gerbang keluar (${currentWIB.timeStr} WIB). Status di Radar otomatis diperbarui menjadi SEDANG DI LUAR.`,
      tipe: 'info',
      linkMenu: 'monitoring',
    });
  };

  // =========================================================================
  // TOMBOL SELESAI / SANTRI KEMBALI DARI RADAR MONITORING
  // MENCATAT KEPULANGAN SEBENARNYA, UPDATE STATUS, DAN MENGHAPUS DARI RADAR
  // =========================================================================
  const handleConfirmSelesai = () => {
    if (!selesaiModalIzin) return;
    const currentWIB = getWIBDateTime();
    const actorName = currentUser ? currentUser.nama : 'Petugas Keamanan';

    const lateCalc = hitungKeterlambatanWIB(
      selesaiModalIzin.tglKembali,
      selesaiModalIzin.jamKembali,
      currentWIB.dateStr,
      currentWIB.timeStr
    );

    const isLate = lateCalc.isTerlambat;
    const diffMinutes = lateCalc.menitKeterlambatan;

    if (isLate) {
      const suspendUntil = getTanggalPenangguhanWIB(durasiSuspensiHari);

      const updatedIzin: Perizinan = {
        ...selesaiModalIzin,
        status: 'Terlambat',
        actualKembali: `${currentWIB.dateStr} ${currentWIB.timeStr} WIB`,
        petugasKembali: actorName,
        menitKeterlambatan: diffMinutes,
        riwayatPersetujuan: [
          ...selesaiModalIzin.riwayatPersetujuan,
          {
            role: 'Biro Keamanan',
            nama: actorName,
            tanggal: `${currentWIB.dateStr} ${currentWIB.timeStr} WIB`,
            status: 'Setuju',
            catatan: `Konfirmasi kepulangan dari Radar Monitoring: TERLAMBAT ${diffMinutes} menit. Otomatis masuk catatan pelanggaran.`,
          }
        ]
      };
      storageService.savePerizinan(updatedIzin);

      // Otomatis buat catatan insiden pelanggaran
      const poinSanksi = diffMinutes > 120 ? 25 : (diffMinutes > 30 ? 15 : 10);
      const tingkatSanksi = diffMinutes > 120 ? 'Berat' : (diffMinutes > 30 ? 'Sedang' : 'Ringan');

      const newPelanggaran: Pelanggaran = {
        id: `pel_late_${Date.now()}`,
        kodePelanggaran: `PEL-LATE-${currentWIB.nowWIB.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        santriId: selesaiModalIzin.santriId,
        santriNama: selesaiModalIzin.santriNama,
        santriNis: selesaiModalIzin.santriNis,
        santriGender: selesaiModalIzin.santriGender,
        tanggal: currentWIB.dateStr,
        waktu: currentWIB.timeStr,
        tataTertibId: 'tt_kamtib_late_izin',
        jenisPelanggaran: `Keterlambatan Kepulangan Izin Keluar (+${diffMinutes} Menit)`,
        kategori: tingkatSanksi,
        poin: poinSanksi,
        kronologi: `Santri kembali ke pondok melewati batas waktu resmi (${selesaiModalIzin.tglKembali} ${selesaiModalIzin.jamKembali} WIB). Tiba di pos kamtib pada ${currentWIB.dateStr} ${currentWIB.timeStr} WIB (Terlambat ${diffMinutes} menit). Dikonfirmasi via Radar Monitoring. Penangguhan izin keluar hingga ${suspendUntil}.`,
        lokasi: 'Pos Gerbang Keamanan Pondok Pesantren',
        namaPetugasPelapor: actorName,
        statusVerifikasi: 'Terverifikasi'
      };
      storageService.savePelanggaran(newPelanggaran);

      // Tangguhkan izin santri
      storageService.suspendSantri(
        selesaiModalIzin.santriId,
        suspendUntil,
        `Keterlambatan izin keluar ${diffMinutes} menit (Nomor Surat: ${selesaiModalIzin.nomorIzin}). Tanggal kembali aktual: ${currentWIB.dateStr} ${currentWIB.timeStr} WIB.`
      );

      // Broadcast Notifikasi Real-time
      storageService.addNotification({
        judul: `Keterlambatan Radar: ${selesaiModalIzin.santriNama} (+${diffMinutes} Mnt)`,
        pesan: `Santri ${selesaiModalIzin.santriNama} telah tiba di gerbang melewati jadwal (+${diffMinutes} mnt). Otomatis masuk Catatan Pelanggaran (+${poinSanksi} poin), dihapus dari radar aktif, dan terekap di riwayat.`,
        tipe: 'danger',
        linkMenu: 'pelanggaran',
      });
    } else {
      // Tepat Waktu -> Status 'Sudah Kembali'
      const updatedIzin: Perizinan = {
        ...selesaiModalIzin,
        status: 'Sudah Kembali',
        actualKembali: `${currentWIB.dateStr} ${currentWIB.timeStr} WIB`,
        petugasKembali: actorName,
        menitKeterlambatan: 0,
        riwayatPersetujuan: [
          ...selesaiModalIzin.riwayatPersetujuan,
          {
            role: 'Biro Keamanan',
            nama: actorName,
            tanggal: `${currentWIB.dateStr} ${currentWIB.timeStr} WIB`,
            status: 'Setuju',
            catatan: `Konfirmasi kepulangan TEPAT WAKTU pada ${currentWIB.timeStr} WIB melalui Radar Monitoring.`,
          }
        ]
      };
      storageService.savePerizinan(updatedIzin);

      storageService.addNotification({
        judul: `Perizinan Selesai: ${selesaiModalIzin.santriNama}`,
        pesan: `Santri ${selesaiModalIzin.santriNama} telah kembali tepat waktu (${currentWIB.timeStr} WIB). Data otomatis terekap ke riwayat dan target dihapus dari radar aktif.`,
        tipe: 'success',
        linkMenu: 'perizinan',
      });
    }

    setSelesaiModalIzin(null);
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
          : warningCount > 0
          ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-cyan-500'
          : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400'
      }`} />

      {/* Military Radar Header Section */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between ${isMedium ? 'gap-3 pb-3' : 'gap-4 pb-5'} border-b border-slate-800/80`}>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-mono font-bold bg-cyan-950/90 text-cyan-300 border border-cyan-500/50 shadow-xs glow-cyan uppercase tracking-wider">
              <Radar className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              SENTRY TARGET ACQUISITION RADAR (REAL-TIME WIB)
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
              TARGET AKTIF: {activePermits.length} SANTRI
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-[10px] font-mono text-slate-400">
              AZIMUTH: 360° CONTINUOUS
            </span>
          </div>

          <h3 className={`${isMedium ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} font-black text-white uppercase tracking-tight mt-1.5 flex items-center gap-2 font-sans`}>
            <Crosshair className={`w-5 h-5 ${threatCount > 0 ? 'text-red-500 animate-pulse' : warningCount > 0 ? 'text-amber-400' : 'text-cyan-400'}`} />
            Radar Kontrol Perizinan & Deteksi Santri Terlambat
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Sistem pemindai spatio-temporal militer terhubung langsung ke database perizinan santri secara real-time
          </p>
        </div>

        {/* Threat Level HUD Telemetry */}
        <div className="flex items-center gap-3 shrink-0">
          {threatCount > 0 ? (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-red-950/90 via-red-900/50 to-slate-950 border border-red-500/80 shadow-xl glow-red flex items-center gap-3 animate-pulse">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
              <div>
                <p className="text-[10px] font-mono font-black text-red-300 uppercase tracking-widest leading-none">
                  THREAT WARNING: DETEKSI TERLAMBAT
                </p>
                <p className="text-sm font-black font-mono text-white mt-0.5">
                  {threatCount} SANTRI TERLAMBAT
                </p>
              </div>
            </div>
          ) : warningCount > 0 ? (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-950 border border-amber-500/60 shadow-xl flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
              <div>
                <p className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest leading-none">
                  PERINGATAN WAKTU: SEGERA KEMBALI
                </p>
                <p className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                  {warningCount} SANTRI DALAM 30 MENIT
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-emerald-500/40 shadow-xl flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div>
                <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest leading-none">
                  PERIMETER STERIL & TERTIB
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

              {/* Concentric Range Rings */}
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

              {/* 360° ROTATING MILITARY RADAR BEAM */}
              <div 
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  animation: `radar-sweep ${getSweepDuration()} linear infinite`,
                  transformOrigin: 'center center'
                }}
              >
                <div 
                  className="w-full h-full rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(6,182,212,0.12) 320deg, rgba(6,182,212,0.45) 359deg, rgba(34,211,238,0.9) 360deg)'
                  }}
                />
                <div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-1/2 bg-gradient-to-t from-cyan-400 to-white shadow-[0_0_12px_#22d3ee]"
                />
              </div>

              {/* Center Sentry Headquarters Base (PP Salaf Al-Maliki Command) */}
              <div className="relative z-20 w-8 h-8 rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/40">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="sr-only">Pos Pusat Al-Maliki</span>
              </div>

              {/* REAL-TIME RADAR TARGET BLIPS */}
              {visibleBlips.map((blip) => {
                const rad = (blip.angleDeg - 90) * (Math.PI / 180);
                const xPercent = 50 + Math.cos(rad) * (blip.distanceRatio * 46);
                const yPercent = 50 + Math.sin(rad) * (blip.distanceRatio * 46);
                const isSelected = selectedBlip?.id === blip.id;

                return (
                  <button
                    key={blip.id}
                    onClick={() => setSelectedBlip(blip)}
                    className="absolute z-30 -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                    style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                    title={`${blip.label} (${blip.statusKamtib})`}
                  >
                    {blip.isThreat ? (
                      /* THREAT / TERLAMBAT BLIP (Flashing Red Reticle) */
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-8 h-8 rounded-full bg-red-600/40 animate-ping border border-red-500" />
                        <span className="absolute w-6 h-6 rounded-full bg-red-500/30 animate-pulse border border-red-400/80" />
                        
                        <div className={`w-5 h-5 rounded-md border-2 ${
                          isSelected ? 'border-yellow-400 bg-red-950/90 scale-110' : 'border-red-500 bg-red-950/80'
                        } flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.9)]`}>
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        </div>

                        <div className={`absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-0.5 rounded-md border font-mono text-[9px] font-bold z-40 shadow-xl pointer-events-none transition-all ${
                          isSelected 
                            ? 'bg-red-950 text-yellow-300 border-yellow-400 scale-105' 
                            : 'bg-black/90 text-red-300 border-red-500/80'
                        }`}>
                          <span className="text-red-400 font-black">! TERLAMBAT:</span> {blip.label.split(' ')[0]} (+{blip.menitKeterlambatan}m)
                        </div>
                      </div>
                    ) : blip.isWarning ? (
                      /* WARNING / SEGERA KEMBALI BLIP (Flashing Amber Reticle) */
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-6 h-6 rounded-full bg-amber-500/30 animate-ping border border-amber-400" />
                        <div className={`w-4 h-4 rounded-md border-2 ${
                          isSelected ? 'border-cyan-300 bg-amber-950/90 scale-110' : 'border-amber-400 bg-amber-950/80'
                        } flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.8)]`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping" />
                        </div>

                        <div className={`absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-0.5 rounded-md border font-mono text-[9px] font-bold z-40 shadow-xl pointer-events-none transition-all ${
                          isSelected 
                            ? 'bg-amber-950 text-cyan-200 border-cyan-400 scale-105' 
                            : 'bg-black/90 text-amber-300 border-amber-500/80'
                        }`}>
                          <span className="text-amber-400 font-bold">SEGERA KEMBALI:</span> {blip.label.split(' ')[0]} (sisa {blip.sisaMenit}m)
                        </div>
                      </div>
                    ) : (
                      /* SAFE / ON-TIME SANTRI TARGET BLIP (Steady Cyan) */
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

              {/* EMPTY RADAR SCREEN OVERLAY IF ZERO TARGETS */}
              {visibleBlips.length === 0 && (
                <div className="absolute z-20 text-center px-4 py-2 rounded-xl bg-black/75 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] pointer-events-none">
                  <span className="block font-bold">0 TARGET DI LUAR PONDOK</span>
                  <span className="text-slate-400 text-[9px]">Perimeter Kamtib Steril & Aman</span>
                </div>
              )}

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
              Semua ({blips.length})
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
              <span>Terlambat ({threatCount})</span>
            </button>
            <button
              onClick={() => setFilterMode('warning_only')}
              className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                filterMode === 'warning_only'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Segera ({warningCount})</span>
            </button>
          </div>

          {/* Selected Target HUD Telemetry Card */}
          {selectedBlip ? (
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              selectedBlip.isThreat
                ? 'bg-gradient-to-b from-red-950/70 via-slate-900 to-slate-950 border-red-500/80 shadow-2xl glow-red'
                : selectedBlip.isWarning
                ? 'bg-gradient-to-b from-amber-950/70 via-slate-900 to-slate-950 border-amber-500/80 shadow-xl'
                : 'bg-gradient-to-b from-slate-900 via-slate-950 to-black border-cyan-500/40 shadow-xl'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                    selectedBlip.isThreat
                      ? 'bg-red-500 text-white animate-pulse'
                      : selectedBlip.isWarning
                      ? 'bg-amber-500 text-slate-950 animate-pulse'
                      : selectedBlip.statusKamtib === 'SEDANG DI LUAR'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  }`}>
                    {selectedBlip.statusKamtib}
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
                    <span className={`font-bold ${selectedBlip.isThreat ? 'text-red-400' : selectedBlip.isWarning ? 'text-amber-300' : 'text-slate-200'}`}>
                      {selectedBlip.jamKembali} WIB ({selectedBlip.tglKembali})
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-black/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Status Keterlambatan:</span>
                    <span className={`font-bold ${
                      selectedBlip.isThreat 
                        ? 'text-red-400 animate-pulse' 
                        : selectedBlip.isWarning 
                        ? 'text-amber-400' 
                        : 'text-emerald-400'
                    }`}>
                      {selectedBlip.isThreat 
                        ? `Terlambat ${selectedBlip.menitKeterlambatan} Mnt` 
                        : selectedBlip.isWarning
                        ? `Sisa ${selectedBlip.sisaMenit} Menit`
                        : selectedBlip.statusKamtib === 'MENUNGGU CHECK-OUT'
                        ? 'Menunggu Gerbang'
                        : 'Tepat Waktu'}
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

              {/* Action Buttons for Selected Target (Including Selesai Button) */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800 flex-wrap">
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
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white border border-red-400'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim WA</span>
                </button>

                {/* TOMBOL MUTASI: CATAT KELUAR GERBANG (JIKA MASIH MENUNGGU CHECK-OUT) */}
                {selectedBlip.statusKamtib === 'MENUNGGU CHECK-OUT' && (
                  <button
                    onClick={() => handleTandaiKeluar(selectedBlip.izin)}
                    className="w-full py-2.5 px-4 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border border-blue-400"
                  >
                    <DoorOpen className="w-4 h-4 text-white" />
                    <span>Catat Keluar Gerbang (Status: SEDANG DI LUAR)</span>
                  </button>
                )}

                {/* TOMBOL SELESAI / SANTRI KEMBALI */}
                <button
                  onClick={() => setSelesaiModalIzin(selectedBlip.izin)}
                  className="w-full py-2.5 px-4 rounded-xl font-mono font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-slate-950 border border-emerald-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Selesai / Konfirmasi Santri Kembali</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs font-mono">
              <Crosshair className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              {activePermits.length === 0
                ? 'Tidak ada target izin aktif pada radar saat ini (Semua santri berada di asrama).'
                : 'Pilih salah satu titik blip pada radar pemindai untuk mengunci telemetri santri.'}
            </div>
          )}

          {/* Quick Target Acquisition List */}
          <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest px-1">
              DAFTAR SASARAN DETEKSI TERAKHIR ({visibleBlips.length}):
            </p>
            {visibleBlips.length === 0 ? (
              <p className="text-xs font-mono text-slate-500 px-2 py-3 text-center bg-slate-950/40 rounded-xl">
                Nol target aktif pada radar pemindai
              </p>
            ) : (
              visibleBlips.map((blip) => {
                const isSelected = selectedBlip?.id === blip.id;
                return (
                  <div
                    key={blip.id}
                    onClick={() => setSelectedBlip(blip)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono cursor-pointer transition-all ${
                      blip.isThreat
                        ? 'bg-red-950/40 hover:bg-red-950/70 border-red-500/50 text-red-200'
                        : blip.isWarning
                        ? 'bg-amber-950/40 hover:bg-amber-950/70 border-amber-500/50 text-amber-200'
                        : isSelected
                        ? 'bg-cyan-950/50 border-cyan-400 text-cyan-200'
                        : 'bg-slate-950/80 hover:bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        blip.isThreat ? 'bg-red-500 animate-ping' : blip.isWarning ? 'bg-amber-400 animate-ping' : 'bg-cyan-400'
                      }`} />
                      <span className="font-bold truncate font-sans text-white">{blip.label}</span>
                      <span className="text-[10px] text-slate-400">{blip.kelas}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold ${
                        blip.isThreat ? 'text-red-400' : blip.isWarning ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {blip.isThreat 
                          ? `+${blip.menitKeterlambatan}m LATE` 
                          : blip.isWarning
                          ? `Sisa ${blip.sisaMenit}m`
                          : blip.jamKembali}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-bold">{blip.distanceKm}km</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* CONFIRMATION MODAL FOR "SELESAI / SANTRI KEMBALI" */}
      {selesaiModalIzin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-slate-950 border border-emerald-500/50 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h4 className="text-sm font-black uppercase tracking-wider font-mono">
                  Konfirmasi Kepulangan Santri (Selesai)
                </h4>
              </div>
              <button
                onClick={() => setSelesaiModalIzin(null)}
                className="w-7 h-7 rounded-lg bg-slate-900 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Santri:</span>
                <span className="font-bold text-white font-sans">{selesaiModalIzin.santriNama} ({selesaiModalIzin.santriKelas})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nomor Izin:</span>
                <span className="text-cyan-300 font-bold">{selesaiModalIzin.nomorIzin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jadwal Kembali:</span>
                <span className="text-amber-300 font-bold">{selesaiModalIzin.tglKembali} {selesaiModalIzin.jamKembali} WIB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waktu Aktual (WIB):</span>
                <span className="text-emerald-400 font-bold">{wibNow.dateStr} {wibNow.timeStr} WIB</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Menekan tombol konfirmasi akan mencatat jam kepulangan sebenarnya ke database pusat, menghitung ketertiban secara otomatis, dan memindahkan izin ke rekapitulasi riwayat (dihapus dari radar aktif).
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelesaiModalIzin(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmSelesai}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-mono font-black text-xs cursor-pointer shadow-lg"
              >
                Konfirmasi Selesai
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
