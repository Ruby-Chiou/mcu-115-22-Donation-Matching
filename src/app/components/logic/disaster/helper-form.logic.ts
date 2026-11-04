import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { geocodeTaiwan } from '../../../core/map/geocoding';
import { HelperDemandService } from '../../../core/services/agency-helper-demand/helper-demand.service';
import { HelperDemand } from '../../../models/agency/helper-demand';

export type HelperFormField =
  | 'type'
  | 'people'
  | 'location'
  | 'condition'
  | 'workContent'
  | 'reason'
  | 'contact'
  | 'phone';

export interface HelperFormSaveResult {
  ok: boolean;
  notice?: string;
  invalidFields?: HelperFormField[];
  successMessage?: string;
  demand?: HelperDemand;
}

export interface HelperFormLoadResult {
  ok: boolean;
  notice?: string;
  demand?: HelperDemand;
  originalLocation?: string;
}

@Injectable()
export class HelperFormLogic {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly helperDemandService = inject(HelperDemandService);

  createEmptyDemand(): HelperDemand {
    return {
      id: 0,
      serialNo: 0,
      type: '',
      people: null,
      location: '',
      condition: '',
      workContent: '',
      reason: '',
      priority: '普通',
      status: '上架',
      contact: '',
      phone: '',
      note: '',
      messageCount: 0,
      createdAt: '',
      publishedAt: '',
      expectedOffShelfAt: '',
    };
  }

  parseEditId(): { isEditMode: boolean; editId: number | null; notice?: string } {
    const rawId = this.route.snapshot.paramMap.get('id');

    if (rawId === null) {
      return { isEditMode: false, editId: null };
    }

    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      return {
        isEditMode: false,
        editId: null,
        notice: '編輯網址資料庫 id 不正確',
      };
    }

    return { isEditMode: true, editId: id };
  }

  async loadEditDemand(id: number): Promise<HelperFormLoadResult> {
    try {
      const target = await this.helperDemandService.getDemandById(id);

      if (!target) {
        return { ok: false, notice: '找不到這筆協力需求' };
      }

      const demand = structuredClone(target);
      return {
        ok: true,
        demand,
        originalLocation: demand.location.trim(),
      };
    } catch (error) {
      console.error('[HelperFormLogic] 載入協力者編輯資料失敗：', error);
      return { ok: false, notice: '載入協力需求失敗' };
    }
  }

  clampPeople(value: string | number | null): number | null {
    if (value === null || value === '') {
      return null;
    }

    const people = Number(value);
    return Number.isNaN(people) ? null : Math.min(500, Math.max(1, people));
  }

  collectInvalidFields(demand: HelperDemand): HelperFormField[] {
    const invalidFields: HelperFormField[] = [];

    if (!demand.type) {
      invalidFields.push('type');
    }
    if (!demand.people || demand.people < 1 || demand.people > 500) {
      invalidFields.push('people');
    }
    if (!demand.location.trim()) {
      invalidFields.push('location');
    }
    if (!demand.condition.trim()) {
      invalidFields.push('condition');
    }
    if (!demand.workContent.trim()) {
      invalidFields.push('workContent');
    }
    if (!demand.reason.trim()) {
      invalidFields.push('reason');
    }
    if (!demand.contact.trim()) {
      invalidFields.push('contact');
    }
    if (!demand.phone.trim()) {
      invalidFields.push('phone');
    }

    return invalidFields;
  }

  isFieldInvalid(demand: HelperDemand, field: HelperFormField, invalidFields: string[]): boolean {
    if (!invalidFields.includes(field)) {
      return false;
    }

    switch (field) {
      case 'type':
        return !demand.type;
      case 'people':
        return !demand.people || demand.people < 1 || demand.people > 500;
      case 'location':
        return !demand.location.trim();
      case 'condition':
        return !demand.condition.trim();
      case 'workContent':
        return !demand.workContent.trim();
      case 'reason':
        return !demand.reason.trim();
      case 'contact':
        return !demand.contact.trim();
      case 'phone':
        return !demand.phone.trim();
      default:
        return false;
    }
  }

  async getCoordinatesFromAddress(demand: HelperDemand): Promise<boolean> {
    const originalAddress = demand.location.trim().replace(/臺/g, '台');

    if (!originalAddress) {
      return false;
    }

    const withoutNumber = originalAddress.replace(/\d+(?:-\d+)?號.*$/, '').trim();
    const roadOnly = withoutNumber.replace(/(?:巷|弄).*/, '').trim();
    const roadMatch = withoutNumber.match(/^(.+?段)/);
    const searchAddresses: string[] = [];

    if (withoutNumber) {
      searchAddresses.push(withoutNumber);
    }
    if (roadOnly && !searchAddresses.includes(roadOnly)) {
      searchAddresses.push(roadOnly);
    }
    if (roadMatch && !searchAddresses.includes(roadMatch[1])) {
      searchAddresses.push(roadMatch[1]);
    }
    if (!searchAddresses.includes(originalAddress)) {
      searchAddresses.push(originalAddress);
    }

    for (const searchAddress of searchAddresses) {
      const point = await geocodeTaiwan(searchAddress);
      if (!point) {
        continue;
      }

      demand.latitude = point.latitude;
      demand.longitude = point.longitude;
      return true;
    }

    return false;
  }

  async save(
    demand: HelperDemand,
    options: { isEditMode: boolean; originalLocation: string }
  ): Promise<HelperFormSaveResult> {
    const invalidFields = this.collectInvalidFields(demand);
    if (invalidFields.length > 0) {
      return { ok: false, invalidFields };
    }

    try {
      const locationChanged = demand.location.trim() !== options.originalLocation;
      const hasCoordinates = Number.isFinite(demand.latitude) && Number.isFinite(demand.longitude);

      if (!options.isEditMode || locationChanged || !hasCoordinates) {
        const coordinatesFound = await this.getCoordinatesFromAddress(demand);
        if (!coordinatesFound) {
          return {
            ok: false,
            notice: '無法取得服務地點的座標，請確認地點是否正確後再試一次。',
          };
        }
      }

      if (options.isEditMode) {
        const savedDemand = await this.helperDemandService.updateDemand(demand);
        return {
          ok: true,
          demand: savedDemand,
          successMessage: '協力需求修改成功！',
        };
      }

      const newDemand: HelperDemand = {
        ...demand,
        id: 0,
        serialNo: this.getNextDemandSerialNo(),
        createdAt: new Date().toISOString(),
        status: demand.status,
        messageCount: 0,
      };

      const savedDemand = await this.helperDemandService.addDemand(newDemand);
      return {
        ok: true,
        demand: savedDemand,
        successMessage: '協力需求發布成功！',
      };
    } catch (error) {
      console.error('儲存協力需求失敗：', error);
      return { ok: false, notice: '儲存失敗，請稍後再試' };
    }
  }

  async navigateAway(): Promise<void> {
    await this.router.navigate(['/agency/disaster']);
  }

  private getNextDemandSerialNo(): number {
    const demands = this.helperDemandService.getDemands();
    const maxSerialNo = demands.reduce((currentMax, demand) => Math.max(currentMax, Number(demand.serialNo ?? 0)), 0);
    return maxSerialNo + 1;
  }
}
