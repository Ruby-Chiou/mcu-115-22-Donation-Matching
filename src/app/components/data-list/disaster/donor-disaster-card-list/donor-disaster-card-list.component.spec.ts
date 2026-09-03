import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDisasterCardListComponent } from './donor-disaster-card-list.component';

describe('DonorDisasterCardListComponent', () => {
  let component: DonorDisasterCardListComponent;
  let fixture: ComponentFixture<DonorDisasterCardListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDisasterCardListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDisasterCardListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
