import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import QRCode from 'qrcode';
import {
  CheckCircle2,
  Printer,
  Share2,
  Sliders,
  X,
  PackageCheck,
  Calendar,
  Phone,
  UserCheck,
} from 'lucide-react';
import {
  PeminjamanPerlengkapan,
  PengaturanSuratPerlengkapan,
  SystemConfig,
} from '../types';
import { createWhatsAppUrl } from '../services/waService';
import { METALLIC_EASE } from './MotionPrimitives';

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
          `${i + 1}. ${b.namaBarang} (${b.jumlah} ${b.satuan}) - Kondisi: ${b.kondisiAwal}`
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

  const fontScaleClass =
    pengaturanSurat.ukuranFont === 'kecil'
      ? 'text-[10.5px] sm:text-[11.5px] leading-snug'
      : pengaturanSurat.ukuranFont === 'besar'
        ? 'text-[13px] sm:text-[14px] leading-relaxed'
        : 'text-[11.5px] sm:text-[12.5px] leading-relaxed';

  const titleScaleClass =
    pengaturanSurat.ukuranFont === 'kecil'
      ? 'text-xs sm:text-sm'
      : pengaturanSurat.ukuranFont === 'besar'
        ? 'text-base sm:text-lg'
        : 'text-sm sm:text-base';

  const visibleSignatureCount =
    (pengaturanSurat.tampilkanTtdPeminjam ? 1 : 0) +
    (pengaturanSurat.tampilkanTtdPerlengkapan ? 1 : 0) +
    (pengaturanSurat.tampilkanTtdKetuaPondok ? 1 : 0);

  const logoSrc =
    !systemConfig.logoUrl ||
    systemConfig.logoUrl.includes('logo_pesantren_almaliki')
      ? '/logo-pondok.png'
      : systemConfig.logoUrl;

  const qrBlock = (
    <div className="flex items-center gap-3 shrink-0 avoid-break">
      {qrUrl ? (
        <div className="p-2 bg-white border-2 border-neutral-900 rounded-xl shadow-xs shrink-0">
          <img
            src={qrUrl}
            alt="QR Code Pengembalian Barang"
            width={148}
            height={148}
            className="official-qr-code w-[148px] h-[148px] min-w-[148px] min-h-[148px] object-contain bg-white block"
          />
        </div>
      ) : (
        <div className="w-[148px] h-[148px] bg-neutral-100 rounded-xl animate-pulse shrink-0" />
      )}
      <div className="max-w-[175px]">
        <p className="text-[9px] text-neutral-500 uppercase font-mono font-bold">
          QR PENGEMBALIAN ASET
        </p>
        <p className="text-xs font-black text-emerald-800 flex items-center gap-1 mt-0.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Disetujui Ketua Pondok</span>
        </p>
        <p className="text-[9px] text-neutral-800 font-mono font-bold mt-1 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-300 inline-block break-all">
          ID: {pinjam.id}
        </p>
        <p className="text-[8.5px] sm:text-[9px] text-neutral-600 mt-1 leading-tight font-mono">
          Pindai QR ini pada menu Scan QR Pengembalian Barang saat aset dikembalikan.
        </p>
      </div>
    </div>
  );

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
        <div
          className={`surat-print-sheet a4-print-canvas flex-1 overflow-y-auto overscroll-contain p-4 sm:p-7 md:p-9 font-sans bg-white text-slate-900 ${fontScaleClass}`}
        >
          {/* Optional Official Kop Surat */}
          {pengaturanSurat.tampilkanKopSurat && (
            <>
              <div className="avoid-break flex items-center justify-between pb-3 border-b-2 border-emerald-900 text-center gap-2 sm:gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-amber-500/80 shrink-0 overflow-hidden bg-white p-0.5">
                  <img
                    src={logoSrc}
                    alt={systemConfig.namaPondok || 'Logo Pondok'}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      if (!img.dataset.fallbackApplied) {
                        img.dataset.fallbackApplied = '1';
                        img.src = '/logo-pondok.png';
                      }
                    }}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0 px-1">
                  <p className="font-serif text-emerald-900 text-xs sm:text-sm mb-0.5 tracking-wider font-semibold">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                  <h2 className="text-xs sm:text-base font-black tracking-tight text-emerald-950 uppercase leading-snug">
                    {systemConfig.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI'}
                  </h2>
                  <p className="text-[10px] sm:text-xs font-bold text-amber-900 uppercase">
                    {systemConfig.perlengkapanConfig?.namaUnitPerlengkapan ||
                      'BAGIAN PERLENGKAPAN, INVENTARIS & SARANA PRASARANA'}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-neutral-600 mt-0.5 leading-tight">
                    {systemConfig.alamatPondok ||
                      'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361'}
                    {systemConfig.hotlineWa ? ` | Hotline: ${systemConfig.hotlineWa}` : ''}
                  </p>
                </div>
                <div className="w-14 sm:w-16 hidden sm:block shrink-0" />
              </div>
              <div className="h-0.5 bg-amber-500 mt-1 mb-4" />
            </>
          )}

          {/* Header / Judul & Nomor Surat */}
          <div className="text-center mb-4">
            <h3
              className={`${titleScaleClass} font-black uppercase tracking-wider text-emerald-950 underline underline-offset-4`}
            >
              {pengaturanSurat.judulSurat}
            </h3>
            <p className="text-[11px] sm:text-xs text-neutral-700 font-mono mt-1 font-semibold">
              Nomor Surat: {pinjam.nomorSurat}
            </p>
          </div>

          {/* Teks Pembuka */}
          <p className="text-neutral-800 mb-3.5 text-justify whitespace-pre-line">
            {pengaturanSurat.teksPembuka}
          </p>

          {/* Identitas Peminjam */}
          <div className="avoid-break bg-emerald-50/40 rounded-xl p-3 sm:p-4 border border-emerald-900/20 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
              <div className="flex">
                <span className="w-36 text-neutral-600 shrink-0 font-medium">Nama Peminjam</span>
                <span className="font-bold text-neutral-950">: {pinjam.namaPeminjam}</span>
              </div>
              <div className="flex">
                <span className="w-36 text-neutral-600 shrink-0 font-medium">
                  Status / Divisi / Kamar
                </span>
                <span className="font-semibold text-neutral-900">
                  : {pinjam.statusDivisiKamar}
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-36 text-neutral-600 shrink-0 font-medium inline-flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-800" /> Nomor HP / WA
                </span>
                <span className="font-mono text-neutral-900">: {pinjam.nomorHp}</span>
              </div>
              <div className="flex items-center">
                <span className="w-36 text-neutral-600 shrink-0 font-medium inline-flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-800" /> Status Persetujuan
                </span>
                <span className="font-bold text-emerald-800">: {pinjam.status}</span>
              </div>
              <div className="flex items-center">
                <span className="w-36 text-neutral-600 shrink-0 font-medium inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-800" /> Tanggal Pinjam
                </span>
                <span className="font-mono font-semibold text-neutral-900">
                  : {pinjam.tanggalPinjam}
                </span>
              </div>
              <div className="flex items-center">
                <span className="w-36 text-neutral-600 shrink-0 font-medium inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-rose-700" /> Estimasi Kembali
                </span>
                <span className="font-mono font-bold text-rose-800">
                  : {pinjam.estimasiTanggalKembali}
                </span>
              </div>
              {pinjam.keperluan && (
                <div className="flex sm:col-span-2 pt-1 border-t border-emerald-900/10">
                  <span className="w-36 text-neutral-600 shrink-0 font-medium">Keperluan</span>
                  <span className="text-neutral-900">: {pinjam.keperluan}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabel Perincian Barang */}
          <div className="avoid-break mb-4">
            <p className="font-bold text-emerald-950 uppercase text-[11px] tracking-wider mb-1.5">
              Daftar Perincian Barang yang Dipinjam:
            </p>
            <table className="a4-print-table w-full border-collapse border border-neutral-800 text-left">
              <thead>
                <tr className="bg-emerald-950 text-white text-[10.5px] uppercase font-mono">
                  <th className="border border-neutral-800 py-2 px-2.5 text-center w-10">No</th>
                  <th className="border border-neutral-800 py-2 px-3">Nama Barang</th>
                  <th className="border border-neutral-800 py-2 px-3 text-center w-32">
                    Jumlah / Unit
                  </th>
                  <th className="border border-neutral-800 py-2 px-3 w-40">Kondisi Awal</th>
                </tr>
              </thead>
              <tbody>
                {pinjam.daftarBarang.map((item, idx) => (
                  <tr key={item.id || idx} className="odd:bg-white even:bg-neutral-50">
                    <td className="border border-neutral-800 py-2 px-2.5 text-center font-mono">
                      {idx + 1}
                    </td>
                    <td className="border border-neutral-800 py-2 px-3 font-semibold text-neutral-950">
                      {item.namaBarang}
                    </td>
                    <td className="border border-neutral-800 py-2 px-3 text-center font-mono font-bold">
                      {item.jumlah} {item.satuan}
                    </td>
                    <td className="border border-neutral-800 py-2 px-3 text-neutral-800">
                      {item.kondisiAwal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ketentuan Tanggung Jawab / Teks Penutup */}
          <div className="avoid-break rounded-xl bg-amber-50/70 border border-amber-400/70 p-3 mb-5 text-neutral-800 text-justify whitespace-pre-line">
            {pengaturanSurat.teksPenutup}
          </div>

          {/* Kolom Tanda Tangan */}
          {visibleSignatureCount > 0 && (
            <div className="avoid-break mb-5">
              <p className="text-right text-[11px] text-neutral-700 font-mono mb-3">
                {systemConfig.kotaInstansi || 'Karawang'},{' '}
                {new Date().toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <div
                className={`grid gap-4 text-center ${
                  visibleSignatureCount === 1
                    ? 'grid-cols-1 max-w-xs mx-auto'
                    : visibleSignatureCount === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-3'
                }`}
              >
                {pengaturanSurat.tampilkanTtdPeminjam && (
                  <div className="flex flex-col items-center justify-between min-h-[115px] p-2">
                    <div>
                      <p className="text-[10px] text-neutral-600">Pihak Peminjam,</p>
                      <p className="font-bold text-neutral-900 text-[11px]">
                        {pinjam.statusDivisiKamar}
                      </p>
                    </div>
                    <div className="h-12 flex items-center justify-center">
                      <span className="font-serif italic text-xs text-neutral-400">
                        ( Tanda Tangan )
                      </span>
                    </div>
                    <div className="w-full">
                      <p className="font-bold text-neutral-950 underline underline-offset-2 text-[11px] truncate">
                        {pinjam.namaPeminjam}
                      </p>
                      <p className="text-[9px] text-neutral-500 font-mono">
                        HP: {pinjam.nomorHp}
                      </p>
                    </div>
                  </div>
                )}

                {pengaturanSurat.tampilkanTtdPerlengkapan && (
                  <div className="flex flex-col items-center justify-between min-h-[115px] p-2">
                    <div>
                      <p className="text-[10px] text-neutral-600">Mengetahui,</p>
                      <p className="font-bold text-neutral-900 text-[11px]">
                        {pengaturanSurat.jabatanKetuaPerlengkapan}
                      </p>
                    </div>
                    <div className="relative h-12 flex items-center justify-center">
                      <div className="text-[7.5px] font-bold text-emerald-900/45 uppercase rotate-[-6deg] border border-emerald-700/45 px-2 py-0.5 rounded-xs">
                        BAG. PERLENGKAPAN
                      </div>
                    </div>
                    <div className="w-full">
                      <p className="font-bold text-neutral-950 underline underline-offset-2 text-[11px] truncate">
                        {pengaturanSurat.namaKetuaPerlengkapan}
                      </p>
                      <p className="text-[9px] text-neutral-500 font-mono">
                        Pengurus Perlengkapan
                      </p>
                    </div>
                  </div>
                )}

                {pengaturanSurat.tampilkanTtdKetuaPondok && (
                  <div className="flex flex-col items-center justify-between min-h-[115px] p-2">
                    <div>
                      <p className="text-[10px] text-neutral-600">Menyetujui / ACC,</p>
                      <p className="font-bold text-neutral-900 text-[11px]">
                        {pengaturanSurat.jabatanKetuaPondok}
                      </p>
                    </div>
                    <div className="relative h-12 flex items-center justify-center">
                      <div className="text-[8px] font-extrabold text-emerald-800/65 uppercase rotate-[-7deg] border-2 border-emerald-700/55 px-2 py-0.5 rounded-sm">
                        DISETUJUI KETUA PONDOK
                      </div>
                    </div>
                    <div className="w-full">
                      <p className="font-bold text-neutral-950 underline underline-offset-2 text-[11px] truncate">
                        {pinjam.diverifikasiOleh || pengaturanSurat.namaKetuaPondok}
                      </p>
                      <p className="text-[9px] text-neutral-500 font-mono">
                        {pinjam.waktuVerifikasi
                          ? `ACC: ${pinjam.waktuVerifikasi}`
                          : pengaturanSurat.jabatanKetuaPondok}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer QR Code Verifikasi Pengembalian (Posisi Kiri Bawah / Kanan Bawah) */}
          <div
            className={`avoid-break pt-3 border-t border-dashed border-neutral-300 flex flex-col sm:flex-row items-center justify-between gap-4 ${
              pengaturanSurat.posisiQrCode === 'kanan_bawah' ? 'sm:flex-row-reverse' : ''
            }`}
          >
            {qrBlock}

            <div
              className={`text-[10px] text-neutral-600 max-w-xs ${
                pengaturanSurat.posisiQrCode === 'kanan_bawah'
                  ? 'text-center sm:text-left'
                  : 'text-center sm:text-right'
              }`}
            >
              <p className="font-bold text-neutral-800 uppercase font-mono">
                Dokumen Resmi Terintegrasi Cloud
              </p>
              <p className="mt-0.5 leading-relaxed">
                QR Code terhubung langsung ke sistem inventaris Perlengkapan untuk verifikasi
                pengembalian barang secara real-time.
              </p>
              {pinjam.waktuKembali && (
                <p className="mt-1 font-mono font-bold text-emerald-800">
                  Dikembalikan: {pinjam.waktuKembali}
                </p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
};
