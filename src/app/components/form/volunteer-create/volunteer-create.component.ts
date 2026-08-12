import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  VolunteerDemandService,
  VolunteerDemand
} from '../../../components/core/services/volunteer-demand.service';

@Component({
  selector: 'app-volunteer-create',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './volunteer-create.component.html',
  styleUrls: ['./volunteer-create.component.scss']
})
export class VolunteerCreateComponent {

  // 是否為編輯模式
  isEditMode: boolean = false;

  // 有錯誤的欄位
  invalidFields: string[] = [];

  // 志工需求資料
  demand: VolunteerDemand = {
    id: 0,
    type: '',
    people: null,
    date: '',
    location: '',
    condition: '',
    workContent: '',
    reason: '',
    priority: '普通',
    status:'已上架',
    contact: '',
    phone: '',
    note: ''
  };

  constructor(
    private router: Router,
    private volunteerDemandService: VolunteerDemandService
  ) {}

  // ==========================================
  // 判斷欄位是否需要紅框
  // ==========================================
  isInvalid(field: string): boolean {

    // 這個欄位沒有被標記錯誤
    if (!this.invalidFields.includes(field)) {
      return false;
    }

    // 如果使用者已經輸入，就取消紅框
    switch (field) {

      case 'type':
        return !this.demand.type;

      case 'people':
        return !this.demand.people || this.demand.people < 1;

      case 'date':
        return !this.demand.date;

      case 'location':
        return !this.demand.location.trim();

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
  // 發布需求
  // ==========================================
  onPublish(): void {

    // 先清除之前的錯誤
    this.invalidFields = [];

    // ==========================================
    // 必填欄位檢查
    // ==========================================

    if (!this.demand.type) {
      this.invalidFields.push('type');
    }

    if (!this.demand.people || this.demand.people < 1) {
      this.invalidFields.push('people');
    }

    if (!this.demand.date) {
      this.invalidFields.push('date');
    }

    // ==========================================
    // 其他必填欄位
    // ==========================================

    if (!this.demand.location.trim()) {
      this.invalidFields.push('location');
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
    // 有欄位沒填
    // ==========================================

    if (this.invalidFields.length > 0) {

      setTimeout(() => {

        const firstInvalid = document.querySelector(
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
    // 全部填寫完成
    // ==========================================

    const newDemand: VolunteerDemand = {
      ...this.demand,

      // 產生唯一 ID
      id: Date.now(),

      // 發布時間
      createdAt: new Date().toISOString(),

      // 預設上架
      status: '已上架',

      // 預設沒有留言
      messageCount: 0
    };

    // 儲存志工需求
    this.volunteerDemandService.addDemand(newDemand);

    console.log('志工需求：', newDemand);

    alert('志工需求發布成功！');

    // 回到急難需求頁面
    this.router.navigate(['/agency/disaster']);
  }

  // ==========================================
  // 取消
  // ==========================================

  onCancel(): void {
    this.router.navigate(['/agency/disaster']);
  }
}
