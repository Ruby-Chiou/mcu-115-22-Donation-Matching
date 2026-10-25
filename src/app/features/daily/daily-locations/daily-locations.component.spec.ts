import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BeneficiaryPublicProfileService } from '../../../core/services/agency/beneficiary-public-profile.service';
import { DailyLocationsComponent } from './daily-locations.component';

describe('DailyLocationsComponent', () => {
  let component: DailyLocationsComponent;
  let fixture: ComponentFixture<DailyLocationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailyLocationsComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: BeneficiaryPublicProfileService,
          useValue: {
            profiles: signal([]),
            ready: signal(true),
            loadError: signal(''),
            ensureLoaded: async () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DailyLocationsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
