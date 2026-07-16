import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgencyDisasterCreateComponent } from './agency-disaster-create.component';

describe('AgencyDisasterCreateComponent', () => {
  let component: AgencyDisasterCreateComponent;
  let fixture: ComponentFixture<AgencyDisasterCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgencyDisasterCreateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AgencyDisasterCreateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
