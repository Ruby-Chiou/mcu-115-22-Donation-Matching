import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDailyFormComponent } from './donor-daily-form.component';

describe('DonorDailyFormComponent', () => {
  let component: DonorDailyFormComponent;
  let fixture: ComponentFixture<DonorDailyFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDailyFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDailyFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
