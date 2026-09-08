import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolunteerSearchBarComponent } from './volunteer-search-bar.component';

describe('VolunteerSearchBarComponent', () => {
  let component: VolunteerSearchBarComponent;
  let fixture: ComponentFixture<VolunteerSearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolunteerSearchBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VolunteerSearchBarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
