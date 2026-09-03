import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VolunteerDemandService } from '../../../../core/services/agency-volunteer-demand/volunteer-demand.service';
import { VolunteerDemand } from '../../../../models/agency/volunteer-demand';

// 讓元件專用的 UI 表單介面繼承原始的 VolunteerDemand，並擴充驗證屬性
export type VolunteerDemandItem = VolunteerDemand & {
  selected?: boolean;
  typeError?: boolean;
  peopleError?: boolean;
  locationError?: boolean;
  conditionError?: boolean;
  workContentError?: boolean;
  reasonError?: boolean;
  contactError?: boolean;
  phoneError?: boolean;
};

@Component({
  selector: 'app-volunteer-batch-edit',
  standalone: true,
  imports: [CommonModule, FormsModule], // 補上 CommonModule 以支援 *ngFor/*ngIf
  templateUrl: './volunteer-batch-edit.component.html',
  styleUrl: './volunteer-batch-edit.component.scss',
})
export class VolunteerBatchEditComponent implements OnInit {
  editDemands: VolunteerDemandItem[] = [];

  constructor(
    private volunteerDemandService: VolunteerDemandService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDataFromService();
  }

  // 從 Service 載入資料
  loadDataFromService(): void {
    const storedData = localStorage.getItem('editVolunteerDemands');

    if (!storedData) {
      alert('沒有找到要編輯的志工需求');
      this.router.navigate(['/agency/disaster']);
      return;
    }

    try {
      const selectedDemands: VolunteerDemand[] = JSON.parse(storedData);

      this.editDemands = JSON.parse(JSON.stringify(selectedDemands));

      console.log('批次編輯資料：', this.editDemands);
    } catch (error) {
      console.error('讀取批次編輯資料失敗：', error);
      alert('讀取編輯資料失敗');

      this.router.navigate(['/agency/disaster']);
    }
  }

  saveAll(): void {
    // 找出有勾選的資料
    const selectedDemands = this.editDemands.filter((demand) => demand.selected);

    // 沒有勾選
    if (selectedDemands.length === 0) {
      alert('請先勾選要編輯的志工需求！');
      return;
    }

    let isValid = true;

    // 只驗證「勾選」的資料
    selectedDemands.forEach((demand) => {
      demand.typeError = !demand.type;

      demand.peopleError = demand.people === null || demand.people === undefined || demand.people <= 0;

      demand.locationError = !demand.location?.trim();

      demand.conditionError = !demand.condition;

      demand.workContentError = !demand.workContent?.trim();

      demand.reasonError = !demand.reason?.trim();

      demand.contactError = !demand.contact?.trim();

      demand.phoneError = !demand.phone?.trim();

      // 只要有一個錯誤
      if (
        demand.typeError ||
        demand.peopleError ||
        demand.locationError ||
        demand.conditionError ||
        demand.workContentError ||
        demand.reasonError ||
        demand.contactError ||
        demand.phoneError
      ) {
        isValid = false;
      }
    });

    // 驗證失敗
    if (!isValid) {
      alert('請檢查紅框標示的必填欄位是否填寫完整！');
      return;
    }

    // 只處理勾選的資料
    const cleanDemands: VolunteerDemand[] = selectedDemands.map(
      ({
        selected,
        typeError,
        peopleError,
        locationError,
        conditionError,
        workContentError,
        reasonError,
        contactError,
        phoneError,
        ...rest
      }) => rest
    );

    // 只更新勾選的資料
    this.volunteerDemandService.updateBatchDemands(cleanDemands);
    // 重新載入資料
    this.loadDataFromService();
    this.router.navigate(['/agency/disaster']);
  }

  cancel(): void {
    this.router.navigate(['/agency/disaster']);
  }
}
