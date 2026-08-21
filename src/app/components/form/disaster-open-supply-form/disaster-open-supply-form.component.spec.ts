import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DisasterOpenSupplyFormComponent } from './disaster-open-supply-form.component';

describe('DisasterOpenSupplyFormComponent', () => {
  let component: DisasterOpenSupplyFormComponent;
  let fixture: ComponentFixture<DisasterOpenSupplyFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisasterOpenSupplyFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisasterOpenSupplyFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
