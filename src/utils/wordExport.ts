export interface WordTableColumn {
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface WordDocumentOptions {
  filename: string;
  title: string;
  subtitle?: string;
  namaPondok?: string;
  alamatPondok?: string;
  kotaInstansi?: string;
  penandatanganNama?: string;
  penandatanganJabatan?: string;
  summaryLines?: string[];
  columns: WordTableColumn[];
  rows: string[][];
}

function escapeHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, '<br/>');
}

/**
 * Menghasilkan file Microsoft Word (.doc) terformat rapi (A4, Kop Pondok, Tabel & Tanda Tangan)
 * dan langsung mengunduhnya secara otomatis ke perangkat pengguna.
 */
export function downloadWordDocument(options: WordDocumentOptions): void {
  const {
    filename,
    title,
    subtitle,
    namaPondok = 'PONDOK PESANTREN SALAF AL-MALIKI',
    alamatPondok = 'Jl. Pesantren Luhur No. 99, Telukjambe Timur, Karawang 41361',
    kotaInstansi = 'Karawang',
    penandatanganNama = 'Ketua Pondok Pesantren',
    penandatanganJabatan = 'Ketua Pondok Pesantren',
    summaryLines = [],
    columns,
    rows,
  } = options;

  const tanggalCetak = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const safeFilename = filename.toLowerCase().endsWith('.doc')
    ? filename
    : `${filename}.doc`;

  const thCells = columns
    .map(
      (col) =>
        `<th style="border:1px solid #1e293b;background-color:#064e3b;color:#ffffff;padding:7px 8px;font-size:10pt;font-weight:bold;text-align:${
          col.align || 'left'
        };${col.width ? `width:${col.width};` : ''}">${escapeHtml(col.header)}</th>`
    )
    .join('');

  const bodyRows =
    rows.length > 0
      ? rows
          .map((row, idx) => {
            const bg = idx % 2 === 1 ? '#f8fafc' : '#ffffff';
            const cells = row
              .map((cell, cIdx) => {
                const align = columns[cIdx]?.align || 'left';
                return `<td style="border:1px solid #94a3b8;padding:6px 8px;font-size:9.5pt;vertical-align:top;text-align:${align};background-color:${bg};">${escapeHtml(
                  cell
                )}</td>`;
              })
              .join('');
            return `<tr>${cells}</tr>`;
          })
          .join('')
      : `<tr><td colspan="${columns.length}" style="border:1px solid #94a3b8;padding:14px;text-align:center;font-size:10pt;color:#475569;">Tidak ada data riwayat untuk ditampilkan.</td></tr>`;

  const summaryHtml =
    summaryLines.length > 0
      ? `<div style="margin-bottom:12px;padding:8px 12px;background-color:#f0fdf4;border:1px solid #86efac;font-size:9.5pt;">
          ${summaryLines.map((line) => `<div>• ${escapeHtml(line)}</div>`).join('')}
        </div>`
      : '';

  const wordHtml = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40" lang="id">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4 landscape;
      margin: 15mm 15mm 15mm 15mm;
    }
    body {
      font-family: 'Times New Roman', Calibri, Arial, serif;
      color: #0f172a;
      margin: 0;
      padding: 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
    }
  </style>
</head>
<body>
  <div style="text-align:center;border-bottom:3px double #0f172a;padding-bottom:8px;margin-bottom:14px;">
    <div style="font-size:11pt;font-weight:bold;letter-spacing:0.5px;">YAYASAN PENDIDIKAN ISLAM SALAF AL-MALIKI</div>
    <div style="font-size:14pt;font-weight:bold;text-transform:uppercase;">${escapeHtml(namaPondok)}</div>
    <div style="font-size:9pt;color:#334155;">${escapeHtml(alamatPondok)}</div>
  </div>

  <div style="text-align:center;margin-bottom:14px;">
    <div style="font-size:12.5pt;font-weight:bold;text-transform:uppercase;text-decoration:underline;">${escapeHtml(title)}</div>
    ${
      subtitle
        ? `<div style="font-size:9.5pt;color:#334155;margin-top:3px;">${escapeHtml(subtitle)}</div>`
        : ''
    }
    <div style="font-size:9pt;color:#475569;margin-top:2px;">Dicetak pada: ${escapeHtml(tanggalCetak)}</div>
  </div>

  ${summaryHtml}

  <table>
    <thead>
      <tr>${thCells}</tr>
    </thead>
    <tbody>
      ${bodyRows}
    </tbody>
  </table>

  <table style="width:100%;margin-top:24px;border:none;">
    <tr>
      <td style="width:65%;border:none;"></td>
      <td style="width:35%;border:none;text-align:center;font-size:10pt;">
        <div>${escapeHtml(kotaInstansi)}, ${escapeHtml(tanggalCetak)}</div>
        <div style="font-weight:bold;margin-top:3px;">${escapeHtml(penandatanganJabatan)}</div>
        <div style="height:48px;"></div>
        <div style="font-weight:bold;text-decoration:underline;">${escapeHtml(penandatanganNama)}</div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const blob = new Blob(['\ufeff', wordHtml], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
