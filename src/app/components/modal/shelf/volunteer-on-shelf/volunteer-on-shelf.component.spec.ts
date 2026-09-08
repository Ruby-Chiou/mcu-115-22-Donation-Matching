import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolunteerOnShelfComponent } from './volunteer-on-shelf.component';

describe('VolunteerOnShelfComponent', () => {
  let component: VolunteerOnShelfComponent;
  let fixture: ComponentFixture<VolunteerOnShelfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolunteerOnShelfComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VolunteerOnShelfComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
