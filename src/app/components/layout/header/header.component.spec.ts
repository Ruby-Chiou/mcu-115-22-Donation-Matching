import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthPrincipal, GUEST_PRINCIPAL } from '../../../models/auth/app-role';
import { AuthSessionService } from '../../../core/services/auth/auth-session.service';
import { DisasterControlData, DisasterControlService } from '../../../core/services/disaster-control/disaster-control.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  const principal = signal<AuthPrincipal>({ ...GUEST_PRINCIPAL });
  const disaster = signal<DisasterControlData>({
    isOpen: false,
    closedAt: null,
    scheduledCloseAt: null,
    announcement: '',
    name: '',
    description: '',
    image: null,
    materialNeeds: [],
  });

  beforeEach(async () => {
    principal.set({ ...GUEST_PRINCIPAL });

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: {
            principal: principal.asReadonly(),
            restore: () => Promise.resolve(),
            signOut: () => Promise.resolve(),
          },
        },
        {
          provide: DisasterControlService,
          useValue: { data: disaster.asReadonly() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('hides progress tracking from guests', () => {
    expect(component.navItems.find((item) => item.name === '進度查詢')).toBeUndefined();
    expect(component.navItems.find((item) => item.name === '捐助專區')?.sub.map((item) => item.name)).toEqual([
      '日常捐助',
      '災害救助',
      '捐助地圖',
      '受助機構',
    ]);
  });

  it('keeps the donor menu short and moves contact under customer service', () => {
    principal.set({
      ...GUEST_PRINCIPAL,
      role: 'donor',
      userId: 'donor-1',
      email: 'dev.donor@example.com',
      displayName: '測試捐助者',
      donorKind: 'individual',
    });

    const donor = component.navItems.find((item) => item.name === '捐助專區');
    const progress = component.navItems.find((item) => item.name === '進度查詢');
    const service = component.navItems.find((item) => item.name === '客服中心');

    expect(donor?.sub.map((item) => item.name)).toEqual(['日常捐助', '災害救助', '捐助地圖', '受助機構']);
    expect(progress?.sub.map((item) => item.name)).toEqual(['捐助紀錄', '配送查詢']);
    expect(service?.sub.map((item) => item.name)).toEqual(['常見問題', 'AI 客服', '聯絡我們']);
  });

  it('shows disaster relief on its own for agencies only while the mode is open', () => {
    principal.set({
      ...GUEST_PRINCIPAL,
      role: 'agency',
      userId: 'agency-1',
      email: 'dev.agency@example.com',
      displayName: '測試受助者',
    });

    expect(component.navItems.find((item) => item.name === '急難救助')).toBeUndefined();
    expect(component.navItems.find((item) => item.name === '前台頁面')?.sub.map((item) => item.name)).toEqual([
      '日常捐助',
      '捐助地圖',
      '受助機構',
      '捐助感謝',
    ]);

    disaster.update((current) => ({ ...current, isOpen: true }));

    expect(component.navItems.find((item) => item.name === '急難救助')?.link).toBe('/agency/disaster');
    expect(component.navItems.find((item) => item.name === '前台頁面')?.sub.map((item) => item.name)).toContain('災害救助');
  });
});
