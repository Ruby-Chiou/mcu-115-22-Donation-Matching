import { MemberMessage } from '../../models/member/member-message';
import { DonorDonationHistory } from '../../models/member/donation-history';

export interface MemberMessageAction {
  label: string;
  hint?: string;
  /** Angular routerLink commands */
  commands: string | string[];
  queryParams?: Record<string, string>;
}

export type DonationNextStep =
  | { kind: 'action'; listLabel: string; detailLabel: string }
  | { kind: 'wait'; listLabel: string; detailLabel: string }
  | { kind: 'supplement'; listLabel: string; detailLabel: string };

const DONATION_ID_PATTERN = /(?:捐助編號|donation(?:Id| ID)?)[:：\s]*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

/** 從欄位或內文取出對應捐助 id。 */
export function relatedDonationIdOf(message: MemberMessage): string | null {
  const fromField = message.relatedDonationId?.trim();
  if (fromField) {
    return fromField;
  }

  const matched = message.content.match(DONATION_ID_PATTERN);
  return matched?.[1] ?? null;
}

/**
 * 收件匣可直接操作的按鈕：捐助／審核信連到捐助紀錄或機構審核頁，不必再手動翻找。
 */
export function memberMessageActions(
  message: MemberMessage,
  options: {
    role: string;
    records?: readonly DonorDonationHistory[];
  },
): MemberMessageAction[] {
  const donationId = relatedDonationIdOf(message);
  const record = donationId ? options.records?.find((item) => item.id === donationId) : undefined;

  if (options.role === 'agency' && donationId) {
    return [
      {
        label: '開啟物資審核',
        hint: '直接進這筆捐助的審核詳情',
        commands: ['/agency/item-review', donationId],
      },
    ];
  }

  if (options.role !== 'donor') {
    return [];
  }

  if (!donationId && message.category !== 'DONATION') {
    return [];
  }

  const actions: MemberMessageAction[] = [];

  if (donationId) {
    const needsTracking =
      record?.status === 'human_approved' &&
      record.donationMethod === '寄送' &&
      (!record.trackingNo || !record.logisticsCarrier);

    const canRevise =
      record?.status === 'pending_ai_review' ||
      record?.status === 'pending_human_review' ||
      record?.status === 'needs_supplement';

    const canSupplement = record?.status === 'needs_supplement' || record?.status === 'human_rejected';

    if (needsTracking) {
      actions.push({
        label: '上傳物流單號',
        hint: '審核已通過，請補物流公司與單號',
        commands: ['/member'],
        queryParams: { tab: 'history', record: donationId },
      });
    } else if (canSupplement) {
      actions.push({
        label: '補件後再送審',
        hint: '在同一筆申請補上傳照片，不必重跑整段流程',
        commands: ['/member'],
        queryParams: { tab: 'history', record: donationId },
      });
    } else if (canRevise) {
      actions.push({
        label: '修改或撤回申請',
        hint: '機構尚未決定前可調整這筆捐助',
        commands: ['/member'],
        queryParams: { tab: 'history', record: donationId },
      });
    } else {
      actions.push({
        label: '開啟這筆捐助紀錄',
        commands: ['/member'],
        queryParams: { tab: 'history', record: donationId },
      });
    }
  } else {
    actions.push({
      label: '打開捐助紀錄',
      hint: '這封信沒有綁定編號，請在紀錄裡對應物資',
      commands: ['/member'],
      queryParams: { tab: 'history' },
    });
  }

  return actions;
}

/** 列表短標。 */
export function donationNextActionLabel(record: DonorDonationHistory): string | null {
  return donationNextStep(record)?.listLabel ?? null;
}

/** 詳情區用：需補件走補件，不是叫人重跑申請。 */
export function donationNextStep(record: DonorDonationHistory): DonationNextStep | null {
  if (record.status === 'needs_supplement' || record.status === 'human_rejected') {
    return {
      kind: 'supplement',
      listLabel: record.status === 'needs_supplement' ? '需補件再送審' : '可補件再送審',
      detailLabel:
        record.status === 'needs_supplement'
          ? 'AI 審核未通過，請在同一筆補上傳照片後再送審'
          : '機構未通過，可在同一筆補件後再送審',
    };
  }

  if (record.status === 'pending_ai_review' || record.status === 'pending_human_review') {
    return {
      kind: 'action',
      listLabel: '可修改／撤回',
      detailLabel: '可修改物資內容或撤回申請',
    };
  }

  if (record.status === 'human_approved' && record.donationMethod === '寄送' && (!record.trackingNo || !record.logisticsCarrier)) {
    return {
      kind: 'action',
      listLabel: '待上傳物流',
      detailLabel: '請選擇物流公司並上傳單號',
    };
  }

  if (record.status === 'human_approved' && record.donationMethod === '寄送' && record.trackingNo && !record.receiptConfirmedAt) {
    return {
      kind: 'wait',
      listLabel: '等待機構簽收',
      detailLabel: '物流已上傳，等待機構簽收回報',
    };
  }

  return null;
}
