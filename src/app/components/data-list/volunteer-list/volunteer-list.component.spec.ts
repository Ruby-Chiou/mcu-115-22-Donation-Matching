import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { VolunteerListComponent } from './volunteer-list.component';

describe('VolunteerListComponent', () => {
  let component: VolunteerListComponent;
  let fixture: ComponentFixture<VolunteerListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolunteerListComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(VolunteerListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should sort unpublished demands as the latest time in ascending order', () => {
    component.loadDemands();
    component.sortAscending = true;

    component.applySort();

    expect(component.filteredDemands[0].id).toBe(1);
    expect(component.filteredDemands.slice(-4).map((demand) => demand.id)).toEqual([3, 5, 9, 10]);
  });

  it('should sort unpublished demands first in descending order', () => {
    component.loadDemands();
    component.sortAscending = false;

    component.applySort();

    expect(component.filteredDemands.slice(0, 4).map((demand) => demand.id)).toEqual([3, 5, 9, 10]);
    expect(component.filteredDemands.at(-1)?.id).toBe(1);
  });
});
