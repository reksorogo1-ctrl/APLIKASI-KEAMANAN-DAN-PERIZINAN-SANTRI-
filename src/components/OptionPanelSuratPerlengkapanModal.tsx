import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Sliders, X } from 'lucide-react';
import {
  PeminjamanPerlengkapan,
  PengaturanSuratPerlengkapan,
  SystemConfig,
} from '../types';
import { METALLIC_EASE } from './MotionPrimitives';
import { SuratPerlengkapanLayoutEditor } from './SuratPerlengkapanLayoutEditor';

interface OptionPanelSuratPerlengkapanModalProps {
  isOpen: boolean;
  onClose: () => void;
  pengaturanSurat: PengaturanSuratPerlengkapan;
  systemConfig?: SystemConfig;
  peminjamanList?: PeminjamanPerlengkapan[];
  onSaved?: (saved: PengaturanSuratPerlengkapan) => void;
}

const FALLBACK_SYSTEM_CONFIG: SystemConfig = {
  namaPondok: 'Pondok Pesantren Salaf Al-Maliki',
  logoUrl: '/logo-pondok.png',
  bgUrl: '',
  bgOpacity: 20,
  gerbangStrictEnforcement: true,
  autoGenerateViolationOnLate: true,
  toleransiKeterlambatanMenit: 15,
  notifikasiWaAutoDirect: true,
  segregasiBaninBanatKetat: false,
  kuotaIzinHarian: 50,
  modeOperasiDarurat: false,
};

export const OptionPanelSuratPerlengkapanModal: React.FC<
  OptionPanelSuratPerlengkapanModalProps
> = ({
  isOpen,
  onClose,
  pengaturanSurat,
  systemConfig = FALLBACK_SYSTEM_CONFIG,
  peminjamanList = [],
  onSaved,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: METALLIC_EASE }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.24, ease: METALLIC_EASE }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-6xl max-h-[94dvh] flex flex-col bg-[#06241B]/95 backdrop-blur-xl border border-[#d4af37]/45 rounded-2xl shadow-2xl overflow-hidden text-white"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-emerald-500/25 bg-[#041A13]/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f3d266] shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-[#f3d266] uppercase tracking-wide truncate">
                Option Panel Format &amp; Layout Surat Peminjaman + Pratinjau
              </h3>
              <p className="text-[10px] text-emerald-200/80 font-mono truncate">
                Edit kop, tema, kolom, redaksi &amp; pratinjau langsung — tersimpan permanen di Cloud
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-red-600/85 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer shrink-0"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Editor & Live Preview Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <SuratPerlengkapanLayoutEditor
            pengaturanSurat={pengaturanSurat}
            systemConfig={systemConfig}
            peminjamanList={peminjamanList}
            onSaved={onSaved}
            onCancel={onClose}
            compactModalMode
          />
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
};
