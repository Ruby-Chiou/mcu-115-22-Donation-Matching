import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // ← 新增這行
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { DisasterDemandService } from '../disaster-demand.service';

@Component({
  selector: 'app-agency-disaster-edit',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './agency-disaster-edit.component.html',
  styleUrl: './agency-disaster-edit.component.scss',
})
export class AgencyDisasterEditComponent implements OnInit {
  demand: any = {};

  // 完好度選項

  conditionList: string[] = ['全新', '二手', '有擦痕', '過期', '毀損'];

  constructor(
    private route: ActivatedRoute,

    private service: DisasterDemandService,

    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    const data = this.service.getDemands().find((item) => item.id === id);

    if (data) {
      this.demand = {
        ...data,

        // 防止舊資料沒有欄位

        conditions: Array.isArray(data.conditions) ? [...data.conditions] : [],

        customCondition: data.customCondition || '',

        unit: data.unit || '',

        amountDescription: data.amountDescription || '',
      };
    }
  }

  // 完好度勾選

  toggleCondition(condition: string) {
    if (!this.demand.conditions) {
      this.demand.conditions = [];
    }

    const index = this.demand.conditions.indexOf(condition);

    if (index !== -1) {
      this.demand.conditions.splice(index, 1);
    } else {
      this.demand.conditions.push(condition);
    }
  }

  save() {
    // 清除錯誤

    this.demand.itemError = false;

    this.demand.amountError = false;

    this.demand.reasonError = false;

    this.demand.descriptionError = false;

    this.demand.addressError = false;

    this.demand.phoneError = false;

    // 必填檢查

    if (!this.demand.item) {
      this.demand.itemError = true;
    }

    if (!this.demand.amount) {
      this.demand.amountError = true;
    }

    if (!this.demand.reason) {
      this.demand.reasonError = true;
    }

    if (!this.demand.description) {
      this.demand.descriptionError = true;
    }

    if (!this.demand.address) {
      this.demand.addressError = true;
    }

    if (!this.demand.phone) {
      this.demand.phoneError = true;
    }

    const invalid =
      this.demand.itemError ||
      this.demand.amountError ||
      this.demand.reasonError ||
      this.demand.descriptionError ||
      this.demand.addressError ||
      this.demand.phoneError;

    if (invalid) {
      setTimeout(() => {
        const firstErrorElement = document.querySelector('.invalid') as HTMLElement | null;

        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({
            behavior: 'smooth',

            block: 'center',
          });

          firstErrorElement.focus();
        }
      }, 0);

      return;
    }

    // 確保 conditions 存在

    if (!this.demand.conditions) {
      this.demand.conditions = [];
    }

    // 加入自訂完好度

    if (this.demand.customCondition && this.demand.customCondition.trim()) {
      const custom = this.demand.customCondition.trim();

      if (!this.demand.conditions.includes(custom)) {
        this.demand.conditions.push(custom);
      }
    }

    // 更新資料

    this.service.updateDemand(this.demand);

    this.router.navigate(['/agency/disaster-post']);
  }
}
