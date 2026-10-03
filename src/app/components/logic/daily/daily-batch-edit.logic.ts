import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { DailyDemandService } from '../../../core/services/agency-daily-demand/daily-demand.service';
import { EditableDailyDemand } from '../../../models/agency/daily-demand';
import { DailyBatchEditLogicBase, DailyTextField } from './daily-batch-edit-logic-base';

export type { DailyTextField } from './daily-batch-edit-logic-base';

@Injectable()
export class DailyBatchEditLogic extends DailyBatchEditLogicBase {
  constructor(service: DailyDemandService, router: Router, http: HttpClient) {
    super(service, router, http);
  }

  init(): void {
    const data = localStorage.getItem('editDemands');

    if (!data) {
      return;
    }

    this.editDemands = JSON.parse(data).map((item: any) => ({
      ...item,
      serviceTargets: this.convertServiceTargets(item.serviceTargets),
      customServiceTargets: item.customServiceTargets?.length ? item.customServiceTargets : [''],
      conditions: item.conditions || {
        全新: '',
        二手: '',
        有擦痕: '',
        過期: '',
        毀損: '',
      },
      customConditions: item.customConditions?.length ? item.customConditions : [''],
      unit: item.unit || '',
      amountDescription: item.amountDescription || '',
      status: item.status ?? '隱藏',
      remaining: item.remaining ?? item.amount,
      createdAt: item.createdAt,
      brand: item.brand || '',
      category: item.category || '',
      receiveMethod: item.receiveMethod || {
        寄送: true,
        面交: false,
      },
      recipient: item.recipient ?? '',
      address: item.address ?? '',
      latitude: item.latitude,
      longitude: item.longitude,
      phone: item.phone ?? '',
      contactTimeWeekday: item.contactTimeWeekday ?? false,
      contactTimeWeekend: item.contactTimeWeekend ?? false,
      contactTimeMorning: item.contactTimeMorning ?? false,
      contactTimeAfternoon: item.contactTimeAfternoon ?? false,
      contactTimeEvening: item.contactTimeEvening ?? false,
      contactTimeSeparate: item.contactTimeSeparate ?? false,
      contactTimeWeekdayMorning: item.contactTimeWeekdayMorning ?? false,
      contactTimeWeekdayAfternoon: item.contactTimeWeekdayAfternoon ?? false,
      contactTimeWeekdayEvening: item.contactTimeWeekdayEvening ?? false,
      contactTimeWeekendMorning: item.contactTimeWeekendMorning ?? false,
      contactTimeWeekendAfternoon: item.contactTimeWeekendAfternoon ?? false,
      contactTimeWeekendEvening: item.contactTimeWeekendEvening ?? false,
      serviceTargetDescription: item.serviceTargetDescription ?? '',
      conditionDescription: item.conditionDescription ?? '',
    }));

    this.editDemands.forEach((item) => {
      this.originalStatusMap[item.serialNo] = item.status ?? '隱藏';

      this.originalOffShelfReasonMap[item.serialNo] = item.offShelfReason;

      this.imageFiles[item.serialNo] = [];

      this.imagePreviewUrls[item.serialNo] = [...(item.image ?? [])];
    });

    console.log('批次修改資料:', this.editDemands);
  }

  onStatusClick(event: MouseEvent, demand: EditableDailyDemand, newStatus: EditableDailyDemand['status']): void {
    if (newStatus === '上架' && this.isManualOffShelf(demand)) {
      event.preventDefault();
      event.stopPropagation();

      demand.status = '下架';
      this.pendingDemand = demand;
      this.showOnShelfWarning = true;

      return;
    }

    this.onStatusSelect(demand, newStatus);
  }

