import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Camera,
  X,
  Upload,
  Loader2,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { LaserScanLine, METALLIC_EASE } from './MotionPrimitives';

interface ScanSuratModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscribed: (text: string) => void;
  initialPreviewUrl?: string | null;
}

const MAX_WIDTH = 768;
const JPEG_QUALITY = 0.65;

export const ScanSuratModal: React.FC<ScanSuratModalProps> = ({
  isOpen,
  onClose,
  onTranscribed,
  initialPreviewUrl = null,
}) => {
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [pureBase64, setPureBase64] = useState<string>('');
  const [imageMeta, setImageMeta] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPreviewDataUrl(null);
      setPureBase64('');
      setImageMeta('');
      setIsCompressing(false);
      setIsExtracting(false);
      setErrorMsg('');
      return;
    }

    if (initialPreviewUrl) {
      const base64Part = initialPreviewUrl.includes(',')
        ? initialPreviewUrl.split(',')[1] || ''
        : initialPreviewUrl;
      const fullDataUrl = initialPreviewUrl.startsWith('data:')
        ? initialPreviewUrl
        : `data:image/jpeg;base64,${initialPreviewUrl}`;
      const kb = Math.max(1, Math.round((base64Part.length * 3) / 4 / 1024));
      setPreviewDataUrl(fullDataUrl);
      setPureBase64(base64Part);
      setImageMeta(`Siap diekstrak • ~${kb} KB`);
      setErrorMsg('');
    }
  }, [isOpen, initialPreviewUrl]);

  const handleCompressImageFile = useCallback((file: File) => {
    setIsCompressing(true);
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
          const targetW = Math.max(1, Math.round(img.width * scale));
          const targetH = Math.max(1, Math.round(img.height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Gagal menginisialisasi HTML5 Canvas 2D context.');
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, targetW, targetH);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetW, targetH);

          const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          const cleanBase64 = dataUrl.split(',')[1] || '';
          if (!cleanBase64) {
            throw new Error('Hasil kompresi gambar Base64 kosong.');
          }

          const kb = Math.max(1, Math.round((cleanBase64.length * 3) / 4 / 1024));
          setPreviewDataUrl(dataUrl);
          setPureBase64(cleanBase64);
          setImageMeta(`${targetW}×${targetH} px • JPEG 65% • ~${kb} KB`);
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : String(err));
        } finally {
          setIsCompressing(false);
        }
      };

      img.onerror = () => {
        setIsCompressing(false);
        setErrorMsg('Gagal memuat file gambar. Pastikan file berupa foto JPG, PNG, atau WEBP.');
      };

      img.src = String(reader.result || '');
    };

    reader.onerror = () => {
      setIsCompressing(false);
      setErrorMsg(reader.error?.message || 'Gagal membaca file gambar dari perangkat.');
    };

    reader.readAsDataURL(file);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    handleCompressImageFile(file);
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
            handleCompressImageFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, handleCompressImageFile]);

  const handleExtractText = async () => {
    if (!pureBase64 || isExtracting) return;

    setIsExtracting(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/scan-surat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: pureBase64,
          mimeType: 'image/jpeg',
        }),
      });

      const rawText = await response.text();
      let payload: { text?: string; error?: string } = {};
      try {
        payload = rawText ? (JSON.parse(rawText) as { text?: string; error?: string }) : {};
      } catch {
        throw new Error(
          `HTTP ${response.status} ${response.statusText}: ${rawText || '(empty response)'}`
        );
      }

      if (!response.ok) {
        throw new Error(
          payload.error || `HTTP ${response.status} ${response.statusText}: ${rawText}`
        );
      }

      if (!payload.text?.trim()) {
        throw new Error(`Hasil ekstraksi kosong: ${JSON.stringify(payload)}`);
      }

      onTranscribed(payload.text.trim());
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      setErrorMsg(message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleResetPhoto = () => {
    setPreviewDataUrl(null);
    setPureBase64('');
    setImageMeta('');
    setErrorMsg('');
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: METALLIC_EASE }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
          handleCompressImageFile(file);
        }
      }}
      className="fixed inset-0 z-[120] w-screen h-[100dvh] bg-[#041A13]/92 backdrop-blur-md flex flex-col overflow-hidden"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 border-b border-emerald-500/25 bg-emerald-950/60 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/50 flex items-center justify-center shrink-0">
            <Camera className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
              Scanner Surat Masuk (Android, iOS &amp; Laptop)
            </h3>
            <p className="text-[11px] sm:text-xs text-[#D1FAE5] truncate">
              Ekstraksi teks Latin, Arab &amp; Pegon langsung ke formulir surat masuk
            </p>
          </div>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          disabled={isExtracting}
          className="px-3.5 py-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs inline-flex items-center gap-1.5 border border-red-400/50 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <X className="w-4 h-4" />
          <span>Tutup</span>
        </motion.button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.24, ease: METALLIC_EASE }}
          className="w-full max-w-2xl space-y-4"
        >
          {!previewDataUrl ? (
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-emerald-400/35 bg-[#06241B]/95 backdrop-blur-xl p-6 sm:p-10 text-center space-y-5 shadow-2xl">
              {/* Reticle corners + moving green laser line inside scanner dropzone */}
              <div className="pointer-events-none absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-[#10B981]/70 rounded-tl-lg" />
              <div className="pointer-events-none absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-[#10B981]/70 rounded-tr-lg" />
              <div className="pointer-events-none absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-[#10B981]/70 rounded-bl-lg" />
              <div className="pointer-events-none absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-[#10B981]/70 rounded-br-lg" />
              <LaserScanLine className="opacity-55" />

              <div className="relative z-10 w-16 h-16 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/50 flex items-center justify-center mx-auto">
                {isCompressing ? (
                  <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-[#D4AF37]" />
                )}
              </div>

              <div className="relative z-10 space-y-1.5">
                <h4 className="text-base sm:text-lg font-extrabold text-white">
                  {isCompressing
                    ? 'Mengompresi Foto Surat...'
                    : 'Pilih atau Jepret Foto Surat Masuk'}
                </h4>
                <p className="text-xs sm:text-sm text-[#D1FAE5] max-w-md mx-auto leading-relaxed">
                  Tekan tombol di bawah untuk membuka kamera HP atau memilih gambar surat dari galeri/komputer. Gambar otomatis dikompresi agar pemindaian cepat dan akurat.
                </p>
              </div>

              <label className="relative z-10 w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#b58922] text-[#041A13] font-extrabold text-sm sm:text-base inline-flex items-center justify-center gap-3 shadow-[0_8px_28px_rgba(212,175,55,0.35)] cursor-pointer hover:brightness-105 transition">
                <Camera className="w-5 h-5" />
                <span>Ambil Foto / Pilih Gambar Surat</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={isCompressing}
                  onChange={handleFileInputChange}
                  className="sr-only"
                />
              </label>

              <p className="relative z-10 text-[11px] text-[#D1FAE5]/85">
                Mendukung kamera iPhone Safari, Chrome Android, upload file komputer, drag &amp; drop, atau tempel gambar (Ctrl+V).
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-400/30 bg-[#06241B]/95 backdrop-blur-xl p-4 sm:p-5 space-y-4 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#D4AF37]">
                  Pratinjau Gambar Surat
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-[#041A13] border border-emerald-500/30 text-[11px] font-mono text-[#D1FAE5]">
                  {imageMeta}
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden border-2 border-[#10B981]/50 bg-[#041A13] flex items-center justify-center max-h-[55dvh]">
                <img
                  src={previewDataUrl}
                  alt="Pratinjau Foto Surat Masuk"
                  className="max-w-full max-h-[55dvh] object-contain"
                />
                {/* Cyber-Emerald Scanner Reticle + Moving Thin Green Laser Line */}
                <div className="pointer-events-none absolute top-2.5 left-2.5 w-6 h-6 border-t-3 border-l-3 border-[#10B981] rounded-tl-lg z-20" />
                <div className="pointer-events-none absolute top-2.5 right-2.5 w-6 h-6 border-t-3 border-r-3 border-[#10B981] rounded-tr-lg z-20" />
                <div className="pointer-events-none absolute bottom-2.5 left-2.5 w-6 h-6 border-b-3 border-l-3 border-[#10B981] rounded-bl-lg z-20" />
                <div className="pointer-events-none absolute bottom-2.5 right-2.5 w-6 h-6 border-b-3 border-r-3 border-[#10B981] rounded-br-lg z-20" />
                <LaserScanLine />
                {isExtracting && (
                  <div className="absolute inset-0 bg-[#041A13]/75 backdrop-blur-xs flex flex-col items-center justify-center gap-3 p-4 text-center z-30">
                    <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
                    <p className="text-sm font-extrabold text-white">
                      Sedang mengekstrak teks Latin &amp; Arab...
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center gap-2">
                  <label className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-[#D4AF37] border border-[#D4AF37]/40 font-bold text-xs inline-flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Ganti Gambar</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isExtracting || isCompressing}
                      onChange={handleFileInputChange}
                      className="sr-only"
                    />
                  </label>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    disabled={isExtracting}
                    onClick={handleResetPhoto}
                    className="px-3.5 py-3 rounded-xl bg-[#041A13]/80 hover:bg-[#041A13] text-[#D1FAE5] border border-emerald-500/30 font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Hapus Pratinjau"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </motion.button>
                </div>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  disabled={!pureBase64 || isExtracting || isCompressing}
                  onClick={handleExtractText}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#b58922] text-[#041A13] font-extrabold text-sm inline-flex items-center justify-center gap-2 shadow-[0_6px_22px_rgba(212,175,55,0.4)] cursor-pointer hover:brightness-105 disabled:opacity-50"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengekstrak Teks...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Ekstrak Teks Surat</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-2xl bg-red-950/95 border border-red-400/70 p-4 shadow-xl space-y-1.5">
              <div className="flex items-center gap-2 text-red-300 text-xs font-extrabold uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Error Pemindaian</span>
              </div>
              <pre className="text-xs font-mono text-red-100 whitespace-pre-wrap break-all leading-relaxed max-h-40 overflow-y-auto bg-black/45 p-2.5 rounded-xl border border-red-500/35">
                {errorMsg}
              </pre>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
