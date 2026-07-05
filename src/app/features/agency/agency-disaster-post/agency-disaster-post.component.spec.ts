import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgencyDisasterPostComponent } from './agency-disaster-post.component';

describe('AgencyDisasterPostComponent', () => {
  let component: AgencyDisasterPostComponent;
  let fixture: ComponentFixture<AgencyDisasterPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgencyDisasterPostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AgencyDisasterPostComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
