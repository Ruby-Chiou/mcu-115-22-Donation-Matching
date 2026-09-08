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
  // 基本資料
  serialNo: number; // 編號
  createdAt?: string; // 建立時間
  publishedAt?: string; // 上架時間
  expectedOffShelfAt?: string; // 預計下架時間

  // 需求物資
  item: string; // 物資名稱
  amount: number | null; // 需求數量
  remaining?: number | null; // 剩餘需求數量
  unit: string; // 單位
  amountDescription?: string; // 數量描述
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

  // 需求內容
  reason: string; // 需求原因
  description: string; // 需求描述
  brand?: string; // 特殊品牌需求

  // 物資圖片
  image?: string[]; // 物資圖片
  imageFileNames?: string[]; // 物資圖片檔名

  // 物資接受條件

  conditions: DisasterConditions; // 前端使用：接受物資狀態

  customConditions: string[]; // 前端使用：其它物資需求狀態

  conditionDescription?: string; // 資料庫使用：合併後的物資狀態內容

  // 優先度與需求狀態
  priority: '普通' | '緊急' | '非常緊急'; // 緊急優先度
  status: '上架' | '隱藏' | '下架'; // 需求狀態

  // 聯絡資訊
  address: string; // 接收物資地址
  phone: string; // 聯絡電話

  // 是否區分平日、假日的聯絡時段
  contactTimeDifferent?: boolean;

  // 一般聯絡時段
  contactTimeMorning?: boolean; // 上午
  contactTimeAfternoon?: boolean; // 下午
  contactTimeEvening?: boolean; // 晚上

  // 平日聯絡時段
  weekdayMorning?: boolean; // 平日上午
  weekdayAfternoon?: boolean; // 平日下午
  weekdayEvening?: boolean; // 平日晚上

  // 假日聯絡時段
  weekendMorning?: boolean; // 假日上午
  weekendAfternoon?: boolean; // 假日下午
  weekendEvening?: boolean; // 假日晚上

  // 其他資訊
  note?: string; // 其他說明（備註）

  // TODO: 留言功能完成後，由 Message 資料計算，不存資料庫
  messageCount?: number; // 留言數量
}

// 編輯用資料
export interface EditableDisasterDemand extends DisasterDemand {
  // 編輯錯誤提示
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
export type CreateDisasterDemand = Omit<DisasterDemand, 'serialNo'>;

// 需求狀態
export type DisasterStatus = '上架' | '隱藏' | '下架';

// 列表顯示狀態
export type DisplayStatus = '已上架' | '隱藏中' | '已下架';
