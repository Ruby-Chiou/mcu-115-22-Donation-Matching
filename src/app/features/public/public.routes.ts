import { Routes } from '@angular/router';

export const publicRoutes: Routes = [
  {
    path: 'donor/beneficiaries',
    loadComponent: () => import('../beneficiary-profile/beneficiary-profile.component').then((m) => m.BeneficiaryProfileComponent),
  },
  {
    path: 'donor/beneficiaries/:name',
    loadComponent: () => import('../beneficiary-profile/beneficiary-detail.component').then((m) => m.BeneficiaryDetailComponent),
  },
  {
    path: 'donor/history',
    loadComponent: () => import('../donor-history/donor-history.component').then((m) => m.DonorHistoryComponent),
  },
  {
    path: 'member',
    loadComponent: () => import('../member-center/member-entry.component').then((m) => m.MemberEntryComponent),
  },
  {
    path: 'tracking',
    loadComponent: () => import('../logistics/tracking/tracking.component').then((m) => m.TrackingComponent),
  },
  {
    path: 'thank-you-wall',
    loadComponent: () => import('../thank-you-wall/thank-you-wall.component').then((m) => m.ThankYouWallComponent),
  },
  {
    path: 'customer-service/ai-chat',
    loadComponent: () => import('../customer-service/ai-chat/ai-chat.component').then((m) => m.AiChatComponent),
  },
  {
    path: 'customer-service/faq',
    loadComponent: () => import('../customer-service/faq/faq.component').then((m) => m.FAQComponent),
  },
  {
    path: 'intro',
    loadComponent: () => import('../about-us/intro/intro.component').then((m) => m.IntroComponent),
  },
  {
    path: 'platform-guide',
    loadComponent: () => import('../about-us/platform-guide/platform-guide.component').then((m) => m.PlatformGuideComponent),
  },
  {
    path: 'contact-us',
    loadComponent: () => import('../about-us/contact-us/contact-us.component').then((m) => m.ContactUsComponent),
  },
  {
    path: 'legal/:page',
    loadComponent: () => import('../legal/legal-page.component').then((m) => m.LegalPageComponent),
  },
];
