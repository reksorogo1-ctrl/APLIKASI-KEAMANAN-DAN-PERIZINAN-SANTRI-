import { jsPDF } from 'jspdf';
import { ArsipSurat, SuratSekretarisConfig, TransaksiKeuangan } from '../types';

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function formatTanggalIndo(dateStr: string): string {
  if (!dateStr) return '-';
  const parsed = new Date(dateStr + 'T00:00:00');
  if (isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

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

  const pageWidth = 210;
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2;
  let y = 16;

  // Logo in Kop Surat
  const logoSrc = config.kopLogoUrl || fallbackLogoUrl || '';
  const logoData = await loadImageAsDataUrl(logoSrc);
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', marginX, y, 22, 22);
    } catch {
      // skip if image format unsupported
    }
  }

  // Kop Surat Header Text
  const textCenterX = logoData ? pageWidth / 2 + 8 : pageWidth / 2;
  doc.setTextColor(35, 23, 16);
  doc.setFont('times', 'bold');
  doc.setFontSize(10.5);
  doc.text((config.kopNamaYayasan || 'YAYASAN PENDIDIKAN ISLAM SALAF AL-MALIKI').toUpperCase(), textCenterX, y + 4, { align: 'center' });

  doc.setFontSize(14);
  doc.text((config.kopNamaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI').toUpperCase(), textCenterX, y + 10.5, { align: 'center' });

  doc.setFontSize(10.5);
  doc.text((config.kopSubInstansi || 'SEKRETARIAT PUSAT PENGURUS PONDOK').toUpperCase(), textCenterX, y + 16, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 55, 45);
  const alamatLines = doc.splitTextToSize(config.kopAlamatKontak || '', logoData ? 140 : 165);
  doc.text(alamatLines, textCenterX, y + 20.5, { align: 'center' });

  y += 27;
  // Double horizontal line
  doc.setDrawColor(20, 15, 12);
  doc.setLineWidth(0.9);
  doc.line(marginX, y, pageWidth - marginX, y);
  doc.setLineWidth(0.3);
  doc.line(marginX, y + 1.3, pageWidth - marginX, y + 1.3);

  y += 9;

  // Bismillah / Jenis Surat Title
  doc.setTextColor(15, 15, 15);
  if (config.tampilkanBismillah) {
    doc.setFont('times', 'italic');
    doc.setFontSize(10);
    doc.text('Bismillahirrahmanirrahim', pageWidth / 2, y, { align: 'center' });
    y += 6;
  }

  // Formal Metadata vs Centered Title (for SK, ST, SM, SKet, SRT, PK)
  const isCenteredTitle = ['SK', 'ST', 'SM', 'SKet', 'SR', 'SPn', 'SPPD', 'SRT', 'PK'].includes(surat.kodeJenis);

  if (isCenteredTitle) {
    doc.setFont('times', 'bold');
    doc.setFontSize(12.5);
    const titleUpper = (surat.namaJenis.split('(')[0] || surat.perihal).trim().toUpperCase();
    doc.text(titleUpper, pageWidth / 2, y, { align: 'center' });
    const titleWidth = doc.getTextWidth(titleUpper);
    doc.setLineWidth(0.4);
    doc.line((pageWidth - titleWidth) / 2, y + 1.2, (pageWidth + titleWidth) / 2, y + 1.2);
    y += 5.5;
    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    doc.text(`Nomor : ${surat.nomorSurat}`, pageWidth / 2, y, { align: 'center' });
    y += 8;
  } else {
    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    const tglFormatted = `${surat.kotaTerbit || config.kotaTerbit || 'Karawang'}, ${formatTanggalIndo(surat.tanggalSurat)}`;
    doc.text(tglFormatted, pageWidth - marginX, y, { align: 'right' });

    doc.text('Nomor', marginX, y);
    doc.text(`: ${surat.nomorSurat}`, marginX + 24, y);
    y += 5;

    doc.text('Lampiran', marginX, y);
    doc.text(`: ${surat.lampiran || '-'}`, marginX + 24, y);
    y += 5;

    doc.text('Perihal', marginX, y);
    doc.setFont('times', 'bold');
    const perihalLines = doc.splitTextToSize(`: ${surat.perihal}`, 95);
    doc.text(perihalLines, marginX + 24, y);
    y += perihalLines.length * 5 + 4;

    doc.setFont('times', 'normal');
    doc.text('Kepada Yth.', marginX, y);
    y += 5;
    doc.setFont('times', 'bold');
    doc.text(surat.tujuanAtauPengirim || '-', marginX, y);
    y += 5;
    if (surat.alamatTujuan) {
      doc.setFont('times', 'normal');
      doc.text(surat.alamatTujuan, marginX, y);
      y += 6;
    }
    y += 3;
  }

  // Salam Pembuka
  if (surat.salamPembuka) {
    doc.setFont('times', 'italic');
    doc.setFontSize(10.5);
    doc.text(surat.salamPembuka, marginX, y);
    y += 6.5;
  }

  // Kalimat Pembuka
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  if (surat.kalimatPembuka) {
    const pembukaLines = doc.splitTextToSize(surat.kalimatPembuka, contentWidth);
    doc.text(pembukaLines, marginX, y);
    y += pembukaLines.length * 5.2 + 4;
  }

  // Isi Surat
  const isiParagraphs = (surat.isiSurat || '').split('\n');
  for (const para of isiParagraphs) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    if (!para.trim()) {
      y += 3.5;
      continue;
    }
    const wrapped = doc.splitTextToSize(para, contentWidth);
    doc.text(wrapped, marginX, y);
    y += wrapped.length * 5.2 + 1.5;
  }

  y += 4;

  // Penutup Surat
  if (surat.penutupSurat) {
    if (y > 245) {
      doc.addPage();
      y = 20;
    }
    const penutupLines = doc.splitTextToSize(surat.penutupSurat, contentWidth);
    doc.text(penutupLines, marginX, y);
    y += penutupLines.length * 5.2 + 8;
  }

  // Signature Block
  if (y > 225) {
    doc.addPage();
    y = 24;
  }

  const showTwoSigners = surat.tampilkanPenandatangan2 ?? config.tampilkanPenandatangan2;
  const kotaTgl = `${surat.kotaTerbit || config.kotaTerbit || 'Karawang'}, ${formatTanggalIndo(surat.tanggalSurat)}`;

  if (showTwoSigners) {
    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    doc.text('Mengetahui,', marginX + 30, y, { align: 'center' });
    doc.text(kotaTgl, pageWidth - marginX - 35, y, { align: 'center' });
    y += 5;

    doc.text(surat.jabatanPenandatangan2 || config.jabatanPenandatangan2 || 'Ketua Pondok', marginX + 30, y, { align: 'center' });
    doc.text(surat.jabatanPenandatangan || config.jabatanPenandatangan || 'Sekretaris Pondok', pageWidth - marginX - 35, y, { align: 'center' });

    y += 22;
    doc.setFont('times', 'bold');
    const nama2 = surat.namaPenandatangan2 || config.namaPenandatangan2 || 'K.H. Ahmad Faqih Al-Maliki';
    const nama1 = surat.namaPenandatangan || config.namaPenandatangan || 'Ustadz Muhammad Yusuf, S.Pd';
    doc.text(nama2, marginX + 30, y, { align: 'center' });
    doc.text(nama1, pageWidth - marginX - 35, y, { align: 'center' });
  } else {
    const sigX = pageWidth - marginX - 38;
    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    doc.text(kotaTgl, sigX, y, { align: 'center' });
    y += 5;
    doc.text(surat.jabatanPenandatangan || config.jabatanPenandatangan || 'Sekretaris Pondok', sigX, y, { align: 'center' });
    y += 22;
    doc.setFont('times', 'bold');
    doc.text(surat.namaPenandatangan || config.namaPenandatangan || 'Ustadz Muhammad Yusuf, S.Pd', sigX, y, { align: 'center' });
  }

  // Tembusan
  if (surat.tembusan && surat.tembusan.trim()) {
    y += 14;
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('times', 'bold');
    doc.setFontSize(9.5);
    doc.text('Tembusan:', marginX, y);
    y += 4.5;
    doc.setFont('times', 'normal');
    const tembusanLines = doc.splitTextToSize(surat.tembusan, contentWidth);
    doc.text(tembusanLines, marginX, y);
  }

  const safeFilename = (surat.nomorSurat || surat.kodeJenis).replace(/[^a-zA-Z0-9-_]/g, '_');
  doc.save(`Surat_${surat.kodeJenis}_${safeFilename}.pdf`);
}

