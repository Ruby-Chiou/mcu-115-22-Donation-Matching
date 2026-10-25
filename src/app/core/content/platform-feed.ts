export interface PlatformAnnouncement {
  date: string;
  text: string;
}

export interface PlatformNewsItem {
  date: string;
  category: string;
  title: string;
  content: string;
  link: string;
}

/** 首頁與受助者總控台共用同一份內容，避免兩邊各寫一份而走樣。 */
export const PLATFORM_ANNOUNCEMENTS: readonly PlatformAnnouncement[] = [
  {
    date: '26/09/07',
    text: '系統更新通知：平台已於 26/09/07 完成系統更新，請使用者重新登入以享受最新功能。',
  },
  {
    date: '26/09/06',
    text: '平台新增「災害救助」功能，提供民眾在災害發生時快速提出需求。',
  },
  {
    date: '26/09/05',
    text: '系統維護通知：平台將於 26/09/07 進行系統維護，屆時可能暫時無法使用。',
  },
];

export const PLATFORM_NEWS: readonly PlatformNewsItem[] = [
  {
    date: '26/09/12',
    category: '災情快訊',
    title: '花蓮部分地區道路通行狀況更新',
    content: '持續整理受災地區交通與救援相關資訊，協助捐助者掌握目前救援情況。',
    link: '/donor/disaster',
  },
  {
    date: '26/09/11',
    category: '救援資訊',
    title: '受災地區臨時安置與救援資源資訊',
    content: '提供避難、安置及相關救援資源資訊，方便有需要的民眾快速查詢。',
    link: '/donor/disaster',
  },
  {
    date: '26/09/10',
    category: '物資需求',
    title: '花蓮受災地區物資需求持續更新',
    content: '目前部分地區仍有民生物資需求，可前往災害救助專區查看詳細需求。',
    link: '/donor/disaster',
  },
];
