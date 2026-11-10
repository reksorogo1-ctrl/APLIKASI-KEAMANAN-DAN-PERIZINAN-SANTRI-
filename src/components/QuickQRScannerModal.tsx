import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
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
  Sparkles,
  RefreshCw,
  SwitchCamera,
  GraduationCap,
  ShieldCheck,
  FileCheck2,
  Calendar
} from 'lucide-react';
import { Perizinan, Santri, UserAccount, Pelanggaran, Sanksi } from '../types';
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
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isCameraRunning, setIsCameraRunning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [scanFlash, setScanFlash] = useState<boolean>(false);
  const [isProcessingScan, setIsProcessingScan] = useState<boolean>(false);
  
  // Results
  const [scannerResult, setScannerResult] = useState<{
    type: 'izin' | 'sanksi' | 'not_found';
    success: boolean;
    isLate?: boolean;
    izin?: Perizinan;
    sanksi?: Sanksi;
    minutesLate?: number;
    message: string;
    rawScannedCode?: string;
  } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'almaliki-qr-scanner-viewport';

  const perizinanList = storageService.getPerizinanList();
  const sanksiList = storageService.getSanksiList();
  const outsideList = perizinanList.filter(
    p => p.status === 'Sedang Keluar' || p.status === 'Terlambat'
  );

  // Play crisp acoustic confirmation chime on QR code detection
  const playScanBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Tone 1 (E6 - 1318Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1318, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.08);

      // Tone 2 (A6 - 1760Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now + 0.08);
      gain2.gain.setValueAtTime(0.18, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.22);
    } catch {}

    // Tactile haptic pulse on mobile devices
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
      }
    } catch {}
  }, []);

  // Process Surat Izin Check-in Verification
  const processCheckinPermit = useCallback((targetPermit: Perizinan) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    const dateStr = now.toISOString().split('T')[0];
    const actualArrival = `${dateStr} ${timeStr}`;

    // Calculate tardiness:
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
        type: 'izin',
        success: true,
        isLate: true,
        izin: updatedPermit,
        minutesLate: diffMinutes,
        message: `PERINGATAN: Santri kembali TERLAMBAT ${diffMinutes} menit. Data kepulangan tersimpan dan insiden keterlambatan otomatis masuk ke Tab Catatan Pelanggaran Admin & Pengurus.`,
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
        type: 'izin',
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
  }, [currentUser, onSuccessCheckin]);

  // Process Surat Sanksi verification
  const processSanksiVerification = useCallback((targetSanksi: Sanksi) => {
    setScannerResult({
      type: 'sanksi',
      success: true,
      sanksi: targetSanksi,
      message: `BERKAS RESMI SANKSI EDUKATIF DITEMUKAN: ${targetSanksi.santriNama} (${targetSanksi.santriNis}). Pelanggaran: ${targetSanksi.jenisPelanggaran}. Bentuk Sanksi: ${targetSanksi.bentukSanksi}. Status: ${targetSanksi.status}.`,
    });
  }, []);

  // Complete Sanksi from Scanner
  const handleCompleteSanksi = (sanksi: Sanksi) => {
    const updated: Sanksi = {
      ...sanksi,
      status: 'Selesai',
      tanggalAktualSelesai: new Date().toISOString().split('T')[0],
      catatanPembinaan: `${sanksi.catatanPembinaan ? sanksi.catatanPembinaan + ' · ' : ''}Takzir edukatif telah disetorkan dan diverifikasi selesai melalui Scanner Pos Keamanan oleh ${currentUser.nama || 'Petugas'}.`,
    };
    storageService.saveSanksi(updated, 'Takzir edukatif diselesaikan via QR Scanner');
    storageService.addLog(
      'Penyelesaian Takzir Sanksi',
      `Sanksi ${sanksi.kodeSanksi} santri ${sanksi.santriNama} diverifikasi SELESAI via scanner pos keamanan.`,
      'gerbang'
    );
    setScannerResult({
      type: 'sanksi',
      success: true,
      sanksi: updated,
      message: `TAKDIR SELESAI: Santri ${sanksi.santriNama} telah menuntaskan sanksi edukatif. Status berkas resmi dinyatakan Bebas Takzir / Selesai.`,
    });
  };

  // Parse Raw QR Code Content
  const handleDecodedQR = useCallback((rawText: string) => {
    if (!rawText || !rawText.trim() || isProcessingScan) return;
    
    setIsProcessingScan(true);
    playScanBeep();
    setScanFlash(true);
    setTimeout(() => setScanFlash(false), 700);

    // Pause html5-qrcode scanner to prevent duplicate triggers
    if (html5QrCodeRef.current && html5QrCodeRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
      try {
        html5QrCodeRef.current.pause(true);
      } catch {}
    }

    const currentPerizinan = storageService.getPerizinanList();
    const currentSanksi = storageService.getSanksiList();

    let isHandled = false;

    // 1. Try JSON parsing
    try {
      const parsed = JSON.parse(rawText);

      // Check if it's a Surat Sanksi
      if (parsed.dokumen && parsed.dokumen.includes('SANKSI') || parsed.kode?.startsWith('SNK/')) {
        const targetSanksi = currentSanksi.find(s => 
          s.kodeSanksi === parsed.kode ||
          s.id === parsed.arsipId ||
          (parsed.nis && s.santriNis === parsed.nis)
        );
        if (targetSanksi) {
          processSanksiVerification(targetSanksi);
          isHandled = true;
        }
      }

      // Check if it's a Surat Izin
      if (!isHandled && (parsed.nomor || parsed.nis || parsed.santri)) {
        let targetPermit = currentPerizinan.find(p => p.nomorIzin === parsed.nomor);
        if (!targetPermit && parsed.nis) {
          targetPermit = currentPerizinan.find(p => 
            p.santriNis === parsed.nis && (p.status === 'Sedang Keluar' || p.status === 'Terlambat' || p.status === 'Disetujui')
          );
        }
        if (targetPermit) {
          processCheckinPermit(targetPermit);
          isHandled = true;
        }
      }
    } catch {
      // Non-JSON plain text fallback
    }

    // 2. Plain text / Barcode lookup
    if (!isHandled) {
      const q = rawText.trim().toLowerCase();
      
      // Look for permit
      const targetPermit = currentPerizinan.find(p => 
        p.nomorIzin.toLowerCase() === q ||
        p.santriNis.toLowerCase() === q ||
        p.id.toLowerCase() === q ||
        p.santriNama.toLowerCase().includes(q)
      );

      if (targetPermit) {
        processCheckinPermit(targetPermit);
        isHandled = true;
      } else {
        // Look for sanksi
        const targetSanksi = currentSanksi.find(s => 
          s.kodeSanksi.toLowerCase() === q ||
          s.santriNis.toLowerCase() === q ||
          s.id.toLowerCase() === q ||
          s.santriNama.toLowerCase().includes(q)
        );
        if (targetSanksi) {
          processSanksiVerification(targetSanksi);
          isHandled = true;
        }
      }
    }

    // 3. Not Found in Active Database
    if (!isHandled) {
      setScannerResult({
        type: 'not_found',
        success: false,
        rawScannedCode: rawText,
        message: `QR Code terdeteksi (${rawText.slice(0, 45)}${rawText.length > 45 ? '...' : ''}), namun tidak terdaftar dalam pangkalan data perizinan maupun sanksi aktif.`,
      });
    }

    setManualInput('');
  }, [isProcessingScan, playScanBeep, processCheckinPermit, processSanksiVerification]);

  // Stop camera tracks cleanly
  const stopScannerCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Stopping scanner:', err);
      } finally {
        setIsCameraRunning(false);
      }
    }
  }, []);

  // Start continuous camera scanning automatically
  const startScannerCamera = useCallback(async (facing: 'environment' | 'user') => {
    setCameraError('');
    setIsCameraRunning(false);

    // Stop previous instance if any
    await stopScannerCamera();

    // Small timeout to allow DOM container to settle
    await new Promise(resolve => setTimeout(resolve, 80));

    const element = document.getElementById(scannerContainerId);
    if (!element) return;

    try {
      const scanner = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = scanner;

      const scanConfig = {
        fps: 20, // High frame rate for instant, snappy detection
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight);
          const boxSize = Math.floor(edge * 0.75);
          return {
            width: Math.max(boxSize, 220),
            height: Math.max(boxSize, 220),
          };
        },
        aspectRatio: 1.0,
      };

      const onScanSuccess = (decodedText: string) => {
        handleDecodedQR(decodedText);
      };

      const onScanError = () => {
        // Continuous scan loop frame-by-frame; no log needed for idle frames
      };

      // Try prioritized facing mode (rear camera first)
      try {
        await scanner.start(
          { facingMode: { ideal: facing } },
          scanConfig,
          onScanSuccess,
          onScanError
        );
        setIsCameraRunning(true);
      } catch {
        // Fallback to user facing / default webcam without specific ideal environment constraints
        await scanner.start(
          { facingMode: 'user' },
          scanConfig,
          onScanSuccess,
          onScanError
        );
        setIsCameraRunning(true);
      }
    } catch (err: unknown) {
      console.error('Camera start error:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('denied')) {
        setCameraError('Izin akses kamera ditolak. Mohon izinkan akses kamera di ikon gembok pada browser Anda.');
      } else if (errMsg.toLowerCase().includes('notfound') || errMsg.toLowerCase().includes('devices')) {
        setCameraError('Perangkat kamera tidak ditemukan. Gunakan input manual nomor izin di bawah.');
      } else {
        setCameraError('Gagal mengaktifkan kamera. Pastikan browser mendukung kamera atau gunakan input manual.');
      }
      setIsCameraRunning(false);
    }
  }, [handleDecodedQR, stopScannerCamera]);

  // Auto-Start camera as soon as modal opens, clean stop when closed
  useEffect(() => {
    if (isOpen) {
      setScannerResult(null);
      setIsProcessingScan(false);
      startScannerCamera(cameraFacing);
    } else {
      stopScannerCamera();
    }

    return () => {
      stopScannerCamera();
    };
  }, [isOpen, cameraFacing, startScannerCamera, stopScannerCamera]);

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

  // Resume camera scanning after viewing a result
  const handleResumeScanning = async () => {
    setScannerResult(null);
    setIsProcessingScan(false);

    if (html5QrCodeRef.current) {
      const state = html5QrCodeRef.current.getState();
      if (state === Html5QrcodeScannerState.PAUSED) {
        try {
          html5QrCodeRef.current.resume();
          return;
        } catch {}
      }
    }

    // Otherwise restart cleanly
    await startScannerCamera(cameraFacing);
  };

  // Toggle Camera Front / Back
  const handleToggleCamera = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[92vh] flex flex-col metallic-glass-card border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden rainbow-active-border card-3d-floating"
      >
        {/* Header Bar */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 shadow-xs glow-cyan">
              <QrCode className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-sans uppercase tracking-wide flex items-center gap-2">
                Pemindai QR Real-Time
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Deteksi otomatis cepat · Surat Izin & Sanksi Santri
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Camera Switch Button */}
            <button
              type="button"
              onClick={handleToggleCamera}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
              title={`Ganti kamera (${cameraFacing === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'})`}
            >
              <SwitchCamera className="w-4 h-4 text-cyan-400" />
            </button>
            <button 
              onClick={onClose} 
              className="w-7 h-7 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 font-mono text-xs">
          
          {/* Result Alert Card when Scanned */}
          {scannerResult && (
            <div className={`p-4 rounded-2xl border flex flex-col gap-2.5 shadow-2xl animate-in zoom-in-95 duration-200 ${
              scannerResult.type === 'not_found'
                ? 'bg-amber-950/80 border-amber-500 text-amber-100 glow-amber'
                : scannerResult.isLate 
                  ? 'bg-red-950/90 border-red-500 text-red-100 glow-red' 
                  : 'bg-emerald-950/90 border-emerald-500 text-emerald-100 glow-cyan'
            }`}>
              
              {/* Header result row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {scannerResult.type === 'not_found' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  ) : scannerResult.type === 'sanksi' ? (
                    <GraduationCap className="w-5 h-5 text-amber-400 shrink-0" />
                  ) : scannerResult.isLate ? (
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[10px] block">
                      {scannerResult.type === 'not_found' 
                        ? 'DOKUMEN TIDAK TERDAFTAR'
                        : scannerResult.type === 'sanksi'
                          ? 'BERKAS SANKSI EDUKATIF TERVERIFIKASI'
                          : scannerResult.isLate 
                            ? 'KEDATANGAN TERLAMBAT (TERCATAT INSIDEN)' 
                            : 'KEDATANGAN TEPAT WAKTU (SELESAI)'}
                    </span>
                    <span className="text-white font-bold font-sans text-sm block">
                      {scannerResult.izin 
                        ? `${scannerResult.izin.santriNama} (${scannerResult.izin.santriNis})`
                        : scannerResult.sanksi 
                          ? `${scannerResult.sanksi.santriNama} (${scannerResult.sanksi.santriNis})`
                          : 'Arsip Tidak Ditemukan'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResumeScanning}
                  className="tactile-interactive inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-slate-950 font-bold text-xs cursor-pointer shadow-md hover:bg-slate-100 shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Pindai Lagi</span>
                </button>
              </div>

              {/* Message text */}
              <p className="text-[11px] leading-relaxed pt-1.5 border-t border-white/15 font-sans">
                {scannerResult.message}
              </p>

              {/* Sanksi specific actions */}
              {scannerResult.sanksi && (
                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-300">
                    Batas: <strong className="text-amber-300">{scannerResult.sanksi.batasMaksimal}</strong>
                  </span>
                  {scannerResult.sanksi.status !== 'Selesai' && (
                    <button
                      type="button"
                      onClick={() => scannerResult.sanksi && handleCompleteSanksi(scannerResult.sanksi)}
                      className="tactile-interactive inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Tandai Selesai / Bebas Takzir</span>
                    </button>
                  )}
                </div>
              )}

              {/* Izin specific row */}
              {scannerResult.izin && (
                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <span className="text-slate-300">
                    Waktu Scan Masuk: <strong className="text-white">{scannerResult.izin.actualKembali}</strong>
                  </span>
                  {scannerResult.izin.noWaPenjemput && (
                    <button
                      type="button"
                      onClick={() => {
                        const text = WhatsAppTemplates.santriCheckIn(
                          scannerResult.izin!,
                          scannerResult.izin!.actualKembali || '',
                          scannerResult.isLate ? `Terlambat ${scannerResult.minutesLate} Menit` : 'Tepat Waktu'
                        );
                        window.open(createWhatsAppUrl(scannerResult.izin!.noWaPenjemput, text), '_blank');
                      }}
                      className="inline-flex items-center gap-1 text-emerald-300 hover:text-emerald-200 underline cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Kirim Info WA Wali</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          )}

          {/* High-Performance Real-Time Camera Viewport */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex items-center justify-center shadow-inner">
            
            {/* Target Viewport Container for Html5Qrcode */}
            <div 
              id={scannerContainerId} 
              className={`w-full h-full relative ${scanFlash ? 'ring-4 ring-emerald-400 ring-inset glow-cyan' : ''}`}
            />

            {/* Tactical Laser & Corner Brackets Overlay (Active while camera is scanning) */}
            {isCameraRunning && !scannerResult && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                
                {/* Visual reticle box */}
                <div className="w-48 h-48 sm:w-56 sm:h-56 relative flex items-center justify-center">
                  
                  {/* 4 Corner L-Brackets */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg shadow-[0_0_8px_#22d3ee]" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg shadow-[0_0_8px_#22d3ee]" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg shadow-[0_0_8px_#22d3ee]" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg shadow-[0_0_8px_#22d3ee]" />

                  {/* High-speed scanning laser line */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-[0_0_12px_#06b6d4]" />

                  {/* Realtime Detection Status Badge */}
                  <div className="absolute -bottom-8 px-3 py-1 rounded-full bg-slate-950/90 border border-cyan-500/50 text-[10px] text-cyan-300 font-mono font-bold tracking-wider shadow-lg flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>KAMERA AKTIF · MENUNGGU QR CODE</span>
                  </div>
                </div>

              </div>
            )}

            {/* Flash Detection Notification */}
            {scanFlash && (
              <div className="absolute inset-0 bg-emerald-500/25 flex items-center justify-center z-20 pointer-events-none transition-opacity duration-300">
                <div className="px-4 py-2 rounded-2xl bg-emerald-950 border border-emerald-400 text-emerald-200 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl animate-in zoom-in-95">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>QR CODE BERHASIL TERDETEKSI!</span>
                </div>
              </div>
            )}

            {/* Camera Error / Fallback State */}
            {cameraError && (
              <div className="absolute inset-0 p-5 bg-slate-950/95 flex flex-col items-center justify-center text-center space-y-3 z-20">
                <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500 text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <p className="font-bold text-white text-xs font-sans">Kamera Belum Dapat Diakses</p>
                  <p className="text-[10px] text-red-300 leading-normal">{cameraError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => startScannerCamera(cameraFacing)}
                  className="tactile-interactive inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Coba Aktifkan Ulang</span>
                </button>
              </div>
            )}

          </div>

          {/* Manual Input or Barcode Scanner Gun */}
          <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-2">
            <label className="block text-slate-300 font-bold uppercase text-[10px] tracking-wider">
              Input Nomor Izin / Nomor Sanksi / NIS Santri / Barcode Gun:
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
                    handleDecodedQR(manualInput);
                  }
                }}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => handleDecodedQR(manualInput)}
                className="tactile-interactive px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold rounded-xl cursor-pointer shadow-md shrink-0"
              >
                Proses
              </button>
            </div>
          </div>

          {/* Quick Simulation List of Santri Currently Outside */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Santri yang Sedang di Luar ({outsideList.length}) · Klik Pindai Cepat:
              </span>
              <span className="text-[9px] text-cyan-400 font-bold">Simulasi Instan</span>
            </div>

            {outsideList.length === 0 ? (
              <p className="text-[11px] text-slate-500 py-2.5 text-center bg-slate-900/60 rounded-xl border border-slate-800 font-sans">
                Tidak ada santri yang sedang berstatus di luar pondok saat ini.
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
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

        {/* Footer Bar */}
        <div className="shrink-0 px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400">
          <span>Arahkan kamera ke QR Code surat · Tekan ESC untuk menutup</span>
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

  return createPortal(modalContent, document.body);
};
