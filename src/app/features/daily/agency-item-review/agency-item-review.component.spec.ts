import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgencyItemReviewComponent } from './agency-item-review.component';

describe('AgencyItemReviewComponent', () => {
  let component: AgencyItemReviewComponent;
  let fixture: ComponentFixture<AgencyItemReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgencyItemReviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AgencyItemReviewComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
