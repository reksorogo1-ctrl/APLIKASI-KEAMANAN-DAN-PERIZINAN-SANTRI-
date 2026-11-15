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
  FileText,
  LogOut,
} from 'lucide-react';
import {
  clearWorkspaceToken,
  getWorkspaceAccessToken,
  getWorkspaceUser,
  googleWorkspaceSignIn,
  initWorkspaceAuth,
  logoutWorkspaceAuth,
} from '../services/googleWorkspaceAuth';
import {
  GoogleAuthExpiredError,
  scanImageWithGoogleDocs,
} from '../services/googleDocsScanService';

export interface ScanSuratResult {
  text: string;
  googleDocId?: string;
  googleDocUrl?: string;
  googleDocTitle?: string;
}

interface ScanSuratModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscribed: (result: ScanSuratResult) => void;
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

  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [googleUserEmail, setGoogleUserEmail] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

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
          'Browser atau perangkat ini tidak mendukung akses kamera langsung. Silakan gunakan tombol "Kamera HP / Upload Foto" di bawah.'
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
          'Izin kamera belum aktif atau kamera tidak terdeteksi. Anda dapat mengizinkan kamera atau menekan tombol "Kamera HP / Upload Foto" di bawah.'
        );
      }
    },
    [stopCamera]
  );

  // Track Google Docs OAuth state in memory
  useEffect(() => {
    const unsubscribe = initWorkspaceAuth(
      (user) => {
        setNeedsAuth(false);
        setGoogleUserEmail(user.email || user.displayName || 'Akun Google Terhubung');
      },
      () => {
        setNeedsAuth(true);
        setGoogleUserEmail('');
      }
    );

    const existingUser = getWorkspaceUser();
    void getWorkspaceAccessToken().then((token) => {
      if (token && existingUser) {
        setNeedsAuth(false);
        setGoogleUserEmail(existingUser.email || existingUser.displayName || 'Akun Google Terhubung');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

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

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setScanError('');
    try {
      const authRes = await googleWorkspaceSignIn();
      if (authRes) {
        setNeedsAuth(false);
        setGoogleUserEmail(
          authRes.user.email || authRes.user.displayName || 'Akun Google Terhubung'
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Login Google dibatalkan atau gagal. Silakan coba lagi.';
      setScanError(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutWorkspaceAuth();
    setNeedsAuth(true);
    setGoogleUserEmail('');
  };

  const sendImageToGoogleDocsOcr = async (dataUrl: string, mimeType: string) => {
    setScanError('');
    const accessToken = await getWorkspaceAccessToken();
    if (!accessToken) {
      setNeedsAuth(true);
      setScanError(
        'Silakan klik tombol "Sign in with Google" terlebih dahulu agar kamera dapat memindai & mentranskripsikan surat melalui Google Docs.'
      );
      return;
    }

    setIsScanning(true);
    try {
      const result = await scanImageWithGoogleDocs(dataUrl, mimeType, accessToken);
      stopCamera();
      onTranscribed({
        text: result.text,
        googleDocId: result.googleDocId,
        googleDocUrl: result.googleDocUrl,
        googleDocTitle: result.googleDocTitle,
      });
    } catch (err) {
      if (err instanceof GoogleAuthExpiredError) {
        clearWorkspaceToken();
        setNeedsAuth(true);
      }
      const message =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat memindai & membaca isi surat dengan Google Docs.';
      setScanError(message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCaptureFromCamera = async () => {
    const accessToken = await getWorkspaceAccessToken();
    if (!accessToken) {
      setNeedsAuth(true);
      setScanError(
        'Silakan klik "Sign in with Google" terlebih dahulu untuk menghubungkan teknologi OCR Google Docs.'
      );
      return;
    }

    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setScanError('Kamera belum siap. Tunggu sebentar atau gunakan tombol Kamera HP / Upload Foto.');
      return;
    }

    const maxDim = 1800;
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
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    await sendImageToGoogleDocsOcr(dataUrl, 'image/jpeg');
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
        const maxDim = 1800;
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
          void sendImageToGoogleDocsOcr(result, file.type || 'image/jpeg');
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.9);
        void sendImageToGoogleDocsOcr(compressed, 'image/jpeg');
      };
      img.onerror = () => {
        void sendImageToGoogleDocsOcr(result, file.type || 'image/jpeg');
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
                Scan Surat Kamera via Google Docs OCR
              </h3>
              <p className="text-[11px] text-emerald-200/80 truncate">
                Mengonversi foto surat menggunakan teknologi Google Docs menjadi teks digital rapi ke tabel
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

        {/* Google Docs Connection Strip */}
        <div className="px-4 py-2.5 bg-[#03160f] border-b border-emerald-800/70 flex flex-wrap items-center justify-between gap-2 shrink-0">
          {needsAuth ? (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-[#f3d266] shrink-0" />
                <span className="text-[11px] text-amber-200 font-semibold">
                  Hubungkan Google Docs untuk mengaktifkan transkripsi OCR otomatis:
                </span>
              </div>
              <button
                type="button"
                disabled={isLoggingIn}
                onClick={handleGoogleSignIn}
                className="gsi-material-button shrink-0"
              >
                <div className="gsi-material-button-content-wrapper">
                  <div className="gsi-material-button-icon">
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      style={{ display: 'block' }}
                    >
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents">
                    {isLoggingIn ? 'Menghubungkan...' : 'Sign in with Google'}
                  </span>
                </div>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/45 text-[11px] font-bold text-emerald-300 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Google Docs Aktif · {googleUserEmail}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleGoogleLogout}
                className="px-2.5 py-1 rounded-lg bg-[#052419] hover:bg-rose-950/70 text-emerald-200 hover:text-rose-200 border border-emerald-700/60 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
              >
                <LogOut className="w-3 h-3" />
                <span>Ganti Akun</span>
              </button>
            </>
          )}
        </div>

        {/* Camera Viewport */}
        <div className="relative flex-1 bg-black min-h-[250px] sm:min-h-[340px] flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full max-h-[54dvh] object-cover ${
              cameraReady ? 'opacity-100' : 'opacity-20'
            }`}
          />

          {/* Guide Frame */}
          {cameraReady && !isScanning && (
            <div className="pointer-events-none absolute inset-4 sm:inset-8 border-2 border-dashed border-[#d4af37]/75 rounded-2xl flex items-end justify-center pb-3">
              <span className="px-3 py-1 rounded-lg bg-black/75 text-[11px] font-semibold text-[#f3d266] border border-[#d4af37]/40">
                Posisikan lembaran surat di dalam bingkai untuk dibaca Google Docs
              </span>
            </div>
          )}

          {/* Switch Camera Floating Button */}
          {cameraReady && !isScanning && (
            <button
              type="button"
              onClick={() =>
                setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
              }
              className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-xs font-bold text-white border border-[#d4af37]/45 flex items-center gap-1.5 cursor-pointer"
              title="Ganti Kamera Depan / Belakang"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#f3d266]" />
              <span className="hidden sm:inline">Ganti Kamera</span>
            </button>
          )}

          {/* Loading Overlay */}
          {isScanning && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 text-center">
              <Loader2 className="w-10 h-10 text-[#f3d266] animate-spin" />
              <p className="text-sm font-bold text-white">
                Sedang Memindai &amp; Mentranskripsikan Surat via Google Docs...
              </p>
              <p className="text-xs text-emerald-200/80 max-w-sm">
                Foto surat dikonversi menggunakan teknologi OCR Google Docs Bahasa Indonesia menjadi teks digital yang rapi.
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
            onClick={() => {
              if (needsAuth) {
                setScanError(
                  'Silakan klik "Sign in with Google" terlebih dahulu di atas sebelum memindai foto.'
                );
                return;
              }
              fileInputRef.current?.click();
            }}
            className="px-4 py-2.5 rounded-xl bg-[#052419] hover:bg-[#083524] text-emerald-100 border border-[#d4af37]/35 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <Upload className="w-4 h-4 text-[#e5c158]" />
            <span>Kamera HP / Upload Foto</span>
          </button>

          <button
            type="button"
            disabled={isScanning || !cameraReady}
            onClick={handleCaptureFromCamera}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] text-[#03140d] font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memindai via Google Docs...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Ambil Foto &amp; Scan Google Docs</span>
              </>
            )}
          </button>

          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-emerald-300/80 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Teks Masuk ke Tabel</span>
          </div>
        </div>
      </div>
    </div>
  );
};
