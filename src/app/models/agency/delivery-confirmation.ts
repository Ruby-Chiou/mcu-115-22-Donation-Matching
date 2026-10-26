export interface DeliveryShipment {
  id: string;
  donorUid: string;
  donorName: string;
  phone: string;
  actualMaterial: string;
  quantity: number;
  donationMethod: string;
  logisticsCarrier: string;
  trackingNo: string;
  trackingUploadedAt: string | null;
  note: string;
  receiptConfirmedAt: string | null;
  receiptPartial: boolean;
  receiptDeclinedVideo: boolean;
  receiptNote: string;
}

export interface ReceiptProofFile {
  id: string;
  fileType: 'receipt_image' | 'receipt_video';
  name: string;
  url: string;
  mimeType: string;
}

export function receiptSubmitError(input: {
  donationMethod: string;
  trackingNo: string;
  alreadyConfirmed: boolean;
  photoCount: number;
  hasVideo: boolean;
  declinedVideo: boolean;
}): string | null {
  if (input.alreadyConfirmed) {
    return '這筆已經簽收過了。';
  }

  if (input.donationMethod === '寄送' && !input.trackingNo.trim()) {
    return '捐助者還沒有上傳物流單號，先等單號再簽收。';
  }

  if (input.photoCount < 1) {
    return '請先拍至少一張收貨照片。數量很多時不必全部拆箱。';
  }

  if (!input.hasVideo && !input.declinedVideo) {
    return '沒有錄影的話，要勾選爭議由雙方各自承擔。';
  }

  return null;
}
