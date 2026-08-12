import { Injectable } from '@angular/core';

export interface VolunteerDemand {
  id: number;

  type: string;
  people: number | null;

  date: string;

  location: string;
  condition: string;
  workContent: string;
  reason: string;

  priority: '普通' | '緊急' | '非常緊急';

  contact: string;
  phone: string;
  note: string;

  status: '已上架' | '隱藏中' | '已下架';

  createdAt?: string;
  messageCount?: number;

  // 列表使用
  selected?: boolean;
  displayStatus?: '已上架' | '隱藏中' | '已下架';
  displayCreatedAt?: string;
}
@Injectable({
  providedIn: 'root'
})
export class VolunteerDemandService {

  private storageKey = 'volunteerDemands';

  // ==========================================
  // 取得所有志工需求
  // ==========================================
  getDemands(): VolunteerDemand[] {

    const data = localStorage.getItem(this.storageKey);

    if (!data) {
      return [];
    }

    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('讀取志工需求失敗：', error);
      return [];
    }
  }

  // ==========================================
  // 新增志工需求
  // ==========================================
  addDemand(demand: VolunteerDemand): void {

    const demands = this.getDemands();

    // 如果沒有 ID，就自動產生
    if (!demand.id) {
      demand.id = Date.now();
    }

    // 如果沒有發布時間，就自動產生
    if (!demand.createdAt && demand.status === '已上架') {
      demand.createdAt = new Date().toISOString();
    }

    demands.push({
      ...demand,

      status: demand.status ?? '已上架',

      messageCount: demand.messageCount ?? 0
    });

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(demands)
    );
  }

  // ==========================================
  // 修改志工需求
  // ==========================================
  updateDemand(demand: VolunteerDemand): void {

    const demands = this.getDemands();

    const index = demands.findIndex(
      item => item.id === demand.id
    );

    if (index === -1) {
      console.error('找不到志工需求：', demand.id);
      return;
    }

    demands[index] = {
      ...demand
    };

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(demands)
    );
  }

  // ==========================================
  // 刪除志工需求
  // ==========================================
  deleteDemand(id: number): void {

    const demands = this.getDemands();

    const newDemands = demands.filter(
      item => item.id !== id
    );

    localStorage.setItem(
      this.storageKey,
      JSON.stringify(newDemands)
    );
  }
}
