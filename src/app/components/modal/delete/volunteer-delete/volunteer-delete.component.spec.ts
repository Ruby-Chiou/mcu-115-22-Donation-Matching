import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolunteerDeleteComponent } from './volunteer-delete.component';

describe('VolunteerDeleteComponent', () => {
  let component: VolunteerDeleteComponent;
  let fixture: ComponentFixture<VolunteerDeleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolunteerDeleteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VolunteerDeleteComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