  onStatusSelect(demand: EditableDailyDemand, newStatus: EditableDailyDemand['status']): void {
    const wasManualOffShelf =
      this.originalStatusMap[demand.serialNo] === '下架' && this.originalOffShelfReasonMap[demand.serialNo] === 'manual';

    const currentlyManualOffShelf = demand.status === '下架' && demand.offShelfReason === 'manual';

    if (wasManualOffShelf || currentlyManualOffShelf) {
      if (newStatus === '上架') {
        demand.status = '下架';
        this.pendingDemand = demand;
        this.showOnShelfWarning = true;
        return;
      }

      demand.status = '下架';
      return;
    }

    if (newStatus === '上架') {
      demand.status = '上架';
      return;
    }

    if (newStatus === '隱藏') {
      demand.status = '隱藏';
      demand.publishedAt = undefined;
      demand.expectedOffShelfAt = undefined;
      demand.offShelfReason = undefined;
      return;
    }

    if (newStatus === '下架') {
      if (demand.status === '下架') {
        return;
      }

      this.pendingDemand = demand;
      demand.status = this.originalStatusMap[demand.serialNo] ?? '隱藏';

      this.showOffShelfWarning = true;
    }
  }

  cancelManualOffShelf(): void {
    if (!this.pendingDemand) {
      this.showOffShelfWarning = false;
      return;
    }

    const demand = this.pendingDemand;

    demand.status = this.originalStatusMap[demand.serialNo] ?? '隱藏';

    demand.offShelfReason = this.originalOffShelfReasonMap[demand.serialNo];

    this.showOffShelfWarning = false;
    this.pendingDemand = null;
  }

  hideInsteadOfOffShelf(): void {
    if (!this.pendingDemand) {
      this.showOffShelfWarning = false;
      return;
    }

    const demand = this.pendingDemand;

    demand.status = '隱藏';
    demand.publishedAt = undefined;
    demand.expectedOffShelfAt = undefined;
    demand.offShelfReason = undefined;

    this.showOffShelfWarning = false;
    this.pendingDemand = null;
  }

  confirmManualOffShelf(): void {
    if (!this.pendingDemand) {
      this.showOffShelfWarning = false;
      return;
    }

    const demand = this.pendingDemand;

    const now = new Date();

    demand.status = '下架';
    demand.offShelfReason = 'manual';
    demand.expectedOffShelfAt = now.toISOString();

    this.showOffShelfWarning = false;
    this.pendingDemand = null;
  }

  closeOnShelfWarning(): void {
    this.showOnShelfWarning = false;

    if (this.pendingDemand) {
      this.pendingDemand.status = '下架';
      this.pendingDemand.offShelfReason = 'manual';
    }

    this.pendingDemand = null;
  }

