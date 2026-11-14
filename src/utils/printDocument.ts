/**
 * Helper untuk mencetak dokumen langsung ke dialog printer / PDF browser
 * menggunakan hidden iframe sehingga bekerja di dalam preview iFrame tanpa window.open.
 * Menyalin seluruh stylesheet Vite/Tailwind dari dokumen utama dan menunggu
 * seluruh gambar (Logo Kop Surat & Tanda Tangan Digital) serta font termuat penuh
 * sebelum memicu dialog cetak agar hasil cetak A4 rapi, konsisten, dan identik.
 */
export function openPrintWindow(title: string, bodyHtml: string, marginMm = 15): void {
  const existingIframe = document.getElementById('sim-kamtib-print-frame') as HTMLIFrameElement | null;
  if (existingIframe) {
    existingIframe.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'sim-kamtib-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  iframe.style.visibility = 'hidden';
  iframe.style.pointerEvents = 'none';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  // Kumpulkan seluruh <style> dan <link rel="stylesheet"> yang sudah terkompilasi dari dokumen utama
  const collectedStyles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]')
  )
    .map((node) => node.outerHTML)
    .join('\n');

  const safeMargin = Math.max(10, Math.min(30, marginMm));

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <base href="${window.location.origin}/" />
  <title>${title}</title>
  ${collectedStyles}
  <style>
    @page {
      size: A4 portrait;
      margin: ${safeMargin}mm;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: 'Times New Roman', Times, Georgia, serif;
      width: 100%;
      height: auto;
    }
    img {
      max-width: 100%;
      object-fit: contain;
      image-rendering: auto;
    }
    /* Fallback layout penting untuk kertas A4 jika CSS eksternal belum termuat */
    .a4-print-root,
    #sekretaris-surat-a4-print,
    #sekretaris-editor-a4-preview {
      background: #ffffff !important;
      color: #0f172a !important;
      font-family: 'Times New Roman', Times, Georgia, serif !important;
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
      margin: 0 auto !important;
      padding: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
    }
    @media print {
      .no-print { display: none !important; }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }
    }
  </style>
</head>
<body class="bg-white text-slate-900">
  <div class="a4-print-root">
    ${bodyHtml}
  </div>
</body>
</html>`;

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();

  let printed = false;
  const triggerPrint = async () => {
    if (printed) return;
    printed = true;
    try {
      const win = iframe.contentWindow;
      if (win?.document?.fonts?.ready) {
        await win.document.fonts.ready.catch(() => {});
      }
      // Decode semua gambar agar logo kop & tanda tangan tidak kosong saat dicetak
      const imgs = Array.from(win?.document?.images || []);
      await Promise.all(
        imgs.map((img) =>
          typeof img.decode === 'function' ? img.decode().catch(() => {}) : Promise.resolve()
        )
      );
      win?.focus();
      win?.print();
    } catch (err) {
      console.error('Print error:', err);
      try {
        window.print();
      } catch {
        // ignore
      }
    }
  };

  const waitForResourcesAndPrint = () => {
    try {
      const images = Array.from(doc.images || []);
      const stylesheets = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));

      let pending = images.length + stylesheets.length;
      if (pending === 0) {
        setTimeout(() => {
          void triggerPrint();
        }, 250);
        return;
      }

      const checkDone = () => {
        pending -= 1;
        if (pending <= 0) {
          setTimeout(() => {
            void triggerPrint();
          }, 250);
        }
      };

      stylesheets.forEach((link) => {
        if ((link as HTMLLinkElement).sheet) {
          checkDone();
        } else {
          link.addEventListener('load', checkDone, { once: true });
          link.addEventListener('error', checkDone, { once: true });
        }
      });

      images.forEach((img) => {
        if (img.complete && img.naturalWidth > 0) {
          checkDone();
        } else {
          img.addEventListener('load', checkDone, { once: true });
          img.addEventListener('error', checkDone, { once: true });
        }
      });

      // Batas waktu maksimal agar dialog cetak tetap terbuka walau ada aset eksternal lambat
      setTimeout(() => {
        void triggerPrint();
      }, 2500);
    } catch {
      setTimeout(() => {
        void triggerPrint();
      }, 400);
    }
  };

  iframe.onload = waitForResourcesAndPrint;
  setTimeout(waitForResourcesAndPrint, 350);
}
