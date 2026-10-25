import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BeneficiaryPublicProfileService } from '../../core/services/agency/beneficiary-public-profile.service';
import { BeneficiaryPublicProfile } from '../../models/agency/beneficiary-public-profile';
import { BeneficiaryProfileComponent } from './beneficiary-profile.component';

const sample = (organizationName: string, city: string): BeneficiaryPublicProfile => ({
  organizationName,
  city,
  image: '',
  introImages: [],
  establishedYear: '2014',
  registrationLabel: '已立案',
  serviceArea: city,
  serviceTargets: ['家庭'],
  publicPhone: '02-2500-1000',
  mission: '在地服務',
  background: '公開介紹',
  verified: true,
});

describe('BeneficiaryProfileComponent', () => {
  let fixture: ComponentFixture<BeneficiaryProfileComponent>;

  beforeEach(async () => {
    const profiles = signal([sample('示範社福機構', '臺北市'), sample('花蓮光復關懷站', '花蓮縣')]);

    await TestBed.configureTestingModule({
      imports: [BeneficiaryProfileComponent],
      providers: [
        provideRouter([]),
        {
          provide: BeneficiaryPublicProfileService,
          useValue: {
            profiles,
            ready: signal(true),
            loadError: signal(''),
            ensureLoaded: async () => undefined,
            cities: () => ['臺北市', '花蓮縣'],
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BeneficiaryProfileComponent);
    fixture.detectChanges();
  });

  it('shows agency cards and filters them by city', () => {
    const text = () => fixture.nativeElement.textContent as string;

    expect(text()).toContain('示範社福機構');
    expect(text()).toContain('花蓮光復關懷站');
    expect(fixture.nativeElement.querySelectorAll('a.org-card').length).toBeGreaterThan(1);

    fixture.componentInstance.selectCity('花蓮縣');
    fixture.detectChanges();

    expect(text()).toContain('花蓮光復關懷站');
    expect(text()).not.toContain('示範社福機構');
  });
});
