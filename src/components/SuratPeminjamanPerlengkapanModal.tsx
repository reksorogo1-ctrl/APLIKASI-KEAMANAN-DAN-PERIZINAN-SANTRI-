import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import QRCode from 'qrcode';
import { Printer, Share2, Sliders, X, PackageCheck } from 'lucide-react';
import {
  PeminjamanPerlengkapan,
  PengaturanSuratPerlengkapan,
  SystemConfig,
} from '../types';
import { createWhatsAppUrl } from '../services/waService';
import { METALLIC_EASE } from './MotionPrimitives';
import { SuratPeminjamanPreview } from './SuratPeminjamanPreview';

interface SuratPeminjamanPerlengkapanModalProps {
  pinjam: PeminjamanPerlengkapan | null;
  systemConfig: SystemConfig;
  pengaturanSurat: PengaturanSuratPerlengkapan;
  onClose: () => void;
  onOpenOptionPanel?: () => void;
}

export const SuratPeminjamanPerlengkapanModal: React.FC<
  SuratPeminjamanPerlengkapanModalProps
> = ({ pinjam, systemConfig, pengaturanSurat, onClose, onOpenOptionPanel }) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (pinjam) {
      const qrPayload = String(pinjam.id);
      QRCode.toDataURL(qrPayload, {
        width: 320,
        margin: 4,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrUrl(url))
        .catch(() => {});
    }
  }, [pinjam]);

  useEffect(() => {
    if (pinjam) {
      document.body.classList.add('modal-surat-open');
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-letter');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      document.body.classList.remove('modal-surat-open');
      document.body.classList.remove('printing-letter');
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [pinjam, onClose]);

  if (!pinjam) return null;

  const handlePrint = async () => {
    if (!qrUrl) {
      try {
        const url = await QRCode.toDataURL(String(pinjam.id), {
          width: 320,
          margin: 4,
          errorCorrectionLevel: 'M',
          color: { dark: '#000000', light: '#FFFFFF' },
        });
        setQrUrl(url);
      } catch {
        // ignore
      }
    }
    document.body.classList.add('printing-letter');
    setTimeout(() => {
      window.print();
    }, 80);
  };

  const handleShareWA = () => {
    const itemsText = pinjam.daftarBarang
      .map(
        (b, i) =>
          `${i + 1}. ${b.namaBarang} (${b.jumlah} ${b.satuan}) [${
            b.sumberBarang === 'fasilitas'
              ? `Fasilitas${b.gedungNama ? ` - ${b.gedungNama}` : ''}`
              : 'Inventaris'
          }] - Kondisi: ${b.kondisiAwal}`
      )
      .join('\n');
    const text =
      `*SURAT IZIN PEMINJAMAN PERLENGKAPAN*\n` +
      `*${systemConfig.namaPondok || 'Pondok Pesantren Salaf Al-Maliki'}*\n\n` +
      `Nomor Surat: ${pinjam.nomorSurat}\n` +
      `Peminjam: ${pinjam.namaPeminjam} (${pinjam.statusDivisiKamar})\n` +
      `Tanggal Pinjam: ${pinjam.tanggalPinjam}\n` +
      `Estimasi Kembali: ${pinjam.estimasiTanggalKembali}\n` +
      `Status: ${pinjam.status}\n\n` +
      `Rincian Barang:\n${itemsText}\n\n` +
      `ID QR Pengembalian: ${pinjam.id}\n` +
      `_Harap menjaga keutuhan barang dan melakukan scan QR saat pengembalian._`;
    window.open(createWhatsAppUrl(pinjam.nomorHp, text), '_blank');
  };

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: METALLIC_EASE }}
      onClick={onClose}
      className="surat-print-overlay fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.24, ease: METALLIC_EASE }}
        onClick={(e) => e.stopPropagation()}
        className="surat-print-modal relative w-full max-w-3xl max-h-[94dvh] flex flex-col bg-[#06241B]/95 backdrop-blur-xl text-slate-900 rounded-2xl shadow-2xl border border-emerald-400/30 overflow-hidden"
      >
        {/* Top Sticky Action Bar (Hidden when Printing) */}
        <div className="no-print shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-[#041A13]/90 text-white border-b border-emerald-500/25 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <PackageCheck className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black tracking-wide text-[#D4AF37] uppercase truncate">
                Surat Peminjaman Barang Perlengkapan
              </h3>
              <p className="text-[10px] text-[#D1FAE5] font-mono truncate">
                {pinjam.nomorSurat} · Status: {pinjam.status}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {onOpenOptionPanel && (
              <button
                type="button"
                onClick={onOpenOptionPanel}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-[#f3d266] bg-[#062a1d] hover:bg-[#0a3c2a] border border-[#d4af37]/45 rounded-xl cursor-pointer"
                title="Edit Format & Layout Surat"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Format Surat</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleShareWA}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl cursor-pointer shadow-md"
              title="Kirim detail surat via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kirim WA</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] sm:text-xs font-mono font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/50 rounded-xl cursor-pointer shadow-md"
              title="Cetak A4 atau Simpan PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-[11px] font-mono font-bold cursor-pointer shadow-md"
              title="Tutup (ESC)"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tutup</span>
            </button>
          </div>
        </div>

        {/* Printable A4 Sheet */}
        <div className="flex-1 overflow-y-auto overscroll-contain bg-white">
          <SuratPeminjamanPreview
            pinjam={pinjam}
            systemConfig={systemConfig}
            pengaturanSurat={pengaturanSurat}
            qrUrlOverride={qrUrl}
          />
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
};
