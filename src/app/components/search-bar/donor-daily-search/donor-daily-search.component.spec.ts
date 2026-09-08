import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDailySearchComponent } from './donor-daily-search.component';

describe('DonorDailySearchComponent', () => {
  let component: DonorDailySearchComponent;
  let fixture: ComponentFixture<DonorDailySearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDailySearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDailySearchComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
