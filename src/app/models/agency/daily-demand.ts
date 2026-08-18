// 接受物資狀態
export type ConditionStatus = '接受' | '不接受' | '';

export interface DailyConditions {
  全新: ConditionStatus;
  二手: ConditionStatus;
  有擦痕: ConditionStatus;
  過期: ConditionStatus;
  毀損: ConditionStatus;
}

// 急難救助需求資料
export interface DailyDemand {
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
  conditions: DailyConditions;

  customConditions: string[];

  priority: '普通' | '緊急' | '非常緊急';

  status: '上架' | '隱藏' | '下架';

  receiveMethod: '寄送' | '面交';

  recipient: string;

  address: string;

  phone: string;

  note?: string;

  brand?: string;

  // TODO: 留言功能完成後，由 Message 資料計算，不存資料庫
  messageCount?: number;

  category: '食物' | '衣物' | '醫療' | '嬰幼兒' | '生活用品' | '其他' | '';

  // 服務對象
  serviceTargets: {
    老人?: boolean;

    嬰幼兒?: boolean;

    孩童?: boolean;

    青少年?: boolean;

    身障?: boolean;

    貧困?: boolean;

    重症照護?: boolean;

    寵物?: boolean;

    流浪?: boolean;

    野生?: boolean;
  };

  customServiceTargets: string[];
}

// 編輯用錯誤提示欄位
export interface EditableDailyDemand extends DailyDemand {
  itemError?: boolean;

  amountError?: boolean;

  unitError?: boolean;

  serviceTargetError?: boolean;

  categoryError?: boolean;

  reasonError?: boolean;

  descriptionError?: boolean;

  phoneError?: boolean;

  remainingError?: boolean;

  invalidReceiveInfo?: boolean;
}

// 新增需求用
export type CreateDailyDemand = Omit<DailyDemand, 'id'>;

// 狀態
export type DailyStatus = '上架' | '隱藏' | '下架';

// 顯示狀態
export type DailyDisplayStatus = '已上架' | '隱藏中' | '已下架';
