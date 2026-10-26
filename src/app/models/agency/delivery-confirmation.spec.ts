import { DeliveryShipment, receiptSubmitError } from './delivery-confirmation';

describe('receipt confirmation', () => {
  const ready: DeliveryShipment = {
    id: '1',
    donorUid: 'donor-1',
    donorName: '王小明',
    phone: '0912',
    actualMaterial: '白米',
    quantity: 20,
    donationMethod: '寄送',
    logisticsCarrier: '黑貓宅急便',
    trackingNo: '771234567890',
    trackingUploadedAt: null,
    note: '',
    receiptConfirmedAt: null,
    receiptPartial: false,
    receiptDeclinedVideo: false,
    receiptNote: '',
  };

  it('asks for a photo and a dispute acknowledgement when there is no video', () => {
    expect(
      receiptSubmitError({
        donationMethod: ready.donationMethod,
        trackingNo: ready.trackingNo,
        alreadyConfirmed: false,
        photoCount: 0,
        hasVideo: false,
        declinedVideo: true,
      }),
    ).toContain('照片');

    expect(
      receiptSubmitError({
        donationMethod: ready.donationMethod,
        trackingNo: ready.trackingNo,
        alreadyConfirmed: false,
        photoCount: 1,
        hasVideo: false,
        declinedVideo: false,
      }),
    ).toContain('各自承擔');
  });

  it('accepts a partial unboxing when a photo exists and video is waived', () => {
    expect(
      receiptSubmitError({
        donationMethod: ready.donationMethod,
        trackingNo: ready.trackingNo,
        alreadyConfirmed: false,
        photoCount: 1,
        hasVideo: false,
        declinedVideo: true,
      }),
    ).toBeNull();
  });

  it('waits for the donor tracking number before a shipped donation can be confirmed', () => {
    expect(
      receiptSubmitError({
        donationMethod: '寄送',
        trackingNo: '',
        alreadyConfirmed: false,
        photoCount: 1,
        hasVideo: true,
        declinedVideo: false,
      }),
    ).toContain('物流單號');
  });
});
