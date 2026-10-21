const RECEIPT_PRINT_CSS = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    background: #fff;
    color: #111;
    font-family: "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif;
  }
  .paper {
    position: relative;
    width: 100%;
    padding: 8mm 10mm 6mm 14mm;
    border: 0;
    background: #fff;
    box-shadow: none;
    font-size: 15px;
    line-height: 1.45;
  }
  .copy-mark {
    position: absolute;
    top: 18mm;
    right: 0;
    margin: 0;
    writing-mode: vertical-rl;
    letter-spacing: 0.15em;
    font-size: 13px;
    font-weight: 700;
  }
  .paper-head {
    display: grid;
    grid-template-columns: 1.1fr 1.4fr 0.8fr;
    gap: 12px;
    align-items: start;
    margin-bottom: 14px;
  }
  .head-left p, .head-right p { margin: 0 0 6px; font-size: 14px; }
  .head-center { text-align: center; }
  .org-en { margin: 0; color: #b42318; font-size: 16px; font-weight: 700; font-style: italic; }
  h1 { margin: 4px 0; font-size: 26px; letter-spacing: 0.08em; }
  .doc-title { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: 0.4em; }
  .receipt-no-label { font-weight: 700; }
  .receipt-no { font-size: 18px; font-weight: 700; letter-spacing: 0.04em; }
  .detail-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  .detail-table th, .detail-table td { border: 2px solid #111; padding: 8px 10px; vertical-align: middle; }
  .detail-table th { width: 18%; background: #fff; font-size: 15px; font-weight: 700; text-align: center; }
  .detail-table th span { display: block; font-size: 12px; font-weight: 600; }
  .emphasis { font-size: 24px; font-weight: 700; letter-spacing: 0.08em; text-align: center; }
  .item { min-height: 64px; font-size: 20px; font-weight: 700; }
  .note { min-height: 40px; }
  .paper-foot { display: grid; grid-template-columns: 1.3fr 0.9fr; gap: 16px; margin-top: 14px; }
  .org-info p { margin: 0 0 4px; font-size: 14px; }
  .thanks { margin-top: 8px; color: #b42318; font-weight: 700; }
  .sign-block { text-align: right; }
  .seals { display: flex; justify-content: flex-end; align-items: flex-end; gap: 16px; min-height: 110px; }
  .seal { display: flex; align-items: center; justify-content: center; color: #b42318; font-weight: 700; }
  .seal img { width: 100%; height: 100%; object-fit: contain; }
  .seal-large { width: 110px; height: 110px; border: 2px solid #b42318; }
  .seal-small { width: 78px; height: 78px; border: 2px solid #b42318; border-radius: 50%; }
  .handler, .valid { margin: 6px 0 0; font-size: 13px; text-align: right; }
`;

/**
 * 只把收據紙張放進獨立文件再列印，不會把網站頁首、跑馬燈、頁尾截進去。
 * 列印對話框請選「另存為 PDF」，檔名會是收據編號。
 */
export function downloadReceiptPdf(paper: HTMLElement, receiptNo: string): void {
  const title = `捐贈收據-${receiptNo || '未編號'}`;
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', title);
  iframe.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;

  if (!doc || !iframe.contentWindow) {
    iframe.remove();
    window.alert('無法準備收據文件，請再試一次。');
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>${RECEIPT_PRINT_CSS}</style>
</head>
<body>
  ${paper.outerHTML}
</body>
</html>`);
  doc.close();

  const printWhenReady = (): void => {
    const frameWindow = iframe.contentWindow;

    if (!frameWindow) {
      iframe.remove();
      return;
    }

    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(() => iframe.remove(), 1000);
  };

  const images = Array.from(doc.images);

  if (images.length === 0) {
    window.setTimeout(printWhenReady, 50);
    return;
  }

  let pending = images.length;
  const finish = (): void => {
    pending -= 1;

    if (pending <= 0) {
      printWhenReady();
    }
  };

  for (const image of images) {
    if (image.complete) {
      finish();
    } else {
      image.onload = finish;
      image.onerror = finish;
    }
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}
