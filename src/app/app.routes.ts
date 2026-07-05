import { Routes } from '@angular/router';

// 1. 捐助者組件
import { DonorDailyLobbyComponent } from './features/donor/donor-daily-lobby/donor-daily-lobby.component';
import { DonorDisasterBoardComponent } from './features/donor/donor-disaster-board/donor-disaster-board.component';
import { DonorHistoryComponent } from './features/donor/donor-history/donor-history.component';

// 2. 社福機構組件
import { AgencyDailyPostComponent } from './features/agency/agency-daily-post/agency-daily-post.component';
import { AgencyDisasterPostComponent } from './features/agency/agency-disaster-post/agency-disaster-post.component';
import { AgencyRequestManagementComponent } from './features/agency/agency-request-management/agency-request-management.component';

// 3. 管理者組件
import { AdminAgencyVerifyComponent } from './features/admin/admin-agency-verify/admin-agency-verify.component';
import { AdminItemReviewComponent } from './features/admin/admin-item-review/admin-item-review.component';
import { AdminDisasterControlComponent } from './features/admin/admin-disaster-control/admin-disaster-control.component';

export const routes: Routes = [
  // 預設首警直接進入日常捐贈大廳
  { path: '', redirectTo: 'donor/daily', pathMatch: 'full' },

  // ==========================================
  // 一、 捐助者管道 (Donor Routes)
  // ==========================================
  { path: 'donor/daily', component: DonorDailyLobbyComponent }, // 日常捐助大廳
  { path: 'donor/disaster', component: DonorDisasterBoardComponent }, // 災害救助大廳
  { path: 'donor/history', component: DonorHistoryComponent }, // 歷史紀錄與進度追蹤

  // ==========================================
  // 二、 受助者/社福機構管道 (Agency Routes)
  // ==========================================
  { path: 'agency/daily-post', component: AgencyDailyPostComponent }, // 發布日常需求
  { path: 'agency/disaster-post', component: AgencyDisasterPostComponent }, // 發布災害需求
  { path: 'agency/management', component: AgencyRequestManagementComponent }, // 機構自身需求管理概覽

  // ==========================================
  // 三、 系統營運審核方 (Admin Routes)
  // ==========================================
  { path: 'admin/agency-verify', component: AdminAgencyVerifyComponent }, // 社福機構註冊字號審核
  { path: 'admin/item-review', component: AdminItemReviewComponent }, // 日常物資 AI+人工審核工作流
  { path: 'admin/disaster-control', component: AdminDisasterControlComponent }, // 日常切換災害模式以及公告(有點抽象)

  // 防呆
  { path: '**', redirectTo: 'donor/daily' },
];
