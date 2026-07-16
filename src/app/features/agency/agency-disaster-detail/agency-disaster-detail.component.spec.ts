import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgencyDisasterDetailComponent } from './agency-disaster-detail.component';

describe('AgencyDisasterDetailComponent', () => {
  let component: AgencyDisasterDetailComponent;
  let fixture: ComponentFixture<AgencyDisasterDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgencyDisasterDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AgencyDisasterDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
