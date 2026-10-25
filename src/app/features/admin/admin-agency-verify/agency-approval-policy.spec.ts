import { AgencyApplication } from '../../../core/services/agency-verification/agency-verification.service';
import { AgencyApplicationQuery } from './agency-application-query';
import { approvalReady, approvedReviewNote, reviewDecisionError } from './agency-approval-policy';

describe('agency approval policy', () => {
  const emptyChecks = {
    organizationFound: false,
    calledPublishedPhone: false,
    registrantConfirmed: false,
  };

  it('blocks approval until the public registry and published phone are both confirmed', () => {
    expect(reviewDecisionError('approved', emptyChecks, '已通話')).toContain('公開查詢網站');
    expect(approvalReady(emptyChecks)).toBe(false);
  });

  it('records the public lookup when every check and the note are present', () => {
    const checks = {
      organizationFound: true,
      calledPublishedPhone: true,
      registrantConfirmed: true,
    };

    expect(reviewDecisionError('approved', checks, '司法院查到，總機確認')).toBeNull();
    expect(approvedReviewNote('司法院查到，總機確認')).toContain('網站公布電話');
  });

  it('keeps cancelled accounts out of the pending count and lets the list find them', () => {
    const query = new AgencyApplicationQuery();
    const applications = [
      application('pending', 'ACTIVE'),
      application('approved', 'DELETED'),
    ];

    expect(query.count(applications, 'pending')).toBe(1);
    expect(query.count(applications, 'approved')).toBe(0);
    expect(query.filter(applications, '', 'deleted')).toHaveLength(1);
  });
});

function application(status: AgencyApplication['status'], accountStatus: string): AgencyApplication {
  return {
    id: `${status}-${accountStatus}`,
    name: '花蓮光復家庭支持站',
    email: 'hualien.socialworker.1024@gmail.com',
    registrationNumber: '82916453',
    representative: '林志明',
    phone: '03-870-2211',
    defaultAddress: '花蓮縣光復鄉中正路一段88號',
    contact: '陳社工',
    contactPersonTitle: '社工員',
    department: '社會服務部',
    contactPersonPhone: '0912-334-567',
    contactPersonEmail: 'hualien.socialworker.1024@gmail.com',
    consentToContact: true,
    agreeToTerms: true,
    submittedAt: '2026-10-24',
    documentName: 'hualien-proof.png',
    documentStored: true,
    status,
    accountStatus,
    reviewNote: '',
  };
}
