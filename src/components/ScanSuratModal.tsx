import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  Upload,
  Loader2,
  AlertCircle,
  Zap,
  ZapOff,
  Focus,
  Sparkles,
} from 'lucide-react';

interface ScanSuratModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscribed: (text: string) => void;
}

const MAX_DIMENSION = 2400;
const JPEG_QUALITY = 0.94;

export const ScanSuratModal: React.FC<ScanSuratModalProps> = ({
  isOpen,
  onClose,
  onTranscribed,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [shutterFlash, setShutterFlash] = useState(false);

  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [resolutionLabel, setResolutionLabel] = useState<string>('');

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore track stop errors
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setTorchOn(false);
    setTorchSupported(false);
    setResolutionLabel('');
  }, []);

  const applyFocusAndInspectTrack = useCallback(async (stream: MediaStream) => {
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const settings = videoTrack.getSettings();
      if (settings.width && settings.height) {
        setResolutionLabel(`${settings.width}×${settings.height}`);
      }

      const capabilities =
        typeof videoTrack.getCapabilities === 'function'
          ? (videoTrack.getCapabilities() as MediaTrackCapabilities & {
              focusMode?: string[];
              torch?: boolean;
            })
          : null;

      setTorchSupported(Boolean(capabilities?.torch));

      if (capabilities?.focusMode && capabilities.focusMode.includes('continuous')) {
        await videoTrack.applyConstraints({
          advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
        });
      }
    } catch {
      // Ignore unsupported hardware constraint calls on specific browsers/devices
    }
  }, []);

  const startCamera = useCallback(
    async (mode: 'environment' | 'user') => {
      stopCamera();
      setCameraError('');
      setErrorMsg('');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Browser atau perangkat tidak mendukung akses kamera langsung. Gunakan tombol "Kamera HP / Pilih Foto" di bawah.'
        );
        return;
      }

      let preferredDeviceId: string | undefined;
      if (typeof navigator.mediaDevices.enumerateDevices === 'function') {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          if (videoInputs.length === 0) {
            setCameraError(
              'Perangkat kamera tidak terdeteksi pada perangkat ini. Silakan gunakan tombol "Kamera HP / Pilih Foto" atau tempel/tarik gambar surat ke layar ini.'
            );
            return;
          }
          const rearCam = videoInputs.find((d) => /back|rear|environment/i.test(d.label));
          const frontCam = videoInputs.find((d) => /front|user|face/i.test(d.label));
          preferredDeviceId =
            mode === 'environment'
              ? (rearCam?.deviceId || videoInputs[0]?.deviceId || undefined)
              : (frontCam?.deviceId || videoInputs[0]?.deviceId || undefined);
        } catch {
          // Continue with standard getUserMedia if enumerateDevices is restricted
        }
      }

      const constraintCandidates: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 3840, min: 1280 },
            height: { ideal: 2160, min: 720 },
          },
          audio: false,
        },
        {
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
          },
          audio: false,
        },
        ...(preferredDeviceId
          ? [
              {
                video: {
                  deviceId: { exact: preferredDeviceId },
                },
                audio: false,
              } as MediaStreamConstraints,
            ]
          : []),
        {
          video: {
            facingMode: { ideal: mode },
          },
          audio: false,
        },
        {
          video: true,
          audio: false,
        },
      ];

      let acquiredStream: MediaStream | null = null;
      let lastError: unknown = null;

      for (const constraints of constraintCandidates) {
        try {
          acquiredStream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          lastError = err;
          const errName = err instanceof DOMException ? err.name : '';
          if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
            break;
          }
        }
      }

      if (!acquiredStream) {
        const errName = lastError instanceof DOMException ? lastError.name : '';
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setCameraError(
            'Izin kamera ditolak oleh browser. Aktifkan izin kamera pada pengaturan browser, atau gunakan tombol "Kamera HP / Pilih Foto".'
          );
        } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
          setCameraError(
            'Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi kamera lain lalu coba lagi, atau pilih foto surat dari galeri.'
          );
        } else {
          setCameraError(
            'Perangkat kamera tidak ditemukan atau tidak tersedia di browser ini. Silakan gunakan tombol "Kamera HP / Pilih Foto" atau tarik/tempel gambar surat.'
          );
        }
        return;
      }

      streamRef.current = acquiredStream;

      if (videoRef.current) {
        videoRef.current.srcObject = acquiredStream;
        try {
          await videoRef.current.play();
        } catch {
          // autoplay might resolve via onLoadedMetadata
        }
      }

      await applyFocusAndInspectTrack(acquiredStream);
      setCameraReady(true);
    },
    [applyFocusAndInspectTrack, stopCamera]
  );

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPreview(null);
      setErrorMsg('');
      setCameraError('');
      setIsProcessing(false);
      return;
    }

    if (!capturedPreview) {
      startCamera(facingMode);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedPreview, startCamera, stopCamera]);

  const handleToggleTorch = async () => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (!videoTrack || !torchSupported) return;
    const nextTorch = !torchOn;
    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: nextTorch } as MediaTrackConstraintSet],
      });
      setTorchOn(nextTorch);
    } catch {
      setTorchSupported(false);
    }
  };

  const handleRefocus = async () => {
    const videoTrack = streamRef.current?.getVideoTracks()[0];
    if (!videoTrack) return;
    try {
      const capabilities =
        typeof videoTrack.getCapabilities === 'function'
          ? (videoTrack.getCapabilities() as MediaTrackCapabilities & {
              focusMode?: string[];
            })
          : null;
      if (capabilities?.focusMode?.includes('single-shot')) {
        await videoTrack.applyConstraints({
          advanced: [{ focusMode: 'single-shot' } as MediaTrackConstraintSet],
        });
      }
      if (capabilities?.focusMode?.includes('continuous')) {
        await videoTrack.applyConstraints({
          advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet],
        });
      }
    } catch {
      // ignore if unsupported
    }
  };

  const processImageWithGemini = async (dataUrl: string) => {
    setIsProcessing(true);
    setErrorMsg('');
    setCapturedPreview(dataUrl);

    try {
      const response = await fetch('/api/scan-surat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType: 'image/jpeg',
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        text?: string;
        error?: string;
      };

      if (!response.ok || !payload.text?.trim()) {
        throw new Error(
          payload.error ||
            'Gagal mengekstrak teks surat dari gambar. Silakan ulangi pemindaian dengan pencahayaan lebih jelas.'
        );
      }

      stopCamera();
      onTranscribed(payload.text.trim());
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat memindai teks surat dengan Gemini OCR.';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    const video = videoRef.current;
    const vw = video.videoWidth || 1920;
    const vh = video.videoHeight || 1080;

    if (vw === 0 || vh === 0) {
      setErrorMsg('Kamera belum siap. Tunggu sesaat lalu coba ambil foto lagi.');
      return;
    }

    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 180);

    const scale = Math.min(1, MAX_DIMENSION / Math.max(vw, vh));
    const targetW = Math.round(vw * scale);
    const targetH = Math.round(vh * scale);

    const canvas = canvasRef.current;
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(video, 0, 0, targetW, targetH);

    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    stopCamera();
    await processImageWithGemini(dataUrl);
  };

  const processImageFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = async () => {
          const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
          const targetW = Math.round(img.width * scale);
          const targetH = Math.round(img.height * scale);

          const canvas = canvasRef.current || document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetW, targetH);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          stopCamera();
          await processImageWithGemini(compressedDataUrl);
        };
        img.onerror = () => {
          setErrorMsg('File gambar tidak dapat dibaca. Pilih foto surat dengan format JPG/PNG.');
        };
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    },
    [stopCamera]
  );

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    processImageFile(file);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            processImageFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, processImageFile]);

  const handleRetryScan = () => {
    setCapturedPreview(null);
    setErrorMsg('');
    setIsProcessing(false);
    startCamera(facingMode);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
          processImageFile(file);
        }
      }}
      className="fixed inset-0 z-[120] w-screen h-[100dvh] bg-black flex flex-col overflow-hidden select-none"
    >
      {/* Top Floating HUD */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 bg-gradient-to-b from-black/85 via-black/55 to-transparent">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/60 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5 text-[#f3d266]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide truncate">
              Scanner Surat Masuk (HD • Latin &amp; Arab)
            </h3>
            <p className="text-[11px] sm:text-xs text-emerald-300/90 truncate">
              {resolutionLabel
                ? `Resolusi Kamera ${resolutionLabel} • Ekstraksi Teks Otomatis`
                : 'Arahkan kamera ke surat lalu tekan Ambil Foto'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {torchSupported && !capturedPreview && (
            <button
              type="button"
              onClick={handleToggleTorch}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                torchOn
                  ? 'bg-[#d4af37] text-[#03140d] border-[#f3d266]'
                  : 'bg-black/60 text-white border-white/25 hover:bg-white/15'
              }`}
              title={torchOn ? 'Matikan Lampu Kilat' : 'Nyalakan Lampu Kilat'}
            >
              {torchOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
            </button>
          )}

          {!capturedPreview && (
            <button
              type="button"
              onClick={handleRefocus}
              className="p-2.5 rounded-xl bg-black/60 text-white border border-white/25 hover:bg-white/15 transition cursor-pointer"
              title="Fokus Ulang Kamera"
            >
              <Focus className="w-5 h-5" />
            </button>
          )}

          {!capturedPreview && (
            <button
              type="button"
              onClick={() => setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))}
              className="p-2.5 rounded-xl bg-black/60 text-white border border-white/25 hover:bg-white/15 transition cursor-pointer"
              title="Ganti Kamera Depan / Belakang"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs inline-flex items-center gap-1.5 border border-red-400/50 cursor-pointer"
            title="Tutup Kamera"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Tutup</span>
          </button>
        </div>
      </div>

      {/* Main Full-Screen Viewfinder */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-black">
        {capturedPreview ? (
          <img
            src={capturedPreview}
            alt="Hasil Foto Surat"
            className="w-full h-full object-contain bg-black"
          />
        ) : cameraError ? (
          <div className="max-w-md mx-4 px-6 py-8 rounded-2xl bg-[#041d13] border border-[#d4af37]/40 text-center space-y-4">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
            <p className="text-sm text-[#e2f2e9] leading-relaxed">{cameraError}</p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] font-extrabold text-xs inline-flex items-center gap-2 cursor-pointer shadow-lg"
              >
                <Upload className="w-4 h-4" />
                <span>Kamera HP / Pilih Foto</span>
              </button>
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="px-4 py-3 rounded-xl bg-[#062a1d] hover:bg-[#083524] text-[#e5c158] border border-[#d4af37]/40 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Coba Kamera Lagi</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              onClick={handleRefocus}
              className="w-full h-full object-cover"
            />

            {/* Subtle Document Framing Overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-5 sm:p-10">
              <div className="relative w-full max-w-2xl h-full max-h-[78dvh] border border-white/25 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.28)]">
                <span className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-[#f3d266] rounded-tl-xl" />
                <span className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-[#f3d266] rounded-tr-xl" />
                <span className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-[#f3d266] rounded-bl-xl" />
                <span className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-[#f3d266] rounded-br-xl" />

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/65 border border-white/20 text-[11px] text-white/90 whitespace-nowrap">
                  Posisikan seluruh isi surat di dalam bingkai • Ketuk layar untuk fokus
                </div>
              </div>
            </div>
          </>
        )}

        {/* Shutter Flash */}
        {shutterFlash && (
          <div className="pointer-events-none absolute inset-0 z-30 bg-white/80 transition-opacity" />
        )}

        {/* OCR Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="max-w-sm w-full rounded-2xl bg-[#041f14] border border-[#d4af37]/50 p-6 text-center space-y-3 shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/50 flex items-center justify-center mx-auto">
                <Loader2 className="w-6 h-6 text-[#f3d266] animate-spin" />
              </div>
              <h4 className="text-base font-extrabold text-white flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#f3d266]" />
                <span>Mengekstrak Teks Surat...</span>
              </h4>
              <p className="text-xs text-[#b8dcc8] leading-relaxed">
                Gemini AI sedang membaca seluruh tulisan Latin maupun Arab pada foto surat untuk dimasukkan otomatis ke formulir Surat Masuk.
              </p>
            </div>
          </div>
        )}

        {/* Error Toast / Overlay when extraction fails */}
        {errorMsg && !isProcessing && (
          <div className="absolute inset-x-4 bottom-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg w-full z-40 rounded-2xl bg-red-950/95 border border-red-400/60 p-4 shadow-2xl space-y-3">
            <div className="flex items-start gap-2.5 text-red-100 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
            <div className="flex items-center justify-end gap-2">
              {capturedPreview && (
                <button
                  type="button"
                  onClick={() => processImageWithGemini(capturedPreview)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 text-[#03140d] font-extrabold text-xs cursor-pointer"
                >
                  Coba Ekstrak Lagi
                </button>
              )}
              <button
                type="button"
                onClick={handleRetryScan}
                className="px-3.5 py-2 rounded-xl bg-white text-black font-extrabold text-xs cursor-pointer"
              >
                Ambil Foto Ulang
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Shutter Dock */}
      <div className="relative z-20 px-4 py-4 sm:px-8 sm:py-5 bg-gradient-to-t from-black/95 via-black/75 to-transparent flex items-center justify-between gap-4">
        <button
          type="button"
          disabled={isProcessing}
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/25 text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Upload className="w-4 h-4 text-[#f3d266]" />
          <span className="hidden sm:inline">Kamera HP / Galeri</span>
          <span className="sm:hidden">Galeri / HP</span>
        </button>

        {capturedPreview ? (
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleRetryScan}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] font-extrabold text-sm inline-flex items-center gap-2 shadow-xl cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Foto Ulang</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={!cameraReady || isProcessing}
            onClick={handleCapturePhoto}
            className="group relative flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] font-extrabold text-sm shadow-[0_0_25px_rgba(212,175,55,0.45)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition"
          >
            <span className="w-8 h-8 rounded-full bg-[#03140d] text-[#f3d266] flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </span>
            <span>Ambil Foto &amp; Scan Teks</span>
          </button>
        )}

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-emerald-300/90 font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-[#f3d266]" />
          <span>Gemini 2.5 Flash OCR</span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
