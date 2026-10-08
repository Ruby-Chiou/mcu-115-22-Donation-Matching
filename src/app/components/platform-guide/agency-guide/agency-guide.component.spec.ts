import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgencyGuideComponent } from './agency-guide.component';

describe('AgencyGuideComponent', () => {
  let component: AgencyGuideComponent;
  let fixture: ComponentFixture<AgencyGuideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgencyGuideComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AgencyGuideComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
