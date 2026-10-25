import {
  AgencyApplication,
  ReviewStatus,
} from '../../../core/services/agency-verification/agency-verification.service';

const LABELS: Record<ReviewStatus, string> = {
  pending: '待審核',
  approved: '已驗證',
  rejected: '未通過',
  supplement: '待補件',
};

export function agencyReviewLabel(status: ReviewStatus): string {
  return LABELS[status];
}

export function agencyStatusText(application: AgencyApplication): string {
  return application.accountStatus === 'DELETED' ? '已註銷' : agencyReviewLabel(application.status);
}

export function agencyStatusClass(application: AgencyApplication): string {
  return application.accountStatus === 'DELETED' ? 'status-deleted' : `status-${application.status}`;
}
