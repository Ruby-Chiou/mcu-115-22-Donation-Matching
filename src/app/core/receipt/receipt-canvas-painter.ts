import {
  DonationReceiptDocument,
  formatReceiptDate,
  formatReceiptPrice,
  lineSubtotal,
  receiptPriceTotal,
  receiptQuantityLabel,
} from './donation-receipt-document';

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const MARGIN = 72;
const FONT = '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif';

/** 用系統中文字型把收據畫成一頁圖，再交給 PDF 組裝。版面只留文字與章印。 */
export async function paintReceipt(document: DonationReceiptDocument): Promise<Uint8Array> {
  const canvas = window.document.createElement('canvas');
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('瀏覽器無法繪製收據');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  context.fillStyle = '#111111';
  context.strokeStyle = '#111111';
  context.lineWidth = 2;
  context.textBaseline = 'top';
  context.strokeRect(36, 36, PAGE_WIDTH - 72, PAGE_HEIGHT - 72);

  const [orgSeal, officerSeal] = await Promise.all([
    loadCanvasImage(document.orgSealUrl),
    loadCanvasImage(document.officerSealUrl),
  ]);

  drawReceipt(context, document, orgSeal, officerSeal);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));

  if (!blob) {
    throw new Error('無法輸出收據圖檔');
  }

  return new Uint8Array(await blob.arrayBuffer());
}

function drawReceipt(
  context: CanvasRenderingContext2D,
  document: DonationReceiptDocument,
  orgSeal: HTMLImageElement | null,
  officerSeal: HTMLImageElement | null,
): void {
  let y = 78;
  const contentWidth = PAGE_WIDTH - MARGIN * 2;

  context.textAlign = 'center';
  context.font = `700 54px ${FONT}`;
  context.fillText('捐贈收據', PAGE_WIDTH / 2, y);
  y += 86;

  context.textAlign = 'left';
  context.font = `28px ${FONT}`;
  context.fillText(`收據編號　${document.receiptNo || '尚未開立'}`, MARGIN, y);
  context.fillText(`開立日期　${formatReceiptDate(document.issuedOn)}`, MARGIN + 620, y);
  y += 64;

  y = drawSection(context, y, '捐助者', [
    `姓名　${textOf(document.donorName)}`,
    `電話　${document.donorPhone.trim() ? textOf(document.donorPhone) : '未留下'}`,
  ]);
  y = drawSection(context, y, '受贈機構', [
    `名稱　${textOf(document.agencyName)}`,
    `會址　${textOf(document.agencyAddress)}`,
    `電話　${textOf(document.agencyPhone)}`,
    `配送地址　${textOf(document.deliveryAddress ?? '')}`,
  ]);

  y = drawLines(context, y, document, contentWidth);
  y += 28;
  context.font = `28px ${FONT}`;
  context.fillText(`接送方式　${textOf(document.handoverMethod)}`, MARGIN, y);
  y += 46;

  if (document.handoverMethod === '寄送') {
    context.fillText(`物流公司　${textOf(document.logisticsCarrier ?? '')}`, MARGIN, y);
    y += 46;
    context.fillText(`物流單號　${textOf(document.trackingNo ?? '')}`, MARGIN, y);
    y += 46;
  }
  context.fillText(`捐贈完成日期　${formatReceiptDate(document.completedOn)}`, MARGIN, y);

  drawSeals(context, orgSeal, officerSeal);
  context.font = `22px ${FONT}`;
  context.fillStyle = '#333333';
  context.fillText('本收據須經機構章與負責人簽章後生效。', MARGIN, 1648);
  context.fillStyle = '#111111';
}

function drawSection(context: CanvasRenderingContext2D, y: number, title: string, rows: string[]): number {
  context.font = `700 30px ${FONT}`;
  context.fillText(title, MARGIN, y);
  y += 46;
  context.font = `26px ${FONT}`;

  for (const row of rows) {
    const wrapped = wrapText(context, row, PAGE_WIDTH - MARGIN * 2);

    for (const line of wrapped) {
      context.fillText(line, MARGIN, y);
      y += 38;
    }
  }

  return y + 16;
}

