import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDisasterHelperFilterComponent } from './donor-disaster-helper-filter.component';

describe('DonorDisasterHelperFilterComponent', () => {
  let component: DonorDisasterHelperFilterComponent;
  let fixture: ComponentFixture<DonorDisasterHelperFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDisasterHelperFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDisasterHelperFilterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
