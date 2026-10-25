import { DonationStatus } from '../agency/item-review';

export type DonationHistoryFilter = 'ALL' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export interface DonorDonationHistory {
  id: string;
  donorUid: string;
  demandId: number;
  demandItem: string;
  demandCategory: string;
  recipient: string;
  address: string;
  actualMaterial: string;
  quantity: number;
  donationMethod: '寄送' | '面交' | string;
  status: DonationStatus;
  aiDecision: string | null;
  aiReason: string | null;
  humanDecision: string | null;
  humanReason: string | null;
  needReceipt: boolean;
  needThankYou: boolean;
  thankNameMode: 'masked' | 'full';
  thankPublic: boolean;
  note: string;
  createdAt: string;
  aiCheckedAt: string | null;
  humanCheckedAt: string | null;
  /** 審核通過後，捐助者上傳的物流單號 */
  trackingNo: string;
  receiptConfirmedAt: string | null;
  receiptPartial: boolean;
  receiptDeclinedVideo: boolean;
}

export const DONATION_HISTORY_STATUS_LABELS: Record<DonationStatus, string> = {
  pending_ai_review: 'AI 審核中',
  pending_human_review: '機構審核中',
  human_approved: '已通過',
  human_rejected: '未通過',
};

export const DONATION_HISTORY_FILTER_OPTIONS: { value: DonationHistoryFilter; label: string }[] = [
  { value: 'ALL', label: '全部' },
  { value: 'IN_REVIEW', label: '審核中' },
  { value: 'APPROVED', label: '已通過' },
  { value: 'REJECTED', label: '未通過' },
];
