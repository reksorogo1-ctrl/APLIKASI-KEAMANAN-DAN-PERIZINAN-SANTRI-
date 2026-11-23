import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Calendar, CheckCircle2, Phone, UserCheck } from 'lucide-react';
import {
  PeminjamanPerlengkapan,
  PengaturanSuratPerlengkapan,
  SystemConfig,
} from '../types';

interface SuratPeminjamanPreviewProps {
  pinjam: PeminjamanPerlengkapan;
  systemConfig: SystemConfig;
  pengaturanSurat: PengaturanSuratPerlengkapan;
  qrUrlOverride?: string;
  compactScale?: boolean;
}

export const SuratPeminjamanPreview: React.FC<SuratPeminjamanPreviewProps> = ({
  pinjam,
  systemConfig,
  pengaturanSurat,
  qrUrlOverride,
  compactScale = false,
}) => {
  const [generatedQrUrl, setGeneratedQrUrl] = useState<string>('');

  useEffect(() => {
    if (qrUrlOverride) {
      setGeneratedQrUrl(qrUrlOverride);
      return;
    }
    let active = true;
    const qrPayload = String(pinjam.id || 'SAMPLE-QR');
    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 4,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#FFFFFF' },
    })
      .then((url) => {
        if (active) setGeneratedQrUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [pinjam.id, qrUrlOverride]);

  const qrUrl = qrUrlOverride || generatedQrUrl;

  const fontScaleClass =
    pengaturanSurat.ukuranFont === 'kecil'
      ? compactScale
        ? 'text-[10px] leading-snug'
        : 'text-[10.5px] sm:text-[11.5px] leading-snug'
      : pengaturanSurat.ukuranFont === 'besar'
        ? compactScale
          ? 'text-[12px] leading-relaxed'
          : 'text-[13px] sm:text-[14px] leading-relaxed'
        : compactScale
          ? 'text-[11px] leading-relaxed'
          : 'text-[11.5px] sm:text-[12.5px] leading-relaxed';

  const titleScaleClass =
    pengaturanSurat.ukuranFont === 'kecil'
      ? 'text-xs sm:text-sm'
      : pengaturanSurat.ukuranFont === 'besar'
        ? 'text-base sm:text-lg'
        : 'text-sm sm:text-base';

  const paddingClass =
    pengaturanSurat.marginHalaman === 'rapat'
      ? compactScale
        ? 'p-3 sm:p-4'
        : 'p-3 sm:p-5'
      : pengaturanSurat.marginHalaman === 'lebar'
        ? compactScale
          ? 'p-5 sm:p-7'
          : 'p-6 sm:p-10 md:p-12'
        : compactScale
          ? 'p-4 sm:p-6'
          : 'p-4 sm:p-7 md:p-9';

  const tema = pengaturanSurat.warnaTemaSurat || 'emerald';
  const themeTokens =
    tema === 'classic_bw'
      ? {
          kopBorder: 'border-neutral-900',
          kopDivider: 'bg-neutral-800',
          kopHeading: 'text-neutral-950',
          kopSub: 'text-neutral-800',
          title: 'text-neutral-950',
          infoBox: 'bg-neutral-50 border-neutral-400',
          infoIcon: 'text-neutral-700',
          tableHead: 'bg-neutral-900 text-white',
          ketentuanBox: 'bg-neutral-50 border-neutral-400',
          stampBorder: 'border-neutral-700/60 text-neutral-800/75',
        }
      : tema === 'gold'
        ? {
            kopBorder: 'border-amber-700',
            kopDivider: 'bg-amber-600',
            kopHeading: 'text-amber-950',
            kopSub: 'text-amber-800',
            title: 'text-amber-950',
            infoBox: 'bg-amber-50/45 border-amber-700/25',
            infoIcon: 'text-amber-800',
            tableHead: 'bg-amber-900 text-amber-50',
            ketentuanBox: 'bg-amber-50/75 border-amber-500/70',
            stampBorder: 'border-amber-700/60 text-amber-900/70',
          }
        : {
            kopBorder: 'border-emerald-900',
            kopDivider: 'bg-amber-500',
            kopHeading: 'text-emerald-950',
            kopSub: 'text-amber-900',
            title: 'text-emerald-950',
            infoBox: 'bg-emerald-50/40 border-emerald-900/20',
            infoIcon: 'text-emerald-800',
            tableHead: 'bg-emerald-950 text-white',
            ketentuanBox: 'bg-amber-50/70 border-amber-400/70',
            stampBorder: 'border-emerald-700/55 text-emerald-800/65',
          };

  const gayaBorder = pengaturanSurat.gayaBorderKop || 'double';
  const kopBorderClass =
    gayaBorder === 'double'
      ? `border-b-4 border-double ${themeTokens.kopBorder}`
      : gayaBorder === 'solid'
        ? `border-b-2 ${themeTokens.kopBorder}`
        : `border-b border-neutral-300`;

  const visibleSignatureCount =
    (pengaturanSurat.tampilkanTtdPeminjam ? 1 : 0) +
    (pengaturanSurat.tampilkanTtdPerlengkapan ? 1 : 0) +
    (pengaturanSurat.tampilkanTtdKetuaPondok ? 1 : 0);

  const logoSrc =
    !systemConfig.logoUrl || systemConfig.logoUrl.includes('logo_pesantren_almaliki')
      ? '/logo-pondok.png'
      : systemConfig.logoUrl;

  const showBismillah = pengaturanSurat.tampilkanBismillah ?? true;
  const showLogoKop = pengaturanSurat.tampilkanLogoKop ?? true;
  const showNomorSurat = pengaturanSurat.tampilkanNomorSurat ?? true;
  const showIdentitas = pengaturanSurat.tampilkanIdentitasPeminjam ?? true;
  const showKeperluan = pengaturanSurat.tampilkanKeperluan ?? true;
  const showKolomSumber = pengaturanSurat.tampilkanKolomSumber ?? true;
  const showKolomKondisi = pengaturanSurat.tampilkanKolomKondisi ?? true;
  const showKetentuan = pengaturanSurat.tampilkanKetentuan ?? true;
  const showQrCode = pengaturanSurat.tampilkanQrCode ?? true;
  const showStempel = pengaturanSurat.tampilkanStempel ?? true;

  const namaInstansiText =
    pengaturanSurat.kopNamaInstansi?.trim() ||
    systemConfig.namaPondok ||
    'PONDOK PESANTREN SALAF AL-MALIKI';
  const namaUnitText =
    pengaturanSurat.kopNamaUnit?.trim() ||
    systemConfig.perlengkapanConfig?.namaUnitPerlengkapan ||
    'BAGIAN PERLENGKAPAN, INVENTARIS & SARANA PRASARANA';
  const alamatKopText =
    pengaturanSurat.kopAlamatKontak?.trim() ||
    `${systemConfig.alamatPondok || 'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361'}${
      systemConfig.hotlineWa ? ` | Hotline: ${systemConfig.hotlineWa}` : ''
    }`;

  const qrSizeClass = compactScale
    ? 'w-[116px] h-[116px] min-w-[116px] min-h-[116px]'
    : 'w-[148px] h-[148px] min-w-[148px] min-h-[148px]';

  const qrBlock = (
    <div className="flex items-center gap-3 shrink-0 avoid-break">
      {qrUrl ? (
        <div className="p-1.5 bg-white border-2 border-neutral-900 rounded-xl shadow-xs shrink-0">
          <img
            src={qrUrl}
            alt="QR Code Pengembalian Barang"
            width={compactScale ? 116 : 148}
            height={compactScale ? 116 : 148}
            className={`official-qr-code ${qrSizeClass} object-contain bg-white block`}
          />
        </div>
      ) : (
        <div className={`${qrSizeClass} bg-neutral-100 rounded-xl animate-pulse shrink-0`} />
      )}
      <div className="max-w-[175px]">
        <p className="text-[9px] text-neutral-500 uppercase font-mono font-bold">
          QR PENGEMBALIAN ASET
        </p>
        <p className="text-xs font-black text-emerald-800 flex items-center gap-1 mt-0.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{pinjam.status}</span>
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

  return (
    <div
      className={`surat-print-sheet a4-print-canvas font-sans bg-white text-slate-900 ${paddingClass} ${fontScaleClass}`}
    >
      {/* Optional Official Kop Surat */}
      {pengaturanSurat.tampilkanKopSurat && (
        <>
          <div className={`avoid-break flex items-center justify-between pb-3 ${kopBorderClass} text-center gap-2 sm:gap-4`}>
            {showLogoKop ? (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-amber-500/80 shrink-0 overflow-hidden bg-white p-0.5">
                <img
                  src={logoSrc}
                  alt={namaInstansiText}
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
            ) : null}
            <div className="flex-1 min-w-0 px-1">
              {showBismillah && (
                <p className={`font-serif ${themeTokens.kopHeading} text-xs sm:text-sm mb-0.5 tracking-wider font-semibold`}>
                  {pengaturanSurat.kopTeksBismillah || 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'}
                </p>
              )}
              <h2 className={`text-xs sm:text-base font-black tracking-tight ${themeTokens.kopHeading} uppercase leading-snug`}>
                {namaInstansiText}
              </h2>
              <p className={`text-[10px] sm:text-xs font-bold ${themeTokens.kopSub} uppercase`}>
                {namaUnitText}
              </p>
              <p className="text-[9px] sm:text-[10px] text-neutral-600 mt-0.5 leading-tight">
                {alamatKopText}
              </p>
            </div>
            {showLogoKop ? <div className="w-14 sm:w-16 hidden sm:block shrink-0" /> : null}
          </div>
          {gayaBorder === 'double' && <div className={`h-0.5 ${themeTokens.kopDivider} mt-1 mb-4`} />}
          {gayaBorder !== 'double' && <div className="mb-4" />}
        </>
      )}

      {/* Header / Judul & Nomor Surat */}
      <div className={`mb-4 ${pengaturanSurat.perataanJudul === 'left' ? 'text-left' : 'text-center'}`}>
        <h3
          className={`${titleScaleClass} font-black uppercase tracking-wider ${themeTokens.title} underline underline-offset-4`}
        >
          {pengaturanSurat.judulSurat}
        </h3>
        {showNomorSurat && (
          <p className="text-[11px] sm:text-xs text-neutral-700 font-mono mt-1 font-semibold">
            Nomor Surat: {pinjam.nomorSurat}
          </p>
        )}
      </div>

      {/* Teks Pembuka */}
      <p className="text-neutral-800 mb-3.5 text-justify whitespace-pre-line">
        {pengaturanSurat.teksPembuka}
      </p>

      {/* Identitas Peminjam */}
      {showIdentitas && (
        <div className={`avoid-break rounded-xl p-3 sm:p-4 border mb-4 ${themeTokens.infoBox}`}>
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
                <Phone className={`w-3 h-3 ${themeTokens.infoIcon}`} /> Nomor HP / WA
              </span>
              <span className="font-mono text-neutral-900">: {pinjam.nomorHp}</span>
            </div>
            <div className="flex items-center">
              <span className="w-36 text-neutral-600 shrink-0 font-medium inline-flex items-center gap-1">
                <UserCheck className={`w-3 h-3 ${themeTokens.infoIcon}`} /> Status Persetujuan
              </span>
              <span className="font-bold text-emerald-800">: {pinjam.status}</span>
            </div>
            <div className="flex items-center">
              <span className="w-36 text-neutral-600 shrink-0 font-medium inline-flex items-center gap-1">
                <Calendar className={`w-3 h-3 ${themeTokens.infoIcon}`} /> Tanggal Pinjam
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
            {showKeperluan && pinjam.keperluan && (
              <div className="flex sm:col-span-2 pt-1 border-t border-neutral-300/60">
                <span className="w-36 text-neutral-600 shrink-0 font-medium">Keperluan</span>
                <span className="text-neutral-900">: {pinjam.keperluan}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabel Perincian Barang */}
      <div className="avoid-break mb-4">
        <p className={`font-bold uppercase text-[11px] tracking-wider mb-1.5 ${themeTokens.title}`}>
          {pengaturanSurat.labelTabelBarang || 'Daftar Perincian Barang yang Dipinjam:'}
        </p>
        <table className="a4-print-table w-full border-collapse border border-neutral-800 text-left">
          <thead>
            <tr className={`${themeTokens.tableHead} text-[10.5px] uppercase font-mono`}>
              <th className="border border-neutral-800 py-2 px-2.5 text-center w-10">No</th>
              <th className="border border-neutral-800 py-2 px-3">Nama Barang</th>
              {showKolomSumber && (
                <th className="border border-neutral-800 py-2 px-2.5 w-36">Sumber / Gedung</th>
              )}
              <th className="border border-neutral-800 py-2 px-3 text-center w-28">
                Jumlah / Unit
              </th>
              {showKolomKondisi && (
                <th className="border border-neutral-800 py-2 px-3 w-36">Kondisi Awal</th>
              )}
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
                {showKolomSumber && (
                  <td className="border border-neutral-800 py-2 px-2.5 text-[10px] text-neutral-700">
                    {item.sumberBarang === 'fasilitas'
                      ? `Fasilitas${item.gedungNama ? ` (${item.gedungNama})` : ''}`
                      : 'Inventaris'}
                  </td>
                )}
                <td className="border border-neutral-800 py-2 px-3 text-center font-mono font-bold">
                  {item.jumlah} {item.satuan}
                </td>
                {showKolomKondisi && (
                  <td className="border border-neutral-800 py-2 px-3 text-neutral-800">
                    {item.kondisiAwal}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ketentuan Tanggung Jawab / Teks Penutup */}
      {showKetentuan && (
        <div
          className={`avoid-break rounded-xl border p-3 mb-5 text-neutral-800 text-justify whitespace-pre-line ${themeTokens.ketentuanBox}`}
        >
          {pengaturanSurat.teksPenutup}
        </div>
      )}

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
                  {showStempel && (
                    <div
                      className={`text-[7.5px] font-bold uppercase rotate-[-6deg] border px-2 py-0.5 rounded-xs ${themeTokens.stampBorder}`}
                    >
                      BAG. PERLENGKAPAN
                    </div>
                  )}
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
                  {showStempel && (
                    <div
                      className={`text-[8px] font-extrabold uppercase rotate-[-7deg] border-2 px-2 py-0.5 rounded-sm ${themeTokens.stampBorder}`}
                    >
                      DISETUJUI KETUA PONDOK
                    </div>
                  )}
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

      {/* Footer QR Code Verifikasi Pengembalian */}
      {showQrCode && (
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
              {pengaturanSurat.labelCatatanFooter || 'Dokumen Resmi Terintegrasi Cloud'}
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
      )}
    </div>
  );
};
