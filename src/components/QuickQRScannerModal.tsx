import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Upload,
  RefreshCw,
  SwitchCamera,
  GraduationCap,
  Check,
  Send,
  ScanLine,
  Keyboard,
  Clock,
  Loader2,
  X,
} from 'lucide-react';
import { Perizinan, UserAccount, Pelanggaran, Sanksi } from '../types';
import { storageService } from '../services/storageService';
import { WhatsAppTemplates, createWhatsAppUrl } from '../services/waService';
import { LaserScanLine, METALLIC_EASE } from './MotionPrimitives';

interface QuickQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onSuccessCheckin?: (izin: Perizinan, isLate: boolean) => void;
}

type ScanMode = 'camera' | 'file';

export const QuickQRScannerModal: React.FC<QuickQRScannerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccessCheckin,
}) => {
  const [scanMode, setScanMode] = useState<ScanMode>('camera');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isCameraRunning, setIsCameraRunning] = useState<boolean>(false);
  const [isStartingCamera, setIsStartingCamera] = useState<boolean>(false);
  const [isScanningFile, setIsScanningFile] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [fileError, setFileError] = useState<string>('');
  const [manualIdInput, setManualIdInput] = useState<string>('');

  const [scannerResult, setScannerResult] = useState<{
    type: 'izin' | 'sanksi' | 'not_found';
    alreadyReturned?: boolean;
    isLate?: boolean;
    minutesLate?: number;
    izin?: Perizinan;
    sanksi?: Sanksi;
    jamKembaliAktual?: string;
    message: string;
    rawScannedCode?: string;
  } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileQrCodeRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef<boolean>(false);
  const isHandlingResultRef = useRef<boolean>(false);

  const cameraViewportId = 'almaliki-qr-scanner-viewport';
  const fileViewportId = 'almaliki-qr-file-viewport';

  const playScanBeep = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

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
    } catch {
      // Ignore audio restriction errors
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([45, 30, 45]);
      }
    } catch {
      // Ignore vibration errors
    }
  }, []);

  const stopCameraScanner = useCallback(async () => {
    const scanner = html5QrCodeRef.current;
    if (!scanner) {
      setIsCameraRunning(false);
      return;
    }
    try {
      const state = scanner.getState();
      if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
        await scanner.stop();
      }
    } catch {
      // Ignore stop errors when camera never finished starting
    }
    try {
      scanner.clear();
    } catch {
      // Ignore clear errors if DOM already unmounted
    }
    html5QrCodeRef.current = null;
    if (isMountedRef.current) {
      setIsCameraRunning(false);
    }
  }, []);

  const processPermitReturn = useCallback(
    (targetPermit: Perizinan) => {
      const isStillOutOrPermitted =
        targetPermit.status === 'Sedang Keluar' ||
        targetPermit.status === 'Disetujui' ||
        targetPermit.status === 'Diajukan' ||
        targetPermit.status === 'Diverifikasi' ||
        (targetPermit.status === 'Terlambat' && !targetPermit.actualKembali);

      if (!isStillOutOrPermitted) {
        const recordedTime =
          targetPermit.waktuKembali ||
          targetPermit.actualKembali ||
          `${targetPermit.tglKembali} ${targetPermit.jamKembali} WIB`;

        setScannerResult({
          type: 'izin',
          alreadyReturned: true,
          isLate: Boolean(targetPermit.menitKeterlambatan && targetPermit.menitKeterlambatan > 0),
          minutesLate: targetPermit.menitKeterlambatan || 0,
          izin: targetPermit,
          jamKembaliAktual: recordedTime,
          message: `Data izin ini sudah tercatat kembali sebelumnya pada ${recordedTime}.`,
        });
        return;
      }

      const now = new Date();
      const timeOnlyStr =
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }) + ' WIB';
      const dateStr = now.toISOString().split('T')[0];
      const actualArrival = `${dateStr} ${timeOnlyStr}`;

      const deadlineString = `${targetPermit.tglKembali}T${targetPermit.jamKembali}:00`;
      const deadlineDate = new Date(deadlineString);
      const diffMs = now.getTime() - deadlineDate.getTime();
      const diffMinutes = !isNaN(deadlineDate.getTime()) ? Math.floor(diffMs / 60000) : 0;
      const isLate = diffMinutes > 0;

      const officerName = currentUser.nama || 'Petugas Keamanan';

      const updatedPermit: Perizinan = {
        ...targetPermit,
        status: 'Sudah Kembali',
        actualKembali: actualArrival,
        waktuKembali: actualArrival,
        petugasKembali: officerName,
        menitKeterlambatan: isLate ? diffMinutes : 0,
      };

      storageService.savePerizinan(
        updatedPermit,
        isLate
          ? `Santri kembali (terlambat ${diffMinutes} menit) via Scan QR Pos Gerbang`
          : 'Santri kembali tepat waktu via Scan QR Pos Gerbang'
      );

      storageService.addLog(
        'Pindai QR Kepulangan Santri',
        `Santri ${targetPermit.santriNama} (${targetPermit.santriNis}) kembali ke pondok pada ${actualArrival}. Petugas: ${officerName}.`,
        'gerbang'
      );

      if (isLate) {
        const pelanggaranBaru: Pelanggaran = {
          id: `pel_late_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          kodePelanggaran: `PEL-LATE-${Date.now().toString().slice(-4)}`,
          santriId: targetPermit.santriId,
          santriNama: targetPermit.santriNama,
          santriNis: targetPermit.santriNis,
          santriGender: targetPermit.santriGender,
          tanggal: dateStr,
          waktu: timeOnlyStr,
          tataTertibId: 'tt_004',
          jenisPelanggaran: `Terlambat kembali ke pondok dari ${targetPermit.jenisIzin} selama ${diffMinutes} menit (Batas: ${targetPermit.jamKembali} WIB).`,
          kategori: diffMinutes > 120 ? 'Sedang' : 'Ringan',
          poin: diffMinutes > 120 ? 10 : 5,
          kronologi: `Santri ${targetPermit.santriNama} (${targetPermit.santriNis}) terdeteksi scan QR masuk gerbang pada ${actualArrival} (terlambat ${diffMinutes} menit dari batas ${targetPermit.tglKembali} ${targetPermit.jamKembali} WIB).`,
          lokasi: 'Pos Gerbang Utama Al-Maliki',
          namaPetugasPelapor: officerName,
          statusVerifikasi: 'Terverifikasi',
        };
        storageService.savePelanggaran(
          pelanggaranBaru,
          'Insiden keterlambatan otomatis dicatat dari pemindaian QR surat izin'
        );

        storageService.addNotification({
          judul: `Santri Kembali (Terlambat ${diffMinutes} Menit): ${targetPermit.santriNama}`,
          pesan: `Santri telah kembali ke pondok pada ${timeOnlyStr} dan status izin diperbarui menjadi Kembali.`,
          tipe: 'warning',
          linkMenu: 'perizinan',
          noWaTujuan: targetPermit.noWaPenjemput,
          waPesanTemplate: WhatsAppTemplates.santriCheckIn(
            targetPermit,
            actualArrival,
            `Terlambat ${diffMinutes} Menit`
          ),
        });
      } else {
        storageService.addNotification({
          judul: `Santri Kembali Tepat Waktu: ${targetPermit.santriNama}`,
          pesan: `Santri telah kembali ke pondok dengan selamat pada ${timeOnlyStr}.`,
          tipe: 'success',
          linkMenu: 'perizinan',
          noWaTujuan: targetPermit.noWaPenjemput,
          waPesanTemplate: WhatsAppTemplates.santriCheckIn(
            targetPermit,
            actualArrival,
            'Tepat Waktu (Disiplin)'
          ),
        });
      }

      setScannerResult({
        type: 'izin',
        alreadyReturned: false,
        isLate,
        minutesLate: isLate ? diffMinutes : 0,
        izin: updatedPermit,
        jamKembaliAktual: timeOnlyStr,
        message: isLate
          ? `Status izin diperbarui menjadi Kembali (${actualArrival}). Catatan keterlambatan ${diffMinutes} menit ikut terekam.`
          : `Status izin diperbarui menjadi Kembali (${actualArrival}) tepat waktu.`,
      });

      if (onSuccessCheckin) {
        onSuccessCheckin(updatedPermit, isLate);
      }
    },
    [currentUser, onSuccessCheckin]
  );

  const handleCompleteSanksi = (sanksi: Sanksi) => {
    const updated: Sanksi = {
      ...sanksi,
      status: 'Selesai',
      tanggalAktualSelesai: new Date().toISOString().split('T')[0],
      catatanPembinaan: `${sanksi.catatanPembinaan ? sanksi.catatanPembinaan + ' · ' : ''}Takzir edukatif diverifikasi selesai via Scanner QR oleh ${currentUser.nama || 'Petugas'}.`,
    };
    storageService.saveSanksi(updated, 'Takzir edukatif diselesaikan via QR Scanner');
    setScannerResult({
      type: 'sanksi',
      sanksi: updated,
      message: `Takzir edukatif santri ${sanksi.santriNama} telah ditandai Selesai.`,
    });
  };

  const handleDecodedQR = useCallback(
    async (decodedText: string) => {
      const cleanText = decodedText.trim();
      if (!cleanText || isHandlingResultRef.current) return;

      isHandlingResultRef.current = true;
      playScanBeep();
      await stopCameraScanner();

      const currentPerizinan = storageService.getPerizinanList();
      const currentSanksi = storageService.getSanksiList();

      // 1. Pencarian utama wajib: String(item.id) === decodedText.trim()
      let targetPermit = currentPerizinan.find((item) => String(item.id) === cleanText);

      // 2. Fallback kompatibilitas jika QR/input berupa JSON atau Nomor Izin / NIS
      if (!targetPermit) {
        try {
          const parsed = JSON.parse(cleanText) as {
            id?: string;
            nomor?: string;
            nis?: string;
            dokumen?: string;
            kode?: string;
            arsipId?: string;
          };

          if (parsed.id) {
            targetPermit = currentPerizinan.find((item) => String(item.id) === String(parsed.id).trim());
          }
          if (!targetPermit && parsed.nomor) {
            targetPermit = currentPerizinan.find((item) => item.nomorIzin === parsed.nomor);
          }
          if (!targetPermit && parsed.nis) {
            targetPermit = currentPerizinan.find(
              (item) =>
                item.santriNis === parsed.nis &&
                (item.status === 'Sedang Keluar' ||
                  item.status === 'Disetujui' ||
                  item.status === 'Terlambat')
            );
          }

          if (!targetPermit && (parsed.dokumen?.includes('SANKSI') || parsed.kode?.startsWith('SNK/'))) {
            const targetSanksi = currentSanksi.find(
              (s) =>
                s.kodeSanksi === parsed.kode ||
                String(s.id) === String(parsed.arsipId) ||
                (parsed.nis && s.santriNis === parsed.nis)
            );
            if (targetSanksi) {
              setScannerResult({
                type: 'sanksi',
                sanksi: targetSanksi,
                message: `Berkas Sanksi Edukatif ditemukan untuk ${targetSanksi.santriNama} (${targetSanksi.santriNis}).`,
              });
              setManualIdInput('');
              return;
            }
          }
        } catch {
          // Bukan JSON — lanjut ke fallback teks biasa
        }
      }

      if (!targetPermit) {
        const lower = cleanText.toLowerCase();
        targetPermit = currentPerizinan.find(
          (item) =>
            String(item.id).toLowerCase() === lower ||
            item.nomorIzin.toLowerCase() === lower ||
            item.santriNis.toLowerCase() === lower
        );
      }

      if (targetPermit) {
        processPermitReturn(targetPermit);
        setManualIdInput('');
        return;
      }

      const targetSanksi = currentSanksi.find(
        (s) =>
          String(s.id) === cleanText ||
          s.kodeSanksi.toLowerCase() === cleanText.toLowerCase()
      );
      if (targetSanksi) {
        setScannerResult({
          type: 'sanksi',
          sanksi: targetSanksi,
          message: `Berkas Sanksi Edukatif ditemukan untuk ${targetSanksi.santriNama} (${targetSanksi.santriNis}).`,
        });
        setManualIdInput('');
        return;
      }

      setScannerResult({
        type: 'not_found',
        rawScannedCode: cleanText,
        message: `Kode QR "${cleanText}" terbaca, namun tidak ditemukan pada daftar data perizinan santri.`,
      });
      setManualIdInput('');
    },
    [playScanBeep, processPermitReturn, stopCameraScanner]
  );

  const startCameraScanner = useCallback(
    async (facing: 'environment' | 'user') => {
      setCameraError('');
      setIsStartingCamera(true);
      await stopCameraScanner();

      await new Promise((resolve) => setTimeout(resolve, 100));
      if (!isMountedRef.current) {
        setIsStartingCamera(false);
        return;
      }

      const container = document.getElementById(cameraViewportId);
      if (!container) {
        setIsStartingCamera(false);
        return;
      }

      try {
        const scanner = new Html5Qrcode(cameraViewportId, { verbose: false });
        html5QrCodeRef.current = scanner;

        const scanConfig = {
          fps: 15,
          aspectRatio: 1.0,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.max(180, Math.min(280, Math.floor(minEdge * 0.72)));
            return { width: size, height: size };
          },
        };

        const onScanSuccess = (decodedText: string) => {
          void handleDecodedQR(decodedText);
        };
        const onScanFailure = () => {
          // Frame tanpa QR diabaikan
        };

        let started = false;
        try {
          await scanner.start(
            { facingMode: facing },
            scanConfig,
            onScanSuccess,
            onScanFailure
          );
          started = true;
        } catch {
          try {
            await scanner.start(
              { facingMode: facing === 'environment' ? 'user' : 'environment' },
              scanConfig,
              onScanSuccess,
              onScanFailure
            );
            started = true;
          } catch {
            const devices = await Html5Qrcode.getCameras();
            if (devices && devices.length > 0) {
              const backCam =
                devices.find((d) => /back|rear|environment/i.test(d.label)) ||
                devices[devices.length - 1];
              await scanner.start(backCam.id, scanConfig, onScanSuccess, onScanFailure);
              started = true;
            }
          }
        }

        if (!started) {
          throw new Error('Perangkat kamera tidak merespons.');
        }

        if (isMountedRef.current) {
          setIsCameraRunning(true);
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (isMountedRef.current) {
          if (/permission|denied|notallowed/i.test(errMsg)) {
            setCameraError(
              'Izin kamera diblokir browser. Gunakan Cara 2 (Upload / Foto QR) di bawah atau izinkan akses kamera.'
            );
          } else if (/notfound|device|requested device/i.test(errMsg)) {
            setCameraError(
              'Kamera tidak terdeteksi di perangkat ini. Gunakan Cara 2 (Upload / Foto QR) atau Input Kode ID Manual di bawah.'
            );
          } else {
            setCameraError(`Kamera gagal dibuka (${errMsg}). Gunakan Cara 2 (Upload / Foto QR) di bawah.`);
          }
          setIsCameraRunning(false);
        }
      } finally {
        if (isMountedRef.current) {
          setIsStartingCamera(false);
        }
      }
    },
    [handleDecodedQR, stopCameraScanner]
  );

  // Cara 2: Upload / Foto QR menggunakan html5QrCode.scanFile(file, true)
  const handleFileQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFileError('');
    setScannerResult(null);
    isHandlingResultRef.current = false;
    setScanMode('file');
    setIsScanningFile(true);

    await stopCameraScanner();

    // Tunggu DOM #almaliki-qr-file-viewport ter-render
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      if (fileQrCodeRef.current) {
        try {
          fileQrCodeRef.current.clear();
        } catch {
          // ignore
        }
      }

      const fileScanner = new Html5Qrcode(fileViewportId, { verbose: false });
      fileQrCodeRef.current = fileScanner;

      const decodedText = await fileScanner.scanFile(file, true);
      await handleDecodedQR(decodedText);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFileError(
        `QR Code belum terbaca dari gambar tersebut (${msg}). Pastikan foto QR jelas, tidak terpotong, dan cukup terang.`
      );
    } finally {
      if (isMountedRef.current) {
        setIsScanningFile(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen) {
      isHandlingResultRef.current = false;
      setScannerResult(null);
      setFileError('');
      setCameraError('');
      setScanMode('camera');
      void startCameraScanner(cameraFacing);
    } else {
      void stopCameraScanner();
    }

    return () => {
      isMountedRef.current = false;
      void stopCameraScanner();
    };
  }, [isOpen, cameraFacing, startCameraScanner, stopCameraScanner]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleResetAndScanAgain = async () => {
    isHandlingResultRef.current = false;
    setScannerResult(null);
    setFileError('');
    setScanMode('camera');
    await startCameraScanner(cameraFacing);
  };

  const handleSwitchMode = async (nextMode: ScanMode) => {
    setScanMode(nextMode);
    setFileError('');
    if (nextMode === 'camera') {
      isHandlingResultRef.current = false;
      setScannerResult(null);
      await startCameraScanner(cameraFacing);
    } else {
      await stopCameraScanner();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: METALLIC_EASE }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.24, ease: METALLIC_EASE }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[94dvh] flex flex-col bg-[#06241B]/95 backdrop-blur-xl border border-emerald-400/30 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header Bar */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-emerald-500/25 bg-[#041A13]/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/35 text-[#10B981] shrink-0">
              <QrCode className="w-5 h-5 text-[#10B981]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white font-sans uppercase tracking-wide truncate">
                Pemindai QR Kepulangan Santri
              </h3>
              <p className="text-[10px] text-[#D1FAE5] font-mono truncate">
                Kamera Langsung &amp; Upload Foto QR (Android, iOS &amp; Laptop)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {scanMode === 'camera' && !scannerResult && (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                className="p-2 rounded-xl bg-emerald-950/75 hover:bg-emerald-900/75 text-[#D1FAE5] border border-emerald-500/30 cursor-pointer"
                title="Ganti Kamera Depan / Belakang"
              >
                <SwitchCamera className="w-4 h-4 text-[#10B981]" />
              </motion.button>
            )}
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-red-600/85 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer font-bold"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 text-xs">
          {/* LAYAR KONFIRMASI HIJAU BESAR: SANTRI TELAH KEMBALI */}
          {scannerResult && scannerResult.type === 'izin' && scannerResult.izin ? (
            <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 border-2 border-emerald-300 p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(16,185,129,0.45)] space-y-4">
              <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center mx-auto shadow-xl">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>

              <div className="space-y-1">
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-mono font-bold uppercase tracking-widest">
                  {scannerResult.alreadyReturned
                    ? 'STATUS SUDAH TERCATAT SEBELUMNYA'
                    : 'VERIFIKASI QR BERHASIL'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-tight pt-1">
                  SANTRI TELAH KEMBALI
                </h2>
              </div>

              <div className="bg-black/25 border border-white/25 rounded-2xl p-4 space-y-2">
                <p className="text-[11px] font-mono uppercase text-emerald-100/80">
                  Nama Santri
                </p>
                <p className="text-xl sm:text-2xl font-extrabold text-white">
                  {scannerResult.izin.santriNama}
                </p>
                <p className="text-xs font-mono text-emerald-100">
                  NIS: {scannerResult.izin.santriNis} · {scannerResult.izin.santriKelas}
                </p>

                <div className="pt-3 mt-2 border-t border-white/20 flex items-center justify-center gap-2 text-white">
                  <Clock className="w-4 h-4 text-emerald-200" />
                  <span className="text-xs font-mono uppercase text-emerald-100">Jam Kembali:</span>
                  <span className="text-base sm:text-lg font-black font-mono text-amber-200">
                    {scannerResult.jamKembaliAktual}
                  </span>
                </div>
              </div>

              {scannerResult.isLate && (
                <div className="px-3.5 py-2 rounded-xl bg-amber-950/75 border border-amber-300/60 text-amber-100 text-xs font-medium">
                  Catatan: Terlambat {scannerResult.minutesLate} menit dari batas jadwal (
                  {scannerResult.izin.jamKembali} WIB).
                </div>
              )}

              <p className="text-xs text-emerald-50/90 leading-relaxed">
                {scannerResult.message}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleResetAndScanAgain}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold text-xs inline-flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Pindai QR Berikutnya</span>
                </button>
                {scannerResult.izin.noWaPenjemput && (
                  <button
                    type="button"
                    onClick={() => {
                      const text = WhatsAppTemplates.santriCheckIn(
                        scannerResult.izin!,
                        scannerResult.izin!.waktuKembali ||
                          scannerResult.izin!.actualKembali ||
                          '',
                        scannerResult.isLate
                          ? `Terlambat ${scannerResult.minutesLate} Menit`
                          : 'Tepat Waktu'
                      );
                      window.open(
                        createWhatsAppUrl(scannerResult.izin!.noWaPenjemput, text),
                        '_blank'
                      );
                    }}
                    className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-emerald-950/70 hover:bg-emerald-950 text-white border border-white/30 font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Info WA Wali</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Result for Sanksi or Not Found */}
              {scannerResult && scannerResult.type === 'sanksi' && scannerResult.sanksi && (
                <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-100 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-mono uppercase text-amber-300 font-bold">
                          Berkas Sanksi Edukatif
                        </p>
                        <p className="text-sm font-bold text-white">
                          {scannerResult.sanksi.santriNama} ({scannerResult.sanksi.santriNis})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetAndScanAgain}
                      className="px-3 py-1.5 rounded-xl bg-white text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      Pindai Lagi
                    </button>
                  </div>
                  <p className="text-xs">{scannerResult.message}</p>
                  {scannerResult.sanksi.status !== 'Selesai' && (
                    <button
                      type="button"
                      onClick={() => scannerResult.sanksi && handleCompleteSanksi(scannerResult.sanksi)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Tandai Selesai</span>
                    </button>
                  )}
                </div>
              )}

              {scannerResult && scannerResult.type === 'not_found' && (
                <div className="p-4 rounded-2xl bg-amber-950/85 border border-amber-500 text-amber-100 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-mono uppercase font-bold text-amber-300">
                          Data Tidak Ditemukan
                        </p>
                        <p className="text-xs font-bold text-white">
                          ID: {scannerResult.rawScannedCode}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetAndScanAgain}
                      className="px-3 py-1.5 rounded-xl bg-white text-slate-950 font-bold text-xs cursor-pointer shrink-0"
                    >
                      Pindai Lagi
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed">{scannerResult.message}</p>
                </div>
              )}

              {/* Pemilih 2 Cara Pemindaian QR */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void handleSwitchMode('camera')}
                  className={`px-3 py-2.5 rounded-2xl font-bold text-xs inline-flex items-center justify-center gap-2 border cursor-pointer transition-all ${
                    scanMode === 'camera'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-lg'
                      : 'bg-[#041d13] text-emerald-200 border-emerald-800 hover:border-emerald-500/50'
                  }`}
                >
                  <Camera className="w-4 h-4 shrink-0" />
                  <span>Cara 1: Kamera Langsung</span>
                </button>

                <label
                  className={`px-3 py-2.5 rounded-2xl font-bold text-xs inline-flex items-center justify-center gap-2 border cursor-pointer transition-all ${
                    scanMode === 'file'
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg'
                      : 'bg-[#041d13] text-amber-300 border-amber-500/40 hover:border-amber-400'
                  }`}
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>Cara 2: Upload / Foto QR</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileQrUpload}
                    className="sr-only"
                  />
                </label>
              </div>

              {/* Cara 1: Kamera Langsung (Square Scanner Viewport) */}
              {scanMode === 'camera' && (
                <div className="relative mx-auto w-full max-w-[340px] aspect-square rounded-2xl overflow-hidden border-2 border-[#10B981]/50 bg-[#041A13] flex items-center justify-center shadow-inner">
                  <div id={cameraViewportId} className="w-full h-full relative" />

                  {isStartingCamera && (
                    <div className="absolute inset-0 bg-[#041A13]/90 flex flex-col items-center justify-center gap-2 z-10">
                      <Loader2 className="w-7 h-7 text-[#10B981] animate-spin" />
                      <span className="text-xs font-mono text-[#D1FAE5]">
                        Membuka kamera belakang...
                      </span>
                    </div>
                  )}

                  {!scannerResult && !cameraError && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                      <div className="w-56 h-56 relative flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-[#10B981] rounded-tl-xl" />
                        <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-[#10B981] rounded-tr-xl" />
                        <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-[#10B981] rounded-bl-xl" />
                        <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-[#10B981] rounded-br-xl" />
                        <LaserScanLine />
                        <div className="absolute -bottom-8 px-3 py-1 rounded-full bg-[#041A13]/90 border border-[#10B981]/50 text-[10px] text-[#D1FAE5] font-mono font-bold whitespace-nowrap flex items-center gap-1.5">
                          <ScanLine className="w-3 h-3 text-[#10B981]" />
                          <span>ARAHKAN KE QR SURAT IZIN</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {cameraError && (
                    <div className="absolute inset-0 p-5 bg-[#02100a]/95 flex flex-col items-center justify-center text-center space-y-3 z-20">
                      <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500 text-red-400">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-white">Kamera Tidak Aktif</p>
                      <p className="text-[11px] text-red-200 leading-relaxed">{cameraError}</p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => void startCameraScanner(cameraFacing)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Coba Lagi</span>
                        </button>
                        <label className="px-3.5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload / Foto QR</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileQrUpload}
                            className="sr-only"
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cara 2: Upload / Foto QR Viewport */}
              {scanMode === 'file' && (
                <div className="rounded-2xl border border-amber-500/40 bg-[#041d13] p-4 space-y-3 text-center">
                  <div
                    id={fileViewportId}
                    className="mx-auto max-w-[280px] min-h-[160px] rounded-xl overflow-hidden bg-[#02100a] border border-emerald-800 flex items-center justify-center"
                  />

                  {isScanningFile && (
                    <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-xs">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Membaca QR Code dari gambar...</span>
                    </div>
                  )}

                  {fileError && (
                    <div className="p-3 rounded-xl bg-red-950/85 border border-red-500/60 text-red-200 text-xs leading-relaxed">
                      {fileError}
                    </div>
                  )}

                  <label className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-extrabold text-xs inline-flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Pilih / Foto Ulang Gambar QR</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileQrUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
              )}
            </>
          )}

          {/* Jalan Pintas Darurat: Input Kode ID Manual di Paling Bawah */}
          <div className="p-3.5 bg-[#02100a]/90 border border-emerald-800 rounded-2xl space-y-2">
            <label
              htmlFor="manual-qr-id-input"
              className="flex items-center gap-1.5 text-emerald-200 font-bold uppercase text-[10px] tracking-wider font-mono"
            >
              <Keyboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Input Kode ID Manual (Jika Kertas QR Rusak)</span>
            </label>
            <div className="flex gap-2">
              <input
                id="manual-qr-id-input"
                type="text"
                placeholder="Masukkan ID Izin (contoh: iz_001)"
                value={manualIdInput}
                onChange={(e) => setManualIdInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleDecodedQR(manualIdInput);
                  }
                }}
                className="flex-1 px-3 py-2 bg-[#041d13] border border-emerald-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-emerald-400"
              />
              <button
                type="button"
                onClick={() => void handleDecodedQR(manualIdInput)}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-extrabold rounded-xl cursor-pointer shrink-0 text-xs"
              >
                Proses ID
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
};
