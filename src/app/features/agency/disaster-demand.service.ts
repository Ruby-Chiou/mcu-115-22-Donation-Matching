import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DisasterDemandService {
  demands: any[] = [];

  addDemand(demand: any) {
    this.demands.push({
      id: this.demands.length + 1,
      ...demand,
    });
  }

  getDemands() {
    return this.demands;
  }

  // =========================
  // 自動判斷需求分類
  // =========================
  getCategory(item: string): string {
    const text = item.toLowerCase();

    // 食物
    if (
      text.includes('米') ||
      text.includes('飯') ||
      text.includes('麵') ||
      text.includes('水') ||
      text.includes('罐頭') ||
      text.includes('泡麵')
    ) {
      return '食物';
    }

    // 衣物
    if (text.includes('衣') || text.includes('外套') || text.includes('褲') || text.includes('襪') || text.includes('鞋')) {
      return '衣物';
    }

    // 醫療
    if (text.includes('藥') || text.includes('口罩') || text.includes('紗布') || text.includes('繃帶') || text.includes('酒精')) {
      return '醫療';
    }

    // 嬰幼兒
    if (text.includes('尿布') || text.includes('奶瓶') || text.includes('奶粉') || text.includes('奶嘴')) {
      return '嬰幼兒';
    }

    // 生活用品
    if (text.includes('毛巾') || text.includes('牙刷') || text.includes('洗髮') || text.includes('衛生紙') || text.includes('洗面乳')) {
      return '生活用品';
    }

    // 無法判斷
    return '其他';
  }

  getDemandById(id: number) {
    return this.demands.find((demand) => demand.id === id);
  }

  updateDemand(updatedDemand: any) {
    const index = this.demands.findIndex((item) => item.id === updatedDemand.id);

    if (index !== -1) {
      this.demands[index] = updatedDemand;
    }
  }

  deleteDemand(id: number) {
    this.demands = this.demands.filter((item) => item.id !== id);
  }
}
