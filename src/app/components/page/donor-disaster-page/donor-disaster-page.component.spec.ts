import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorDisasterPageComponent } from './donor-disaster-page.component';

describe('DonorDisasterPageComponent', () => {
  let component: DonorDisasterPageComponent;
  let fixture: ComponentFixture<DonorDisasterPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorDisasterPageComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorDisasterPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
