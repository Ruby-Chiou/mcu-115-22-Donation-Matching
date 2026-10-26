import { Routes } from '@angular/router';

export const agencyRoutes: Routes = [
  {
    path: 'agency/inbox',
    loadComponent: () => import('./agency-inbox/agency-inbox.component').then((m) => m.AgencyInboxComponent),
  },
  {
    path: 'agency/dashboard',
    loadComponent: () => import('./agency-dashboard/agency-dashboard.component').then((m) => m.AgencyDashboardComponent),
  },
  {
    path: 'agency/profile',
    loadComponent: () => import('./agency-profile/agency-profile.component').then((m) => m.AgencyProfileComponent),
  },
  {
    path: 'agency/delivery-confirm',
    loadComponent: () => import('./agency-delivery-confirm/agency-delivery-confirm.component').then((m) => m.AgencyDeliveryConfirmComponent),
  },
  {
    path: 'agency/receipt-review',
    loadComponent: () => import('./agency-receipt-review/agency-receipt-review.component').then((m) => m.AgencyReceiptReviewComponent),
  },
  {
    path: 'agency/receipt-review/:donationId/edit',
    loadComponent: () =>
      import('./agency-receipt-review/agency-receipt-form/agency-receipt-form.component').then((m) => m.AgencyReceiptFormComponent),
  },
  {
    path: 'agency/receipt-review/:donationId/preview',
    loadComponent: () =>
      import('./agency-receipt-review/agency-receipt-preview/agency-receipt-preview.component').then((m) => m.AgencyReceiptPreviewComponent),
  },
];
