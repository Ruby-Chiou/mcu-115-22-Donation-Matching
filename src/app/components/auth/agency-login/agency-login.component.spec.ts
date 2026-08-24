import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgencyLoginComponent } from './agency-login.component';

describe('AgencyLoginComponent', () => {
  let component: AgencyLoginComponent;
  let fixture: ComponentFixture<AgencyLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgencyLoginComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AgencyLoginComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
