import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolunteerOffShelfComponent } from './volunteer-off-shelf.component';

describe('VolunteerOffShelfComponent', () => {
  let component: VolunteerOffShelfComponent;
  let fixture: ComponentFixture<VolunteerOffShelfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolunteerOffShelfComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VolunteerOffShelfComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
