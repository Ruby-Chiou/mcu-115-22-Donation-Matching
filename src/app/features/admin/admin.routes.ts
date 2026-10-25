import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: 'admin/agency-verify',
    loadComponent: () => import('./admin-agency-verify/admin-agency-verify.component').then((m) => m.AdminAgencyVerifyComponent),
  },
  {
    path: 'admin/company-verify',
    loadComponent: () => import('./admin-company-verify/admin-company-verify.component').then((m) => m.AdminCompanyVerifyComponent),
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
  },
  {
    path: 'admin/donors',
    loadComponent: () => import('./admin-donors/admin-donors.component').then((m) => m.AdminDonorsComponent),
  },
  {
    path: 'admin/donors/:uid',
    loadComponent: () => import('./admin-donors/admin-donor-detail.component').then((m) => m.AdminDonorDetailComponent),
  },
  {
    path: 'admin/donors/:uid/:kind/:id',
    loadComponent: () => import('./admin-donors/admin-donor-record.component').then((m) => m.AdminDonorRecordComponent),
  },
  {
    path: 'admin/announcements',
    loadComponent: () => import('./admin-announcements/admin-announcements.component').then((m) => m.AdminAnnouncementsComponent),
  },
];
