/**
 * Prints a specific DOM element or raw HTML string cleanly on A4 paper using an invisible iframe
 * (safe for preview iframe environments without using window.open).
 */
export function openPrintWindow(
  elementIdOrTitle: string,
  documentTitleOrHtml: string = 'Dokumen_Resmi_AlMaliki'
): void {
  const target = document.getElementById(elementIdOrTitle);
  const isRawHtmlSecond = documentTitleOrHtml.trim().startsWith('<');
  const isRawHtmlFirst = elementIdOrTitle.trim().startsWith('<');

  let bodyHtml = '';
  let pageTitle = 'Dokumen_Resmi_AlMaliki';

  if (target) {
    bodyHtml = target.outerHTML;
    pageTitle = documentTitleOrHtml;
  } else if (isRawHtmlSecond) {
    bodyHtml = documentTitleOrHtml;
    pageTitle = elementIdOrTitle;
  } else if (isRawHtmlFirst) {
    bodyHtml = elementIdOrTitle;
    pageTitle = documentTitleOrHtml;
  } else {
    window.print();
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    window.print();
    return;
  }

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>${pageTitle}</title>
        ${styles}
        <style>
          @page { size: A4 portrait; margin: 14mm; }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Plus Jakarta Sans', Georgia, serif;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        </style>
      </head>
      <body>
        ${bodyHtml}
      </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  }, 350);
}
