import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisasterOpenVolunteerDetailPageComponent } from './disaster-open-volunteer-detail-page.component';

describe('DisasterOpenVolunteerDetailPageComponent', () => {
  let component: DisasterOpenVolunteerDetailPageComponent;
  let fixture: ComponentFixture<DisasterOpenVolunteerDetailPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisasterOpenVolunteerDetailPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisasterOpenVolunteerDetailPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
