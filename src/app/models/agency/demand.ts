// 接受物資狀態
export type ConditionStatus = '接受' | '不接受' | '';

export interface DisasterConditions {
  全新: ConditionStatus;
  二手: ConditionStatus;
  有擦痕: ConditionStatus;
  過期: ConditionStatus;
  毀損: ConditionStatus;
}

// 急難救助需求資料
export interface DisasterDemand {
  id: number; // 編號
  createdAt?: string; // 建立時間
  publishedAt?: string; // 發布時間
  expectedOffShelfAt?: string; // 預計下架時間
  item: string; // 物資名稱
  amount: number | null; // 需求數量
  remaining?: number | null; // 剩餘需求數量
  unit: string; // 單位
  amountDescription?: string; // 數量說明
  reason: string; // 需求原因
  description: string; // 需求描述
  conditions: DisasterConditions; // 接受物資狀態
  customConditions: string[]; // 其他物資狀態
  priority: '普通' | '緊急' | '非常緊急'; // 緊急程度
  status: '上架' | '隱藏' | '下架'; // 需求狀態
  address: string; // 地址
  phone: string; // 聯絡電話
  contactTimeWeekday?: boolean; // 平日聯絡
  contactTimeWeekend?: boolean; // 假日聯絡
  contactTimeMorning?: boolean; // 上午聯絡
  contactTimeAfternoon?: boolean; // 下午聯絡
  contactTimeEvening?: boolean; // 晚上聯絡
  note?: string; // 備註
  brand?: string; // 品牌
  image?: string[]; // 物資圖片
  imageFileNames?: string[]; // 物資圖片檔名

  // TODO: 留言功能完成後，由 Message 資料計算，不存資料庫
  messageCount?: number; // 留言數量

  category:
    | '食品與飲用水'
    | '衣物與保暖用品'
    | '醫療與照護用品'
    | '清潔與衛生用品'
    | '嬰幼兒用品'
    | '長者與身心障礙用品'
    | '女性生理用品'
    | '寵物與動物用品'
    | '防災與照明用品'
    | '通訊與求救用品'
    | '生活與炊事用品'
    | '居住安置與修繕用品'
    | '其他'
    | '';
}

// 編輯用錯誤提示欄位
export interface EditableDisasterDemand extends DisasterDemand {
  itemError?: boolean; // 物資名稱錯誤
  amountError?: boolean; // 需求數量錯誤
  unitError?: boolean; // 單位錯誤
  categoryError?: boolean; // 物資分類錯誤
  reasonError?: boolean; // 需求原因錯誤
  descriptionError?: boolean; // 需求描述錯誤
  addressError?: boolean; // 地址錯誤
  phoneError?: boolean; // 聯絡電話錯誤
  remainingError?: boolean; // 剩餘需求數量錯誤

  // 批次編輯專用
  categoryDropdownOpen?: boolean; // 物資分類下拉選單是否開啟
  imageFiles: File[]; // 物資圖片檔案
}

// 新增需求用
export type CreateDisasterDemand = Omit<DisasterDemand, 'id'>;

// 狀態
export type DisasterStatus = '上架' | '隱藏' | '下架';

// 顯示狀態
export type DisplayStatus = '已上架' | '隱藏中' | '已下架';
