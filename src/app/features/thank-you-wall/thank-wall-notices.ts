import { BoardAnnouncement } from '../../core/services/admin/board-announcement.service';

/** 公開說明固定文案（前台覆寫 DB 舊描述，避免重複公告）。 */
export const THANK_WALL_PUBLIC_NOTICE_BODY =
  '捐助者可自行設定匿名、全名或不公開的方式顯示於本名單下，感謝如下愛心人士們的幫助。';

/** 只保留一則公開說明，並濾掉同義／無標題的重複導語。 */
export function normalizeThankWallNotices(wall: BoardAnnouncement[]): BoardAnnouncement[] {
  const publicNotices = wall.filter((item) => !item.donorUid);
  const disclosure = publicNotices.find((item) => item.headline.includes('公開說明'));
  const others = publicNotices.filter((item) => {
    if (item.headline.includes('公開說明')) {
      return false;
    }
    if (/匿名|全名|不公開/.test(item.body) && /感謝牆|本名單|感謝如下/.test(item.body)) {
      return false;
    }
    if (!item.headline.trim() && /匿名|全名|不公開/.test(item.body)) {
      return false;
    }
    return true;
  });

  const notices: BoardAnnouncement[] = [];
  if (disclosure) {
    notices.push({ ...disclosure, body: THANK_WALL_PUBLIC_NOTICE_BODY });
  } else {
    notices.push({
      id: -100,
      board: 'thank_wall',
      headline: '公開說明',
      body: THANK_WALL_PUBLIC_NOTICE_BODY,
      published: true,
      sortOrder: 0,
      donorUid: null,
    });
  }
  return [...notices, ...others];
}
