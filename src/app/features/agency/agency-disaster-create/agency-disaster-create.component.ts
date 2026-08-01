import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DisasterDemandService } from '../disaster-demand.service';

@Component({
  selector: 'app-agency-disaster-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './agency-disaster-create.component.html',
  styleUrl: './agency-disaster-create.component.scss',
})
export class AgencyDisasterCreateComponent {
  submitted = false;
  hasServiceTarget = true;

  @ViewChild('itemInput') itemInput!: ElementRef;

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

    customConditions: [''],

    priority: '普通',
    status: '上架',
    address: '',
    phone: '',
    note: '',
    brand: '',
    category: '',

    serviceTargets: {
      老人: false,
      嬰幼兒: false,
      孩童: false,
      青少年: false,
      身障: false,
      貧困: false,
      重症照護: false,
      寵物: false,
      流浪: false,
      野生: false,
    },

    customServiceTargets: [''],
  };

  constructor(
    private disasterDemandService: DisasterDemandService,
    private router: Router
  ) {}

  save() {
    this.submitted = true;

    this.hasServiceTarget =
      Object.values(this.demand.serviceTargets).some((value: boolean) => value) ||
      this.demand.customServiceTargets.some((target) => target.trim());

    if (
      !this.demand.item ||
      !this.demand.amount ||
      !this.demand.unit ||
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

    if (!this.hasServiceTarget) {
      this.scrollToServiceTarget();
      return;
    }

    // 自動判斷需求分類
    this.demand.category = this.disasterDemandService.getCategory(this.demand.item);

    this.disasterDemandService.addDemand(this.demand);
    this.router.navigate(['/agency/disaster']);
  }

  addCustomCondition() {
    if (this.demand.customConditions.length < 5) {
      this.demand.customConditions.push('');
    }
  }

  removeCustomCondition(index: number) {
    this.demand.customConditions.splice(index, 1);
  }

  addCustomServiceTarget() {
    if (this.demand.customServiceTargets.length < 5) {
      this.demand.customServiceTargets.push('');
    }
  }

  removeCustomServiceTarget(index: number) {
    this.demand.customServiceTargets.splice(index, 1);
  }

  scrollToServiceTarget() {
    const element = document.querySelector('.service-target-area');

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }
}
