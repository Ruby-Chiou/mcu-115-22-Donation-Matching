import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorRegisterComponent } from './donor-register.component';

describe('DonorRegisterComponent', () => {
  let component: DonorRegisterComponent;
  let fixture: ComponentFixture<DonorRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorRegisterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DonorRegisterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
