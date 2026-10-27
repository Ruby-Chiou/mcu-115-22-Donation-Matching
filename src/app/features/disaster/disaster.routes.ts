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
    redirectTo: 'donor/disaster/helper/detail/:id',
  },
  {
    path: 'donor/disaster/helper/detail/:id',
    canActivate: [donorDisasterGuard],
    loadComponent: () =>
      import('./pages/donor-disaster-helper-detail-page/donor-disaster-helper-detail-page.component').then(
        (m) => m.DonorDisasterHelperDetailPageComponent
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
    redirectTo: 'agency/helper-form',
  },
  {
    path: 'agency/volunteer-edit/:id',
    redirectTo: 'agency/helper-edit/:id',
  },
  {
    path: 'agency/volunteer-detail/:id',
    redirectTo: 'agency/helper-detail/:id',
  },
  {
    path: 'agency/volunteer-comments/:id',
    redirectTo: 'agency/helper-comments/:id',
  },
  {
    path: 'agency/volunteer-batch-edit',
    redirectTo: 'agency/helper-batch-edit',
  },
  {
    path: 'agency/helper-form',
    loadComponent: () => import('./pages/helper-form/helper-form.component').then((m) => m.HelperFormComponent),
  },
  {
    path: 'agency/helper-edit/:id',
    loadComponent: () => import('./pages/helper-form/helper-form.component').then((m) => m.HelperFormComponent),
  },
  {
    path: 'agency/helper-detail/:id',
    loadComponent: () => import('./pages/helper-detail/helper-detail.component').then((m) => m.HelperDetailComponent),
  },
  {
    path: 'agency/helper-comments/:id',
    loadComponent: () => import('./pages/helper-comment-page/helper-comment-page.component').then((m) => m.HelperCommentPageComponent),
  },
  {
    path: 'agency/helper-batch-edit',
    loadComponent: () => import('./pages/helper-batch-edit/helper-batch-edit.component').then((m) => m.HelperBatchEditComponent),
  },
  {
    path: 'admin/disaster-control',
    loadComponent: () => import('./admin-disaster-control/admin-disaster-control.component').then((m) => m.AdminDisasterControlComponent),
  },
];
