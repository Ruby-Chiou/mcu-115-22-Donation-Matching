import { Injectable } from '@angular/core';
import { VolunteerDemand } from '../../models/agency/volunteer-demand';

@Injectable({
  providedIn: 'root',
})
export class VolunteerDemandService {
  demands: VolunteerDemand[] = [
    {
      id: 1,
      type: '物資搬運',
      people: 5,
      location: '花蓮縣光復鄉大平村武昌街87號 ',
      condition: '無特殊條件',
      workContent: '需要協助運土出來，需要約五名人力及三副袖套 ',
      reason: '花蓮光復救災',
      priority: '非常緊急',
      status: '上架',
      contact: '林先生',
      phone: '0926766326',
      note: '',
      messageCount: 7,
      createdAt: '2026-08-25T11:30:00',
      publishedAt: '2026-08-25T11:30:00',
      expectedOffShelfAt: '2026-09-24T11:30:00',
    },
    {
      id: 2,
      type: '物資整理',
      people: 10,
      location: '花蓮縣光復鄉大同村學士街11號',
      condition: '無特殊條件',
      workContent: '從光復糖廠理貨後，派車送過去',
      reason: '花蓮光復救災',
      priority: '非常緊急',
      status: '上架',
      contact: '黃小姐 ',
      phone: '0968-372-479',
      note: '',
      messageCount: 10,
      createdAt: '2026-08-25T11:30:00',
      publishedAt: '2026-08-25T11:30:00',
      expectedOffShelfAt: '2026-09-24T11:30:00',
    },
    {
      id: 3,
      type: '環境清潔',
      people: 10,
      location: '花蓮縣光復鄉大華村中央產業道路33號 ',
      condition: '無特殊條件',
      workContent: '需自備鏟子或路上借',
      reason: '花蓮光復救災',
      priority: '緊急',
      status: '隱藏',
      contact: '光復車站附近民宅 ',
      phone: '0988791556',
      note: '可能在鏟土沒接手機',
      messageCount: 10,
      createdAt: '2026-08-25T11:30:00',
      publishedAt: '2026-08-25T11:30:00',
      expectedOffShelfAt: '2026-09-24T11:30:00',
    },
    {
      id: 4,
      type: '物資整理',
      people: 10,
      location: '花蓮縣光復鄉大進村糖廠街19-6號',
      condition: '無特殊條件',
      workContent: '需要人力: 整理物資',
      reason: '花蓮光復救災',
      priority: '非常緊急',
      status: '上架',
      contact: '呂小姐',
      phone: '0972338088',
      note: '今晚22:00-明天6:00',
      messageCount: 10,
      createdAt: '2026-08-25T11:30:00',
      publishedAt: '2026-08-25T11:30:00',
      expectedOffShelfAt: '2026-09-24T11:30:00',
    },
    {
      id: 5,
      type: '環境清潔',
      people: 3,
      location: '花蓮縣光復鄉北富村富田二街59號',
      condition: '無特殊條件',
      workContent: '需要人力: 清除垃圾',
      reason: '花蓮光復救災',
      priority: '緊急',
      status: '隱藏',
      contact: '林先生',
      phone: '0900111222',
      note: '',
      messageCount: 1,
      createdAt: '2026-08-25T11:30:00',
      publishedAt: '2026-08-25T11:30:00',
      expectedOffShelfAt: '2026-09-24T11:30:00',
    },
    {
      id: 6,
      type: '環境清潔',
      people: 10,
      location: '花蓮縣光復鄉南富村建國路2段73巷1號',
      condition: '無特殊條件',
      workContent: '屋主拜託志工幫她清理家園',
      reason: '花蓮光復救災',
      priority: '非常緊急',
      status: '下架',
      contact: '林坤祥',
      phone: '0977024963',
      note: '',
      messageCount: 8,
      createdAt: '2026-08-25T11:30:00',
      publishedAt: '2026-08-25T11:30:00',
      expectedOffShelfAt: '2026-09-24T11:30:00',
    },
    {
      id: 7,
      type: '物資搬運',
      people: 10,
      location: '花蓮縣光復鄉大華村仁愛路55號 ',
      condition: '無特殊條件',
      workContent: '需要到地下室一樓鏟泥土、搬重物、遞水桶、倒泥土',
      reason: '花蓮光復救災',
      priority: '非常緊急',
      status: '上架',
      contact: '志工回報',
      phone: '無',
      note: '',
      messageCount: 10,
      createdAt: '2026-08-25T11:30:00',
      publishedAt: '2026-08-25T11:30:00',
      expectedOffShelfAt: '2026-09-24T11:30:00',
    },
    {
      id: 8,
      type: '環境清潔',
      people: 3,
      location: '花蓮縣光復鄉大華村仁愛路35號 ',
      condition: '無特殊條件',
      workContent: '水溝淤積住宅無法排水',
      reason: '花蓮光復救災',
      priority: '非常緊急',
      status: '上架',
      contact: '林智偉',
      phone: '0933480505',
      note: '',
      messageCount: 5,
      createdAt: '2026-08-25T11:30:00',
      publishedAt: '2026-08-25T11:30:00',
      expectedOffShelfAt: '2026-09-24T11:30:00',
    },
    {
      id: 9,
      type: '環境清潔',
      people: 15,
      location: '花蓮縣光復鄉大華村中正路一段97號',
      condition: '無特殊條件',
      workContent: '清理家園',
      reason: '花蓮光復救災',
      priority: '普通',
      status: '隱藏',
      contact: '陳先生',
      phone: '0922022279',
      note: '家中人員不便移動',
      messageCount: 10,
      createdAt: '2026-08-25T11:30:00',
      publishedAt: '2026-08-25T11:30:00',
      expectedOffShelfAt: '2026-09-24T11:30:00',
    },
    {
      id: 10,
      type: '醫療照護',
      people: 8,
      location: '花蓮縣光復鄉大安村中正路一段2-1號',
      condition: '專業照顧',
      workContent: '協助看診及照護',
      reason: '花蓮光復救災',
      priority: '緊急',
      status: '隱藏',
      contact: '光復火車站醫療站',
      phone: '無',
      note: '',
      messageCount: 16,
      createdAt: '2026-08-25T11:30:00',
      publishedAt: '2026-08-25T11:30:00',
      expectedOffShelfAt: '2026-09-24T11:30:00',
    },
    {
      id: 11,
      type: '醫療照護',
      people: 10,
      location: '花蓮縣光復鄉東富路31號',
      condition: '專業照顧',
      workContent: '協助看診及照護',
      reason: '花蓮光復救災',
      priority: '非常緊急',
      status: '上架',
      contact: '成先生 ',
      phone: '0986623182',
      note: '北富村偏遠，醫療急救物資缺乏、山貓不足',
      messageCount: 10,
      createdAt: '2026-08-25T11:30:00',
      publishedAt: '2026-08-25T11:30:00',
      expectedOffShelfAt: '2026-09-24T11:30:00',
    },
  ];
  private storageKey = 'volunteerDemands';
  private selectedDemands: VolunteerDemand[] = [];

