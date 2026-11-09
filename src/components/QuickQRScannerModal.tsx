import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  ScanLine, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  QrCode, 
  Clock, 
  DoorOpen, 
  UserCheck, 
  ArrowLeft,
  Check,
  Send,
  Sparkles
} from 'lucide-react';
import { Perizinan, Santri, UserAccount, Pelanggaran } from '../types';
import { storageService } from '../services/storageService';
import { WhatsAppTemplates, createWhatsAppUrl } from '../services/waService';

interface QuickQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onSuccessCheckin?: (izin: Perizinan, isLate: boolean) => void;
}

export const QuickQRScannerModal: React.FC<QuickQRScannerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccessCheckin,
}) => {
  const [manualInput, setManualInput] = useState<string>('');
  const [scannerResult, setScannerResult] = useState<{
    success: boolean;
    isLate: boolean;
    izin: Perizinan;
    minutesLate: number;
    message: string;
  } | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const perizinanList = storageService.getPerizinanList();
  const outsideList = perizinanList.filter(
    p => p.status === 'Sedang Keluar' || p.status === 'Terlambat'
  );

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle Camera activation
  useEffect(() => {
    if (isOpen && cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, cameraActive]);

  const startCamera = async () => {
    setCameraError('');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } else {
        setCameraError('Kamera tidak didukung oleh browser ini.');
      }
    } catch {
      setCameraError('Izin akses kamera ditolak atau kamera tidak ditemukan.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  if (!isOpen) return null;

  // Execute Check-in Verification from parsed permit
  const processCheckinPermit = (targetPermit: Perizinan) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const dateStr = now.toISOString().split('T')[0];
    const actualArrival = `${dateStr} ${timeStr}`;

    // Calculate tardiness:
    // Deadline:
    const deadlineString = `${targetPermit.tglKembali}T${targetPermit.jamKembali}:00`;
    const deadlineDate = new Date(deadlineString);
    const diffMs = now.getTime() - deadlineDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const isLate = diffMinutes > 0;

    const officerName = currentUser.nama || 'Petugas Pengurus Keamanan';

    // 1. Update Perizinan status
    const updatedPermit: Perizinan = {
      ...targetPermit,
      status: isLate ? 'Terlambat' : 'Sudah Kembali',
      actualKembali: actualArrival,
      petugasKembali: officerName,
      menitKeterlambatan: isLate ? diffMinutes : 0,
    };

    storageService.savePerizinan(updatedPermit, isLate ? `Kembali terlambat ${diffMinutes} menit` : 'Kembali tepat waktu (Selesai)');

    // 2. Log in central activity logs
    storageService.addLog(
      'Pindai QR Kepulangan Santri',
      `Santri ${targetPermit.santriNama} (${targetPermit.santriNis}) dipindai di pos gerbang. Status: ${isLate ? `Terlambat ${diffMinutes} menit` : 'Tepat Waktu (Selesai)'}. Petugas: ${officerName}`,
      'gerbang'
    );

    // 3. If LATE, AUTOMATICALLY create entry in Catatan Insiden Pelanggaran (pelanggaranList)
    if (isLate) {
      const pelanggaranBaru: Pelanggaran = {
        id: `pel_late_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        kodePelanggaran: `PEL-LATE-${Date.now().toString().slice(-4)}`,
        santriId: targetPermit.santriId,
        santriNama: targetPermit.santriNama,
        santriNis: targetPermit.santriNis,
        santriGender: targetPermit.santriGender,
        tanggal: dateStr,
        waktu: timeStr,
        tataTertibId: 'tt_004',
        jenisPelanggaran: `Terlambat kembali ke pondok dari ${targetPermit.jenisIzin} selama ${diffMinutes} menit (Jadwal: ${targetPermit.jamKembali} WIB).`,
        kategori: diffMinutes > 120 ? 'Sedang' : 'Ringan',
        poin: diffMinutes > 120 ? 10 : 5,
        kronologi: `Santri ${targetPermit.santriNama} (${targetPermit.santriNis}) keluar izin ${targetPermit.jenisIzin} tujuan ${targetPermit.tujuan}. Jadwal kepulangan maksimal ${targetPermit.tglKembali} pukul ${targetPermit.jamKembali} WIB, namun baru terdeteksi scan QR masuk gerbang pada ${actualArrival}. Terlambat ${diffMinutes} menit.`,
        lokasi: 'Pos Gerbang Utama Al-Maliki',
        namaPetugasPelapor: officerName,
        statusVerifikasi: 'Terverifikasi',
      };

      storageService.savePelanggaran(pelanggaranBaru, `Insiden keterlambatan otomatis dicatat dari pemindaian QR surat izin`);

      storageService.addNotification({
        judul: `⚠️ SANTRI TERLAMBAT: ${targetPermit.santriNama}`,
        pesan: `Santri terdeteksi terlambat ${diffMinutes} menit saat scan QR masuk gerbang. Berkas pelanggaran otomatis diterbitkan ke tab Catatan Pelanggaran.`,
        tipe: 'danger',
        linkMenu: 'pelanggaran',
        noWaTujuan: targetPermit.noWaPenjemput,
        waPesanTemplate: WhatsAppTemplates.santriCheckIn(targetPermit, actualArrival, `Terlambat ${diffMinutes} Menit`),
      });

      setScannerResult({
        success: true,
        isLate: true,
        izin: updatedPermit,
        minutesLate: diffMinutes,
        message: `PERINGATAN: Santri kembali TERLAMBAT ${diffMinutes} menit. Status surat diperbarui dan insiden otomatis masuk ke Tab Catatan Pelanggaran.`,
      });
    } else {
      // ON TIME
      storageService.addNotification({
        judul: `✅ Santri Kembali Tepat Waktu: ${targetPermit.santriNama}`,
        pesan: `Santri telah kembali ke pondok dengan selamat dan disiplin pada pukul ${timeStr}. Status izin resmi dinyatakan SELESAI dan terekap di pangkalan data perizinan.`,
        tipe: 'success',
        linkMenu: 'perizinan',
        noWaTujuan: targetPermit.noWaPenjemput,
        waPesanTemplate: WhatsAppTemplates.santriCheckIn(targetPermit, actualArrival, 'Tepat Waktu (Disiplin)'),
      });

      setScannerResult({
        success: true,
        isLate: false,
        izin: updatedPermit,
        minutesLate: 0,
        message: `ALHAMDULILLAH: Santri kembali TEPAT WAKTU. Status izin otomatis berubah menjadi SELESAI dan langsung terekap ke rekapan perizinan santri.`,
      });
    }

    if (onSuccessCheckin) {
      onSuccessCheckin(updatedPermit, isLate);
    }
  };

  // Parse QR String or Manual Input
  const handleScanInput = (rawText: string) => {
    if (!rawText.trim()) return;

    let targetPermit: Perizinan | undefined;

    // Try parsing as JSON first
    try {
      const parsed = JSON.parse(rawText);
      if (parsed.nomor) {
        targetPermit = perizinanList.find(p => p.nomorIzin === parsed.nomor);
      } else if (parsed.nis) {
        targetPermit = perizinanList.find(p => p.santriNis === parsed.nis && (p.status === 'Sedang Keluar' || p.status === 'Terlambat' || p.status === 'Disetujui'));
      }
    } catch {
      // Plain text search (nomor izin or NIS or ID)
      const q = rawText.trim().toLowerCase();
      targetPermit = perizinanList.find(p => 
        p.nomorIzin.toLowerCase().includes(q) ||
        p.santriNis.toLowerCase() === q ||
        p.id.toLowerCase() === q ||
        p.santriNama.toLowerCase().includes(q)
      );
    }

    if (!targetPermit) {
      alert(`Surat izin atau data santri "${rawText}" tidak ditemukan dalam pangkalan data perizinan aktif.`);
      return;
    }

    processCheckinPermit(targetPermit);
    setManualInput('');
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col metallic-glass-card border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden rainbow-active-border card-3d-floating"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 shadow-xs glow-cyan">
              <QrCode className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-sans uppercase tracking-wide flex items-center gap-2">
                Pemindai QR Surat Izin Santri
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Verifikasi kepulangan · Deteksi otomatis tepat waktu vs terlambat
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-7 h-7 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4 font-mono text-xs">
          
          {/* Result Alert if Scanned */}
          {scannerResult && (
            <div className={`p-4 rounded-2xl border flex flex-col gap-2 shadow-xl animate-in zoom-in-95 duration-200 ${
              scannerResult.isLate 
                ? 'bg-red-950/80 border-red-500 text-red-100 glow-red' 
                : 'bg-emerald-950/80 border-emerald-500 text-emerald-100 glow-cyan'
            }`}>
              <div className="flex items-center gap-2.5">
                {scannerResult.isLate ? (
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold uppercase tracking-wider text-[11px] block">
                    {scannerResult.isLate ? 'KEDATANGAN TERLAMBAT' : 'KEDATANGAN TEPAT WAKTU (SELESAI)'}
                  </span>
                  <span className="text-white font-bold font-sans text-sm">
                    {scannerResult.izin.santriNama} ({scannerResult.izin.santriNis})
                  </span>
                </div>
              </div>

              <p className="text-[11px] leading-relaxed pt-1 border-t border-slate-700/60 font-sans">
                {scannerResult.message}
              </p>

              <div className="flex items-center justify-between pt-1 text-[10px]">
                <span className="text-slate-300">
                  Waktu Kembali: <strong className="text-white">{scannerResult.izin.actualKembali}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setScannerResult(null)}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  Pindai Santri Lain
                </button>
              </div>
            </div>
          )}

          {/* Camera Scanner Viewfinder */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center shadow-inner">
            {cameraActive ? (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover" 
                />
                {/* Laser Reticle Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-cyan-400/80 rounded-2xl relative shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                    <span className="absolute -top-6 left-0 text-[9px] font-bold text-cyan-300 uppercase tracking-widest">
                      ARAHKAN QR SURAT KE KOTAK
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-cyan-400 shadow-md">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-bold text-white uppercase tracking-wider text-xs font-sans">
                    Kamera Pemindai QR
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Aktifkan kamera smartphone atau webcam laptop untuk memindai langsung QR Code pada surat
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCameraActive(true)}
                  className="tactile-interactive inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 rounded-xl cursor-pointer shadow-md"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-950" />
                  <span>Aktifkan Kamera Pemindai</span>
                </button>
              </div>
            )}

            {cameraActive && (
              <button
                type="button"
                onClick={() => setCameraActive(false)}
                className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/80 text-slate-300 text-[10px] border border-slate-700 hover:text-white cursor-pointer"
              >
                Matikan Kamera
              </button>
            )}

            {cameraError && (
              <div className="absolute bottom-2 inset-x-2 p-2 bg-red-950/90 border border-red-500 text-red-200 text-[10px] text-center rounded-xl">
                {cameraError}
              </div>
            )}
          </div>

          {/* Manual Input or Barcode Gun Input */}
          <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-2">
            <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider">
              Input Nomor Izin / NIS Santri / Barcode Scanner:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Misal: IZIN/MALIKI/2026/XI/001 atau NIS: 20240182"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleScanInput(manualInput);
                  }
                }}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => handleScanInput(manualInput)}
                className="tactile-interactive px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow-md shrink-0"
              >
                Pindai Masuk
              </button>
            </div>
          </div>

          {/* Quick Simulation List of Santri Currently Outside */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Santri yang Sedang di Luar ({outsideList.length}) · Klik Pindai Cepat:
              </span>
              <span className="text-[9px] text-cyan-400">Simulasi Instan</span>
            </div>

            {outsideList.length === 0 ? (
              <p className="text-[11px] text-slate-500 py-2 text-center bg-slate-900/60 rounded-xl border border-slate-800">
                Tidak ada santri yang sedang berstatus di luar pondok saat ini.
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {outsideList.map((izin) => (
                  <div
                    key={izin.id}
                    className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate font-sans text-xs">{izin.santriNama}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        NIS: <span className="text-cyan-300">{izin.santriNis}</span> · Batas: <span className="text-amber-300 font-bold">{izin.jamKembali} WIB</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => processCheckinPermit(izin)}
                      className={`tactile-interactive px-2.5 py-1.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer shadow-xs shrink-0 flex items-center gap-1 ${
                        izin.status === 'Terlambat'
                          ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      <ScanLine className="w-3 h-3" />
                      <span>{izin.status === 'Terlambat' ? 'Scan (Terlambat)' : 'Scan Masuk'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400">
          <span>Tekan ESC untuk menutup pemindai</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