  async saveAll(): Promise<void> {
    try {
      this.editDemands.forEach((item) => {
        item.itemError = false;
        item.amountError = false;
        item.unitError = false;
        item.reasonError = false;
        item.descriptionError = false;
        item.phoneError = false;
        item.remainingError = false;
        item.categoryError = false;
        item.serviceTargetError = false;
        item.invalidReceiveInfo = false;

        if (!item.item) {
          item.itemError = true;
        }

        if (!item.amount || isNaN(Number(item.amount))) {
          item.amountError = true;
        }

        if (!item.unit || !item.unit.trim()) {
          item.unitError = true;
        }

        if (item.remaining === undefined || item.remaining === null) {
          item.remainingError = true;
        }

        if (Number(item.remaining) < 0) {
          item.remainingError = true;
        }

        if (!item.reason) {
          item.reasonError = true;
        }

        if (!item.description) {
          item.descriptionError = true;
        }

        if (!item.category) {
          item.categoryError = true;
        }

        const hasReceiveMethod = item.receiveMethod?.寄送 || item.receiveMethod?.面交;

        if (!hasReceiveMethod || !item.recipient || !item.address) {
          item.invalidReceiveInfo = true;
        }

        if (!item.phone) {
          item.phoneError = true;
        }

        const hasServiceTarget =
          (Array.isArray(item.serviceTargets) && item.serviceTargets.length > 0) ||
          item.customServiceTargets?.some((target: string) => target.trim() !== '');

        if (!hasServiceTarget) {
          item.serviceTargetError = true;
        }
      });

      const invalid = this.editDemands.some(
        (item) =>
          item.itemError ||
          item.amountError ||
          item.unitError ||
          item.reasonError ||
          item.descriptionError ||
          item.categoryError ||
          item.phoneError ||
          item.remainingError ||
          item.serviceTargetError ||
          item.invalidReceiveInfo
      );

      if (invalid) {
        this.scrollToFirstError();
        return;
      }

      const invalidManualOffShelf = this.editDemands.find((item) => {
        const originalStatus = this.originalStatusMap[item.serialNo];

        const originalOffShelfReason = this.originalOffShelfReasonMap[item.serialNo];

        const isOriginalManualOffShelf = originalStatus === '下架' && originalOffShelfReason === 'manual';

        const isCurrentManualOffShelf = item.status === '下架' && item.offShelfReason === 'manual';

        return item.status === '上架' && (isOriginalManualOffShelf || isCurrentManualOffShelf);
      });

      if (invalidManualOffShelf) {
        alert(`需求 A${invalidManualOffShelf.serialNo} 為使用者主動下架，無法重新上架。`);

        invalidManualOffShelf.status = '下架';

        return;
      }

      this.editDemands.forEach((item) => {
        if (!item.conditions) {
          item.conditions = {
            全新: '',
            二手: '',
            有擦痕: '',
            過期: '',
            毀損: '',
          };
        }
      });

      for (const item of this.editDemands) {
        item.customConditions = item.customConditions.filter((condition) => condition.trim() !== '');

        item.customServiceTargets = item.customServiceTargets.filter((target) => target.trim() !== '');

        if (item.customConditions.length === 0) {
          item.customConditions.push('');
        }

        if (item.customServiceTargets.length === 0) {
          item.customServiceTargets.push('');
        }

        item.serviceTargetDescription = this.buildServiceTargetDescription(item);

        item.conditionDescription = this.buildConditionDescription(item);

        const originalStatus = this.originalStatusMap[item.serialNo] ?? item.status;

        const originalOffShelfReason = this.originalOffShelfReasonMap[item.serialNo];

        const now = new Date();

        const isOriginalManualOffShelf = originalStatus === '下架' && originalOffShelfReason === 'manual';

        const isCurrentManualOffShelf = item.status === '下架' && item.offShelfReason === 'manual';

        if (item.status === '上架' && (isOriginalManualOffShelf || isCurrentManualOffShelf)) {
          alert(`需求 A${item.serialNo} 為使用者主動下架，無法重新上架。`);

          item.status = '下架';
          return;
        }

        if (item.status === '上架') {
          if (originalStatus !== '上架') {
            item.publishedAt = now.toISOString();

            if (!item.createdAt) {
              item.createdAt = now.toISOString();
            }
          }

          if (!item.createdAt) {
            item.createdAt = now.toISOString();
          }

          if (item.publishedAt) {
            item.expectedOffShelfAt = this.calculateExpectedOffShelfDate(new Date(item.publishedAt), item.priority);
          }

          item.offShelfReason = undefined;
        } else if (item.status === '隱藏') {
          item.publishedAt = undefined;

          item.expectedOffShelfAt = undefined;

          item.offShelfReason = undefined;
        } else if (item.status === '下架') {
          if (!item.offShelfReason) {
            item.offShelfReason = 'manual';
          }

          if (!item.expectedOffShelfAt) {
            item.expectedOffShelfAt = now.toISOString();
          }
        }

        const addressSuccess = await this.getCoordinatesFromAddress(item.address, item);

        if (!addressSuccess) {
          alert(`需求 A${item.serialNo} 的地址無法找到位置，請確認地址是否正確。`);

          return;
        }

        const files = this.imageFiles[item.serialNo] || [];

        item.image = [];
        item.imageFileNames = [];

        for (const file of files) {
          const base64 = await this.fileToBase64(file);

          item.image.push(base64);
          item.imageFileNames.push(file.name);
        }

        await this.service.updateDemand(item);
      }

      localStorage.removeItem('editDemands');

      await this.router.navigate(['/agency/daily'], {
        queryParams: {
          refresh: Date.now(),
        },
      });
    } catch (error) {
      console.error('批次修改日常物資需求失敗：', error);

      alert('批次修改失敗，請確認網路或 Supabase 權限後再試。');
    }
  }

  cancel(): void {
    localStorage.removeItem('editDemands');

    this.router.navigate(['/agency/daily']);
  }
}