  setSelectedDemands(demands: VolunteerDemand[]): void {
    this.selectedDemands = JSON.parse(JSON.stringify(demands));
  }

  getSelectedDemands(): VolunteerDemand[] {
    return JSON.parse(JSON.stringify(this.selectedDemands));
  }
  // ==========================================
  // 取得所有志工需求
  // ==========================================
  addDemand(demand: VolunteerDemand): void {
    this.demands.push({
      ...demand,
    });
  }

  // =========================
  // 取得全部
  // =========================

  getDemands(): VolunteerDemand[] {
    return this.demands;
  }

  // =========================
  // 取得單筆
  // =========================

  getDemandById(id: number): VolunteerDemand | undefined {
    return this.demands.find((demand) => demand.id === id);
  }

  // =========================
  // 修改
  // =========================

  updateDemand(updatedDemand: VolunteerDemand): void {
    const index = this.demands.findIndex((item) => item.id === updatedDemand.id);

    if (index !== -1) {
      this.demands[index] = updatedDemand;
    }
  }

  // =========================
  // 刪除
  // =========================

  deleteDemand(id: number): void {
    this.demands = this.demands.filter((item) => item.id !== id);
  }
  updateBatchDemands(updatedDemands: VolunteerDemand[]): void {
    this.demands = this.demands.map((existingDemand) => {
      const updatedDemand = updatedDemands.find((item) => item.id === existingDemand.id);

      // 有被勾選、且有修改 → 更新
      if (updatedDemand) {
        return updatedDemand;
      }

      // 沒被勾選 → 保留原本資料
      return existingDemand;
    });

    console.log('Service 資料已更新：', this.demands);
  }
}
