import { jsPDF } from 'jspdf';
import { Perizinan, Sanksi, ArsipSurat, SuratSekretarisConfig } from '../types';
import { storageService } from '../services/storageService';
import { INITIAL_SURAT_SEKRETARIS_CONFIG } from '../data/seedData';

const OFFICIAL_PONDOK_LOGO =
  'https://cdn.phototourl.com/member/2026-11-14-03361e24-6ae4-4db0-bdad-b98af1797f52.png';
const OFFICIAL_KOP_LOGO_1 =
  'https://cdn.phototourl.com/member/2026-11-14-49a0f8f3-f2e5-443e-8c1e-36ccad7a6009.png';
const OFFICIAL_KOP_LOGO_2 =
  'https://cdn.phototourl.com/member/2026-11-14-6e57abdd-4666-430d-911c-7e8281c86140.jpg';

interface LoadedImageInfo {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Memuat gambar dari URL, path lokal, atau DataURL (PNG/JPG/WebP/SVG)
 * dan menormalisasinya menjadi PNG DataURL beresolusi tajam via offscreen Canvas
 * sekaligus mempertahankan rasio aspek asli agar logo & tanda tangan tidak pecah/terpotong.
 */
async function loadImageWithAspect(url?: string): Promise<LoadedImageInfo | null> {
  if (!url || !url.trim()) return null;
  let cleanUrl = url.trim();

  // Gunakan salinan lokal same-origin agar jsPDF tidak pernah gagal memuat gambar akibat CORS
  if (cleanUrl.includes('2026-11-14-49a0f8f3') || cleanUrl === '/kop-logo-1.png') {
    cleanUrl = `${window.location.origin}/kop-logo-1.png`;
  } else if (cleanUrl.includes('2026-11-14-6e57abdd') || cleanUrl === '/kop-logo-2.jpg') {
    cleanUrl = `${window.location.origin}/kop-logo-2.jpg`;
  } else if (cleanUrl.includes('2026-11-14-03361e24') || cleanUrl === '/logo-fit.png' || cleanUrl === '/pwa-512x512.png') {
    cleanUrl = `${window.location.origin}/logo-fit.png`;
  } else if (cleanUrl.startsWith('/') && !cleanUrl.startsWith('//')) {
    cleanUrl = `${window.location.origin}${cleanUrl}`;
  }

  const renderImgElementToPng = (src: string, useCors: boolean): Promise<LoadedImageInfo | null> =>
    new Promise((resolve) => {
      const img = new Image();
      if (useCors && !src.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      const timer = setTimeout(() => resolve(null), 6000);

      img.onload = () => {
        clearTimeout(timer);
        try {
          const natW = img.naturalWidth || img.width || 300;
          const natH = img.naturalHeight || img.height || 300;
          // Render dengan resolusi tinggi (min 600px pada sisi terpanjang) agar tajam di PDF A4
          const scale = Math.max(1, Math.min(3, 600 / Math.max(natW, natH, 1)));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(natW * scale));
          canvas.height = Math.max(1, Math.round(natH * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(src.startsWith('data:image/png') ? { dataUrl: src, width: natW, height: natH } : null);
            return;
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pngDataUrl = canvas.toDataURL('image/png', 1.0);
          resolve({
            dataUrl: pngDataUrl,
            width: natW,
            height: natH,
          });
        } catch {
          resolve(src.startsWith('data:') ? { dataUrl: src, width: img.width || 200, height: img.height || 200 } : null);
        }
      };

      img.onerror = () => {
        clearTimeout(timer);
        resolve(null);
      };

      img.src = src;
    });

  // 1. Jika sudah berupa data:image/*, langsung konversi lewat Canvas ke PNG
  if (cleanUrl.startsWith('data:image/')) {
    const res = await renderImgElementToPng(cleanUrl, false);
    if (res) return res;
  }

  // 2. Coba muat via fetch -> Blob -> DataURL -> Canvas (support same-origin & CORS)
  try {
    const isSameOrigin = cleanUrl.startsWith(window.location.origin);
    const response = await fetch(cleanUrl, {
      mode: isSameOrigin ? 'same-origin' : 'cors',
      credentials: 'omit',
    });
    if (response.ok) {
      const blob = await response.blob();
      const blobDataUrl = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
      if (blobDataUrl) {
        const rendered = await renderImgElementToPng(blobDataUrl, false);
        if (rendered) return rendered;
        if (blobDataUrl.startsWith('data:image/png')) {
          return { dataUrl: blobDataUrl, width: 200, height: 200 };
        }
      }
    }
  } catch {
    // Lanjut ke metode Image langsung
  }

  // 3. Coba langsung dengan HTMLImageElement crossOrigin='anonymous'
  const direct = await renderImgElementToPng(cleanUrl, !cleanUrl.startsWith(window.location.origin));
  if (direct) return direct;

  return null;
}

export async function loadImageAsDataUrl(url?: string): Promise<string | null> {
  const info = await loadImageWithAspect(url);
  return info ? info.dataUrl : null;
}

/**
 * Merender teks Arab Bismillah pada Canvas beresolusi tinggi agar tampil presisi
 * di PDF jsPDF sama persis dengan pratinjau A4 di browser.
 */
function renderArabicBismillahImage(): LoadedImageInfo | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 110;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#064e3b';
    ctx.font = 'bold 46px "Amiri", "Traditional Arabic", "Times New Roman", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    ctx.fillText('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', canvas.width / 2, canvas.height / 2);
    return {
      dataUrl: canvas.toDataURL('image/png', 1.0),
      width: canvas.width,
      height: canvas.height,
    };
  } catch {
    return null;
  }
}

/**
 * Merender gambar Stempel Resmi Pondok pada Canvas beresolusi tinggi dengan rotasi -6deg
 * agar hasil PDF sama persis dengan pratinjau surat di layar.
 */
function renderDefaultStempelImage(): LoadedImageInfo | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 440;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((-6 * Math.PI) / 180);
    ctx.strokeStyle = 'rgba(6, 95, 70, 0.72)';
    ctx.lineWidth = 5;
    ctx.strokeRect(-185, -34, 370, 68);
    ctx.fillStyle = 'rgba(6, 78, 59, 0.8)';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('STEMPEL RESMI PONDOK', 0, 2);
    ctx.restore();
    return {
      dataUrl: canvas.toDataURL('image/png', 1.0),
      width: canvas.width,
      height: canvas.height,
    };
  } catch {
    return null;
  }
}