export async function downloadLaporanKeuanganPDF(params: {
  periodeLabel: string;
  transaksi: TransaksiKeuangan[];
  totalPemasukan: number;
  totalPengeluaran: number;
  saldoKas: number;
  namaPondok: string;
  logoUrl?: string;
}): Promise<void> {
  const { periodeLabel, transaksi, totalPemasukan, totalPengeluaran, saldoKas, namaPondok, logoUrl } = params;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;
  let y = 15;

  const logoData = logoUrl ? await loadImageAsDataUrl(logoUrl) : null;
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', marginX, y, 18, 18);
    } catch {
      // ignore
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(35, 23, 16);
  doc.text((namaPondok || 'PONDOK PESANTREN SALAF AL-MALIKI').toUpperCase(), pageWidth / 2 + (logoData ? 6 : 0), y + 6, { align: 'center' });
  doc.setFontSize(10.5);
  doc.text(`LAPORAN KEUANGAN BENDAHARA (${periodeLabel.toUpperCase()})`, pageWidth / 2 + (logoData ? 6 : 0), y + 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 75, 65);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`, pageWidth / 2 + (logoData ? 6 : 0), y + 17, { align: 'center' });

  y += 22;
  doc.setDrawColor(198, 139, 89);
  doc.setLineWidth(0.7);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 7;

  // Summary Boxes
  const boxW = (contentWidth - 8) / 3;
  const drawSummaryBox = (x: number, label: string, val: number, color: [number, number, number]) => {
    doc.setFillColor(248, 245, 240);
    doc.setDrawColor(210, 195, 175);
    doc.roundedRect(x, y, boxW, 18, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(90, 75, 65);
    doc.text(label, x + 4, y + 6);
    doc.setFontSize(10.5);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(`Rp ${val.toLocaleString('id-ID')}`, x + 4, y + 13.5);
  };

  drawSummaryBox(marginX, 'TOTAL PEMASUKAN', totalPemasukan, [22, 163, 74]);
  drawSummaryBox(marginX + boxW + 4, 'TOTAL PENGELUARAN', totalPengeluaran, [220, 38, 38]);
  drawSummaryBox(marginX + (boxW + 4) * 2, 'SALDO KAS BERSIH', saldoKas, [160, 105, 25]);

  y += 25;

  // Table Header
  const drawTableHeader = () => {
    doc.setFillColor(38, 27, 20);
    doc.rect(marginX, y, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(245, 239, 230);
    doc.text('Tanggal', marginX + 2, y + 5.2);
    doc.text('Kode / Kategori', marginX + 26, y + 5.2);
    doc.text('Uraian Transaksi', marginX + 74, y + 5.2);
    doc.text('Tipe', marginX + 136, y + 5.2);
    doc.text('Nominal (Rp)', pageWidth - marginX - 2, y + 5.2, { align: 'right' });
    y += 8;
  };

  drawTableHeader();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  transaksi.forEach((trx, idx) => {
    if (y > 272) {
      doc.addPage();
      y = 16;
      drawTableHeader();
    }
    if (idx % 2 === 0) {
      doc.setFillColor(252, 250, 246);
      doc.rect(marginX, y, contentWidth, 8, 'F');
    }
    doc.setTextColor(30, 25, 20);
    doc.text(trx.tanggal, marginX + 2, y + 5.2);
    doc.text((trx.kategori || '').slice(0, 24), marginX + 26, y + 5.2);
    doc.text((trx.deskripsi || '').slice(0, 34), marginX + 74, y + 5.2);

    if (trx.tipe === 'Pemasukan') {
      doc.setTextColor(22, 163, 74);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    doc.text(trx.tipe, marginX + 136, y + 5.2);
    doc.text(`${trx.tipe === 'Pemasukan' ? '+' : '-'}${trx.nominal.toLocaleString('id-ID')}`, pageWidth - marginX - 2, y + 5.2, { align: 'right' });
    y += 8;
  });

  doc.save(`Laporan_Keuangan_AlMaliki_${periodeLabel.replace(/\s+/g, '_')}.pdf`);
}

export async function downloadElementAsPdf(elementId: string, filename: string = 'Dokumen_AlMaliki.pdf'): Promise<void> {
  const el = document.getElementById(elementId);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const textContent = el ? el.innerText : 'Dokumen Resmi Pondok Pesantren Salaf Al-Maliki';
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(textContent, 170);
  doc.text(lines, 20, 22);
  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

