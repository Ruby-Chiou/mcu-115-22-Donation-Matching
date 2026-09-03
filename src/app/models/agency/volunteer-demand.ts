// 志工需求狀態
export type VolunteerStatus = '上架' | '隱藏' | '下架';

// 前端畫面 UI 呈現的狀態型態
export type DisplayVolunteerStatus = '已上架' | '隱藏中' | '已下架';

// 志工需求資料
export interface VolunteerDemand {
  // 基本資料與時間戳記
  serialNo: number; // 編號
  createdAt?: string; // 建立時間
  publishedAt?: string; // 上架時間
  expectedOffShelfAt?: string; // 預計下架時間

  // 志工基本資訊
  type: string; // 志工類型
  people: number | null; // 需求人數
  location: string; // 需求地點
  condition: string; // 現場狀況
  workContent: string; // 工作內容
  reason: string; // 需求原因

  // 優先度與需求狀態
  priority: '普通' | '緊急' | '非常緊急'; // 優先程度
  status: VolunteerStatus; // 上架狀態

  // 聯絡資訊
  contact: string; // 聯絡人
  phone: string; // 聯絡電話

  // 其他資訊
  note?: string; // 其他說明
  messageCount?: number; // 留言數
}

// 新增志工需求用
export type CreateVolunteerDemand = Omit<VolunteerDemand, 'serialNo'>;
