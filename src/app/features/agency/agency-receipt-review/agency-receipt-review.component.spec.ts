import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AgencyReceiptIssuanceService } from '../../../core/services/agency/agency-receipt-issuance.service';
import { AgencyReceiptReviewComponent } from './agency-receipt-review.component';

describe('AgencyReceiptReviewComponent', () => {
  let component: AgencyReceiptReviewComponent;
  let fixture: ComponentFixture<AgencyReceiptReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgencyReceiptReviewComponent],
      providers: [
        provideRouter([]),
        {
          provide: AgencyReceiptIssuanceService,
          useValue: {
            tasks: () => [],
            defaultAgencyName: '示範社福機構',
            certificateAccept: 'application/pdf',
            loadTasks: async () => [],
            isDone: () => false,
            isPending: () => true,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AgencyReceiptReviewComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
