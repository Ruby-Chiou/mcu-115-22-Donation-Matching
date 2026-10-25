import { ReviewStatus } from '../../../core/services/agency-verification/agency-verification.service';

export interface PublicWelfareRegistry {
  name: string;
  url: string;
  hint: string;
}

export interface PublicRegistryCheck {
  organizationFound: boolean;
  calledPublishedPhone: boolean;
  registrantConfirmed: boolean;
}

export const PUBLIC_WELFARE_REGISTRIES: readonly PublicWelfareRegistry[] = [
  {
    name: '司法院法人及夫妻財產登記公告查詢',
    url: 'https://aomp109.judicial.gov.tw/judbp/whd6k/WHD6K01.htm',
    hint: '用機構名稱查全國財團法人、社團法人登記',
  },
  {
    name: '內政部人民團體數位櫃檯',
    url: 'https://grouptw.moi.gov.tw/searchGroup',
    hint: '用團體名稱查全國及省級人民團體',
  },
];

export function approvalReady(checks: PublicRegistryCheck): boolean {
  return checks.organizationFound && checks.calledPublishedPhone && checks.registrantConfirmed;
}

export function reviewDecisionError(
  status: Exclude<ReviewStatus, 'pending'>,
  checks: PublicRegistryCheck,
  note: string,
): string | null {
  if (status === 'approved' && !approvalReady(checks)) {
    return '通過前要先在公認的公開查詢網站找到這間機構，撥打網站上寫的電話，確認機構存在、註冊人存在，而且對方承認有向本平台註冊。寄確認信不能當作通過。';
  }

  if (!note.trim()) {
    return status === 'approved' ? '請寫下查詢的網站、接聽人與確認結果。' : '請填寫審核原因，再進行此操作。';
  }

  return null;
}

export function approvedReviewNote(note: string): string {
  return `已查公開社福資料並撥打網站公布電話確認。${note.trim()}`;
}
