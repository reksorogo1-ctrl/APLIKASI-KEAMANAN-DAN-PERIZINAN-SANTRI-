import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Loader2,
  RotateCcw,
  Save,
  Sliders,
  X,
} from 'lucide-react';
import { PengaturanSuratPerlengkapan } from '../types';
import {
  DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN,
  savePengaturanSuratPerlengkapan,
} from '../services/peminjamanPerlengkapanService';
import { METALLIC_EASE } from './MotionPrimitives';

interface OptionPanelSuratPerlengkapanModalProps {
  isOpen: boolean;
  onClose: () => void;
  pengaturanSurat: PengaturanSuratPerlengkapan;
  onSaved?: (saved: PengaturanSuratPerlengkapan) => void;
}

export const OptionPanelSuratPerlengkapanModal: React.FC<
  OptionPanelSuratPerlengkapanModalProps
> = ({ isOpen, onClose, pengaturanSurat, onSaved }) => {
  const [form, setForm] = useState<PengaturanSuratPerlengkapan>(pengaturanSurat);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (isOpen) {
      setForm(pengaturanSurat);
      setStatusMsg(null);
    }
  }, [isOpen, pengaturanSurat]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);
    try {
      const saved = await savePengaturanSuratPerlengkapan(form);
      setStatusMsg({
        type: 'ok',
        text: 'Format & layout surat berhasil disimpan permanen ke Firebase Cloud!',
      });
      onSaved?.(saved);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMsg({ type: 'err', text: `Gagal menyimpan pengaturan: ${msg}` });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = () => {
    setForm(DEFAULT_PENGATURAN_SURAT_PERLENGKAPAN);
    setStatusMsg({
      type: 'ok',
      text: 'Form dikembalikan ke template standar. Klik "Simpan Perubahan" untuk menerapkan ke Cloud.',
    });
  };

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
        className="relative w-full max-w-2xl max-h-[94dvh] flex flex-col bg-[#06241B]/95 backdrop-blur-xl border border-[#d4af37]/45 rounded-2xl shadow-2xl overflow-hidden text-white"
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-emerald-500/25 bg-[#041A13]/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#f3d266] shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-[#f3d266] uppercase tracking-wide truncate">
                Option Panel Format &amp; Layout Surat Peminjaman
              </h3>
              <p className="text-[10px] text-emerald-200/80 font-mono truncate">
                Tersimpan permanen di Firebase (pengaturan_surat_perlengkapan) &amp; langsung diterapkan pada Cetak A4
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

        {/* Form Body */}
        <form
          onSubmit={handleSave}
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 text-xs"
        >
          {statusMsg && (
            <div
              className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                statusMsg.type === 'ok'
                  ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                  : 'bg-rose-950/90 border-rose-500 text-rose-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Header & Teks Surat */}
          <div className="space-y-3 rounded-2xl bg-[#03160f]/90 border border-emerald-800/70 p-4">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#f3d266] font-bold">
              1. Konten Header &amp; Redaksi Surat
            </h4>
            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                Judul / Header Surat
              </label>
              <input
                type="text"
                required
                value={form.judulSurat}
                onChange={(e) => setForm({ ...form, judulSurat: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white font-bold focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                Teks Pembuka Surat
              </label>
              <textarea
                rows={3}
                required
                value={form.teksPembuka}
                onChange={(e) => setForm({ ...form, teksPembuka: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                Teks Penutup &amp; Ketentuan Tanggung Jawab Kerusakan
              </label>
              <textarea
                rows={3}
                required
                value={form.teksPenutup}
                onChange={(e) => setForm({ ...form, teksPenutup: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* Penanda Tangan */}
          <div className="space-y-3 rounded-2xl bg-[#03160f]/90 border border-emerald-800/70 p-4">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#f3d266] font-bold">
              2. Nama &amp; Jabatan Penanda Tangan serta Visibilitas Kolom TTD
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Nama Ketua Pondok
                </label>
                <input
                  type="text"
                  required
                  value={form.namaKetuaPondok}
                  onChange={(e) => setForm({ ...form, namaKetuaPondok: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Jabatan Ketua Pondok
                </label>
                <input
                  type="text"
                  required
                  value={form.jabatanKetuaPondok}
                  onChange={(e) => setForm({ ...form, jabatanKetuaPondok: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Nama Ketua Bagian Perlengkapan
                </label>
                <input
                  type="text"
                  required
                  value={form.namaKetuaPerlengkapan}
                  onChange={(e) =>
                    setForm({ ...form, namaKetuaPerlengkapan: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Jabatan Bagian Perlengkapan
                </label>
                <input
                  type="text"
                  required
                  value={form.jabatanKetuaPerlengkapan}
                  onChange={(e) =>
                    setForm({ ...form, jabatanKetuaPerlengkapan: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#02100a] border border-emerald-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.tampilkanTtdPeminjam}
                  onChange={(e) =>
                    setForm({ ...form, tampilkanTtdPeminjam: e.target.checked })
                  }
                  className="accent-emerald-500 w-4 h-4"
                />
                <span className="font-semibold text-emerald-100">TTD Peminjam</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#02100a] border border-emerald-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.tampilkanTtdPerlengkapan}
                  onChange={(e) =>
                    setForm({ ...form, tampilkanTtdPerlengkapan: e.target.checked })
                  }
                  className="accent-emerald-500 w-4 h-4"
                />
                <span className="font-semibold text-emerald-100">TTD Bag. Perlengkapan</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#02100a] border border-emerald-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.tampilkanTtdKetuaPondok}
                  onChange={(e) =>
                    setForm({ ...form, tampilkanTtdKetuaPondok: e.target.checked })
                  }
                  className="accent-emerald-500 w-4 h-4"
                />
                <span className="font-semibold text-emerald-100">TTD Ketua Pondok</span>
              </label>
            </div>
          </div>

          {/* Layout & QR Settings */}
          <div className="space-y-3 rounded-2xl bg-[#03160f]/90 border border-emerald-800/70 p-4">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#f3d266] font-bold">
              3. Pengaturan Layout, Ukuran Font, Kop Surat &amp; Posisi QR Code
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Ukuran Font Cetak
                </label>
                <select
                  value={form.ukuranFont}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ukuranFont: e.target.value as PengaturanSuratPerlengkapan['ukuranFont'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white font-semibold"
                >
                  <option value="kecil">Kecil (Padat)</option>
                  <option value="sedang">Sedang (Standar A4)</option>
                  <option value="besar">Besar (Jelas)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-emerald-300 mb-1">
                  Posisi QR Code
                </label>
                <select
                  value={form.posisiQrCode}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      posisiQrCode: e.target.value as PengaturanSuratPerlengkapan['posisiQrCode'],
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#02100a] border border-emerald-800 text-white font-semibold"
                >
                  <option value="kiri_bawah">Kiri Bawah Surat</option>
                  <option value="kanan_bawah">Kanan Bawah Surat</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-[#02100a] border border-emerald-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.tampilkanKopSurat}
                    onChange={(e) =>
                      setForm({ ...form, tampilkanKopSurat: e.target.checked })
                    }
                    className="accent-emerald-500 w-4 h-4"
                  />
                  <span className="font-semibold text-emerald-100">Tampilkan Kop Surat</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sticky Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={handleResetDefault}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-[#02100a] hover:bg-[#06281c] border border-emerald-700 text-emerald-200 font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b58922] hover:from-[#e5c158] hover:to-[#d4af37] text-[#02120a] font-extrabold inline-flex items-center justify-center gap-1.5 shadow-lg cursor-pointer disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Format Surat'}</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
};
