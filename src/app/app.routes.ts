import { Routes } from '@angular/router';

export const routes: Routes = [
  // 1. 預設首頁修改：一進網站，直接自動導向日常物資大廳！
  { path: '', redirectTo: 'donor/daily', pathMatch: 'full' },

  // 2. 認證模組 (需要下標、發布需求時才跳轉來這)
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },

  // 3. 捐助者模組 (民眾/訪客端)
  {
    path: 'donor/daily',
    loadComponent: () => import('./features/donor/donor-daily-lobby/donor-daily-lobby.component').then((m) => m.DonorDailyLobbyComponent),
  },
  {
    path: 'donor/disaster',
    loadComponent: () =>
      import('./features/donor/donor-disaster-board/donor-disaster-board.component').then((m) => m.DonorDisasterBoardComponent),
  },
  {
    path: 'donor/history',
    loadComponent: () => import('./features/donor/donor-history/donor-history.component').then((m) => m.DonorHistoryComponent),
  },

  // 4. 社福機構模組 (機構端)
  {
    path: 'agency/daily-post',
    loadComponent: () => import('./features/agency/agency-daily-post/agency-daily-post.component').then((m) => m.AgencyDailyPostComponent),
  },
  {
    path: 'agency/disaster-post',
    loadComponent: () =>
      import('./features/agency/agency-disaster-post/agency-disaster-post.component').then((m) => m.AgencyDisasterPostComponent),
  },
  {
    path: 'agency/management',
    loadComponent: () =>
      import('./features/agency/agency-request-management/agency-request-management.component').then(
        (m) => m.AgencyRequestManagementComponent
      ),
  },

  // 5. 系統後台模組 (管理員端)
  {
    path: 'admin/agency-verify',
    loadComponent: () =>
      import('./features/admin/admin-agency-verify/admin-agency-verify.component').then((m) => m.AdminAgencyVerifyComponent),
  },
  {
    path: 'admin/item-review',
    loadComponent: () => import('./features/admin/admin-item-review/admin-item-review.component').then((m) => m.AdminItemReviewComponent),
  },
  {
    path: 'admin/disaster-control',
    loadComponent: () =>
      import('./features/admin/admin-disaster-control/admin-disaster-control.component').then((m) => m.AdminDisasterControlComponent),
  },

  // 6. 防呆萬用路由：如果隨便亂打網址，一律踢回日常物資大廳
  { path: '**', redirectTo: 'donor/daily' },
];
