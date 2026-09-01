import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDailyDetailComponent } from './donor-daily-detail.component';

describe('DonorDailyDetailComponent', () => {
  let component: DonorDailyDetailComponent;
  let fixture: ComponentFixture<DonorDailyDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDailyDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDailyDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
