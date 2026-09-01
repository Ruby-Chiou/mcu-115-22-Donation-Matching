import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDailyCardComponent } from './donor-daily-card.component';

describe('DonorDailyCardComponent', () => {
  let component: DonorDailyCardComponent;
  let fixture: ComponentFixture<DonorDailyCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDailyCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDailyCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
