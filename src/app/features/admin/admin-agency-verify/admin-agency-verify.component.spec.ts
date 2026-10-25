import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AGENCY_APPLICATION_READER, AGENCY_DOCUMENT_READER, AGENCY_REVIEW_WRITER } from '../../../core/services/agency-verification/agency-review.ports';
import { AgencyApplication } from '../../../core/services/agency-verification/agency-verification.service';
import { AdminAgencyVerifyComponent } from './admin-agency-verify.component';

describe('AdminAgencyVerifyComponent', () => {
  let fixture: ComponentFixture<AdminAgencyVerifyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAgencyVerifyComponent],
    })
      .overrideComponent(AdminAgencyVerifyComponent, {
        set: {
          providers: [
            { provide: AGENCY_APPLICATION_READER, useValue: { list: async () => [sample()] } },
            {
              provide: AGENCY_REVIEW_WRITER,
              useValue: { updateStatus: async () => true, cancelAccount: async () => true },
            },
            { provide: AGENCY_DOCUMENT_READER, useValue: { readFile: async () => Promise.reject(new Error('未開啟')) } },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AdminAgencyVerifyComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows a cancel action on each application row', () => {
    expect(fixture.nativeElement.textContent).toContain('花蓮光復家庭支持站');
    expect(fixture.nativeElement.textContent).toContain('註銷帳號');
  });
});

function sample(): AgencyApplication {
  return {
    id: 'agency-1',
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
    status: 'approved',
    accountStatus: 'ACTIVE',
    reviewNote: '',
  };
}
