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

export function isExternalNewsLink(link: string): boolean {
  return /^https?:\/\//i.test(link);
}

export const PLATFORM_NEWS: readonly PlatformNewsItem[] = [
  {
    date: '26/10/27',
    category: '災情快訊',
    title: '民生示警公開資料：即時災情',
    content: '國家災害防救科技中心的即時示警會持續更新降雨、淹水、地震等災情，只列示警內容。',
    link: 'https://alerts.ncdr.nat.gov.tw/web/alerts/immediate',
  },
  {
    date: '26/10/27',
    category: '救援資訊',
    title: '消防署災情與救援通報',
    content: '內政部消防署救災救護指揮中心公布的災情與救援通報，依官方發布內容更新。',
    link: 'https://www.nfa.gov.tw/pro/index.php?code=list&ids=114',
  },
  {
    date: '26/09/10',
    category: '物資需求',
    title: '花蓮受災地區物資需求持續更新',
    content: '目前部分地區仍有民生物資需求，可前往災害救助專區查看詳細需求。',
    link: '/donor/disaster',
  },
];
