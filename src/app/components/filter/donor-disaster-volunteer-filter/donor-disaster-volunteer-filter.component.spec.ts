import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDisasterVolunteerFilterComponent } from './donor-disaster-volunteer-filter.component';

describe('DonorDisasterVolunteerFilterComponent', () => {
  let component: DonorDisasterVolunteerFilterComponent;
  let fixture: ComponentFixture<DonorDisasterVolunteerFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDisasterVolunteerFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDisasterVolunteerFilterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
