import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DisasterDemandService } from '../disaster-demand.service';

@Component({
  selector: 'app-agency-disaster-create',
  imports: [FormsModule, RouterLink],
  templateUrl: './agency-disaster-create.component.html',
  styleUrl: './agency-disaster-create.component.scss',
})
export class AgencyDisasterCreateComponent {
  submitted = false;

  @ViewChild('itemInput')
  itemInput!: ElementRef;

  // 物品完好度選項
  conditionList: string[] = ['全新', '二手', '過期', '毀損', '有擦痕'];

  // 使用者勾選的狀態
  selectedConditions: string[] = [];

  demand = {
    item: '',

    amount: '',

    unit: '',

    amountDescription: '',

    reason: '',

    description: '',

    // 新增物品完好度
    conditions: [] as string[],

    // 自訂狀態
    customCondition: '',

    priority: '普通',

    address: '',

    phone: '',

    note: '',
  };

  constructor(
    private disasterDemandService: DisasterDemandService,
    private router: Router
  ) {}

  // 勾選物品狀態
  toggleCondition(condition: string) {
    const index = this.selectedConditions.indexOf(condition);

    if (index > -1) {
      // 已存在 → 移除

      this.selectedConditions.splice(index, 1);
    } else {
      // 不存在 → 加入

      this.selectedConditions.push(condition);
    }
  }

  save() {
    this.submitted = true;

    if (
      !this.demand.item ||
      !this.demand.amount ||
      !this.demand.reason ||
      !this.demand.description ||
      !this.demand.address ||
      !this.demand.phone
    ) {
      this.itemInput.nativeElement.scrollIntoView({
        behavior: 'smooth',

        block: 'center',
      });

      return;
    }

    // =========================
    // 儲存物品完好度
    // =========================

    this.demand.conditions = [...this.selectedConditions];

    // 如果有自訂狀態，加進去

    if (this.demand.customCondition && this.demand.customCondition.trim()) {
      this.demand.conditions.push(this.demand.customCondition.trim());
    }

    this.disasterDemandService.addDemand(this.demand);

    this.router.navigate(['/agency/disaster-post']);
  }
}
