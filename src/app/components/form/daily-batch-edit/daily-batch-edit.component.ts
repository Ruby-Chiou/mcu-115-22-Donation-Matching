import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DailyDemandService } from '../../../core/services/daily-demand.service';
import { EditableDailyDemand } from '../../../models/agency/daily-demand';
import { ImagePreviewComponent } from '../../modal/image-preview/image-preview.component';

@Component({
  selector: 'app-daily-batch-edit',
  imports: [CommonModule, FormsModule, ImagePreviewComponent],
  templateUrl: './daily-batch-edit.component.html',
  styleUrls: ['./daily-batch-edit-A.component.scss', './daily-batch-edit-B.component.scss', './daily-batch-edit-C.component.scss'],
})
export class DailyBatchEditComponent implements OnInit {
  editDemands: EditableDailyDemand[] = [];

  // 圖片
  imageFiles: { [id: number]: File[] } = {};
  imagePreviewUrls: { [id: number]: string[] } = {};

  showImagePreview = false;
  previewImage = '';
  previewImageName = '';

  constructor(
    private service: DailyDemandService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  categoryDropdownIndex: number | null = null;

  categoryOptions: NonNullable<EditableDailyDemand['category']>[] = [
    '食品與飲用水',
    '衣物與保暖用品',
    '醫療與照護用品',
    '清潔與衛生用品',
    '嬰幼兒用品',
    '長者與身心障礙用品',
    '女性生理用品',
    '寵物與動物用品',
    '防災與照明用品',
    '通訊與求救用品',
    '生活與炊事用品',
    '居住安置與修繕用品',
    '其他',
  ];

  ngOnInit() {
    const data = localStorage.getItem('editDemands');

    if (data) {
      this.editDemands = JSON.parse(data).map((item: any) => ({
        ...item,

        // 服務對象初始化（相容舊資料）
        serviceTargets: item.serviceTargets || {
          老人: false,
          嬰幼兒: false,
          孩童: false,
          青少年: false,
          身障: false,
          貧困: false,
          重症照護: false,
          動物: false,
          無家者: false,
        },

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
        status: item.status ?? '上架',
        remaining: item.remaining ?? item.amount,
        createdAt: item.createdAt,
        brand: item.brand || '',
        category: item.category || '',
        receiveMethod: item.receiveMethod || {
          寄送: true,
          面交: false,
        },
        recipient: item.recipient ?? '',
      }));
      this.editDemands.forEach((item) => {
        this.imageFiles[item.id] = [];

        Promise.all(
          (item.image ?? []).map((image: string, index: number) => {
            const fileName = item.imageFileNames?.[index] ?? `物資圖片${index + 1}.png`;

            return this.base64ToFile(image, fileName);
          })
        ).then((files) => {
          this.imageFiles[item.id] = files;

          // 預先建立圖片預覽 URL
          this.imagePreviewUrls[item.id] = files.map((file) => URL.createObjectURL(file));

          this.cdr.detectChanges();
        });
      });
    }
    console.log('批次修改資料:', this.editDemands);
  }

  async base64ToFile(base64: string, fileName: string): Promise<File> {
    const response = await fetch(base64);
    const blob = await response.blob();

    return new File([blob], fileName, {
      type: blob.type,
    });
  }

  onImageSelected(event: Event, demand: EditableDailyDemand) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    if (!this.imageFiles[demand.id]) {
      this.imageFiles[demand.id] = [];
    }

    const file = input.files[0];

    // 最多 5 張
    if (this.imageFiles[demand.id].length >= 5) {
      alert('最多只能上傳 5 張圖片');
      input.value = '';
      return;
    }

    // 限制 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不可超過 5MB');
      input.value = '';
      return;
    }

    // 加入圖片清單
    this.imageFiles[demand.id].push(file);

    if (!this.imagePreviewUrls[demand.id]) {
      this.imagePreviewUrls[demand.id] = [];
    }

    this.imagePreviewUrls[demand.id].push(URL.createObjectURL(file));

    // 讀取圖片
    const reader = new FileReader();

    reader.onload = () => {
      if (!demand.image) {
        demand.image = [];
      }

      if (!demand.imageFileNames) {
        demand.imageFileNames = [];
      }

      demand.image.push(reader.result as string);
      demand.imageFileNames.push(file.name);
    };

    reader.readAsDataURL(file);