function drawLines(context: CanvasRenderingContext2D, y: number, document: DonationReceiptDocument, contentWidth: number): number {
  const columns = [400, 110, 100, 210, contentWidth - 820];
  const headers = ['品項', '數量', '單位', '預估單價', '小計'];
  context.font = `700 24px ${FONT}`;
  drawRow(context, y, headers, columns, 52, true);
  y += 52;
  context.font = `22px ${FONT}`;

  const lines = document.lines.length > 0 ? document.lines : [];

  if (lines.length === 0) {
    drawRow(context, y, ['—', '—', '—', '—', '—'], columns, 52, false);
    return y + 52;
  }

  for (const line of lines.slice(0, 8)) {
    const nameLines = wrapText(context, line.name || '—', columns[0] - 24);
    const height = Math.max(52, nameLines.length * 30 + 16);
    drawRow(
      context,
      y,
      [
        nameLines.join('\n'),
        String(line.quantity || '—'),
        line.unit || '—',
        formatReceiptPrice(line.estimatedPrice),
        formatReceiptPrice(lineSubtotal(line)),
      ],
      columns,
      height,
      false,
    );
    y += height;
  }

  if (document.lines.length > 8) {
    context.fillText('其餘品項請見系統內的收據明細。', MARGIN, y + 8);
    y += 40;
  }

  context.font = `700 24px ${FONT}`;
  context.fillText(`合計數量　${receiptQuantityLabel(lines)}`, MARGIN, y + 16);
  context.fillText(`預估總價　${formatReceiptPrice(receiptPriceTotal(lines))}`, MARGIN + 520, y + 16);

  return y + 56;
}

function drawRow(
  context: CanvasRenderingContext2D,
  y: number,
  cells: string[],
  columns: number[],
  height: number,
  header: boolean,
): void {
  let x = MARGIN;

  cells.forEach((cell, index) => {
    const width = columns[index] ?? 0;
    context.strokeRect(x, y, width, height);
    const parts = cell.split('\n');
    parts.forEach((part, lineIndex) => {
      context.fillText(part, x + 12, y + 12 + lineIndex * 32);
    });
    x += width;
    if (header) {
      void header;
    }
  });
}

function drawSeals(
  context: CanvasRenderingContext2D,
  orgSeal: HTMLImageElement | null,
  officerSeal: HTMLImageElement | null,
): void {
  drawSeal(context, orgSeal, 760, 1468, '機構章');
  drawSeal(context, officerSeal, 980, 1468, '負責人簽章');
}

function drawSeal(context: CanvasRenderingContext2D, image: HTMLImageElement | null, x: number, y: number, label: string): void {
  context.strokeRect(x, y, 150, 150);
  context.font = `22px ${FONT}`;

  if (!image) {
    context.fillText(label, x + 18, y + 60);
    return;
  }

  const scale = Math.min(130 / image.width, 130 / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  context.drawImage(image, x + (150 - width) / 2, y + (150 - height) / 2, width, height);
}

function wrapText(context: CanvasRenderingContext2D, value: string, maxWidth: number): string[] {
  const text = value.trim() || '—';
  const lines: string[] = [];
  let current = '';

  for (const char of Array.from(text)) {
    const next = current + char;

    if (context.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = char;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : ['—'];
}

function textOf(value: string): string {
  return value.trim() || '—';
}

async function loadCanvasImage(url: string): Promise<HTMLImageElement | null> {
  if (!url.trim() || url.startsWith('blob:')) {
    return null;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const objectUrl = URL.createObjectURL(await response.blob());
    const image = new Image();

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('seal'));
      };
      image.src = objectUrl;
    });
    URL.revokeObjectURL(objectUrl);

    return image;
  } catch {
    return null;
  }
}
