import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDailyCardListComponent } from './donor-daily-card-list.component';

describe('DonorDailyCardListComponent', () => {
  let component: DonorDailyCardListComponent;
  let fixture: ComponentFixture<DonorDailyCardListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDailyCardListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDailyCardListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
