import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgencyRequestManagementComponent } from './agency-request-management.component';

describe('AgencyRequestManagementComponent', () => {
  let component: AgencyRequestManagementComponent;
  let fixture: ComponentFixture<AgencyRequestManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgencyRequestManagementComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AgencyRequestManagementComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
