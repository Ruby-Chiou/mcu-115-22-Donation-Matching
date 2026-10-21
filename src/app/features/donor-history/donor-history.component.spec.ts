import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AgencyCertificateService } from '../../core/services/member-center/agency-certificate.service';
import { DonationReceiptService } from '../../core/services/member-center/donation-receipt.service';
import { DonorDonationHistoryService } from '../../core/services/member-center/donor-donation-history.service';
import { PublicDonationThankService } from '../../core/services/member-center/public-donation-thank.service';
import { DonorHistoryComponent } from './donor-history.component';

describe('DonorHistoryComponent', () => {
  let component: DonorHistoryComponent;
  let fixture: ComponentFixture<DonorHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorHistoryComponent],
      providers: [
        provideRouter([]),
        {
          provide: DonorDonationHistoryService,
          useValue: {
            records: () => [],
            loadHistory: async () => [],
          },
        },
        {
          provide: DonationReceiptService,
          useValue: {
            receipts: () => [],
            loadReceipts: async () => [],
          },
        },
        {
          provide: AgencyCertificateService,
          useValue: {
            certificates: () => [],
            loadCertificates: async () => [],
          },
        },
        {
          provide: PublicDonationThankService,
          useValue: {
            thanks: () => [],
            loadMyPublicThanks: async () => [],
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorHistoryComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
