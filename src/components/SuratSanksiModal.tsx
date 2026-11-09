import React, { useState } from 'react';
import QRCode from 'qrcode';
import { Sanksi, Santri, SuratSanksiLayoutConfig } from '../types';
import { 
  Printer, 
  Share2, 
  X, 
  GraduationCap, 
  ShieldCheck, 
  Edit3, 
  CheckCircle2, 
  FileText,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  Save,
  RotateCcw
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { createWhatsAppUrl } from '../services/waService';

interface SuratSanksiModalProps {
  sanksi: Sanksi | null;
  santriList: Santri[];
  onClose: () => void;
  onSanksiUpdated?: (updated: Sanksi) => void;
}

export const SuratSanksiModal: React.FC<SuratSanksiModalProps> = ({
  sanksi,
  santriList,
  onClose,
  onSanksiUpdated,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const systemConfig = storageService.getSystemConfig();
  
  // Use frozen snapshot if available, otherwise fallback to current systemConfig.suratSanksiLayout
  const activeLayout: SuratSanksiLayoutConfig = sanksi?.snapshotLayout || systemConfig.suratSanksiLayout || {
    teksBismillah: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    kopNamaInstansi: systemConfig.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI',
    kopSubInstansi: 'DEWAN KEAMANAN & PENEGAKAN KODIFIKASI QANUN KETERTIBAN',
    kopAlamatKontak: 'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361 | Hotline: 0812-3456-7800',
    judulSurat: 'SURAT PELANGGARAN DAN SANKSI EDUKATIF',
    formatNomorSurat: 'SNK/MALIKI/{TAHUN}/{ROMAN}/{NOMOR}',
    kalimatPembuka: 'Berdasarkan sidang rekapitulasi kodifikasi qanun ketertiban santri Pondok Pesantren Salaf Al-Maliki, dengan ini diterbitkan Surat Pelanggaran dan Penetapan Sanksi Edukatif kepada santri:',
    tampilkanNis: true,
    tampilkanKelas: true,
    tampilkanKamar: true,
    tampilkanWali: true,
    tampilkanHariTanggal: true,
    tampilkanBatasWaktu: true,
    formatKalimatHukuman: 'Santri yang bersangkutan diwajibkan menyelesaikan takzir edukatif dan pembinaan ibadah/keilmuan sebagai berikut:',
    pesanEdukasi: 'Sanksi ini bersifat edukatif dan pembinaan ruhiyah semata tanpa kekerasan fisik. Santri wajib menyelesaikan dan menyetorkan tugas pembinaan sebelum batas waktu yang telah ditentukan.',
    kotaTerbit: 'Karawang',
    jumlahTandaTangan: 3,
    posisiTandaTangan: 'sejajar',
    jabatanPihak1: 'Santri Pelanggar',
    namaPihak1: 'Santri Bersangkutan',
    gelarPihak1: '(Tanda Tangan & Komitmen)',
    jabatanPihak2: 'Petugas / Dewan Keamanan',
    namaPihak2: 'Ustadz Abdul Rohman, S.Pd.I',
    gelarPihak2: 'Ketua Dewan Keamanan',
    jabatanPihak3: 'Ketua Pondok Pesantren',
    namaPihak3: 'K.H. Syarifuddin Malik',
    gelarPihak3: 'Pengasuh / Pimpinan Pondok',
    footerCatatan: 'Dokumen ini sah diterbitkan secara otomatis oleh SIM Kamtib Al-Maliki dan diarsipkan dalam pangkalan data kedisiplinan pondok.',
    tampilkanStempelSah: true,
  };

  // Find santri detail
  const santriDetail = santriList.find(s => s.id === sanksi?.santriId);

  // Editable local state
  const [editedNomor, setEditedNomor] = useState<string>(
    sanksi?.customNomorSurat || sanksi?.kodeSanksi || 'SNK/MALIKI/2026/XI/001'
  );
  const [editedBentukSanksi, setEditedBentukSanksi] = useState<string>(sanksi?.bentukSanksi || '');
  const [editedBatasMaksimal, setEditedBatasMaksimal] = useState<string>(
    sanksi?.batasMaksimal || `${sanksi?.tanggalTargetSelesai || ''} 17:00 WIB`
  );
  const [editedPembina, setEditedPembina] = useState<string>(sanksi?.ustadzPembina || 'Ustadz Pembimbing');
  const [editedPetugasPenetap, setEditedPetugasPenetap] = useState<string>(
    sanksi?.petugasPenetap || activeLayout.namaPihak2 || 'Ustadz Abdul Rohman, S.Pd.I'
  );
  const [editedKetuaPondok, setEditedKetuaPondok] = useState<string>(
    activeLayout.namaPihak3 || 'K.H. Syarifuddin Malik'
  );
  const [editedCatatan, setEditedCatatan] = useState<string>(sanksi?.catatanPembinaan || '');

  React.useEffect(() => {
    if (sanksi) {
      setEditedNomor(sanksi.customNomorSurat || sanksi.kodeSanksi || 'SNK/MALIKI/2026/XI/001');
      setEditedBentukSanksi(sanksi.bentukSanksi || '');
      setEditedBatasMaksimal(sanksi.batasMaksimal || `${sanksi.tanggalTargetSelesai || ''} 17:00 WIB`);
      setEditedPembina(sanksi.ustadzPembina || 'Ustadz Pembimbing');
      setEditedPetugasPenetap(sanksi.petugasPenetap || activeLayout.namaPihak2 || 'Ustadz Abdul Rohman, S.Pd.I');
      setEditedKetuaPondok(activeLayout.namaPihak3 || 'K.H. Syarifuddin Malik');
      setEditedCatatan(sanksi.catatanPembinaan || '');

      const qrPayload = JSON.stringify({
        dokumen: 'SURAT PELANGGARAN & SANKSI EDUKATIF',
        kode: sanksi.kodeSanksi,
        santri: sanksi.santriNama,
        nis: sanksi.santriNis,
        pelanggaran: sanksi.jenisPelanggaran,
        sanksi: sanksi.bentukSanksi,
        batas: sanksi.batasMaksimal || sanksi.tanggalTargetSelesai,
        instansi: systemConfig.namaPondok,
        status: sanksi.status,
      });

      QRCode.toDataURL(qrPayload, {
        width: 130,
        margin: 1,
        color: {
          dark: '#7F1D1D',
          light: '#FFFFFF'
        }
      }).then(url => setQrUrl(url)).catch(() => {});
    }
  }, [sanksi, systemConfig.namaPondok, activeLayout.namaPihak2, activeLayout.namaPihak3]);

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!sanksi) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSaveEdits = () => {
    const updated: Sanksi = {
      ...sanksi,
      customNomorSurat: editedNomor,
      bentukSanksi: editedBentukSanksi,
      batasMaksimal: editedBatasMaksimal,
      ustadzPembina: editedPembina,
      petugasPenetap: editedPetugasPenetap,
      catatanPembinaan: editedCatatan,
      snapshotLayout: {
        ...activeLayout,
        namaPihak2: editedPetugasPenetap,
        namaPihak3: editedKetuaPondok,
      }
    };
    storageService.saveSanksi(updated, 'Koreksi isi surat sanksi edukatif');
    if (onSanksiUpdated) onSanksiUpdated(updated);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleShareWA = () => {
    const targetWa = santriDetail?.noWaWali || '081234567890';
    const text = `*PONDOK PESANTREN SALAF AL-MALIKI*
*Surat Pelanggaran dan Sanksi Edukatif*
Nomor: ${editedNomor}
─────────────────────────────
Assalamu'alaikum Wr. Wb.

Yth. Orang Tua / Wali dari ananda *${sanksi.santriNama}* (${sanksi.santriNis})
Kelas: ${sanksi.santriKelas || santriDetail?.kelas || '-'}

Dengan ini kami sampaikan surat resmi penetapan sanksi edukatif dan pembinaan karakter santri:
📌 *Hari/Tanggal*: ${sanksi.pelanggaranHari || 'Hari ini'}, ${sanksi.pelanggaranTanggal || sanksi.tanggalPenetapan}
⚠️ *Pelanggaran*: ${sanksi.jenisPelanggaran}
📖 *Bentuk Sanksi Edukatif*: ${editedBentukSanksi}
⏰ *Batas Maksimal Pengumpulan*: ${editedBatasMaksimal}
👤 *Ustadz Pembina*: ${editedPembina}
📌 *Status*: ${sanksi.status}

Sanksi ini ditujukan untuk pembinaan ruhiyah dan kedisiplinan hafalan tanpa kekerasan fisik. Mohon dukungan dan doa restu Bapak/Ibu Wali Santri.

Wassalamu'alaikum Wr. Wb.
*Dewan Keamanan Ponpes Salaf Al-Maliki*`;

    window.open(createWhatsAppUrl(targetWa, text), '_blank');
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl sm:max-w-2xl lg:max-w-3xl max-h-[92vh] sm:max-h-[88vh] flex flex-col bg-white text-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden rainbow-active-border card-3d-floating"
      >
        
        {/* Top Control Bar (Hidden when printed, Always Visible & Sticky at Top) */}
        <div className="no-print shrink-0 flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-slate-100 border-b border-slate-800 gap-2 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black tracking-wide text-amber-300 font-sans uppercase truncate">
                Surat Sanksi Edukatif & Pembinaan
              </h3>
              <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono truncate">
                {editedNomor} · Resmi Ponpes Al-Maliki
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`tactile-interactive inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-mono font-bold rounded-lg sm:rounded-xl transition-all cursor-pointer shadow-md ${
                isEditing 
                  ? 'bg-amber-400 text-slate-950 border border-amber-300' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Edit redaksi atau nama sebelum cetak"
            >
              <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">{isEditing ? 'Batal' : 'Edit'}</span>
            </button>

            <button
              onClick={handleShareWA}
              className="tactile-interactive inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 rounded-lg sm:rounded-xl transition-all cursor-pointer shadow-md border border-emerald-300/60"
              title="Kirim ke WhatsApp Wali Santri"
            >
              <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Kirim WA</span>
            </button>

            <button
              onClick={handlePrint}
              className="tactile-interactive inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-mono font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg sm:rounded-xl transition-all cursor-pointer shadow-md border border-blue-400/50"
              title="Cetak Surat / Simpan PDF"
            >
              <Printer className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-300" />
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

        {/* Edit Panel Drawer (If isEditing is true) */}
        {isEditing && (
          <div className="no-print p-4 bg-slate-900 border-b border-slate-800 text-slate-100 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" />
                Mode Edit Format Surat Sanksi Edukatif
              </span>
              <span className="text-[10px] text-slate-400">
                Perubahan tersimpan langsung pada berkas sanksi ini
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-300 font-bold mb-1">Nomor Surat</label>
                <input
                  type="text"
                  value={editedNomor}
                  onChange={(e) => setEditedNomor(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-300 font-bold mb-1">Batas Maksimal Pengumpulan</label>
                <input
                  type="text"
                  value={editedBatasMaksimal}
                  onChange={(e) => setEditedBatasMaksimal(e.target.value)}
                  placeholder="Misal: 09 November 2026, Pukul 17:00 WIB"
                  className="w-full px-3 py-1.5 bg-black border border-slate-700 rounded-xl text-white font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-300 font-bold mb-1">Uraian Bentuk Sanksi / Hukuman Edukatif</label>
              <textarea
                rows={2}
                value={editedBentukSanksi}
                onChange={(e) => setEditedBentukSanksi(e.target.value)}
                className="w-full px-3 py-1.5 bg-black border border-slate-700 rounded-xl text-white font-sans text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-300 font-bold mb-1">Ustadz Pembimbing</label>
                <input
                  type="text"
                  value={editedPembina}
                  onChange={(e) => setEditedPembina(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black border border-slate-700 rounded-xl text-white font-sans text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-300 font-bold mb-1">Nama Petugas Keamanan</label>
                <input
                  type="text"
                  value={editedPetugasPenetap}
                  onChange={(e) => setEditedPetugasPenetap(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black border border-slate-700 rounded-xl text-white font-sans text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-300 font-bold mb-1">Nama Ketua Pondok / Pihak Berwenang</label>
                <input
                  type="text"
                  value={editedKetuaPondok}
                  onChange={(e) => setEditedKetuaPondok(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black border border-slate-700 rounded-xl text-white font-sans text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSaveEdits}
                className="tactile-interactive inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-bold cursor-pointer shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {saveSuccess && (
          <div className="no-print p-3 bg-emerald-950 border-b border-emerald-500 text-emerald-200 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Perubahan surat sanksi edukatif berhasil disimpan ke database.</span>
          </div>
        )}

        {/* Printable Official Letter Canvas (Scrollable Inside without losing Header) */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-8 font-sans printable-card bg-amber-50/15 text-slate-900 leading-normal">
          
          {/* 1. Official Letterhead (Kop Surat) */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b-2 border-emerald-900 text-center relative gap-2 sm:gap-4">
            <img 
              src={systemConfig.logoUrl || "/src/assets/images/logo_pesantren_almaliki_1794050742981.jpg"} 
              alt={systemConfig.namaPondok || "Logo Al-Maliki"} 
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-full border border-amber-500 shadow-xs shrink-0"
            />
            <div className="flex-1 px-1 sm:px-2 min-w-0">
              <p className="font-serif text-emerald-900 text-xs sm:text-sm mb-0.5 tracking-wider font-semibold">
                {activeLayout.teksBismillah || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
              </p>
              <h2 className="text-xs sm:text-base font-black tracking-tight text-emerald-950 uppercase leading-snug">
                {activeLayout.kopNamaInstansi || systemConfig.namaPondok || "PONDOK PESANTREN SALAF AL-MALIKI"}
              </h2>
              <p className="text-[10px] sm:text-xs font-bold text-amber-900 tracking-wide uppercase">
                {activeLayout.kopSubInstansi || "DEWAN KEAMANAN & PENEGAKAN KODIFIKASI QANUN KETERTIBAN"}
              </p>
              <p className="text-[9px] sm:text-[10px] text-neutral-600 mt-0.5 leading-tight">
                {activeLayout.kopAlamatKontak || "Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361 | Hotline: 0812-3456-7800"}
              </p>
            </div>
            <div className="w-12 sm:w-16 hidden sm:block shrink-0">
              {/* Balancer column */}
            </div>
          </div>

          {/* Double Separator Line */}
          <div className="h-[1.5px] bg-amber-600 mt-1 mb-4" />

          {/* 2. Judul Dokumen & Nomor Surat */}
          <div className="text-center mb-4 sm:mb-5">
            <h1 className="text-xs sm:text-base font-black text-slate-950 uppercase tracking-wide underline decoration-amber-600 decoration-2 underline-offset-4">
              {activeLayout.judulSurat || 'SURAT PELANGGARAN DAN SANKSI EDUKATIF'}
            </h1>
            <p className="text-[10px] sm:text-xs font-mono font-bold text-neutral-700 mt-1">
              Nomor: {editedNomor}
            </p>
          </div>

          {/* 3. Kalimat Pembuka */}
          <p className="text-[11px] sm:text-xs text-justify text-neutral-800 mb-3 leading-relaxed font-sans">
            {activeLayout.kalimatPembuka || 'Berdasarkan sidang rekapitulasi kodifikasi qanun ketertiban santri Pondok Pesantren Salaf Al-Maliki, dengan ini diterbitkan Surat Pelanggaran dan Penetapan Sanksi Edukatif kepada santri:'}
          </p>

          {/* 4. Identitas Santri Table */}
          <div className="bg-white/90 border border-neutral-300 rounded-xl p-4 mb-5 shadow-xs">
            <table className="w-full text-xs text-neutral-800">
              <tbody className="divide-y divide-neutral-200/70">
                <tr>
                  <td className="py-1.5 font-bold w-40 text-neutral-600">Nama Santri</td>
                  <td className="py-1.5 font-black text-neutral-950 text-sm font-sans">{sanksi.santriNama}</td>
                </tr>
                {activeLayout.tampilkanNis !== false && (
                  <tr>
                    <td className="py-1.5 font-bold text-neutral-600">Nomor Induk Santri (NIS)</td>
                    <td className="py-1.5 font-mono font-bold text-neutral-900">{sanksi.santriNis}</td>
                  </tr>
                )}
                {activeLayout.tampilkanKelas !== false && (
                  <tr>
                    <td className="py-1.5 font-bold text-neutral-600">Kelas & Divisi</td>
                    <td className="py-1.5 text-neutral-900">{sanksi.santriKelas || santriDetail?.kelas || '-'} ({sanksi.santriGender === 'putra' ? 'Banin / Putra' : 'Banat / Putri'})</td>
                  </tr>
                )}
                {activeLayout.tampilkanKamar !== false && (
                  <tr>
                    <td className="py-1.5 font-bold text-neutral-600">Kamar / Asrama</td>
                    <td className="py-1.5 text-neutral-900">{sanksi.santriKamar || santriDetail?.kamar || '-'} ({santriDetail?.asrama || 'Komplek Asrama Santri'})</td>
                  </tr>
                )}
                {activeLayout.tampilkanWali !== false && santriDetail?.namaWali && (
                  <tr>
                    <td className="py-1.5 font-bold text-neutral-600">Nama Orang Tua / Wali</td>
                    <td className="py-1.5 text-neutral-900">{santriDetail.namaWali} ({santriDetail.noWaWali})</td>
                  </tr>
                )}
                {activeLayout.tampilkanHariTanggal !== false && (
                  <tr>
                    <td className="py-1.5 font-bold text-neutral-600">Hari & Tanggal Pelanggaran</td>
                    <td className="py-1.5 font-semibold text-rose-800">
                      {sanksi.pelanggaranHari || 'Senin'}, {sanksi.pelanggaranTanggal || sanksi.tanggalPenetapan}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="py-1.5 font-bold text-neutral-600 align-top">Uraian Kasus Pelanggaran</td>
                  <td className="py-1.5 font-semibold text-neutral-950 font-sans">
                    {sanksi.jenisPelanggaran}
                    {sanksi.kronologi && (
                      <div className="text-[11px] font-normal text-neutral-600 italic mt-0.5">
                        Kronologi: {sanksi.kronologi}
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 5. Ketetapan Hukuman / Sanksi Edukatif */}
          <div className="mb-5">
            <p className="text-xs font-bold text-neutral-900 mb-2">
              {activeLayout.formatKalimatHukuman || 'Santri yang bersangkutan diwajibkan menyelesaikan takzir edukatif dan pembinaan ibadah/keilmuan sebagai berikut:'}
            </p>
            <div className="p-3.5 bg-amber-100/60 border-l-4 border-amber-600 rounded-r-xl text-neutral-900 text-xs font-medium space-y-1">
              <div className="font-bold text-sm text-neutral-950 font-sans flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{editedBentukSanksi}</span>
              </div>
              {editedCatatan && (
                <p className="text-[11px] text-neutral-700 italic">
                  Catatan Pengurus: "{editedCatatan}"
                </p>
              )}
            </div>
          </div>

          {/* 6. Batas Waktu & Pembina */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-3 bg-neutral-100/70 rounded-xl text-xs border border-neutral-200">
            <div>
              <span className="font-bold text-neutral-600 block">Batas Maksimal Pengumpulan / Selesai:</span>
              <span className="font-black text-rose-800 text-xs sm:text-sm font-mono mt-0.5 block">
                {editedBatasMaksimal}
              </span>
            </div>
            <div>
              <span className="font-bold text-neutral-600 block">Ustadz Pembina / Penerima Setoran:</span>
              <span className="font-bold text-emerald-900 text-xs sm:text-sm mt-0.5 block">
                {editedPembina}
              </span>
            </div>
          </div>

          {/* 7. Pesan Edukasi & Prinsip Pembinaan */}
          <p className="text-[11px] text-neutral-600 text-justify mb-8 leading-relaxed italic border-t border-neutral-200 pt-3">
            {activeLayout.pesanEdukasi || 'Sanksi ini bersifat edukatif dan pembinaan ruhiyah semata tanpa kekerasan fisik. Santri wajib menyelesaikan dan menyetorkan tugas pembinaan sebelum batas waktu yang telah ditentukan.'}
          </p>

          {/* 8. Tanggal Surat & Kolom Tanda Tangan */}
          <div className="mb-4">
            <div className="text-right text-xs text-neutral-800 mb-4 font-mono font-medium">
              {activeLayout.kotaTerbit || 'Karawang'}, {sanksi.tanggalPenetapan}
            </div>

            {/* Signature layout: 3 Columns or 2 Columns */}
            {activeLayout.jumlahTandaTangan === 2 ? (
              <div className="grid grid-cols-2 gap-8 text-center text-xs">
                {/* Pihak 2: Petugas Keamanan */}
                <div className="flex flex-col items-center justify-between min-h-[120px]">
                  <p className="font-bold text-neutral-800">{activeLayout.jabatanPihak2 || 'Petugas / Dewan Keamanan'}</p>
                  <div className="my-auto py-2">
                    <span className="font-serif italic text-neutral-400 text-xs">(Tanda Tangan Sah)</span>
                  </div>
                  <div>
                    <p className="font-bold text-neutral-950 underline">{editedPetugasPenetap}</p>
                    <p className="text-[10px] text-neutral-600 font-mono">{activeLayout.gelarPihak2 || 'Ketua Dewan Keamanan'}</p>
                  </div>
                </div>

                {/* Pihak 3: Ketua Pondok */}
                <div className="flex flex-col items-center justify-between min-h-[120px] relative">
                  {activeLayout.tampilkanStempelSah !== false && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-70 pointer-events-none">
                      <div className="w-20 h-20 rounded-full border-2 border-emerald-800 border-dashed flex flex-col items-center justify-center rotate-[-12deg] p-1 text-[8px] font-black text-emerald-900 uppercase">
                        <span>PONTREN SALAF</span>
                        <span className="text-[9px]">AL-MALIKI</span>
                        <span className="text-[7px]">TERVERIFIKASI</span>
                      </div>
                    </div>
                  )}
                  <p className="font-bold text-neutral-800">{activeLayout.jabatanPihak3 || 'Ketua Pondok Pesantren'}</p>
                  <div className="my-auto py-2">
                    <span className="font-serif italic text-neutral-400 text-xs">(Stempel & Pengesahan)</span>
                  </div>
                  <div>
                    <p className="font-bold text-neutral-950 underline">{editedKetuaPondok}</p>
                    <p className="text-[10px] text-neutral-600 font-mono">{activeLayout.gelarPihak3 || 'Pengasuh / Pimpinan Pondok'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                {/* Pihak 1: Santri Pelanggar */}
                <div className="flex flex-col items-center justify-between min-h-[120px]">
                  <p className="font-bold text-neutral-800">{activeLayout.jabatanPihak1 || 'Santri Pelanggar'}</p>
                  <div className="my-auto py-2">
                    <span className="font-serif italic text-neutral-400 text-xs">(Menyetujui & Berjanji)</span>
                  </div>
                  <div>
                    <p className="font-bold text-neutral-950 underline">{sanksi.santriNama}</p>
                    <p className="text-[10px] text-neutral-600 font-mono">NIS: {sanksi.santriNis}</p>
                  </div>
                </div>

                {/* Pihak 2: Petugas / Dewan Keamanan */}
                <div className="flex flex-col items-center justify-between min-h-[120px]">
                  <p className="font-bold text-neutral-800">{activeLayout.jabatanPihak2 || 'Dewan Keamanan'}</p>
                  <div className="my-auto py-2">
                    <span className="font-serif italic text-neutral-400 text-xs">(Petugas Pemeriksa)</span>
                  </div>
                  <div>
                    <p className="font-bold text-neutral-950 underline">{editedPetugasPenetap}</p>
                    <p className="text-[10px] text-neutral-600 font-mono">{activeLayout.gelarPihak2 || 'Ketua Dewan Keamanan'}</p>
                  </div>
                </div>

                {/* Pihak 3: Ketua Pondok Pesantren */}
                <div className="flex flex-col items-center justify-between min-h-[120px] relative">
                  {activeLayout.tampilkanStempelSah !== false && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-70 pointer-events-none">
                      <div className="w-18 h-18 rounded-full border-2 border-emerald-800 border-dashed flex flex-col items-center justify-center rotate-[-12deg] p-1 text-[7px] font-black text-emerald-900 uppercase">
                        <span>PONTREN SALAF</span>
                        <span className="text-[8px]">AL-MALIKI</span>
                        <span className="text-[6px]">TERVERIFIKASI</span>
                      </div>
                    </div>
                  )}
                  <p className="font-bold text-neutral-800">{activeLayout.jabatanPihak3 || 'Ketua Pondok'}</p>
                  <div className="my-auto py-2">
                    <span className="font-serif italic text-neutral-400 text-xs">(Pengesahan)</span>
                  </div>
                  <div>
                    <p className="font-bold text-neutral-950 underline">{editedKetuaPondok}</p>
                    <p className="text-[10px] text-neutral-600 font-mono">{activeLayout.gelarPihak3 || 'Pimpinan Pondok'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 9. QR Verification & Official Footer */}
          <div className="pt-3 sm:pt-4 border-t border-neutral-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {qrUrl && (
                <img 
                  src={qrUrl} 
                  alt="QR Verifikasi Sanksi" 
                  className="w-12 h-12 sm:w-14 sm:h-14 border border-neutral-300 rounded-lg p-0.5 bg-white shadow-xs shrink-0"
                />
              )}
              <div className="text-[8px] sm:text-[9px] text-neutral-600 font-mono">
                <p className="font-bold text-rose-900">VERIFIKASI DIGITAL KEAMANAN</p>
                <p>Status: <span className="font-bold text-neutral-900">{sanksi.status}</span></p>
                <p>Arsip ID: {sanksi.id}</p>
              </div>
            </div>

            <div className="text-right text-[8px] sm:text-[9px] text-neutral-500 font-mono max-w-xs">
              {activeLayout.footerCatatan || 'Dokumen ini sah diterbitkan secara otomatis oleh SIM Kamtib Al-Maliki dan diarsipkan dalam pangkalan data kedisiplinan pondok.'}
            </div>
          </div>

        </div>

        {/* Bottom Action Footer (Hidden in Print) - Tombol tutup selalu mudah diakses */}
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
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tutup Surat</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
