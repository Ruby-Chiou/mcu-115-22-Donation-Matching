import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDisasterSupplyFilterComponent } from './donor-disaster-supply-filter.component';

describe('DonorDisasterSupplyFilterComponent', () => {
  let component: DonorDisasterSupplyFilterComponent;
  let fixture: ComponentFixture<DonorDisasterSupplyFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDisasterSupplyFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDisasterSupplyFilterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
