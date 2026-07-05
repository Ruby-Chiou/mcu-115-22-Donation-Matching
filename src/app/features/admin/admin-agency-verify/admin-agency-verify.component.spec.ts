import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAgencyVerifyComponent } from './admin-agency-verify.component';

describe('AdminAgencyVerifyComponent', () => {
  let component: AdminAgencyVerifyComponent;
  let fixture: ComponentFixture<AdminAgencyVerifyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAgencyVerifyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminAgencyVerifyComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
