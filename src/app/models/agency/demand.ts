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
  id: number;

  createdAt?: string;

  item: string;

  amount: number | null;

  remaining?: number | null;

  unit: string;

  amountDescription?: string;

  reason: string;

  description: string;

  // 接受物資狀態
  conditions: DisasterConditions;

  customConditions: string[];

  priority: '普通' | '緊急' | '非常緊急';

  status: '上架' | '隱藏' | '下架';

  address: string;

  phone: string;

  note?: string;

  brand?: string;

  // TODO: 留言功能完成後，由 Message 資料計算，不存資料庫
  messageCount?: number;

  category: '食物' | '衣物' | '醫療' | '嬰幼兒' | '生活用品' | '其他' | '';
}

// 編輯用錯誤提示欄位
export interface EditableDisasterDemand extends DisasterDemand {
  itemError?: boolean;

  amountError?: boolean;

  unitError?: boolean;

  categoryError?: boolean;

  reasonError?: boolean;

  descriptionError?: boolean;

  addressError?: boolean;

  phoneError?: boolean;

  remainingError?: boolean;
}

// 新增需求用
export type CreateDisasterDemand = Omit<DisasterDemand, 'id'>;

// 狀態
export type DisasterStatus = '上架' | '隱藏' | '下架';

// 顯示狀態
export type DisplayStatus = '已上架' | '隱藏中' | '已下架';
