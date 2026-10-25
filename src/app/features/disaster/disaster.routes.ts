import { Routes } from '@angular/router';

import { donorDisasterGuard } from '../../core/guards/donor-disaster.guard';

export const disasterRoutes: Routes = [
  {
    path: 'donor/disaster',
    canActivate: [donorDisasterGuard],
    loadComponent: () => import('./donor-disaster-lobby/donor-disaster-lobby.component').then((m) => m.DonorDisasterLobbyComponent),
  },
  {
    path: 'disaster/history',
    loadComponent: () => import('./disaster-history/disaster-history.component').then((m) => m.DisasterHistoryComponent),
  },
  {
    path: 'donor/disaster/supply/detail/:id',
    canActivate: [donorDisasterGuard],
    loadComponent: () =>
      import('./pages/donor-disaster-supply-detail-page/donor-disaster-supply-detail-page.component').then(
        (m) => m.DonorDisasterSupplyDetailPageComponent
      ),
  },
  {
    path: 'donor/disaster/volunteer/detail/:id',
    canActivate: [donorDisasterGuard],
    loadComponent: () =>
      import('./pages/donor-disaster-volunteer-detail-page/donor-disaster-volunteer-detail-page.component').then(
        (m) => m.DonorDisasterVolunteerDetailPageComponent
      ),
  },
  {
    path: 'donor/disaster/supply/form/:id',
    canActivate: [donorDisasterGuard],
    loadComponent: () =>
      import('./pages/donor-disaster-supply-form/donor-disaster-supply-form.component').then((m) => m.DonorDisasterSupplyFormComponent),
  },
  {
    path: 'agency/disaster',
    loadComponent: () => import('./agency-disaster-workspace/agency-disaster-workspace.component').then((m) => m.AgencyDisasterWorkspaceComponent),
  },
  {
    path: 'agency/supply-form',
    loadComponent: () => import('./pages/supply-form/supply-form.component').then((m) => m.SupplyFormComponent),
  },
  {
    path: 'agency/supply-edit/:id',
    loadComponent: () => import('./pages/supply-form/supply-form.component').then((m) => m.SupplyFormComponent),
  },
  {
    path: 'agency/supply-detail/:id',
    loadComponent: () => import('./pages/supply-detail/supply-detail.component').then((m) => m.SupplyDetailComponent),
  },
  {
    path: 'agency/disaster-comments/:id',
    loadComponent: () => import('./pages/disaster-comment-page/disaster-comment-page.component').then((m) => m.DisasterCommentPageComponent),
  },
  {
    path: 'agency/supply-batch-edit',
    loadComponent: () => import('./pages/supply-batch-edit/supply-batch-edit.component').then((m) => m.SupplyBatchEditComponent),
  },
  {
    path: 'agency/volunteer-form',
    loadComponent: () => import('./pages/volunteer-form/volunteer-form.component').then((m) => m.VolunteerFormComponent),
  },
  {
    path: 'agency/volunteer-edit/:id',
    loadComponent: () => import('./pages/volunteer-form/volunteer-form.component').then((m) => m.VolunteerFormComponent),
  },
  {
    path: 'agency/volunteer-detail/:id',
    loadComponent: () => import('./pages/volunteer-detail/volunteer-detail.component').then((m) => m.VolunteerDetailComponent),
  },
  {
    path: 'agency/volunteer-comments/:id',
    loadComponent: () => import('./pages/volunteer-comment-page/volunteer-comment-page.component').then((m) => m.VolunteerCommentPageComponent),
  },
  {
    path: 'agency/volunteer-batch-edit',
    loadComponent: () => import('./pages/volunteer-batch-edit/volunteer-batch-edit.component').then((m) => m.VolunteerBatchEditComponent),
  },
  {
    path: 'admin/disaster-control',
    loadComponent: () => import('./admin-disaster-control/admin-disaster-control.component').then((m) => m.AdminDisasterControlComponent),
  },
];