/**
 * Menggambar gambar pada dokumen jsPDF secara proporsional di dalam kotak (boxX, boxY, maxW, maxH)
 * agar gambar tidak pernah gepeng, pecah, atau terpotong.
 */
function addProportionalImageToPdf(
  doc: jsPDF,
  imgInfo: LoadedImageInfo,
  boxX: number,
  boxY: number,
  maxW: number,
  maxH: number
): void {
  try {
    const ratio = imgInfo.width / Math.max(imgInfo.height, 1);
    let drawW = maxW;
    let drawH = drawW / ratio;
    if (drawH > maxH) {
      drawH = maxH;
      drawW = drawH * ratio;
    }
    const offsetX = boxX + (maxW - drawW) / 2;
    const offsetY = boxY + (maxH - drawH) / 2;
    doc.addImage(imgInfo.dataUrl, 'PNG', offsetX, offsetY, drawW, drawH, undefined, 'FAST');
  } catch (err) {
    console.warn('addImage warning:', err);
  }
}

function getRomanMonth(monthIndex: number): string {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romans[monthIndex] || 'I';
}

export async function downloadSuratIzinPDF(izin: Perizinan): Promise<void> {
  const config = storageService.getSystemConfig();
  const layout = config.suratIzinLayout || {};
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 18;

  // Load Official Logo Surat Perizinan Keamanan
  const logoInfo =
    (await loadImageWithAspect(config.logoSuratPerizinanUrl)) ||
    (await loadImageWithAspect('/logo-fit.png')) ||
    (await loadImageWithAspect(OFFICIAL_PONDOK_LOGO));
  if (logoInfo) {
    addProportionalImageToPdf(doc, logoInfo, margin, y - 3, 22, 22);
  }

  // Header / Kop Surat
  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text('BISMILLAHIRRAHMANIRRAHIM', pageWidth / 2 + 6, y, { align: 'center' });
  y += 6;

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(
    (layout.kopNamaInstansi || config.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI').toUpperCase(),
    pageWidth / 2 + 6,
    y,
    { align: 'center' }
  );
  y += 5.5;

  doc.setFontSize(10);
  doc.setTextColor(146, 64, 14);
  doc.text(
    (layout.kopSubInstansi || 'DEWAN KEAMANAN DAN KETERTIBAN SANTRI (KAMTIB)').toUpperCase(),
    pageWidth / 2 + 6,
    y,
    { align: 'center' }
  );
  y += 5;

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    layout.kopAlamatKontak ||
      'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361 | Hotline: 0812-3456-7800',
    pageWidth / 2 + 6,
    y,
    { align: 'center' }
  );
  y += 5;

  // Garis Ganda Kop Surat
  doc.setDrawColor(6, 78, 59);
  doc.setLineWidth(0.9);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 1.2, pageWidth - margin, y + 1.2);
  y += 10;

  // Judul Surat
  doc.setFont('times', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  const judul = (layout.judulSurat || 'SURAT KETERANGAN IZIN KELUAR / PULANG').toUpperCase();
  doc.text(judul, pageWidth / 2, y, { align: 'center' });
  const titleWidth = doc.getTextWidth(judul);
  doc.setLineWidth(0.4);
  doc.line((pageWidth - titleWidth) / 2, y + 1, (pageWidth + titleWidth) / 2, y + 1);
  y += 5.5;

  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.text(`Nomor: ${izin.nomorIzin}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Kalimat Pembuka
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  const pembuka =
    layout.kalimatPembuka ||
    'Pengurus Dewan Keamanan Pondok Pesantren Salaf Al-Maliki dengan ini menerangkan bahwa santri yang tercantum di bawah ini telah mendapatkan izin resmi dengan ketentuan sebagai berikut:';
  const splitPembuka = doc.splitTextToSize(pembuka, pageWidth - margin * 2);
  doc.text(splitPembuka, margin, y);
  y += splitPembuka.length * 5.2 + 4;

  // Tabel Biodata Santri & Detail Izin
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 66, 2, 2, 'FD');

  let rowY = y + 7;
  const rows: [string, string][] = [
    ['Nama Lengkap Santri', izin.santriNama],
    ['Nomor Induk Santri (NIS)', `${izin.santriNis} (${izin.santriGender === 'putra' ? 'Banin / Putra' : 'Banat / Putri'})`],
    ['Kelas / Kamar Asrama', `${izin.santriKelas} / ${izin.santriKamar}`],
    ['Kategori Perizinan', izin.jenisIzin],
    ['Keperluan & Tujuan', `${izin.alasan} (${izin.tujuan})`],
    ['Penjemput / Pendamping', `${izin.namaPenjemput} (${izin.hubunganPenjemput}) - WA: ${izin.noWaPenjemput}`],
    ['Jadwal Keluar Pondok', `${izin.tglKeluar} Pukul ${izin.jamKeluar} WIB`],
    ['Batas Waktu Kembali', `${izin.tglKembali} Pukul ${izin.jamKembali} WIB`],
    ['Status Perizinan', izin.status.toUpperCase()],
  ];

  rows.forEach(([label, val]) => {
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text(label, margin + 4, rowY);
    doc.text(':', margin + 52, rowY);

    doc.setFont('times', 'normal');
    doc.setTextColor(15, 23, 42);
    const valLines = doc.splitTextToSize(String(val || '-'), pageWidth - margin * 2 - 60);
    doc.text(valLines[0] || '-', margin + 56, rowY);
    rowY += 6.5;
  });

  y += 74;

  // Ketentuan
  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.text('Ketentuan Wajib:', margin, y);
  y += 5;

  doc.setFont('times', 'normal');
  doc.setFontSize(9.5);
  const poinList = [
    layout.ketentuanPoin1 || '1. Wajib menjaga akhlaqul karimah, adab santri, dan shalat lima waktu berjamaah.',
    layout.ketentuanPoin2 || '2. Menunjukkan surat izin ini kepada Petugas Gerbang saat keluar dan kembali.',
    layout.ketentuanPoin3 || '3. Wajib kembali tepat waktu. Keterlambatan tanpa keterangan akan dikenakan takzir edukatif.',
  ];
  poinList.forEach((p, idx) => {
    const cleanP = p.match(/^\d\./) ? p : `${idx + 1}. ${p}`;
    const lines = doc.splitTextToSize(cleanP, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 4.8 + 1;
  });

  y += 10;

  // Tanda Tangan
  const kota = layout.kotaTerbit || 'Karawang';
  const tglCetak = izin.tglPengajuan || new Date().toISOString().split('T')[0];

  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.text('Wali Santri / Penjemput,', margin + 25, y + 5, { align: 'center' });
  doc.text(`${kota}, ${tglCetak}`, pageWidth - margin - 32, y, { align: 'center' });
  doc.text(layout.jabatanPenandatangan || 'Ketua Dewan Keamanan,', pageWidth - margin - 32, y + 5, { align: 'center' });

  if (layout.tampilkanStempelSah !== false) {
    doc.setDrawColor(6, 78, 59);
    doc.setTextColor(6, 78, 59);
    doc.roundedRect(pageWidth - margin - 52, y + 10, 40, 10, 1.5, 1.5, 'S');
    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.text('STEMPEL SAH KAMTIB', pageWidth - margin - 32, y + 16, { align: 'center' });
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${izin.namaPenjemput || '................................'} )`, margin + 25, y + 28, { align: 'center' });
  doc.text(
    layout.gelarPenandatangan || layout.namaPenandatangan || 'Ustadz Abdul Rohman, S.Pd.I',
    pageWidth - margin - 32,
    y + 28,
    { align: 'center' }
  );

  const safeName = izin.santriNama.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Surat_Izin_${safeName}_${izin.nomorIzin.replace(/\//g, '-')}.pdf`);
}

export async function downloadSuratSanksiPDF(sanksi: Sanksi): Promise<void> {
  const config = storageService.getSystemConfig();
  const layout = sanksi.snapshotLayout || config.suratSanksiLayout || {};
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 18;

  const logoInfo =
    (await loadImageWithAspect(config.logoSuratPerizinanUrl)) ||
    (await loadImageWithAspect('/logo-fit.png')) ||
    (await loadImageWithAspect(OFFICIAL_PONDOK_LOGO));
  if (logoInfo) {
    addProportionalImageToPdf(doc, logoInfo, margin, y - 3, 22, 22);
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(6, 78, 59);
  doc.text('BISMILLAHIRRAHMANIRRAHIM', pageWidth / 2 + 6, y, { align: 'center' });
  y += 6;

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(
    (layout.kopNamaInstansi || config.namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI').toUpperCase(),
    pageWidth / 2 + 6,
    y,
    { align: 'center' }
  );
  y += 5.5;

  doc.setFontSize(9.5);
  doc.setTextColor(146, 64, 14);
  doc.text(
    (layout.kopSubInstansi || 'DEWAN KEAMANAN & PENEGAKAN KODIFIKASI QANUN KETERTIBAN').toUpperCase(),
    pageWidth / 2 + 6,
    y,
    { align: 'center' }
  );
  y += 5;

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    layout.kopAlamatKontak ||
      'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361 | Hotline: 0812-3456-7800',
    pageWidth / 2 + 6,
    y,
    { align: 'center' }
  );
  y += 5;

  doc.setDrawColor(6, 78, 59);
  doc.setLineWidth(0.9);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 1.2, pageWidth - margin, y + 1.2);
  y += 10;

  // Judul
  doc.setFont('times', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  const judul = (layout.judulSurat || 'SURAT PELANGGARAN DAN SANKSI EDUKATIF').toUpperCase();
  doc.text(judul, pageWidth / 2, y, { align: 'center' });
  const titleWidth = doc.getTextWidth(judul);
  doc.line((pageWidth - titleWidth) / 2, y + 1, (pageWidth + titleWidth) / 2, y + 1);
  y += 5.5;

  const year = (sanksi.tanggalPenetapan || new Date().toISOString()).slice(0, 4);
  const roman = getRomanMonth(new Date().getMonth());
  const nomorSurat = sanksi.customNomorSurat || `SNK/MALIKI/${year}/${roman}/${sanksi.kodeSanksi}`;
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.text(`Nomor: ${nomorSurat}`, pageWidth / 2, y, { align: 'center' });
  y += 9;

  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  const pembuka =
    layout.kalimatPembuka ||
    'Berdasarkan sidang rekapitulasi kodifikasi qanun ketertiban santri Pondok Pesantren Salaf Al-Maliki, dengan ini diterbitkan Surat Pelanggaran dan Penetapan Sanksi Edukatif kepada santri:';
  const splitPembuka = doc.splitTextToSize(pembuka, pageWidth - margin * 2);
  doc.text(splitPembuka, margin, y);
  y += splitPembuka.length * 5.2 + 4;

  // Detail Santri & Pelanggaran
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 52, 2, 2, 'FD');

  let rowY = y + 7;
  const rows: [string, string][] = [
    ['Nama Santri', sanksi.santriNama],
    ['Nomor Induk Santri (NIS)', `${sanksi.santriNis} (${sanksi.santriGender === 'putra' ? 'Putra' : 'Putri'})`],
    ['Kelas / Kamar', `${sanksi.santriKelas || '-'} / ${sanksi.santriKamar || '-'}`],
    ['Jenis Pelanggaran', sanksi.jenisPelanggaran],
    ['Tanggal Pelanggaran', sanksi.pelanggaranTanggal || sanksi.tanggalPenetapan],
    ['Kronologi Singkat', sanksi.kronologi || 'Tercatat melanggar qanun ketertiban pondok pesantren.'],
  ];

  rows.forEach(([label, val]) => {
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    doc.text(label, margin + 4, rowY);
    doc.text(':', margin + 48, rowY);

    doc.setFont('times', 'normal');
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(String(val || '-'), pageWidth - margin * 2 - 56);
    doc.text(lines[0] || '-', margin + 52, rowY);
    rowY += 7.2;
  });

  y += 60;

  // Bentuk Sanksi Edukatif
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(217, 119, 6);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 30, 2, 2, 'FD');

  doc.setFont('times', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(146, 64, 14);
  doc.text('KETETAPAN TAKZIR & PEMBINAAN EDUKATIF:', margin + 4, y + 7);

  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  const sanksiLines = doc.splitTextToSize(sanksi.bentukSanksi, pageWidth - margin * 2 - 8);
  doc.text(sanksiLines, margin + 4, y + 13.5);

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(185, 28, 28);
  doc.text(
    `Batas Waktu Penyelesaian: ${sanksi.batasMaksimal || sanksi.tanggalTargetSelesai} | Pembina: ${sanksi.ustadzPembina}`,
    margin + 4,
    y + 25
  );

  y += 38;

  doc.setFont('times', 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  const edukasi =
    layout.pesanEdukasi ||
    'Sanksi ini bersifat edukatif dan pembinaan ruhiyah semata tanpa kekerasan fisik. Santri wajib menyelesaikan tugas pembinaan sebelum batas waktu yang ditentukan.';
  const eduLines = doc.splitTextToSize(edukasi, pageWidth - margin * 2);
  doc.text(eduLines, margin, y);
  y += eduLines.length * 4.8 + 10;

  const kota = layout.kotaTerbit || 'Karawang';
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${kota}, ${sanksi.tanggalPenetapan}`, pageWidth - margin, y, { align: 'right' });
  y += 8;

  // 3 Kolom Tanda Tangan
  const colW = (pageWidth - margin * 2) / 3;
  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.text(layout.jabatanPihak1 || 'Santri Bersangkutan', margin + colW * 0.5, y, { align: 'center' });
  doc.text(layout.jabatanPihak2 || 'Ketua Dewan Keamanan', margin + colW * 1.5, y, { align: 'center' });
  doc.text(layout.jabatanPihak3 || 'Ketua Pondok Pesantren', margin + colW * 2.5, y, { align: 'center' });

  doc.text(`( ${sanksi.santriNama} )`, margin + colW * 0.5, y + 23, { align: 'center' });
  doc.text(layout.namaPihak2 || sanksi.petugasPenetap || 'Ustadz Abdul Rohman, S.Pd.I', margin + colW * 1.5, y + 23, { align: 'center' });
  doc.text(layout.namaPihak3 || 'K.H. Ahmad Faqih Al-Maliki', margin + colW * 2.5, y + 23, { align: 'center' });

  const safeName = sanksi.santriNama.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Surat_Sanksi_${safeName}_${sanksi.kodeSanksi}.pdf`);
}

/**
 * Generator PDF Kertas A4 Resmi Sekretaris Pondok Pesantren Salaf Al-Maliki.
 * Menampilkan Logo Kop Kiri & Kanan dengan rasio proporsional (tidak pecah/terpotong),
 * Garis Ganda Kop Surat, Isi Surat A4, Stempel Pondok, dan Tanda Tangan Digital (via Link URL).
 */
export async function downloadSuratSekretarisPDF(
  surat: ArsipSurat,
  config: SuratSekretarisConfig,
  fallbackLogoUrl?: string
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const margin = config.marginSuratMm || 20;
  const contentWidth = pageWidth - margin * 2;
  let y = Math.max(14, margin - 3);

  // Ukuran font berdasarkan pengaturan editor surat (selaras dengan preview)
  const bodyFontPt =
    config.ukuranFontSurat === 'kecil' ? 9.5 : config.ukuranFontSurat === 'besar' ? 11.5 : 10.5;
  const lineSpacing =
    config.ukuranFontSurat === 'kecil' ? 4.6 : config.ukuranFontSurat === 'besar' ? 5.8 : 5.2;

  // 1. Muat Logo 1 (Kiri) & Logo 2 (Kanan) — fallback lokal menjamin logo selalu muncul di PDF
  const leftLogoUrl =
    (config.kopLogoUrl && !config.kopLogoUrl.includes('2026-11-11-7ffd46ad')
      ? config.kopLogoUrl
      : OFFICIAL_KOP_LOGO_1) ||
    fallbackLogoUrl ||
    OFFICIAL_KOP_LOGO_1;
  const rightLogoUrl =
    config.kopLogoKananUrl &&
    config.kopLogoKananUrl.trim() !== '' &&
    !config.kopLogoKananUrl.includes('2026-11-11-7ffd46ad')
      ? config.kopLogoKananUrl
      : OFFICIAL_KOP_LOGO_2;

  const [leftLogoInfo, rightLogoInfo] = await Promise.all([
    loadImageWithAspect(leftLogoUrl).then((res) => res || loadImageWithAspect('/kop-logo-1.png')),
    rightLogoUrl
      ? loadImageWithAspect(rightLogoUrl).then((res) => res || loadImageWithAspect('/kop-logo-2.jpg'))
      : Promise.resolve(null),
  ]);

  const logoSizeMm = Math.min(24, Math.max(16, Math.round((config.ukuranLogoPx || 68) * 0.28)));
  const alamatMaxW = Math.max(88, contentWidth - (logoSizeMm + 6) * 2);

  // Hitung tinggi blok teks Kop terlebih dahulu agar kedua logo tepat sejajar tengah (vertically centered)
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  const alamatLines = doc.splitTextToSize(config.kopAlamatKontak || '', alamatMaxW);
  const bismillahImg = config.tampilkanBismillah ? renderArabicBismillahImage() : null;
  const kopTextHeight =
    (config.tampilkanBismillah ? 5.6 : 0) + 4.8 + 5.6 + 4.6 + alamatLines.length * 3.6 + 1.5;
  const kopHeaderHeight = Math.max(kopTextHeight, logoSizeMm);

  const leftLogoY = y + Math.max(0, (kopHeaderHeight - logoSizeMm) / 2);
  const rightLogoY = y + Math.max(0, (kopHeaderHeight - logoSizeMm) / 2);

  if (leftLogoInfo) {
    addProportionalImageToPdf(doc, leftLogoInfo, margin, leftLogoY, logoSizeMm, logoSizeMm);
  }
  if (rightLogoInfo) {
    addProportionalImageToPdf(
      doc,
      rightLogoInfo,
      pageWidth - margin - logoSizeMm,
      rightLogoY,
      logoSizeMm,
      logoSizeMm
    );
  }

  // 2. Teks Kop Surat di Tengah
  const centerX = pageWidth / 2;
  let kopY = y + Math.max(1, (kopHeaderHeight - kopTextHeight) / 2) + 2;

  if (config.tampilkanBismillah) {
    if (bismillahImg) {
      addProportionalImageToPdf(doc, bismillahImg, centerX - 24, kopY - 4.2, 48, 5.5);
    } else {
      doc.setFont('times', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(6, 78, 59);
      doc.text('BISMILLAHIRRAHMANIRRAHIM', centerX, kopY, { align: 'center' });
    }
    kopY += 5.4;
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(6, 78, 59);
  doc.text((config.kopNamaYayasan || 'YAYASAN PENDIDIKAN ISLAM SALAF AL-MALIKI').toUpperCase(), centerX, kopY, {
    align: 'center',
  });
  kopY += 5.2;

  doc.setFontSize(13.5);
  doc.setTextColor(2, 6, 23);
  doc.text((config.kopNamaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI').toUpperCase(), centerX, kopY, {
    align: 'center',
  });
  kopY += 4.8;

  doc.setFontSize(9.5);
  doc.setTextColor(146, 64, 14);
  doc.text((config.kopSubInstansi || 'SEKRETARIAT PUSAT PENGURUS PONDOK').toUpperCase(), centerX, kopY, {
    align: 'center',
  });
  kopY += 4.5;

  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(alamatLines, centerX, kopY, { align: 'center' });

  y = y + kopHeaderHeight + 2.5;

  // Garis Ganda Kop Surat (border-b-4 border-double border-emerald-900)
  doc.setDrawColor(6, 78, 59);
  doc.setLineWidth(0.95);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setLineWidth(0.32);
  doc.line(margin, y + 1.3, pageWidth - margin, y + 1.3);
  y += 7.5;

  // 3. Blok Nomor, Lampiran, Perihal & Tanggal
  const kota = surat.kotaTerbit || config.kotaTerbit || 'Karawang';
  const formattedDate = (() => {
    try {
      const d = new Date(surat.tanggalSurat);
      if (isNaN(d.getTime())) return surat.tanggalSurat;
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return surat.tanggalSurat;
    }
  })();

  doc.setFont('times', 'normal');
  doc.setFontSize(bodyFontPt);
  doc.setTextColor(15, 23, 42);

  if (config.posisiTanggal !== 'bawah_kanan') {
    doc.text(`${kota}, ${formattedDate}`, pageWidth - margin, y, { align: 'right' });
  }

  doc.text('Nomor', margin, y);
  doc.text(`: ${surat.nomorSurat}`, margin + 22, y);
  y += 5;

  doc.text('Lampiran', margin, y);
  doc.text(`: ${surat.lampiran || '-'}`, margin + 22, y);
  y += 5;

  doc.text('Perihal', margin, y);
  doc.text(':', margin + 22, y);
  doc.setFont('times', 'bold');
  const perihalLines = doc.splitTextToSize(surat.perihal || '-', contentWidth - 26);
  perihalLines.forEach((line: string, idx: number) => {
    const lineY = y + idx * 5;
    doc.text(line, margin + 24.5, lineY);
    const lw = doc.getTextWidth(line);
    doc.setLineWidth(0.25);
    doc.line(margin + 24.5, lineY + 0.8, margin + 24.5 + lw, lineY + 0.8);
  });
  y += perihalLines.length * 5 + 3.5;

  // 4. Tujuan Surat (sama persis dengan pratinjau: Kepada Yth. / Nama / AlamatTujuan)
  if (surat.tujuanAtauPengirim) {
    doc.setFont('times', 'normal');
    doc.text('Kepada Yth.', margin, y);
    y += 4.8;
    doc.setFont('times', 'bold');
    const tujuanLines = doc.splitTextToSize(surat.tujuanAtauPengirim, contentWidth);
    doc.text(tujuanLines, margin, y);
    y += tujuanLines.length * 4.8;
    doc.setFont('times', 'normal');
    doc.text(surat.alamatTujuan || 'Di Tempat', margin, y);
    y += 7.5;
  }

  // 5. Judul Surat di Tengah (Untuk SK, SPn, SM, ST, SKet, SR, SPPD, SRT, PK)
  const centeredTypes = ['SK', 'SPn', 'SM', 'ST', 'SKet', 'SR', 'SPPD', 'SRT', 'PK'];
  if (centeredTypes.includes(surat.kodeJenis)) {
    doc.setFont('times', 'bold');
    doc.setFontSize(bodyFontPt + 1.5);
    const jdl = (surat.perihal || surat.namaJenis).toUpperCase();
    const jdlLines = doc.splitTextToSize(jdl, contentWidth - 10);
    jdlLines.forEach((line: string) => {
      doc.text(line, centerX, y, { align: 'center' });
      const tw = doc.getTextWidth(line);
      doc.setLineWidth(0.35);
      doc.line((pageWidth - tw) / 2, y + 0.9, (pageWidth + tw) / 2, y + 0.9);
      y += 5.2;
    });
    doc.setFont('courier', 'bold');
    doc.setFontSize(bodyFontPt - 0.8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Nomor: ${surat.nomorSurat}`, centerX, y, { align: 'center' });
    doc.setTextColor(15, 23, 42);
    y += 7;
  }

  const useJustify = config.perataanIsi !== 'left';
  const drawParagraph = (text: string) => {
    const lines = doc.splitTextToSize(text, contentWidth);
    if (y + lines.length * lineSpacing > pageHeight - 58) {
      doc.addPage();
      y = margin;
    }
    // Baris berformat label titik dua ("Hari / Tanggal : ...") tetap rata kiri agar kolomnya rapi
    const isTabularLine = lines.length <= 2 && text.includes(':');
    if (useJustify && !isTabularLine && lines.length > 1) {
      doc.text(text, margin, y, { align: 'justify', maxWidth: contentWidth });
    } else {
      doc.text(lines, margin, y);
    }
    y += lines.length * lineSpacing + 1.2;
  };

  // 6. Salam Pembuka
  doc.setFontSize(bodyFontPt);
  if (surat.salamPembuka) {
    doc.setFont('times', 'bolditalic');
    doc.text(surat.salamPembuka, margin, y);
    y += lineSpacing + 1.8;
  }

  // 7. Kalimat Pembuka
  if (surat.kalimatPembuka) {
    doc.setFont('times', 'normal');
    drawParagraph(surat.kalimatPembuka);
    y += 1.8;
  }

  // 8. Isi Pokok Surat (mendukung multi-halaman secara rapi & perataan sesuai pengaturan)
  doc.setFont('times', 'normal');
  const paragraphs = (surat.isiSurat || '').split('\n');
  for (const para of paragraphs) {
    if (!para.trim()) {
      y += 2.8;
      continue;
    }
    drawParagraph(para);
  }

  y += 2.2;

  // 9. Kalimat Penutup
  if (surat.penutupSurat) {
    doc.setFont('times', 'normal');
    drawParagraph(surat.penutupSurat);
    y += 5;
  } else {
    y += 4;
  }

  // 10. Blok Tanda Tangan & Tanda Tangan Digital (via Link URL)
  if (y > pageHeight - 58) {
    doc.addPage();
    y = margin + 4;
  }

  const showTwoSigners = surat.tampilkanPenandatangan2 ?? config.tampilkanPenandatangan2;
  const ttd1Url = surat.ttdUrl1 ?? config.ttdUrl1;
  const ttd2Url = surat.ttdUrl2 ?? config.ttdUrl2;
  const stempelCustomUrl = config.stempelUrl;

  const [ttd1Info, ttd2Info, stempelInfo] = await Promise.all([
    loadImageWithAspect(ttd1Url),
    showTwoSigners ? loadImageWithAspect(ttd2Url) : Promise.resolve(null),
    config.tampilkanStempel && stempelCustomUrl ? loadImageWithAspect(stempelCustomUrl) : Promise.resolve(null),
  ]);

  const leftSignX = margin + contentWidth * 0.24;
  const rightSignX = pageWidth - margin - contentWidth * 0.24;

  doc.setFont('times', 'normal');
  doc.setFontSize(bodyFontPt);
  doc.text(`${kota}, ${formattedDate}`, rightSignX, y, { align: 'center' });
  if (showTwoSigners) {
    doc.setFontSize(bodyFontPt - 0.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Mengetahui,', leftSignX, y, { align: 'center' });
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(bodyFontPt);
  }
  y += 4.8;

  if (showTwoSigners) {
    doc.setFont('times', 'bold');
    doc.text(
      surat.jabatanPenandatangan2 || config.jabatanPenandatangan2 || 'Ketua Pondok Pesantren',
      leftSignX,
      y,
      { align: 'center' }
    );
  }

  doc.setFont('times', 'bold');
  doc.text(surat.jabatanPenandatangan || config.jabatanPenandatangan || 'Sekretaris Pondok', rightSignX, y, {
    align: 'center',
  });

  // Render Gambar Tanda Tangan Digital 2 (Kiri - Ketua Pondok)
  if (showTwoSigners && ttd2Info) {
    addProportionalImageToPdf(doc, ttd2Info, leftSignX - 22, y + 2, 44, 18);
  }

  // Render Stempel Pondok (mengikuti posisi kiri area TTD 1 pada pratinjau)
  if (config.tampilkanStempel) {
    const stampX = rightSignX - 30;
    if (stempelInfo) {
      addProportionalImageToPdf(doc, stempelInfo, stampX, y + 1.5, 26, 20);
    } else {
      const defaultStempel = renderDefaultStempelImage();
      if (defaultStempel) {
        addProportionalImageToPdf(doc, defaultStempel, stampX - 2, y + 4.5, 34, 12);
      }
    }
  }

  // Render Gambar Tanda Tangan Digital 1 (Kanan - Sekretaris)
  if (ttd1Info) {
    addProportionalImageToPdf(doc, ttd1Info, rightSignX - 22, y + 2, 44, 18);
  }

  // Nama Terang Penandatangan
  doc.setFont('times', 'bold');
  doc.setFontSize(bodyFontPt);
  doc.setTextColor(15, 23, 42);

  if (showTwoSigners) {
    const nama2 = surat.namaPenandatangan2 || config.namaPenandatangan2 || 'K.H. Ahmad Faqih Al-Maliki';
    doc.text(nama2, leftSignX, y + 23.5, { align: 'center' });
    const w2 = doc.getTextWidth(nama2);
    doc.setLineWidth(0.3);
    doc.line(leftSignX - w2 / 2, y + 24.3, leftSignX + w2 / 2, y + 24.3);
  }

  const nama1 = surat.namaPenandatangan || config.namaPenandatangan || 'Ustadz Muhammad Yusuf, S.Pd';
  doc.text(nama1, rightSignX, y + 23.5, { align: 'center' });
  const w1 = doc.getTextWidth(nama1);
  doc.setLineWidth(0.3);
  doc.line(rightSignX - w1 / 2, y + 24.3, rightSignX + w1 / 2, y + 24.3);

  y += 31;

  // 11. Tembusan / Catatan Kaki
  if (surat.tembusan && y < pageHeight - 15) {
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.line(margin, y - 3, pageWidth - margin, y - 3);
    doc.setFont('times', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Tembusan / Catatan:', margin, y + 1);
    doc.setFont('times', 'italic');
    const tLines = doc.splitTextToSize(surat.tembusan, contentWidth);
    doc.text(tLines, margin, y + 5);
  }

  const cleanNomor = surat.nomorSurat.replace(/[^a-zA-Z0-9-_]/g, '-');
  doc.save(`Surat_${surat.kodeJenis}_${cleanNomor}.pdf`);
}

export function downloadElementAsPdf(elementId: string, filename: string, title: string): void {
  const el = document.getElementById(elementId);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const textContent = el ? el.innerText : title;
  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.text(title.toUpperCase(), 105, 18, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(textContent, 170);
  doc.text(lines, 20, 28);
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}