    // 清空 input
    input.value = '';
  }

  removeImage(demand: EditableDailyDemand, index: number) {
    const urls = this.imagePreviewUrls[demand.id];

    if (urls?.[index]) {
      URL.revokeObjectURL(urls[index]);
      urls.splice(index, 1);
    }

    if (this.imageFiles[demand.id]) {
      this.imageFiles[demand.id].splice(index, 1);
    }

    if (demand.image) {
      demand.image.splice(index, 1);
    }

    if (demand.imageFileNames) {
      demand.imageFileNames.splice(index, 1);
    }
  }

  // 限制剩餘需求最高只能填到需求數量
  onRemainingChange(demand: any) {
    if (demand.amount !== undefined && demand.amount !== null && demand.amount !== '') {
      const maxAmount = Number(demand.amount);
      const currentRemaining = Number(demand.remaining);

      if (!isNaN(maxAmount) && !isNaN(currentRemaining)) {
        if (currentRemaining > maxAmount) {
          demand.remaining = maxAmount;
        }
      }
    }
  }

  limitNumberLength(event: Event, demand: any, field: 'amount' | 'remaining') {
    const input = event.target as HTMLInputElement;

    input.value = input.value.replace(/[^0-9]/g, '');

    if (input.value.length > 10) {
      input.value = input.value.slice(0, 10);
    }

    const value = input.value ? Number(input.value) : null;

    if (field === 'amount') {
      demand.amount = value;

      // 需求數量變更時，剩餘需求同步更新
      demand.remaining = value;
    }

    if (field === 'remaining') {
      if (value !== null && demand.amount !== null && value > demand.amount) {
        demand.remaining = demand.amount;
        input.value = demand.amount.toString();
      } else {
        demand.remaining = value;
      }
    }
  }

  openImagePreview(demand: EditableDailyDemand, index: number): void {
    const files = this.imageFiles[demand.id] || [];
    const previewUrls = this.imagePreviewUrls[demand.id] || [];

    const file = files[index];
    const previewUrl = previewUrls[index];

    if (!file || !previewUrl) {
      return;
    }

    this.previewImage = previewUrl;
    this.previewImageName = file.name;
    this.showImagePreview = true;
  }

  closeImagePreview(): void {
    this.showImagePreview = false;
    this.previewImage = '';
    this.previewImageName = '';
  }

  saveAll() {
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

      // 接收方式檢查
      const hasReceiveMethod = item.receiveMethod?.寄送 || item.receiveMethod?.面交;

      if (!hasReceiveMethod || !item.recipient || !item.address) {
        item.invalidReceiveInfo = true;
      }

      // 聯絡電話檢查
      if (!item.phone) {
        item.phoneError = true;
      }

      // 服務對象檢查
      const hasServiceTarget =
        Object.values(item.serviceTargets || {}).some((value: any) => value) ||
        item.customServiceTargets?.some((target: string) => target.trim());

      if (!hasServiceTarget) {
        item.serviceTargetError = true;
      }
    });

    // =========================
    // 判斷是否有錯誤
    // =========================
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

    // 清除空白自訂欄位
    this.editDemands.forEach((item) => {
      item.customConditions = item.customConditions.filter((condition) => condition.trim() !== '');
      item.customServiceTargets = item.customServiceTargets.filter((target) => target.trim() !== '');

      // 至少保留一個輸入框
      if (item.customConditions.length === 0) {
        item.customConditions.push('');
      }
      if (item.customServiceTargets.length === 0) {
        item.customServiceTargets.push('');
      }

      // 上架 / 下架 都需要發布時間
      if ((item.status === '上架' || item.status === '下架') && !item.createdAt) {
        item.createdAt = new Date().toISOString();
      }

      // 隱藏代表尚未發布，清除發布時間
      if (item.status === '隱藏') {
        item.createdAt = undefined;
      }

      this.service.updateDemand(item);
    });

    localStorage.removeItem('editDemands');
    this.router.navigate(['/agency/daily']);
  }

  scrollToFirstError() {
    setTimeout(() => {
      const firstErrorElement = document.querySelector('.invalid, .invalid-box') as HTMLElement | null;

      if (firstErrorElement) {
        const top = firstErrorElement.getBoundingClientRect().top + window.scrollY - 120;

        window.scrollTo({
          top,
          behavior: 'smooth',
        });
      }
    }, 100);
  }

  // 其他服務對象動態增減
  addCustomServiceTarget(demand: any) {
    if (demand.customServiceTargets.length < 5) {
      demand.customServiceTargets.push('');
    }
  }

  removeCustomServiceTarget(demand: any, index: number) {
    if (demand.customServiceTargets.length > 1) {
      demand.customServiceTargets.splice(index, 1);
    }
  }

  // 接受物資狀態切換
  toggleCondition(demand: EditableDailyDemand, key: keyof EditableDailyDemand['conditions']) {
    const current = demand.conditions[key];

    if (current === '') {
      demand.conditions[key] = '接受';
    } else if (current === '接受') {
      demand.conditions[key] = '不接受';
    } else {
      demand.conditions[key] = '';
    }
  }

  // 顯示接受物資狀態圖示
  getConditionIcon(status: '接受' | '不接受' | '') {
    if (status === '接受') {
      return '✔';
    }

    if (status === '不接受') {
      return '✘';
    }

    return '―';
  }

  // 其他物品狀態動態增減
  addCustomCondition(demand: any) {
    if (demand.customConditions.length < 5) {
      demand.customConditions.push('');
    }
  }

  removeCustomCondition(demand: any, index: number) {
    demand.customConditions.splice(index, 1);
  }

  toggleCategoryDropdown(index: number): void {
    this.categoryDropdownIndex = this.categoryDropdownIndex === index ? null : index;
  }

  selectCategory(demand: EditableDailyDemand, category: NonNullable<EditableDailyDemand['category']>): void {
    demand.category = category;
    demand.categoryError = false;
    this.categoryDropdownIndex = null;
  }

  trackByIndex(index: number): number {
    return index;
  }

  cancel() {
    localStorage.removeItem('editDemands');
    this.router.navigate(['/agency/daily']);
  }
}
