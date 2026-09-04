import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent {
  private router = inject(Router);

  // 定義所有模組的導航清單
  menuSections = [
    {
      title: '認證模組 (Auth)',
      icon: 'lock',
      items: [
        { name: '登入頁面', path: '/login', desc: '使用者登入' },
        { name: '註冊頁面', path: '/register', desc: '新帳號註冊' },
      ],
    },
    {
      title: '捐助者模組 (Donor)',
      icon: 'volunteer_activism',
      items: [
        { name: '日常捐助大廳', path: '/donor/daily', desc: '瀏覽日常物資與捐助' },
        { name: '災害救助大廳', path: '/donor/disaster', desc: '急難救助需求瀏覽' },
        { name: '災害歷史紀錄', path: '/disaster/history', desc: '查看災害歷史紀錄' },
        { name: '歷史紀錄與進度追蹤', path: '/donor/history', desc: '查詢個人捐助歷史' },
      ],
    },
    {
      title: '社福機構模組 (Agency)',
      icon: 'business',
      items: [
        { name: '社福機構總控制台', path: '/agency/dashboard', desc: '機構可概覽各式資訊與連結' },
        { name: '捐助發票管理區', path: '/agency/receipt-review', desc: '機構審核捐助收據與感謝狀寄出' },
        { name: '日常需求管理區', path: '/agency/daily', desc: '機構發布與管理日常需求' },
        { name: '急難救助需求區', path: '/agency/disaster', desc: '急難救助需求管理' },
        { name: '日常物資 AI+人工審核', path: '/agency/item-review', desc: '審核民眾提交的物資' },
      ],
    },
    {
      title: '系統後台模組 (Admin)',
      icon: 'settings',
      items: [
        { name: '機構字號審核', path: '/admin/agency-verify', desc: '審核社福機構註冊資格' },
        { name: '災害模式控制台', path: '/admin/disaster-control', desc: '切換災害模式與發布公告' },
      ],
    },
  ];

  // 點擊卡片跳轉
  goTo(path: string) {
    this.router.navigate([path]);
  }
}
