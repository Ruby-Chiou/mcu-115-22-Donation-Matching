import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminItemReviewComponent } from './admin-item-review.component';

describe('AdminItemReviewComponent', () => {
  let component: AdminItemReviewComponent;
  let fixture: ComponentFixture<AdminItemReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminItemReviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminItemReviewComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
