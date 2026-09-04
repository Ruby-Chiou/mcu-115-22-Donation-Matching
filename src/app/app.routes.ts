import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { donorDisasterGuard } from './core/guards/donor-disaster.guard';

export const routes: Routes = [
  // 1. 預設首頁
  { path: '', component: HomeComponent, pathMatch: 'full' },

  { path: 'home', component: HomeComponent },

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
    loadComponent: () => import('./features/daily/donor-daily-lobby/donor-daily-lobby.component').then((m) => m.DonorDailyLobbyComponent), // 日常捐助大廳
  },
  {
    path: 'donor/daily/detail/:id',
    loadComponent: () =>
      import('./components/data-list/daily/donor-daily-detail/donor-daily-detail.component').then((m) => m.DonorDailyDetailComponent),
  },
  {
    path: 'donor/daily/form/:id',
    loadComponent: () =>
      import('./components/form/daily/donor-daily-form/donor-daily-form.component').then((m) => m.DonorDailyFormComponent),
  },

  {
    path: 'donor/disaster',
    canActivate: [donorDisasterGuard],
    loadComponent: () =>
      import('./features/disaster/donor-disaster-lobby/donor-disaster-lobby.component').then((m) => m.DonorDisasterLobbyComponent), // 災害救助大廳
  },
  {
    path: 'donor/history',
    loadComponent: () => import('./features/donor-history/donor-history.component').then((m) => m.DonorHistoryComponent), // 歷史紀錄與進度追蹤
  },
  {
    path: 'tracking',
    loadComponent: () => import('./features/logistics/tracking/tracking.component').then((m) => m.TrackingComponent),
  },
  {
    path: 'daily/locations',
    loadComponent: () => import('./features/daily/daily-locations/daily-locations.component').then((m) => m.DailyLocationsComponent),
  },

  {
    path: 'disaster/history',
    loadComponent: () => import('./features/disaster/disaster-history/disaster-history.component').then((m) => m.DisasterHistoryComponent), //災害歷史紀錄(從needs更名為history)
  },
  {
    path: 'donor/disaster/supply/detail/:id',
    canActivate: [donorDisasterGuard],
    loadComponent: () =>
      import('./components/page/donor-disaster-supply-detail-page/donor-disaster-supply-detail-page.component').then(
        (m) => m.DonorDisasterSupplyDetailPageComponent
      ),
  },
  {
    path: 'donor/disaster/volunteer/detail/:id',
    canActivate: [donorDisasterGuard],
    loadComponent: () =>
      import('./components/page/donor-disaster-volunteer-detail-page/donor-disaster-volunteer-detail-page.component').then(
        (m) => m.DonorDisasterVolunteerDetailPageComponent
      ),
  },
  {
    path: 'donor/disaster/supply/form/:id',
    canActivate: [donorDisasterGuard],
    loadComponent: () =>
      import('./components/form/disaster/donor-disaster-supply-form/donor-disaster-supply-form.component').then(
        (m) => m.DonorDisasterSupplyFormComponent
      ),
  },
  // 4. 社福機構模組 (機構端)
  // 4.1 社福團體儀錶板
  {
    path: 'agency/dashboard',
    loadComponent: () => import('./features/agency-dashboard/agency-dashboard.component').then((m) => m.AgencyDashboardComponent),
  },
  // 4.2 捐助發票與感謝狀送出處
  {
    path: 'agency/receipt-review',
    loadComponent: () =>
      import('./features/agency-receipt-review/agency-receipt-review.component').then((m) => m.AgencyReceiptReviewComponent),
  },

  // 4.3 日常需求管理區
  {
    path: 'agency/daily',
    loadComponent: () =>
      import('./features/daily/agency-daily-workspace/agency-daily-workspace.component').then((m) => m.AgencyDailyWorkspaceComponent), // 日常需求發布管理區
  },
  {
    path: 'agency/daily-form',
    loadComponent: () => import('./components/form/daily/daily-form/daily-form.component').then((m) => m.DailyFormComponent),
  },
  {
    path: 'agency/daily-edit/:serialNo',
    loadComponent: () => import('./components/form/daily/daily-form/daily-form.component').then((m) => m.DailyFormComponent),
  },
  {
    path: 'agency/daily-detail/:serialNo',
    loadComponent: () => import('./components/data-list/daily/daily-detail/daily-detail.component').then((m) => m.DailyDetailComponent),
  },
  {
    path: 'agency/daily-batch-edit',
    loadComponent: () =>
      import('./components/form/daily/daily-batch-edit/daily-batch-edit.component').then((m) => m.DailyBatchEditComponent),
  },

  // 4.4 日常物資審核管理區
  {
    path: 'agency/item-review',
    loadComponent: () =>
      import('./features/daily/agency-item-review/agency-item-review.component').then((m) => m.AgencyItemReviewComponent), // 日常物資 AI+人工審核工作流
  },

  //4.5 急難救助需求管理區
  {
    path: 'agency/disaster',
    loadComponent: () =>
      import('./features/disaster/agency-disaster-workspace/agency-disaster-workspace.component').then(
        (m) => m.AgencyDisasterWorkspaceComponent
      ), // 急難救助需求管理區
  },
  {
    path: 'agency/supply-form',
    loadComponent: () => import('./components/form/disaster/supply-form/supply-form.component').then((m) => m.SupplyFormComponent),
  },
  {
    path: 'agency/supply-edit/:serialNo',
    loadComponent: () => import('./components/form/disaster/supply-form/supply-form.component').then((m) => m.SupplyFormComponent),
  },
  {
    path: 'agency/supply-detail/:serialNo',
    loadComponent: () =>
      import('./components/data-list/disaster/supply-detail/supply-detail.component').then((m) => m.SupplyDetailComponent),
  },
  {
    path: 'agency/supply-batch-edit',
    loadComponent: () =>
      import('./components/form/disaster/supply-batch-edit/supply-batch-edit.component').then((m) => m.SupplyBatchEditComponent),
  },

  // 4.6 災害需求志工管理區
  {
    path: 'agency/volunteer-form',
    loadComponent: () => import('./components/form/disaster/volunteer-form/volunteer-form.component').then((m) => m.VolunteerFormComponent),
  },
  {
    path: 'agency/volunteer-edit/:id',
    loadComponent: () => import('./components/form/disaster/volunteer-form/volunteer-form.component').then((m) => m.VolunteerFormComponent),
  },
  {
    path: 'agency/volunteer-detail/:id',
    loadComponent: () =>
      import('./components/data-list/disaster/volunteer-detail/volunteer-detail.component').then((m) => m.VolunteerDetailComponent),
  },
  {
    path: 'agency/volunteer-batch-edit',
    loadComponent: () =>
      import('./components/form/disaster/volunteer-batch-edit/volunteer-batch-edit.component').then((m) => m.VolunteerBatchEditComponent),
  },

  // 5. 系統後台模組 (管理員端)
  {
    path: 'admin/agency-verify',
    loadComponent: () =>
      import('./features/auth/admin-agency-verify/admin-agency-verify.component').then((m) => m.AdminAgencyVerifyComponent), // 社福機構註冊字號審核
  },
  {
    path: 'admin/disaster-control',
    loadComponent: () =>
      import('./features/disaster/admin-disaster-control/admin-disaster-control.component').then((m) => m.AdminDisasterControlComponent), // 日常切換災害模式以及發布公告(有點抽象)
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./features/admin-dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
  },

  // 6. 防呆萬用路由：如果隨便亂打網址，一律踢回大廳
  { path: '**', redirectTo: 'home' },
];
