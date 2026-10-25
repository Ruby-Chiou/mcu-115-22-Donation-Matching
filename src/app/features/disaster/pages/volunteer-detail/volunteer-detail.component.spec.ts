import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolunteerDetailComponent } from './volunteer-detail.component';

describe('VolunteerDetailComponent', () => {
  let component: VolunteerDetailComponent;
  let fixture: ComponentFixture<VolunteerDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolunteerDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VolunteerDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
