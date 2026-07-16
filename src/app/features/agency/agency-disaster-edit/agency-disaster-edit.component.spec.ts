import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgencyDisasterEditComponent } from './agency-disaster-edit.component';

describe('AgencyDisasterEditComponent', () => {
  let component: AgencyDisasterEditComponent;
  let fixture: ComponentFixture<AgencyDisasterEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgencyDisasterEditComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AgencyDisasterEditComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
