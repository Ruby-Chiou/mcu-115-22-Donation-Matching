import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolunteerCreateComponent } from './volunteer-create.component';

describe('VolunteerCreateComponent', () => {
  let component: VolunteerCreateComponent;
  let fixture: ComponentFixture<VolunteerCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolunteerCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VolunteerCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
