import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Perizinan } from '../types';
import { Printer, Share2, X, CheckCircle2, ShieldCheck, Clock, Calendar, Check } from 'lucide-react';
import { WhatsAppTemplates, createWhatsAppUrl } from '../services/waService';
import { storageService } from '../services/storageService';

interface SuratIzinModalProps {
  izin: Perizinan | null;
  onClose: () => void;
}

export const SuratIzinModal: React.FC<SuratIzinModalProps> = ({ izin, onClose }) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const systemConfig = storageService.getSystemConfig();
  const layout = systemConfig.suratIzinLayout || {};

  useEffect(() => {
    if (izin) {
      const qrPayload = JSON.stringify({
        nomor: izin.nomorIzin,
        santri: izin.santriNama,
        nis: izin.santriNis,
        status: izin.status,
        pengaju: izin.petugasPencatat || 'Pengurus Keamanan',
        penyetujui: izin.disetujuiOleh || layout.namaPenandatangan || 'Ketua Keamanan',
        validUntil: `${izin.tglKembali} ${izin.jamKembali}`,
        pesantren: layout.kopNamaInstansi || systemConfig.namaPondok || 'Pondok Pesantren Salaf Al-Maliki'
      });
      QRCode.toDataURL(qrPayload, {
        width: 140,
        margin: 1,
        color: {
          dark: '#064E3B',
          light: '#FFFFFF'
        }
      }).then(url => setQrUrl(url)).catch(() => {});
    }
  }, [izin, systemConfig, layout]);

  if (!izin) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWA = () => {
    const text = WhatsAppTemplates.izinDisetujui(izin);
    const url = createWhatsAppUrl(izin.noWaPenjemput, text);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-700/80 my-8 overflow-hidden rainbow-active-border card-3d-floating">
        
        {/* Action Header (Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-slate-100 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <div>
              <h3 className="text-sm font-black tracking-wide text-amber-300 font-sans uppercase">
                Dokumen Surat Izin Digital Resmi
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Terverifikasi terpusat · Siap dicetak langsung oleh pengurus
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWA}
              className="tactile-interactive inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl transition-all cursor-pointer shadow-md border border-amber-300/60"
              title="Kirim ke WhatsApp Wali"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Kirim WA</span>
            </button>
            <button
              onClick={handlePrint}
              className="tactile-interactive inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cetak Dokumen</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Letter Container */}
        <div className="p-8 sm:p-10 font-sans printable-card bg-amber-50/20">
          
          {/* Pesantren Official Letterhead (Kop Surat) - Editable from Option Panel */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-emerald-900 text-center relative">
            <img 
              src={systemConfig.logoUrl || "/src/assets/images/logo_pesantren_almaliki_1794050742981.jpg"} 
              alt={systemConfig.namaPondok || "Logo Al-Maliki"} 
              className="w-18 h-18 sm:w-20 sm:h-20 object-contain rounded-full border border-amber-500 shadow-xs"
            />
            <div className="flex-1 px-4">
              <p className="font-serif text-emerald-900 text-base sm:text-lg mb-0.5 tracking-wider font-semibold">
                {layout.teksBismillah || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
              </p>
              <h2 className="text-base sm:text-xl font-bold tracking-tight text-emerald-950 uppercase">
                {layout.kopNamaInstansi || systemConfig.namaPondok || "Pondok Pesantren Salaf Al-Maliki"}
              </h2>
              <p className="text-xs sm:text-sm font-medium text-amber-900">
                {layout.kopSubInstansi || "DEWAN KEAMANAN DAN KETERTIBAN SANTRI (KAMTIB)"}
              </p>
              <p className="text-[11px] text-neutral-600 mt-0.5">
                {layout.kopAlamatKontak || "Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361 | Hotline: 0812-3456-7800"}
              </p>
            </div>
            <div className="w-18 hidden sm:block"></div>
          </div>

          <div className="h-0.5 bg-amber-500 my-1"></div>

          {/* Letter Title & Number - Editable from Option Panel */}
          <div className="text-center my-4">
            <h3 className="text-base font-bold uppercase tracking-wider text-emerald-950 underline underline-offset-4">
              {layout.judulSurat || 'SURAT KETERANGAN IZIN KELUAR / PULANG'}
            </h3>
            <p className="text-xs text-neutral-600 font-mono mt-1">
              Nomor: {izin.nomorIzin}
            </p>
          </div>

          {/* Statement Body - Editable from Option Panel */}
          <p className="text-xs leading-relaxed text-neutral-800 mb-4">
            {layout.kalimatPembuka || 'Pengurus Dewan Keamanan Pondok Pesantren Salaf Al-Maliki dengan ini menerangkan bahwa santri yang tercantum di bawah ini telah mendapatkan izin resmi dengan ketentuan sebagai berikut:'}
          </p>

          {/* Santri Data Grid */}
          <div className="bg-white rounded-xl p-4 border border-emerald-900/15 shadow-xs mb-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
              <div className="flex">
                <span className="w-32 text-neutral-500 shrink-0">Nama Santri</span>
                <span className="font-semibold text-neutral-900">: {izin.santriNama}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-neutral-500 shrink-0">Nomor Induk (NIS)</span>
                <span className="font-mono text-neutral-900">: {izin.santriNis}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-neutral-500 shrink-0">Kelas / Marhalah</span>
                <span className="text-neutral-900">: {izin.santriKelas}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-neutral-500 shrink-0">Kamar / Asrama</span>
                <span className="text-neutral-900">: {izin.santriKamar}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-neutral-500 shrink-0">Jenis Perizinan</span>
                <span className="font-semibold text-emerald-800">: {izin.jenisIzin}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-neutral-500 shrink-0">Penjemput</span>
                <span className="text-neutral-900">: {izin.namaPenjemput} ({izin.hubunganPenjemput})</span>
              </div>
            </div>
          </div>

          {/* Schedule & Destination Card */}
          <div className="border border-amber-300 bg-amber-50/50 rounded-xl p-3.5 mb-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-medium text-amber-900 uppercase tracking-wide flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3 text-emerald-800" />
                  Waktu Mulai Keluar
                </p>
                <p className="font-semibold text-neutral-900 text-sm">
                  {izin.tglKeluar} <span className="font-mono text-emerald-800">[{izin.jamKeluar} WIB]</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-amber-900 uppercase tracking-wide flex items-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-red-700" />
                  Batas Maksimal Kembali
                </p>
                <p className="font-bold text-red-800 text-sm">
                  {izin.tglKembali} <span className="font-mono">[{izin.jamKembali} WIB]</span>
                </p>
              </div>
              <div className="sm:col-span-2 pt-2 border-t border-amber-200">
                <p className="text-[11px] text-neutral-500">Tujuan & Alasan:</p>
                <p className="font-medium text-neutral-900">{izin.tujuan} - <span className="italic text-neutral-700">{izin.alasan}</span></p>
              </div>
            </div>
          </div>

          {/* Rules & Responsibilities - Editable from Option Panel */}
          <div className="text-[11px] text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-200 mb-5">
            <p className="font-semibold text-neutral-800 mb-1">Ketentuan Santri Selama di Luar Pondok:</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>{layout.ketentuanPoin1 || 'Wajib menjaga akhlaqul karimah, adab santri, dan shalat lima waktu berjamaah.'}</li>
              <li>{layout.ketentuanPoin2 || 'Menunjukkan surat izin ini kepada Petugas Gerbang saat keluar dan kembali.'}</li>
              <li>{layout.ketentuanPoin3 || 'Wajib kembali tepat waktu. Keterlambatan tanpa keterangan akan dikenakan takzir edukatif.'}</li>
            </ol>
          </div>

          {/* Validation & Official Signatures Row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 pt-1">
            
            {/* QR Code Validation */}
            {layout.tampilkanQrCode !== false && (
              <div className="flex items-center gap-3">
                {qrUrl ? (
                  <img src={qrUrl} alt="QR Code Verifikasi" className="w-20 h-20 border border-emerald-900/20 rounded-lg p-1 bg-white shadow-xs" />
                ) : (
                  <div className="w-20 h-20 bg-neutral-100 rounded-lg animate-pulse" />
                )}
                <div>
                  <p className="text-[9px] text-neutral-500 uppercase font-semibold">Status Validasi</p>
                  <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Terverifikasi Sah
                  </p>
                  <p className="text-[9px] text-neutral-500 mt-0.5 max-w-[140px] leading-tight font-mono">
                    Pindai QR di Pos Gerbang untuk verifikasi keaslian surat.
                  </p>
                </div>
              </div>
            )}

            {/* Signature 1: Pengurus Pencatat / Pemohon Izin */}
            <div className="text-center text-xs w-40">
              <p className="text-neutral-500 text-[10px] font-mono">Diajukan & Dicatat:</p>
              <p className="font-medium text-neutral-800 text-[11px]">Pengurus Keamanan</p>
              
              <div className="relative h-14 flex items-center justify-center my-0.5">
                <div className="absolute text-[8px] font-bold text-blue-900/40 uppercase rotate-[-6deg] border border-blue-600/40 px-2 py-0.5 rounded-xs">
                  TERCATAT SISTEM
                </div>
                <p className="font-serif italic text-sm text-blue-950 font-bold z-10">
                  {izin.petugasPencatat || 'Petugas Keamanan'}
                </p>
              </div>
              
              <p className="font-bold text-neutral-900 underline underline-offset-2 text-[11px]">
                {izin.petugasPencatat || 'Petugas Keamanan'}
              </p>
              <p className="text-[9px] text-neutral-500 font-mono">Petugas Pencatat</p>
            </div>

            {/* Signature 2: Pejabat / Pengurus Penyetujui Resmi */}
            <div className="text-center text-xs w-48">
              <p className="text-neutral-500 text-[10px] font-mono">
                {layout.kotaTerbit || 'Karawang'}, {izin.tglPengajuan.split(' ')[0]}
              </p>
              <p className="font-medium text-neutral-800 text-[11px]">
                {layout.jabatanPenandatangan || 'Ketua Dewan Keamanan'},
              </p>
              
              {/* Stamp & Signature simulation */}
              <div className="relative h-14 flex items-center justify-center my-0.5">
                {layout.tampilkanStempelSah !== false && (
                  <div className="absolute text-[9px] font-bold text-emerald-900/40 uppercase rotate-[-8deg] border-2 border-emerald-700/40 px-2.5 py-0.5 rounded-sm">
                    TERVERIFIKASI SAH
                  </div>
                )}
                <p className="font-serif italic text-base text-emerald-950 font-bold z-10">
                  {izin.disetujuiOleh || layout.namaPenandatangan || 'Abdul Rohman'}
                </p>
              </div>
              
              <p className="font-bold text-neutral-900 underline underline-offset-2 text-[11px]">
                {izin.disetujuiOleh 
                  ? `Ustadz ${izin.disetujuiOleh}` 
                  : (layout.gelarPenandatangan || 'Ustadz Abdul Rohman, S.Pd.I')}
              </p>
              <p className="text-[9px] text-neutral-500">
                {layout.jabatanPenandatangan || 'Ketua Dewan Keamanan'}
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
