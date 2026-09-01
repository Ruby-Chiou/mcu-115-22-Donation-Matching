// 接受物資狀態
export type ConditionStatus = '接受' | '不接受' | '';

export interface DailyConditions {
  全新: ConditionStatus;
  二手: ConditionStatus;
  有擦痕: ConditionStatus;
  過期: ConditionStatus;
  毀損: ConditionStatus;
}

// 接收方式
export type ReceiveMethod = '寄送' | '面交';

export interface DailyReceiveMethod {
  寄送: boolean;
  面交: boolean;
}

// 日常需求資料
export interface DailyDemand {
  serialNo: number; // 編號
  createdAt?: string; // 建立日期
  publishedAt?: string; // 上架日期
  expectedOffShelfAt?: string; // 預計下架日期／下架日期

  // 需求物資
  item: string; // 需求物
  amount: number | null; // 需求數量
  remaining?: number | null; // 剩餘需求
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

  // 需求對象
  // 前端使用：固定需求對象勾選
  serviceTargets: {
    老人: boolean;
    嬰幼兒: boolean;
    孩童: boolean;
    青少年: boolean;
    身障: boolean;
    貧困: boolean;
    重症照護: boolean;
    動物: boolean;
    無家者: boolean;
  };

  // 前端使用：其他自訂需求對象
  // 最多 5 個
  customServiceTargets: string[];

  // 資料庫使用：合併後的需求對象內容
  // 內容包含「固定需求對象」及「其他自訂需求對象」
  serviceTargetDescription?: string;

  // 物資接受條件
  // 前端使用：接受物資狀態
  conditions: DailyConditions;

  // 前端使用：其他物資需求狀態
  // 最多 5 個
  customConditions: string[];

  // 資料庫使用：合併後的物資需求狀態內容
  // 內容包含「接受物資狀態」及「其他物資需求狀態」
  conditionDescription?: string;

  // 優先度與需求狀態
  priority: '普通' | '緊急' | '非常緊急'; // 緊急優先度
  status: '上架' | '隱藏' | '下架'; // 系統實際狀態

  // 接收方式
  receiveMethod: DailyReceiveMethod;
  recipient: string; // 收件人
  address: string; // 接收物資地址
  phone: string; // 聯絡電話

  // 聯絡時間：平日
  contactTimeWeekday: boolean;

  // 聯絡時間：假日
  contactTimeWeekend: boolean;

  // 聯絡時間：上午
  contactTimeMorning: boolean;

  // 聯絡時間：下午
  contactTimeAfternoon: boolean;

  // 聯絡時間：晚上
  contactTimeEvening: boolean;

  // 是否將平日與假日的聯絡時段分開設定
  contactTimeSeparate: boolean;

  // 平日：上午
  contactTimeWeekdayMorning: boolean;

  // 平日：下午
  contactTimeWeekdayAfternoon: boolean;

  // 平日：晚上
  contactTimeWeekdayEvening: boolean;

  // 假日：上午
  contactTimeWeekendMorning: boolean;

  // 假日：下午
  contactTimeWeekendAfternoon: boolean;

  // 假日：晚上
  contactTimeWeekendEvening: boolean;

  // 其他說明
  note?: string;

  // TODO:
  // 留言功能完成後，由 Message 資料計算，不存資料庫
  messageCount?: number;
}

// 編輯用資料
export interface EditableDailyDemand extends DailyDemand {
  itemError?: boolean; // 物資名稱錯誤
  amountError?: boolean; // 需求數量錯誤
  unitError?: boolean; // 單位錯誤
  serviceTargetError?: boolean; // 服務對象錯誤
  categoryError?: boolean; // 物資分類錯誤
  reasonError?: boolean; // 需求原因錯誤
  descriptionError?: boolean; // 需求描述錯誤
  phoneError?: boolean; // 聯絡電話錯誤
  remainingError?: boolean; // 剩餘需求數量錯誤
  invalidReceiveInfo?: boolean; // 接收方式資訊錯誤

  // 批次編輯圖片
  imageFiles: File[];
}

// 新增需求用
export type CreateDailyDemand = Omit<DailyDemand, 'serialNo'>;

// 狀態
export type DailyStatus = '上架' | '隱藏' | '下架';

// 列表顯示狀態
export type DailyDisplayStatus = '已上架' | '隱藏中' | '已下架';
