import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { Perizinan } from '../types';
import { Printer, Share2, X, CheckCircle2, ShieldCheck, Clock, Calendar } from 'lucide-react';
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

  // Generate QR Code as soon as izin is provided
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

  // Manage print isolation state and Escape key
  useEffect(() => {
    if (izin) {
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
  }, [izin, onClose]);

  if (!izin) return null;

  const handlePrint = async () => {
    // Pastikan QR code sudah siap sebelum memanggil window.print()
    if (!qrUrl) {
      try {
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
        const url = await QRCode.toDataURL(qrPayload, {
          width: 140,
          margin: 1,
          color: {
            dark: '#064E3B',
            light: '#FFFFFF'
          }
        });
        setQrUrl(url);
      } catch (e) {
        console.error('Failed to generate QR Code:', e);
      }
    }

    // Otomatis ubah status izin santri menjadi 'Sedang Keluar' agar langsung masuk ke Radar Monitoring (Admin & Pengurus)
    if (izin.status === 'Disetujui' || izin.status === 'Diverifikasi' || izin.status === 'Diajukan') {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      const dateStr = now.toISOString().split('T')[0];
      const updated: Perizinan = {
        ...izin,
        status: 'Sedang Keluar',
        actualKeluar: `${dateStr} ${timeStr}`,
        petugasKeluar: izin.petugasKeluar || 'Petugas Cetak Gerbang',
      };
      storageService.savePerizinan(updated, 'Surat izin dicetak - santri resmi berangkat & masuk radar monitoring');
      storageService.addLog(
        'Cetak Surat & Masuk Radar',
        `Surat izin ${izin.nomorIzin} santri ${izin.santriNama} dicetak. Status: Sedang Keluar dan otomatis masuk ke Radar Monitoring Admin & Pengurus.`,
        'gerbang'
      );
      storageService.addNotification({
        judul: `Santri Berangkat: ${izin.santriNama}`,
        pesan: `Surat izin ${izin.nomorIzin} dicetak. Santri keluar menuju ${izin.tujuan}. Terpantau di Radar Monitoring. Batas kembali: ${izin.tglKembali} ${izin.jamKembali} WIB.`,
        tipe: 'info',
        linkMenu: 'monitoring',
        noWaTujuan: izin.noWaPenjemput,
      });
    }

    // Tandai body untuk isolasi cetak sempurna
    document.body.classList.add('printing-letter');
    
    // Beri jeda 80ms untuk memastikan render layout browser selesai
    setTimeout(() => {
      window.print();
    }, 80);
  };

  const handleShareWA = () => {
    const text = WhatsAppTemplates.izinDisetujui(izin);
    const url = createWhatsAppUrl(izin.noWaPenjemput, text);
    window.open(url, '_blank');
  };

  const modalContent = (
    <div 
      onClick={onClose}
      className="surat-print-overlay fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="surat-print-modal relative w-full max-w-xl sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white text-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden rainbow-active-border card-3d-floating"
      >
        
        {/* Action Header (Hidden in Print, Always Visible & Sticky at Top) */}
        <div className="no-print shrink-0 flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-slate-100 border-b border-slate-800 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black tracking-wide text-amber-300 font-sans uppercase truncate">
                Surat Izin Digital Resmi
              </h3>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate">
                {izin.nomorIzin} · Terverifikasi Sah
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleShareWA}
              className="tactile-interactive inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 rounded-lg sm:rounded-xl transition-all cursor-pointer shadow-md border border-amber-300/60"
              title="Kirim ke WhatsApp Wali"
            >
              <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Kirim WA</span>
            </button>
            <button
              onClick={handlePrint}
              className="tactile-interactive inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-mono font-bold text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg sm:rounded-xl transition-all cursor-pointer shadow-md"
              title="Cetak Surat Izin"
            >
              <Printer className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400" />
              <span className="hidden xs:inline">Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg sm:rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-[11px] sm:text-xs font-mono font-bold transition-all cursor-pointer shadow-md active:scale-95"
              title="Tutup Surat (ESC)"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tutup</span>
            </button>
          </div>
        </div>

        {/* Printable Official Letter Container */}
        <div className="surat-print-sheet flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-8 font-sans bg-amber-50/20 text-slate-900">
          
          {/* Pesantren Official Letterhead (Kop Surat) */}
          <div className="avoid-break flex items-center justify-between pb-3 sm:pb-4 border-b-2 border-emerald-900 text-center relative gap-2 sm:gap-3">

            <img 
              src={systemConfig.logoUrl || "/src/assets/images/logo_pesantren_almaliki_1794050742981.jpg"} 
              alt={systemConfig.namaPondok || "Logo Al-Maliki"} 
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-full border border-amber-500 shadow-xs shrink-0"
            />
            <div className="flex-1 px-1 sm:px-2 min-w-0">
              <p className="font-serif text-emerald-900 text-xs sm:text-sm mb-0.5 tracking-wider font-semibold">
                {layout.teksBismillah || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
              </p>
              <h2 className="text-xs sm:text-base font-black tracking-tight text-emerald-950 uppercase leading-snug">
                {layout.kopNamaInstansi || systemConfig.namaPondok || "Pondok Pesantren Salaf Al-Maliki"}
              </h2>
              <p className="text-[10px] sm:text-xs font-bold text-amber-900">
                {layout.kopSubInstansi || "DEWAN KEAMANAN DAN KETERTIBAN SANTRI (KAMTIB)"}
              </p>
              <p className="text-[9px] sm:text-[10px] text-neutral-600 mt-0.5 leading-tight">
                {layout.kopAlamatKontak || "Jl. Pesantren Luhur No. 99, Karawang | Hotline: 0812-3456-7800"}
              </p>
            </div>
            <div className="w-12 sm:w-16 hidden sm:block shrink-0"></div>
          </div>

          <div className="h-0.5 bg-amber-500 my-1"></div>

          {/* Letter Title & Number */}
          <div className="text-center my-3 sm:my-3.5">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-950 underline underline-offset-4">
              {layout.judulSurat || 'SURAT KETERANGAN IZIN KELUAR / PULANG'}
            </h3>
            <p className="text-[10px] sm:text-xs text-neutral-600 font-mono mt-0.5">
              Nomor: {izin.nomorIzin}
            </p>
          </div>

          {/* Statement Body */}
          <p className="text-[11px] sm:text-xs leading-relaxed text-neutral-800 mb-3 text-justify">
            {layout.kalimatPembuka || 'Pengurus Dewan Keamanan Pondok Pesantren Salaf Al-Maliki dengan ini menerangkan bahwa santri yang tercantum di bawah ini telah mendapatkan izin resmi dengan ketentuan sebagai berikut:'}
          </p>

          {/* Santri Data Grid */}
          <div className="avoid-break bg-white rounded-xl p-3 sm:p-3.5 border border-emerald-900/15 shadow-xs mb-3 text-[11px] sm:text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-3">
              <div className="flex">
                <span className="w-28 sm:w-32 text-neutral-500 shrink-0">Nama Santri</span>
                <span className="font-semibold text-neutral-900 truncate">: {izin.santriNama}</span>
              </div>
              <div className="flex">
                <span className="w-28 sm:w-32 text-neutral-500 shrink-0">Nomor Induk (NIS)</span>
                <span className="font-mono text-neutral-900">: {izin.santriNis}</span>
              </div>
              <div className="flex">
                <span className="w-28 sm:w-32 text-neutral-500 shrink-0">Kelas / Marhalah</span>
                <span className="text-neutral-900">: {izin.santriKelas}</span>
              </div>
              <div className="flex">
                <span className="w-28 sm:w-32 text-neutral-500 shrink-0">Kamar / Asrama</span>
                <span className="text-neutral-900">: {izin.santriKamar}</span>
              </div>
              <div className="flex">
                <span className="w-28 sm:w-32 text-neutral-500 shrink-0">Jenis Perizinan</span>
                <span className="font-semibold text-emerald-800">: {izin.jenisIzin}</span>
              </div>
              <div className="flex">
                <span className="w-28 sm:w-32 text-neutral-500 shrink-0">Penjemput</span>
                <span className="text-neutral-900 truncate">: {izin.namaPenjemput} ({izin.hubunganPenjemput})</span>
              </div>
            </div>
          </div>

          {/* Schedule & Destination Card */}
          <div className="avoid-break border border-amber-300 bg-amber-50/50 rounded-xl p-3 mb-3 text-[11px] sm:text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <p className="text-[10px] font-medium text-amber-900 uppercase tracking-wide flex items-center gap-1 mb-0.5">
                  <Calendar className="w-3 h-3 text-emerald-800" />
                  Waktu Mulai Keluar
                </p>
                <p className="font-semibold text-neutral-900 text-xs sm:text-sm">
                  {izin.tglKeluar} <span className="font-mono text-emerald-800">[{izin.jamKeluar} WIB]</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-amber-900 uppercase tracking-wide flex items-center gap-1 mb-0.5">
                  <Clock className="w-3 h-3 text-red-700" />
                  Batas Maksimal Kembali
                </p>
                <p className="font-bold text-red-800 text-xs sm:text-sm">
                  {izin.tglKembali} <span className="font-mono">[{izin.jamKembali} WIB]</span>
                </p>
              </div>
              <div className="sm:col-span-2 pt-1.5 border-t border-amber-200">
                <p className="text-[10px] text-neutral-500">Tujuan & Alasan:</p>
                <p className="font-medium text-neutral-900">{izin.tujuan} - <span className="italic text-neutral-700">{izin.alasan}</span></p>
              </div>
            </div>
          </div>

          {/* Rules & Responsibilities */}
          <div className="avoid-break text-[10px] sm:text-[11px] text-neutral-600 bg-neutral-50 p-2.5 sm:p-3 rounded-lg border border-neutral-200 mb-4">
            <p className="font-semibold text-neutral-800 mb-0.5">Ketentuan Santri Selama di Luar Pondok:</p>
            <ol className="list-decimal pl-3.5 space-y-0.5">
              <li>{layout.ketentuanPoin1 || 'Wajib menjaga akhlaqul karimah, adab santri, dan shalat lima waktu berjamaah.'}</li>
              <li>{layout.ketentuanPoin2 || 'Menunjukkan surat izin ini kepada Petugas Gerbang saat keluar dan kembali.'}</li>
              <li>{layout.ketentuanPoin3 || 'Wajib kembali tepat waktu. Keterlambatan tanpa keterangan akan dikenakan takzir edukatif.'}</li>
            </ol>
          </div>

          {/* Validation & Official Signatures Row */}
          <div className="avoid-break flex flex-col sm:flex-row items-center sm:items-end justify-between gap-3 pt-1">
            
            {/* QR Code Validation */}
            {layout.tampilkanQrCode !== false && (
              <div className="flex items-center gap-2.5">
                {qrUrl ? (
                  <img src={qrUrl} alt="QR Code Verifikasi" className="w-14 h-14 sm:w-16 sm:h-16 border border-emerald-900/20 rounded-lg p-0.5 bg-white shadow-xs" />
                ) : (
                  <div className="w-14 h-14 bg-neutral-100 rounded-lg animate-pulse" />
                )}
                <div>
                  <p className="text-[8px] sm:text-[9px] text-neutral-500 uppercase font-semibold">Status Validasi</p>
                  <p className="text-[11px] sm:text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Terverifikasi Sah
                  </p>
                  <p className="text-[8px] sm:text-[9px] text-neutral-500 mt-0.5 max-w-[130px] leading-tight font-mono">
                    Pindai QR di Pos Gerbang untuk verifikasi keaslian.
                  </p>
                </div>
              </div>
            )}

            {/* Signature 1: Pengurus Pencatat */}
            <div className="text-center text-[11px] w-36 sm:w-40">
              <p className="text-neutral-500 text-[9px] font-mono">Diajukan & Dicatat:</p>
              <p className="font-medium text-neutral-800 text-[10px]">Pengurus Keamanan</p>
              
              <div className="relative h-10 sm:h-12 flex items-center justify-center my-0.5">
                <div className="absolute text-[7px] font-bold text-blue-900/40 uppercase rotate-[-6deg] border border-blue-600/40 px-1.5 py-0.5 rounded-xs">
                  TERCATAT SISTEM
                </div>
                <p className="font-serif italic text-xs sm:text-sm text-blue-950 font-bold z-10 truncate px-2">
                  {izin.petugasPencatat || 'Petugas Keamanan'}
                </p>
              </div>
              
              <p className="font-bold text-neutral-900 underline underline-offset-2 text-[10px] sm:text-[11px] truncate">
                {izin.petugasPencatat || 'Petugas Keamanan'}
              </p>
              <p className="text-[8px] sm:text-[9px] text-neutral-500 font-mono">Petugas Pencatat</p>
            </div>

            {/* Signature 2: Pejabat / Pengurus Penyetujui Resmi */}
            <div className="text-center text-[11px] w-40 sm:w-44">
              <p className="text-neutral-500 text-[9px] font-mono">
                {layout.kotaTerbit || 'Karawang'}, {izin.tglPengajuan.split(' ')[0]}
              </p>
              <p className="font-medium text-neutral-800 text-[10px]">
                {layout.jabatanPenandatangan || 'Ketua Dewan Keamanan'},
              </p>
              
              {/* Stamp & Signature simulation */}
              <div className="relative h-10 sm:h-12 flex items-center justify-center my-0.5">
                {layout.tampilkanStempelSah !== false && (
                  <div className="absolute text-[8px] font-bold text-emerald-900/40 uppercase rotate-[-8deg] border-2 border-emerald-700/40 px-2 py-0.5 rounded-sm">
                    TERVERIFIKASI SAH
                  </div>
                )}
                <p className="font-serif italic text-xs sm:text-sm text-emerald-950 font-bold z-10 truncate px-2">
                  {izin.disetujuiOleh || layout.namaPenandatangan || 'Abdul Rohman'}
                </p>
              </div>
              
              <p className="font-bold text-neutral-900 underline underline-offset-2 text-[10px] sm:text-[11px] truncate">
                {izin.disetujuiOleh 
                  ? `Ustadz ${izin.disetujuiOleh}` 
                  : (layout.gelarPenandatangan || 'Ustadz Abdul Rohman, S.Pd.I')}
              </p>
              <p className="text-[8px] sm:text-[9px] text-neutral-500">
                {layout.jabatanPenandatangan || 'Ketua Dewan Keamanan'}
              </p>
            </div>

          </div>

        </div>

        {/* Bottom Action Footer (Hidden in Print) - Memastikan tombol tutup selalu mudah diakses */}
        <div className="no-print shrink-0 px-4 py-2.5 bg-slate-100 border-t border-slate-300 flex items-center justify-between text-xs font-mono text-slate-600">
          <span className="text-[10px] hidden sm:inline">Tekan ESC atau klik luar untuk menutup surat</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 font-bold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tutup Surat</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

