import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDisasterSupplyDetailPageComponent } from './donor-disaster-supply-detail-page.component';

describe('DonorDisasterSupplyDetailPageComponent', () => {
  let component: DonorDisasterSupplyDetailPageComponent;
  let fixture: ComponentFixture<DonorDisasterSupplyDetailPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDisasterSupplyDetailPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDisasterSupplyDetailPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
