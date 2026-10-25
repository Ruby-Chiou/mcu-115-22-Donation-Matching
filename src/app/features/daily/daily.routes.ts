import { Routes } from '@angular/router';

export const dailyRoutes: Routes = [
  {
    path: 'donor/daily',
    loadComponent: () => import('./donor-daily-lobby/donor-daily-lobby.component').then((m) => m.DonorDailyLobbyComponent),
  },
  {
    path: 'donor/daily/detail/:id',
    loadComponent: () => import('./pages/donor-daily-detail/donor-daily-detail.component').then((m) => m.DonorDailyDetailComponent),
  },
  {
    path: 'donor/daily/form/:id',
    loadComponent: () => import('./pages/donor-daily-form/donor-daily-form.component').then((m) => m.DonorDailyFormComponent),
  },
  {
    path: 'daily/locations',
    loadComponent: () => import('./daily-locations/daily-locations.component').then((m) => m.DailyLocationsComponent),
  },
  { path: 'daily-locations', redirectTo: 'daily/locations' },
  {
    path: 'agency/daily',
    loadComponent: () => import('./agency-daily-workspace/agency-daily-workspace.component').then((m) => m.AgencyDailyWorkspaceComponent),
  },
  {
    path: 'agency/daily-form',
    loadComponent: () => import('./pages/daily-form/daily-form.component').then((m) => m.DailyFormComponent),
  },
  {
    path: 'agency/daily-edit/:id',
    loadComponent: () => import('./pages/daily-form/daily-form.component').then((m) => m.DailyFormComponent),
  },
  {
    path: 'agency/daily-detail/:id',
    loadComponent: () => import('./pages/daily-detail/daily-detail.component').then((m) => m.DailyDetailComponent),
  },
  {
    path: 'agency/daily-comment/:id',
    loadComponent: () => import('./pages/daily-comment-page/daily-comment-page.component').then((m) => m.DailyCommentPageComponent),
  },
  {
    path: 'agency/daily-batch-edit',
    loadComponent: () => import('./pages/daily-batch-edit/daily-batch-edit.component').then((m) => m.DailyBatchEditComponent),
  },
  {
    path: 'agency/item-review',
    loadComponent: () => import('./agency-item-review/agency-item-review.component').then((m) => m.AgencyItemReviewComponent),
  },
  {
    path: 'agency/item-review/:id',
    loadComponent: () =>
      import('./agency-item-review-detail/agency-item-review-detail.component').then((m) => m.AgencyItemReviewDetailComponent),
  },
];
