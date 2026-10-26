import { AppRole } from '../../models/auth/app-role';

export interface NavLink {
  name: string;
  link: string;
}

export interface NavItem {
  name: string;
  link: string;
  sub: NavLink[];
}

const DONOR_AREA: NavItem = {
  name: '捐助專區',
  link: '/donor/daily',
  sub: [
    { name: '日常捐助', link: '/donor/daily' },
    { name: '災害救助', link: '/donor/disaster' },
    { name: '捐助地圖', link: '/daily/locations' },
    { name: '受助機構', link: '/donor/beneficiaries' },
  ],
};

const PROGRESS: NavItem = {
  name: '進度查詢',
  link: '/donor/history',
  sub: [
    { name: '捐助紀錄', link: '/donor/history' },
    { name: '配送查詢', link: '/tracking' },
  ],
};

const SERVICE: NavItem = {
  name: '客服中心',
  link: '/customer-service/faq',
  sub: [
    { name: '常見問題', link: '/customer-service/faq' },
    { name: 'AI 客服', link: '/customer-service/ai-chat' },
    { name: '聯絡我們', link: '/contact-us' },
  ],
};

const ABOUT: NavItem = {
  name: '關於我們',
  link: '/intro',
  sub: [
    { name: '平台介紹', link: '/intro' },
    { name: '平台導覽', link: '/platform-guide' },
    { name: '捐助感謝', link: '/thank-you-wall' },
  ],
};

const AGENCY_AREA: NavItem = {
  name: '機構作業',
  link: '/agency/dashboard',
  sub: [
    { name: '收件匣', link: '/agency/inbox' },
    { name: '機構資料', link: '/agency/profile' },
    { name: '總控制台', link: '/agency/dashboard' },
    { name: '日常需求', link: '/agency/daily' },
    { name: '物資審核', link: '/agency/item-review' },
    { name: '收件確認', link: '/agency/delivery-confirm' },
    { name: '收據與感謝', link: '/agency/receipt-review' },
  ],
};

const AGENCY_DISASTER: NavItem = {
  name: '急難救助',
  link: '/agency/disaster',
  sub: [],
};

/** 捐助者在前台看得到的公開頁。急難救助關閉時，前台也不列出災害救助。 */
function agencyPublicFront(disasterOpen: boolean): NavItem {
  const sub: NavLink[] = [
    { name: '日常捐助', link: '/donor/daily' },
    { name: '捐助地圖', link: '/daily/locations' },
    { name: '受助機構', link: '/donor/beneficiaries' },
    { name: '捐助感謝', link: '/thank-you-wall' },
  ];

  if (disasterOpen) {
    sub.splice(1, 0, { name: '災害救助', link: '/donor/disaster' });
  }

  return { name: '前台頁面', link: '/donor/daily', sub };
}

const ADMIN_OVERVIEW: NavItem = {
  name: '總覽',
  link: '/admin/dashboard',
  sub: [],
};

const ADMIN_REVIEW: NavItem = {
  name: '審核',
  link: '/admin/agency-verify',
  sub: [
    { name: '受助者審核', link: '/admin/agency-verify' },
    { name: '企業審核', link: '/admin/company-verify' },
  ],
};

const ADMIN_PLATFORM: NavItem = {
  name: '平台',
  link: '/admin/donors',
  sub: [
    { name: '捐助者帳號', link: '/admin/donors' },
    { name: '系統公告', link: '/admin/announcements' },
    { name: '災害控管', link: '/admin/disaster-control' },
  ],
};

/** 導覽列只列出該身分可進入的項目。公開資訊頁各身分都看得到。 */
export function navigationFor(role: AppRole, disasterOpen = false): NavItem[] {
  if (role === 'admin') {
    return [ADMIN_OVERVIEW, ADMIN_REVIEW, ADMIN_PLATFORM, SERVICE, ABOUT];
  }

  if (role === 'agency') {
    const front = agencyPublicFront(disasterOpen);
    return disasterOpen
      ? [AGENCY_AREA, AGENCY_DISASTER, front, SERVICE, ABOUT]
      : [AGENCY_AREA, front, SERVICE, ABOUT];
  }

  if (role === 'donor') {
    return [DONOR_AREA, PROGRESS, SERVICE, ABOUT];
  }

  return [DONOR_AREA, SERVICE, ABOUT];
}
