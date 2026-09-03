import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDailyFilterComponent } from './donor-daily-filter.component';

describe('DonorDailyFilterComponent', () => {
  let component: DonorDailyFilterComponent;
  let fixture: ComponentFixture<DonorDailyFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDailyFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDailyFilterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
