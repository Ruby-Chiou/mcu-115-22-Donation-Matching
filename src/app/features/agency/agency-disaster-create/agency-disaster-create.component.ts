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

  demand = {
    item: '',

    amount: '',

    unit: '',

    amountDescription: '',

    reason: '',

    description: '',

    // 接受物資狀態
    conditions: {
      全新: '',

      二手: '',

      有擦痕: '',

      過期: '',

      毀損: '',
    },

    customCondition: '',

    priority: '普通',

    status: '上架',

    address: '',

    phone: '',

    note: '',
  };

  constructor(
    private disasterDemandService: DisasterDemandService,

    private router: Router
  ) {}

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

    this.disasterDemandService.addDemand(this.demand);

    this.router.navigate(['/agency/disaster-post']);
  }
}
