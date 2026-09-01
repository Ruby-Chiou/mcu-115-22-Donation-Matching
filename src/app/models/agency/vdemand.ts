export interface VolunteerDemand {
// 志工需求資料
  id: number;

  createdAt?: string;

  // 志工類型
  type: string;

  // 需求人數
  people: number | null;

  // 需求地點
  location: string;

  // 現場狀況
  condition: string;

  // 工作內容
  workContent: string;

  // 需求原因
  reason: string;

  // 優先程度
  priority: '普通' | '緊急' | '非常緊急';

  // 上架狀態
  status: '上架' | '隱藏' | '下架';

  // 聯絡人
  contact: string;

  // 聯絡電話
  phone: string;

  // 其他說明
  note?: string;

  // 留言數
  messageCount?: number;
}


// 新增志工需求用
export type CreateVolunteerDemand = Omit<VolunteerDemand, 'id'>;


// 志工需求狀態
// 1. 後端/資料庫真正的狀態型態
export type VolunteerStatus = '上架' | '隱藏' | '下架';

// 2. 前端畫面 UI 呈現的狀態型態
export type DisplayVolunteerStatus = '已上架' | '隱藏中' | '已下架';
