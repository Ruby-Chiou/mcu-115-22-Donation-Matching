import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDisasterSupplyFormComponent } from './donor-disaster-supply-form.component';

describe('DonorDisasterSupplyFormComponent', () => {
  let component: DonorDisasterSupplyFormComponent;
  let fixture: ComponentFixture<DonorDisasterSupplyFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDisasterSupplyFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDisasterSupplyFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
