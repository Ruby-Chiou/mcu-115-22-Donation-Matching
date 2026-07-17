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
    loadComponent: () => import('./features/donor/donor-daily-lobby/donor-daily-lobby.component').then((m) => m.DonorDailyLobbyComponent), // 日常捐助大廳
  },
  {
    path: 'donor/disaster',
    loadComponent: () =>
      import('./features/donor/donor-disaster-board/donor-disaster-board.component').then((m) => m.DonorDisasterBoardComponent), // 災害救助大廳
  },
  {
    path: 'donor/history',
    loadComponent: () => import('./features/donor/donor-history/donor-history.component').then((m) => m.DonorHistoryComponent), // 歷史紀錄與進度追蹤
  },

  // 4. 社福機構模組 (機構端)
  {
    path: 'agency/daily-post',
    loadComponent: () => import('./features/agency/agency-daily-post/agency-daily-post.component').then((m) => m.AgencyDailyPostComponent), // 發布日常需求
  },
  {
    path: 'agency/disaster-post',
    loadComponent: () =>
      import('./features/agency/agency-disaster-post/agency-disaster-post.component').then((m) => m.AgencyDisasterPostComponent), // 發布災害需求
  },
  {
    path: 'agency/disaster-create',
    loadComponent: () =>
      import('./features/agency/agency-disaster-create/agency-disaster-create.component').then((m) => m.AgencyDisasterCreateComponent), // 新增災害需求
  },
  {
    path: 'agency/disaster-edit/:id',
    loadComponent: () =>
      import('./features/agency/agency-disaster-edit/agency-disaster-edit.component').then((m) => m.AgencyDisasterEditComponent),
  },
  {
    path: 'agency/disaster-batch-edit',
    loadComponent: () =>
      import('./features/agency/agency-disaster-batch-edit/agency-disaster-batch-edit.component').then(
        (m) => m.AgencyDisasterBatchEditComponent
      ),
  },
  {
    path: 'agency/disaster-detail/:id',
    loadComponent: () =>
      import('./features/agency/agency-disaster-detail/agency-disaster-detail.component').then((m) => m.AgencyDisasterDetailComponent),
  },
  {
    path: 'agency/management',
    loadComponent: () =>
      import('./features/agency/agency-request-management/agency-request-management.component').then(
        (m) => m.AgencyRequestManagementComponent
      ), // 機構自身需求管理概覽
  },

  // 5. 系統後台模組 (管理員端)
  {
    path: 'admin/agency-verify',
    loadComponent: () =>
      import('./features/admin/admin-agency-verify/admin-agency-verify.component').then((m) => m.AdminAgencyVerifyComponent), // 社福機構註冊字號審核
  },
  {
    path: 'admin/item-review',
    loadComponent: () => import('./features/admin/admin-item-review/admin-item-review.component').then((m) => m.AdminItemReviewComponent), // 日常物資 AI+人工審核工作流
  },
  {
    path: 'admin/disaster-control',
    loadComponent: () =>
      import('./features/admin/admin-disaster-control/admin-disaster-control.component').then((m) => m.AdminDisasterControlComponent), // 日常切換災害模式以及公告(有點抽象)
  },

  // 6. 防呆萬用路由：如果隨便亂打網址，一律踢回日常物資大廳
  { path: '**', redirectTo: 'donor/daily' },
];
