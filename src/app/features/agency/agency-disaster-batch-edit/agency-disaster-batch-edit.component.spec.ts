import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgencyDisasterBatchEditComponent } from './agency-disaster-batch-edit.component';

describe('AgencyDisasterBatchEditComponent', () => {
  let component: AgencyDisasterBatchEditComponent;
  let fixture: ComponentFixture<AgencyDisasterBatchEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgencyDisasterBatchEditComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AgencyDisasterBatchEditComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
