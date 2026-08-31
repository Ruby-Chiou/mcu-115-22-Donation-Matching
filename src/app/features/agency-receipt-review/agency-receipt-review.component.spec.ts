import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgencyReceiptReviewComponent } from './agency-receipt-review.component';

describe('AgencyReceiptReviewComponent', () => {
  let component: AgencyReceiptReviewComponent;
  let fixture: ComponentFixture<AgencyReceiptReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgencyReceiptReviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AgencyReceiptReviewComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
