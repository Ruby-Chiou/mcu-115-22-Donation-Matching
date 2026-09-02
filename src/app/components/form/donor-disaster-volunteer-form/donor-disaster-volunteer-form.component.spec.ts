import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisasterOpenVolunteerFormComponent } from './donor-disaster-volunteer-form.component';

describe('DisasterOpenVolunteerFormComponent', () => {
  let component: DisasterOpenVolunteerFormComponent;
  let fixture: ComponentFixture<DisasterOpenVolunteerFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisasterOpenVolunteerFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisasterOpenVolunteerFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
