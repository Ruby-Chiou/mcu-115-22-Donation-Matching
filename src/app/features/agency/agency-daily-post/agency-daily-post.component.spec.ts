import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgencyDailyPostComponent } from './agency-daily-post.component';

describe('AgencyDailyPostComponent', () => {
  let component: AgencyDailyPostComponent;
  let fixture: ComponentFixture<AgencyDailyPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgencyDailyPostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AgencyDailyPostComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
