import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolunteerFilterComponent } from './volunteer-filter.component';

describe('VolunteerFilterComponent', () => {
  let component: VolunteerFilterComponent;
  let fixture: ComponentFixture<VolunteerFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolunteerFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VolunteerFilterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
