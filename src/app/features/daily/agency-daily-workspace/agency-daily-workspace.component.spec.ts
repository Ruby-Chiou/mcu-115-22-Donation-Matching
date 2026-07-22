import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgencyDailyWorkspaceComponent } from './agency-daily-workspace.component';

describe('AgencyDailyPostComponent', () => {
  let component: AgencyDailyWorkspaceComponent;
  let fixture: ComponentFixture<AgencyDailyWorkspaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgencyDailyWorkspaceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AgencyDailyWorkspaceComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
