import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDisasterHelperDetailPageComponent } from './donor-disaster-helper-detail-page.component';

describe('DonorDisasterHelperDetailPageComponent', () => {
  let component: DonorDisasterHelperDetailPageComponent;
  let fixture: ComponentFixture<DonorDisasterHelperDetailPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDisasterHelperDetailPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDisasterHelperDetailPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
