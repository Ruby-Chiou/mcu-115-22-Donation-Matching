import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolunteerSortBarComponent } from './volunteer-sort-bar.component';

describe('VolunteerSortBarComponent', () => {
  let component: VolunteerSortBarComponent;
  let fixture: ComponentFixture<VolunteerSortBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolunteerSortBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VolunteerSortBarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
