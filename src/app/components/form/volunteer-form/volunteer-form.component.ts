import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VolunteerDemandService } from '../../../core/services/volunteer-demand.service';
import { VolunteerDemand } from '../../../models/agency/vdemand';

@Component({
  selector: 'app-volunteer-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './volunteer-form.component.html',
  styleUrls: ['./volunteer-form.component.scss']
})
export class VolunteerFormComponent implements OnInit {

  // 是否為編輯模式
  isEditMode: boolean = false;

  // 是否顯示取消編輯確認視窗
  showCancelModal = false;

  // 是否顯示儲存成功視窗
  showSuccessModal = false;

  successMessage = '';

  // 編輯中的需求 ID
  editId: number | null = null;

  // 有錯誤的欄位
  invalidFields: string[] = [];

  // 志工需求資料
  demand: VolunteerDemand = {
    id: 0,
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
    note: ''
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private volunteerDemandService: VolunteerDemandService
  ) {}

  ngOnInit(): void {

    // 從網址取得 id
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.editId = Number(id);
      this.isEditMode = true;

      this.loadEditDemand(this.editId);
    }
  }

  // ==========================================
  // 載入要編輯的資料
  // ==========================================

  loadEditDemand(id: number): void {

    const demands = this.volunteerDemandService.getDemands();

    const target = demands.find(
      demand => demand.id === id
    );

    if (!target) {
      alert('找不到這筆志工需求');
      this.router.navigate(['/agency/disaster']);
      return;
    }

    // 深拷貝
    this.demand = JSON.parse(
      JSON.stringify(target)
    );

    console.log('目前編輯資料：', this.demand);
  }

  // ==========================================
  // 判斷欄位是否需要紅框
  // ==========================================

  isInvalid(field: string): boolean {

    if (!this.invalidFields.includes(field)) {
      return false;
    }

    switch (field) {

      case 'type':
        return !this.demand.type;

      case 'people':
        return !this.demand.people ||
               this.demand.people < 1;

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

  // ==========================================
  // 儲存 / 發布
  // ==========================================

  onPublish(): void {

    // 清除之前錯誤
    this.invalidFields = [];

    // ==========================================
    // 必填欄位檢查
    // ==========================================

    if (!this.demand.type) {
      this.invalidFields.push('type');
    }

    if (
      !this.demand.people ||
      this.demand.people < 1
    ) {
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

    // ==========================================
    // 有欄位錯誤
    // ==========================================

    if (this.invalidFields.length > 0) {

      setTimeout(() => {

        const firstInvalid =
          document.querySelector(
            '.invalid-field'
          ) as HTMLElement;

        if (firstInvalid) {

          firstInvalid.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });

          firstInvalid.focus();
        }

      }, 0);

      return;
    }

    // ==========================================
    // 編輯模式
    // ==========================================

    if (this.isEditMode) {

      this.volunteerDemandService.updateDemand(
        this.demand
      );

      console.log(
        '修改後的志工需求：',
        this.demand
      );

      this.successMessage = '志工需求修改成功！';
      this.showSuccessModal = true;

      return;
    }

    // ==========================================
    // 新增模式
    // ==========================================

    const newDemand: VolunteerDemand = {
      ...this.demand,

      id: this.getNextDemandId(),

      createdAt:
        new Date().toISOString(),

      status: this.demand.status,

      messageCount: 0
    };

    this.volunteerDemandService.addDemand(
      newDemand
    );

    console.log(
      '新增志工需求：',
      newDemand
    );

    this.successMessage = '志工需求發布成功！';
    this.showSuccessModal = true;
  }

  private getNextDemandId(): number {
    const demands = this.volunteerDemandService.getDemands();
    const maxId = demands.reduce((currentMax, demand) => Math.max(currentMax, demand.id), 0);

    return maxId + 1;
  }

  // ==========================================
  // 取消
  // ==========================================

  onCancel(): void {

    if (this.isEditMode) {

      this.showCancelModal = true;

      return;
    }

    this.router.navigate([
      '/agency/disaster'
    ]);
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
