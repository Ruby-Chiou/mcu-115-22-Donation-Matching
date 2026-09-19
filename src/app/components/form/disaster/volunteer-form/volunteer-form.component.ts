import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { VolunteerDemandService } from '../../../../core/services/agency-volunteer-demand/volunteer-demand.service';
import { VolunteerDemand } from '../../../../models/agency/volunteer-demand';

@Component({
  selector: 'app-volunteer-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './volunteer-form.component.html',
  styleUrls: ['./volunteer-form.component.scss'],
})
export class VolunteerFormComponent implements OnInit {
  isEditMode = false;

  showCancelModal = false;
  showSuccessModal = false;
  successMessage = '';

  /*
   * editId 是 Supabase 資料庫主鍵 id。
   * 不要把 serialNo 放在這裡。
   */
  editId: number | null = null;

  invalidFields: string[] = [];

  demand: VolunteerDemand = {
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

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly volunteerDemandService: VolunteerDemandService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const rawId = this.route.snapshot.paramMap.get('id');

    /*
     * 新增頁：/agency/volunteer-form
     * 沒有 id 是正常狀況，不要當錯誤。
     */
    if (rawId === null) {
      this.isEditMode = false;
      this.editId = null;

      console.log('[VolunteerFormComponent] 新增模式');

      return;
    }

    const id = Number(rawId);

    if (!Number.isInteger(id) || id <= 0) {
      console.error('[VolunteerFormComponent] 編輯網址資料庫 id 不正確：', rawId);

      this.router.navigate(['/agency/disaster']);

      return;
    }

    this.isEditMode = true;
    this.editId = id;

    await this.loadEditDemand(id);
  }

  /*
   * 直接向 Supabase 以資料庫主鍵 id 查資料，
   * 因此編輯頁重整後仍可正常顯示。
   */
  async loadEditDemand(id: number): Promise<void> {
    try {
      const target = await this.volunteerDemandService.getDemandById(id);

      console.log('[VolunteerFormComponent] Service 回傳編輯資料：', target);

      if (!target) {
        alert('找不到這筆志工需求');

        this.router.navigate(['/agency/disaster']);

        return;
      }

      /*
       * 深拷貝資料，避免使用者還沒按儲存就直接改到
       * Service 內快取的同一份物件。
       */
      this.demand = structuredClone(target);

      this.editId = this.demand.id;

      this.cdr.detectChanges();

      console.log('[VolunteerFormComponent] 目前編輯資料：', this.demand);
    } catch (error) {
      console.error('[VolunteerFormComponent] 載入志工編輯資料失敗：', error);

      alert('載入志工需求失敗');

      this.router.navigate(['/agency/disaster']);
    }
  }

  limitPeopleInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    const people = Number(input.value);

    if (people > 500) {
      input.value = '500';
      this.demand.people = 500;
    }
  }

  setPeople(value: string | number | null): void {
    if (value === null || value === '') {
      this.demand.people = null;

      return;
    }

    const people = Number(value);

    this.demand.people = Number.isNaN(people) ? null : Math.min(500, Math.max(1, people));
  }

  isInvalid(field: string): boolean {
    if (!this.invalidFields.includes(field)) {
      return false;
    }

    switch (field) {
      case 'type':
        return !this.demand.type;

      case 'people':
        return !this.demand.people || this.demand.people < 1 || this.demand.people > 500;

      case 'location':
        return !this.demand.location.trim();

      case 'condition':
        return !this.demand.condition.trim();

      case 'workContent':
        return !this.demand.workContent.trim();

      case 'reason':
        return !this.demand.reason.trim();

      case 'contact':
        return !this.demand.contact.trim();

      case 'phone':
        return !this.demand.phone.trim();

      default:
        return false;
    }
  }

  async onPublish(): Promise<void> {
    this.invalidFields = [];

    if (!this.demand.type) {
      this.invalidFields.push('type');
    }

    if (!this.demand.people || this.demand.people < 1 || this.demand.people > 500) {
      this.invalidFields.push('people');
    }

    if (!this.demand.location.trim()) {
      this.invalidFields.push('location');
    }

    if (!this.demand.condition.trim()) {
      this.invalidFields.push('condition');
    }

    if (!this.demand.workContent.trim()) {
      this.invalidFields.push('workContent');
    }

    if (!this.demand.reason.trim()) {
      this.invalidFields.push('reason');
    }

    if (!this.demand.contact.trim()) {
      this.invalidFields.push('contact');
    }

    if (!this.demand.phone.trim()) {
      this.invalidFields.push('phone');
    }

    if (this.invalidFields.length > 0) {
      setTimeout(() => {
        const firstInvalid = document.querySelector('.invalid-field') as HTMLElement | null;

        if (firstInvalid) {
          firstInvalid.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });

          firstInvalid.focus();
        }
      }, 0);

      return;
    }

    try {
      if (this.isEditMode) {
        /*
         * this.demand.id 是從 Supabase 載入時帶回的資料庫 id。
         */
        const savedDemand = await this.volunteerDemandService.updateDemand(this.demand);

        this.demand = savedDemand;

        console.log('修改後的志工需求：', savedDemand);

        this.successMessage = '志工需求修改成功！';

        this.showSuccessModal = true;

        return;
      }

      const newDemand: VolunteerDemand = {
        ...this.demand,

        /*
         * 新增時 id 不交給前端設定，
         * Supabase 會自動產生真正的資料庫主鍵。
         */
        id: 0,
        /*
         * serialNo 只作為畫面需求編號。
         */
        serialNo: this.getNextDemandSerialNo(),

        createdAt: new Date().toISOString(),

        status: this.demand.status,

        messageCount: 0,
      };

      const savedDemand = await this.volunteerDemandService.addDemand(newDemand);

      console.log('新增志工需求：', savedDemand);

      this.successMessage = '志工需求發布成功！';

      this.showSuccessModal = true;
    } catch (error) {
      console.error('儲存志工需求失敗：', error);

      alert('儲存失敗，請稍後再試');
    }
  }

  /*
   * 只計算畫面顯示用的流水號。
   */
  private getNextDemandSerialNo(): number {
    const demands = this.volunteerDemandService.getDemands();

    const maxSerialNo = demands.reduce((currentMax, demand) => Math.max(currentMax, Number(demand.serialNo ?? 0)), 0);

    return maxSerialNo + 1;
  }

  onCancel(): void {
    if (this.isEditMode) {
      this.showCancelModal = true;

      return;
    }

    this.router.navigate(['/agency/disaster']);
  }

  closeCancelModal(): void {
    this.showCancelModal = false;
  }

  confirmCancel(): void {
    this.showCancelModal = false;

    this.router.navigate(['/agency/disaster']);
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;

    this.router.navigate(['/agency/disaster']);
  }
}
