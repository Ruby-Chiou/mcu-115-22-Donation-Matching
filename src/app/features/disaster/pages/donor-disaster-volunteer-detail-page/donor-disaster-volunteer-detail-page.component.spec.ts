import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDisasterVolunteerDetailPageComponent } from './donor-disaster-volunteer-detail-page.component';

describe('DonorDisasterVolunteerDetailPageComponent', () => {
  let component: DonorDisasterVolunteerDetailPageComponent;
  let fixture: ComponentFixture<DonorDisasterVolunteerDetailPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDisasterVolunteerDetailPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDisasterVolunteerDetailPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
