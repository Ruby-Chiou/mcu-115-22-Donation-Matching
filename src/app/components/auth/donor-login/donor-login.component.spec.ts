import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorLoginComponent } from './donor-login.component';

describe('DonorLoginComponent', () => {
  let component: DonorLoginComponent;
  let fixture: ComponentFixture<DonorLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorLoginComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorLoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
