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
  ScanLine,
  Keyboard,
  Clock,
  Loader2,
  PackageCheck,
  X,
} from 'lucide-react';
import { PeminjamanPerlengkapan, UserAccount } from '../types';
import {
  formatWaktuIndonesiaNow,
  updateStatusPeminjamanPerlengkapan,
} from '../services/peminjamanPerlengkapanService';
import { storageService } from '../services/storageService';
import { LaserScanLine, METALLIC_EASE } from './MotionPrimitives';

interface ScanQRPengembalianModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  peminjamanList: PeminjamanPerlengkapan[];
  onSuccessReturned?: (item: PeminjamanPerlengkapan) => void;
}

type ScanMode = 'camera' | 'file';

export const ScanQRPengembalianModal: React.FC<ScanQRPengembalianModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  peminjamanList,
  onSuccessReturned,
}) => {
  const [scanMode, setScanMode] = useState<ScanMode>('camera');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isScanningFile, setIsScanningFile] = useState(false);
  const [isProcessingUpdate, setIsProcessingUpdate] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [fileError, setFileError] = useState('');
  const [manualIdInput, setManualIdInput] = useState('');

  const [scanResult, setScanResult] = useState<{
    status: 'returned_now' | 'already_returned' | 'not_approved' | 'not_found' | 'error';
    item?: PeminjamanPerlengkapan;
    waktuKembali?: string;
    message: string;
    rawScannedCode?: string;
  } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileQrCodeRef = useRef<Html5Qrcode | null>(null);
  const isMountedRef = useRef(false);
  const isHandlingResultRef = useRef(false);
  const peminjamanListRef = useRef<PeminjamanPerlengkapan[]>(peminjamanList);

  useEffect(() => {
    peminjamanListRef.current = peminjamanList;
  }, [peminjamanList]);

  const cameraViewportId = 'perlengkapan-qr-scanner-viewport';
  const fileViewportId = 'perlengkapan-qr-file-viewport';

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
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.24);
    } catch {
      // Ignore audio errors
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([45, 30, 60]);
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
      if (
        state === Html5QrcodeScannerState.SCANNING ||
        state === Html5QrcodeScannerState.PAUSED
      ) {
        await scanner.stop();
      }
    } catch {
      // ignore
    }
    try {
      scanner.clear();
    } catch {
      // ignore
    }
    html5QrCodeRef.current = null;
    if (isMountedRef.current) {
      setIsCameraRunning(false);
    }
  }, []);

  const handleDecodedQR = useCallback(
    async (decodedText: string) => {
      const cleanText = decodedText.trim();
      if (!cleanText || isHandlingResultRef.current) return;

      isHandlingResultRef.current = true;
      playScanBeep();
      await stopCameraScanner();

      const currentList = peminjamanListRef.current;
      let target = currentList.find((item) => String(item.id) === cleanText);

      if (!target) {
        try {
          const parsed = JSON.parse(cleanText) as { id?: string; nomorSurat?: string };
          if (parsed.id) {
            target = currentList.find((item) => String(item.id) === String(parsed.id).trim());
          }
          if (!target && parsed.nomorSurat) {
            target = currentList.find(
              (item) => item.nomorSurat.toLowerCase() === parsed.nomorSurat!.toLowerCase()
            );
          }
        } catch {
          // ignore non-JSON
        }
      }

      if (!target) {
        const lower = cleanText.toLowerCase();
        target = currentList.find(
          (item) =>
            String(item.id).toLowerCase() === lower ||
            item.nomorSurat.toLowerCase() === lower
        );
      }

      if (!target) {
        setScanResult({
          status: 'not_found',
          rawScannedCode: cleanText,
          message: `Kode QR "${cleanText}" terbaca, namun tidak ditemukan pada daftar peminjaman barang perlengkapan.`,
        });
        setManualIdInput('');
        return;
      }

      if (target.status === 'Sudah Dikembalikan') {
        setScanResult({
          status: 'already_returned',
          item: target,
          waktuKembali: target.waktuKembali || '-',
          message: `Peminjaman ini sudah tercatat dikembalikan sebelumnya pada ${
            target.waktuKembali || '-'
          }.`,
        });
        setManualIdInput('');
        return;
      }

      if (target.status !== 'Disetujui') {
        setScanResult({
          status: 'not_approved',
          item: target,
          message: `Pengajuan peminjaman atas nama ${target.namaPeminjam} saat ini berstatus "${target.status}" dan belum berstatus Disetujui Ketua Pondok.`,
        });
        setManualIdInput('');
        return;
      }

      setIsProcessingUpdate(true);
      try {
        const waktuKembali = formatWaktuIndonesiaNow();
        const petugasNama = currentUser.nama || 'Petugas Perlengkapan';

        await updateStatusPeminjamanPerlengkapan(target.id, {
          status: 'Sudah Dikembalikan',
          waktuKembali,
          petugasPengembalian: petugasNama,
        });

        const updatedItem: PeminjamanPerlengkapan = {
          ...target,
          status: 'Sudah Dikembalikan',
          waktuKembali,
          petugasPengembalian: petugasNama,
        };

        storageService.addLog(
          'Scan QR Pengembalian Perlengkapan',
          `Peminjaman ${target.nomorSurat} atas nama ${target.namaPeminjam} (${target.daftarBarang.length} jenis barang) telah dikembalikan pada ${waktuKembali}. Petugas: ${petugasNama}.`,
          'admin'
        );

        setScanResult({
          status: 'returned_now',
          item: updatedItem,
          waktuKembali,
          message: `Status peminjaman berhasil diperbarui menjadi Sudah Dikembalikan secara real-time.`,
        });
        setManualIdInput('');
        onSuccessReturned?.(updatedItem);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setScanResult({
          status: 'error',
          item: target,
          message: `Gagal menyimpan pengembalian ke Firebase: ${errMsg}`,
        });
      } finally {
        if (isMountedRef.current) {
          setIsProcessingUpdate(false);
        }
      }
    },
    [currentUser.nama, onSuccessReturned, playScanBeep, stopCameraScanner]
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
        const onScanFailure = () => {};

        let started = false;
        try {
          await scanner.start({ facingMode: facing }, scanConfig, onScanSuccess, onScanFailure);
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
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        if (isMountedRef.current) {
          if (/permission|denied|notallowed/i.test(errMsg)) {
            setCameraError(
              'Izin kamera diblokir browser. Gunakan Cara 2 (Upload / Foto QR) atau izinkan kamera.'
            );
          } else if (/notfound|device|requested device/i.test(errMsg)) {
            setCameraError(
              'Kamera tidak terdeteksi di perangkat ini. Gunakan Cara 2 (Upload / Foto QR) atau Input Kode ID Manual.'
            );
          } else {
            setCameraError(`Kamera gagal dibuka (${errMsg}). Gunakan Cara 2 (Upload / Foto QR).`);
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

  const handleFileQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFileError('');
    setScanResult(null);
    isHandlingResultRef.current = false;
    setScanMode('file');
    setIsScanningFile(true);

    await stopCameraScanner();
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFileError(
        `QR Code belum terbaca dari gambar (${msg}). Pastikan foto QR jelas dan tidak terpotong.`
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
      setScanResult(null);
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
    setScanResult(null);
    setFileError('');
    setScanMode('camera');
    await startCameraScanner(cameraFacing);
  };

  const handleSwitchMode = async (nextMode: ScanMode) => {
    setScanMode(nextMode);
    setFileError('');
    if (nextMode === 'camera') {
      isHandlingResultRef.current = false;
      setScanResult(null);
      await startCameraScanner(cameraFacing);
    } else {
      await stopCameraScanner();
    }
  };

  if (!isOpen) return null;

  const isSuccessView =
    scanResult &&
    (scanResult.status === 'returned_now' || scanResult.status === 'already_returned') &&
    scanResult.item;

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: METALLIC_EASE }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.24, ease: METALLIC_EASE }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[94dvh] flex flex-col bg-[#06241B]/95 backdrop-blur-xl border border-emerald-400/35 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header Bar */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-emerald-500/25 bg-[#041A13]/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/35 text-[#10B981] shrink-0">
              <QrCode className="w-5 h-5 text-[#10B981]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white uppercase tracking-wide truncate">
                Scan QR Pengembalian Barang
              </h3>
              <p className="text-[10px] text-[#D1FAE5] font-mono truncate">
                Verifikasi Pengembalian Inventaris Real-Time (HP &amp; Laptop)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {scanMode === 'camera' && !isSuccessView && (
              <button
                type="button"
                onClick={() =>
                  setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                className="p-2 rounded-xl bg-emerald-950/75 hover:bg-emerald-900/75 text-[#D1FAE5] border border-emerald-500/30 cursor-pointer"
                title="Ganti Kamera Depan / Belakang"
              >
                <SwitchCamera className="w-4 h-4 text-[#10B981]" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-red-600/85 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer font-bold"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 text-xs">
          {isProcessingUpdate && (
            <div className="p-6 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-center space-y-2">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
              <p className="text-sm font-bold text-white">
                Menyimpan Status Pengembalian ke Firebase...
              </p>
            </div>
          )}

          {/* LAYAR KONFIRMASI HIJAU BESAR */}
          {!isProcessingUpdate && isSuccessView && scanResult?.item ? (
            <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 border-2 border-emerald-300 p-5 sm:p-7 text-center shadow-[0_0_50px_rgba(16,185,129,0.45)] space-y-4">
              <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/60 flex items-center justify-center mx-auto shadow-xl">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>

              <div className="space-y-1">
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-mono font-bold uppercase tracking-widest">
                  {scanResult.status === 'already_returned'
                    ? 'SUDAH DIKEMBALIKAN SEBELUMNYA'
                    : 'KONFIRMASI PENGEMBALIAN BERHASIL'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase leading-tight pt-1">
                  BARANG TELAH DIKEMBALIKAN
                </h2>
              </div>

              <div className="bg-black/25 border border-white/25 rounded-2xl p-4 space-y-3 text-left">
                <div className="text-center border-b border-white/15 pb-3">
                  <p className="text-[10px] font-mono uppercase text-emerald-100/80">
                    Nama Peminjam
                  </p>
                  <p className="text-lg sm:text-xl font-extrabold text-white">
                    {scanResult.item.namaPeminjam}
                  </p>
                  <p className="text-[11px] font-mono text-emerald-100">
                    {scanResult.item.statusDivisiKamar} · HP: {scanResult.item.nomorHp}
                  </p>
                  <p className="text-[10px] font-mono text-amber-200 mt-0.5">
                    Surat: {scanResult.item.nomorSurat}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-mono uppercase text-emerald-100/90 font-bold mb-1.5 flex items-center gap-1">
                    <PackageCheck className="w-3.5 h-3.5 text-amber-300" />
                    <span>Rincian Barang yang Dikembalikan:</span>
                  </p>
                  <ul className="space-y-1.5">
                    {scanResult.item.daftarBarang.map((b, i) => (
                      <li
                        key={b.id || i}
                        className="flex items-center justify-between gap-2 bg-white/10 rounded-xl px-3 py-1.5 text-white"
                      >
                        <span className="font-bold">
                          {i + 1}. {b.namaBarang}
                        </span>
                        <span className="font-mono font-extrabold text-amber-200 shrink-0">
                          {b.jumlah} {b.satuan} ({b.kondisiAwal})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-white/20 flex flex-wrap items-center justify-center gap-2 text-white">
                  <Clock className="w-4 h-4 text-emerald-200" />
                  <span className="text-[11px] font-mono uppercase text-emerald-100">
                    Waktu Kembali:
                  </span>
                  <span className="text-sm sm:text-base font-black font-mono text-amber-200">
                    {scanResult.waktuKembali}
                  </span>
                </div>
              </div>

              <p className="text-xs text-emerald-50/90">{scanResult.message}</p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleResetAndScanAgain}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold text-xs inline-flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Scan QR Berikutnya</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-950/75 hover:bg-emerald-950 text-white border border-white/30 font-bold text-xs cursor-pointer"
                >
                  Selesai &amp; Tutup
                </button>
              </div>
            </div>
          ) : (
            <>
              {scanResult &&
                (scanResult.status === 'not_found' ||
                  scanResult.status === 'not_approved' ||
                  scanResult.status === 'error') && (
                  <div className="p-4 rounded-2xl bg-amber-950/90 border border-amber-500 text-amber-100 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                          <p className="text-[10px] font-mono uppercase font-bold text-amber-300">
                            {scanResult.status === 'not_approved'
                              ? 'Belum Disetujui Ketua Pondok'
                              : scanResult.status === 'error'
                                ? 'Terjadi Kesalahan'
                                : 'Data Tidak Ditemukan'}
                          </p>
                          {scanResult.rawScannedCode && (
                            <p className="text-xs font-bold text-white break-all">
                              Kode: {scanResult.rawScannedCode}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetAndScanAgain}
                        className="px-3 py-1.5 rounded-xl bg-white text-slate-950 font-bold text-xs cursor-pointer shrink-0"
                      >
                        Scan Ulang
                      </button>
                    </div>
                    <p className="text-xs leading-relaxed">{scanResult.message}</p>
                  </div>
                )}

              {/* Mode Selector */}
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
                  <span>Kamera Langsung</span>
                </button>

                <label
                  className={`px-3 py-2.5 rounded-2xl font-bold text-xs inline-flex items-center justify-center gap-2 border cursor-pointer transition-all ${
                    scanMode === 'file'
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg'
                      : 'bg-[#041d13] text-amber-300 border-amber-500/40 hover:border-amber-400'
                  }`}
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span>Upload / Foto QR</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileQrUpload}
                    className="sr-only"
                  />
                </label>
              </div>

              {/* Camera Viewport */}
              {scanMode === 'camera' && (
                <div className="relative mx-auto w-full max-w-[340px] aspect-square rounded-2xl overflow-hidden border-2 border-[#10B981]/50 bg-[#041A13] flex items-center justify-center shadow-inner">
                  <div id={cameraViewportId} className="w-full h-full relative" />

                  {isStartingCamera && (
                    <div className="absolute inset-0 bg-[#041A13]/90 flex flex-col items-center justify-center gap-2 z-10">
                      <Loader2 className="w-7 h-7 text-[#10B981] animate-spin" />
                      <span className="text-xs font-mono text-[#D1FAE5]">
                        Membuka kamera...
                      </span>
                    </div>
                  )}

                  {!isSuccessView && !cameraError && isCameraRunning && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                      <div className="w-56 h-56 relative flex items-center justify-center">
                        <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-[#10B981] rounded-tl-xl" />
                        <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-[#10B981] rounded-tr-xl" />
                        <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-[#10B981] rounded-bl-xl" />
                        <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-[#10B981] rounded-br-xl" />
                        <LaserScanLine />
                        <div className="absolute -bottom-8 px-3 py-1 rounded-full bg-[#041A13]/90 border border-[#10B981]/50 text-[10px] text-[#D1FAE5] font-mono font-bold whitespace-nowrap flex items-center gap-1.5">
                          <ScanLine className="w-3 h-3 text-[#10B981]" />
                          <span>ARAHKAN KE QR SURAT PEMINJAMAN</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {cameraError && (
                    <div className="absolute inset-0 p-5 bg-[#02100a]/95 flex flex-col items-center justify-center text-center space-y-3 z-20">
                      <AlertTriangle className="w-7 h-7 text-rose-400" />
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

              {/* File Upload Viewport */}
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
                    <div className="p-3 rounded-xl bg-red-950/85 border border-red-500/60 text-red-200 text-xs">
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

              {/* Input Manual Fallback */}
              <div className="p-3.5 bg-[#02100a]/90 border border-emerald-800 rounded-2xl space-y-2">
                <label
                  htmlFor="manual-perlengkapan-qr-input"
                  className="flex items-center gap-1.5 text-emerald-200 font-bold uppercase text-[10px] tracking-wider font-mono"
                >
                  <Keyboard className="w-3.5 h-3.5 text-amber-400" />
                  <span>Input ID Peminjaman / Nomor Surat Manual</span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="manual-perlengkapan-qr-input"
                    type="text"
                    placeholder="Contoh: pjm_179... atau 001/PJM-PRL/..."
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
                    Proses
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
};
