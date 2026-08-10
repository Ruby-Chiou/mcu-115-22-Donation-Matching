import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisasterLocationsComponent } from './disaster-locations.component';

describe('DisasterLocationsComponent', () => {
  let component: DisasterLocationsComponent;
  let fixture: ComponentFixture<DisasterLocationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisasterLocationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisasterLocationsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
