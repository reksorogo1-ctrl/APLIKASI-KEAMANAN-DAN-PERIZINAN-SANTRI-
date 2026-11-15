import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ScanText,
} from 'lucide-react';

interface ScanSuratModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscribed: (text: string) => void;
}

export const ScanSuratModal: React.FC<ScanSuratModalProps> = ({
  isOpen,
  onClose,
  onTranscribed,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState('');

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(
    async (mode: 'environment' | 'user') => {
      stopCamera();
      setCameraError('');
      setScanError('');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          'Browser atau perangkat ini tidak mendukung akses kamera langsung. Silakan gunakan tombol "Ambil / Pilih Foto" di bawah.'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraReady(true);
      } catch (err) {
        console.warn('Camera access error:', err);
        setCameraError(
          'Izin kamera belum aktif atau kamera tidak terdeteksi. Anda dapat mengizinkan kamera atau menekan tombol "Ambil / Pilih Foto" di bawah.'
        );
      }
    },
    [stopCamera]
  );

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCamera();
      setIsScanning(false);
      setScanError('');
      setCameraError('');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, startCamera, stopCamera]);

  const sendImageToOcr = async (dataUrl: string, mimeType: string) => {
    setIsScanning(true);
    setScanError('');
    try {
      const response = await fetch('/api/scan-surat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl, mimeType }),
      });

      const result = (await response.json().catch(() => ({}))) as {
        text?: string;
        error?: string;
      };

      if (!response.ok || !result.text) {
        throw new Error(
          result.error || 'Gagal membaca teks surat dari foto. Pastikan tulisan terlihat jelas.'
        );
      }

      stopCamera();
      onTranscribed(result.text);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Terjadi kesalahan saat memindai isi surat.';
      setScanError(message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCaptureFromCamera = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setScanError('Kamera belum siap. Tunggu sebentar atau gunakan tombol Pilih Foto.');
      return;
    }

    const maxDim = 1600;
    let width = video.videoWidth;
    let height = video.videoHeight;
    if (width > maxDim || height > maxDim) {
      if (width >= height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setScanError('Gagal memproses tangkapan layar kamera.');
      return;
    }
    ctx.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    await sendImageToOcr(dataUrl, 'image/jpeg');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        setScanError('File gambar tidak dapat dibaca.');
        return;
      }
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          void sendImageToOcr(result, file.type || 'image/jpeg');
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.88);
        void sendImageToOcr(compressed, 'image/jpeg');
      };
      img.onerror = () => {
        void sendImageToOcr(result, file.type || 'image/jpeg');
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-[#041d14] border border-[#d4af37]/50 shadow-2xl overflow-hidden flex flex-col max-h-[95dvh]">
        {/* Header */}
        <div className="px-4 py-3.5 bg-[#02110b] border-b border-[#d4af37]/30 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-[#d4af37]/20 text-[#f3d266] border border-[#d4af37]/40 shrink-0">
              <ScanText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-white truncate">
                Scan Surat Masuk via Kamera
              </h3>
              <p className="text-[11px] text-emerald-200/80 truncate">
                Foto surat otomatis dibaca menjadi teks digital (tanpa menyimpan foto di tabel)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-xl bg-emerald-950/80 hover:bg-red-900/70 text-emerald-200 hover:text-white border border-emerald-800 cursor-pointer shrink-0"
            aria-label="Tutup Kamera"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative flex-1 bg-black min-h-[260px] sm:min-h-[360px] flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full max-h-[58dvh] object-cover ${
              cameraReady ? 'opacity-100' : 'opacity-20'
            }`}
          />

          {/* Guide Frame */}
          {cameraReady && !isScanning && (
            <div className="pointer-events-none absolute inset-4 sm:inset-8 border-2 border-dashed border-[#d4af37]/75 rounded-2xl flex items-end justify-center pb-3">
              <span className="px-3 py-1 rounded-lg bg-black/70 text-[11px] font-semibold text-[#f3d266] border border-[#d4af37]/40">
                Posisikan seluruh lembaran surat di dalam bingkai
              </span>
            </div>
          )}

          {/* Switch Camera Floating Button */}
          {cameraReady && !isScanning && (
            <button
              type="button"
              onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
              className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-xs font-bold text-white border border-[#d4af37]/45 flex items-center gap-1.5 cursor-pointer"
              title="Ganti Kamera Depan / Belakang"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#f3d266]" />
              <span className="hidden sm:inline">Ganti Kamera</span>
            </button>
          )}

          {/* Loading Overlay */}
          {isScanning && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 text-center">
              <Loader2 className="w-10 h-10 text-[#f3d266] animate-spin" />
              <p className="text-sm font-bold text-white">
                Sedang Membaca &amp; Mentranskripsikan Isi Surat...
              </p>
              <p className="text-xs text-emerald-200/80 max-w-sm">
                Sistem otomatis mengenali tulisan tangan maupun cetak Bahasa Indonesia beserta nama, tanggal, dan angka secara teliti.
              </p>
            </div>
          )}

          {/* Camera Error / Permission Guidance */}
          {cameraError && !isScanning && (
            <div className="absolute inset-0 bg-[#03160f]/95 flex flex-col items-center justify-center p-6 text-center gap-3">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <p className="text-xs sm:text-sm text-amber-100 max-w-md leading-relaxed">
                {cameraError}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-3.5 py-2 rounded-xl bg-[#072c1e] hover:bg-[#0b422d] text-xs font-bold text-emerald-200 border border-emerald-600/50 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Coba Buka Kamera Lagi</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#02120a] text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ambil / Pilih Foto Surat</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error banner from OCR */}
        {scanError && (
          <div className="px-4 py-2.5 bg-red-950/90 border-t border-red-500/40 text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{scanError}</span>
          </div>
        )}

        {/* Action Footer */}
        <div className="p-4 bg-[#02110b] border-t border-[#d4af37]/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            disabled={isScanning}
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl bg-[#052419] hover:bg-[#083524] text-emerald-100 border border-[#d4af37]/35 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-[#e5c158]" />
            <span>Kamera HP / Upload Foto</span>
          </button>

          <button
            type="button"
            disabled={isScanning || !cameraReady}
            onClick={handleCaptureFromCamera}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Teks...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Ambil Foto &amp; Baca Isi Surat</span>
              </>
            )}
          </button>

          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-emerald-300/80">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Hasil Teks Masuk ke Tabel</span>
          </div>
        </div>
      </div>
    </div>
  );
};
