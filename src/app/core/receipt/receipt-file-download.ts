/** 複製成一般 ArrayBuffer，避免共用記憶體型別無法放進 Blob。 */
export function pdfBlob(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);

  return new Blob([copy.buffer], { type: 'application/pdf' });
}

/** 觸發瀏覽器下載已完成的 PDF，不開啟列印對話框。 */
export function savePdfFile(bytes: Uint8Array, fileName: string): void {
  const blob = pdfBlob(bytes);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
