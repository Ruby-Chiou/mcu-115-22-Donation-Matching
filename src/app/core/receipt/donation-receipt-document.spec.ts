import { isTaiwanId } from './taiwan-id';
import {
  lineFromItemText,
  receiptPdfFileName,
  receiptPriceTotal,
  receiptQuantityLabel,
  summarizeReceiptLines,
  validateAgencyReceiptIssue,
  validateDonorReceiptRequest,
  validateReceiptLines,
} from './donation-receipt-document';

describe('donation receipt document', () => {
  const lines = [{ name: '白米', quantity: 2, unit: '包', estimatedPrice: 1200 }];

  it('accepts the common sample national id', () => {
    expect(isTaiwanId('A123456789')).toBe(true);
    expect(isTaiwanId('a123456788')).toBe(false);
  });

  it('names the downloaded file after the receipt number', () => {
    expect(receiptPdfFileName('RC-2026-0001')).toBe('捐贈收據-RC-2026-0001.pdf');
  });

  it('summarizes item lines for the stored donation text', () => {
    expect(summarizeReceiptLines(lines)).toBe('白米 2包');
  });

  it('reads the count out of an item name instead of leaving quantity at 1', () => {
    expect(lineFromItemText('橘子工坊洗衣精 3 瓶')).toEqual({
      name: '橘子工坊洗衣精',
      quantity: 3,
      unit: '瓶',
      estimatedPrice: null,
    });
    expect(receiptQuantityLabel([{ name: '橘子工坊洗衣精', quantity: 3, unit: '瓶', estimatedPrice: 120 }])).toBe('3 瓶');
    expect(receiptPriceTotal([{ name: '橘子工坊洗衣精', quantity: 3, unit: '瓶', estimatedPrice: 120 }])).toBe(360);
  });

  it('requires a price, a valid id, and agreement before the donor submits', () => {
    expect(validateReceiptLines([{ ...lines[0], estimatedPrice: null }])).toContain('預估單價');
    expect(
      validateDonorReceiptRequest({
        donorName: '王小明',
        donorPhone: '0912345678',
        donorEmail: 'donor@example.com',
        donorIdNo: 'A123456789',
        lines,
        handoverMethod: '面交',
        agreed: false,
      }),
    ).toContain('同意');
  });

  it('requires agency contact data before issue', () => {
    expect(
      validateAgencyReceiptIssue({
        donorName: '王小明',
        donorPhone: '0912345678',
        donorEmail: 'donor@example.com',
        donorIdNo: 'A123456789',
        agencyName: '',
        agencyAddress: '台北市',
        agencyPhone: '02-1234-5678',
        lines,
        handoverMethod: '寄送',
        completedOn: '2026-10-24',
      }),
    ).toContain('受贈機構');
  });
});
