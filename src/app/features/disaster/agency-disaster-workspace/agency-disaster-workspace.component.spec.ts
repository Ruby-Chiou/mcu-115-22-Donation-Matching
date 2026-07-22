import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgencyDisasterWorkspaceComponent } from './agency-disaster-workspace.component';

describe('AgencyRequestManagementComponent', () => {
  let component: AgencyDisasterWorkspaceComponent;
  let fixture: ComponentFixture<AgencyDisasterWorkspaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgencyDisasterWorkspaceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AgencyDisasterWorkspaceComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
