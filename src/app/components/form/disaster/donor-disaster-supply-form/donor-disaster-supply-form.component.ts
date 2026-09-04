import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { DisasterDemand } from '../../../../models/agency/disaster-demand';
import { DisasterDemandService } from '../../../../core/services/agency-disaster-demand/disaster-demand.service';

@Component({
  selector: 'app-donor-disaster-supply-form',
  imports: [FormsModule, CommonModule],
  templateUrl: './donor-disaster-supply-form.component.html',
  styleUrl: './donor-disaster-supply-form.component.scss',
})
export class DonorDisasterSupplyFormComponent implements OnInit {

  demand: DisasterDemand | undefined;
  // 目前這筆需求最多可以捐多少
  maxDonationQuantity = 0;
  donorName = '';
  phone = '';
  // 自動填入帳戶資料
  useAccountInfo = false;
  // 之後如果有登入系統，可以改成從會員資料取得
  accountName = '王小明';
  accountPhone = '0912345678';
  actualMaterial = '';
  quantity: number | null = null;
  note = '';
  needReceipt = '';
  receiptTitle = '';
  taxId = '';
  needThankYou = '';
  proofFile: File | null = null;
  proofFileName = '';

  submitted = false;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private disasterDemandService: DisasterDemandService
  ) {}
  // 初始化  //
  ngOnInit(): void {
    // 從網址取得 id
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      alert('找不到需求資料');
      this.router.navigate(['/donor/disaster']);
      return;
    }
    // 取得全部需求
    const allDemands = this.disasterDemandService.getDemands();
    // 如果你的 route id 對應 serialNo
    this.demand = allDemands.find(
      (d) => d.serialNo === id
    );
    if (!this.demand) {
      alert('此需求不存在或已失效');
      this.router.navigate(['/donor/disaster']);
      return;
    }
    // 剩餘需求 = 最大可以捐贈數量
    this.maxDonationQuantity = this.demand.remaining ?? 0;
  }
  // 優先程度 CSS  //
  getPriorityClass(priority: string | undefined): string {
    switch (priority) {
      case '高':
        return 'priority-high';
      case '中':
        return 'priority-medium';
      case '低':
        return 'priority-low';
      default:
        return '';
    }
  }
  // 是否需要上傳證明  //
  get needProofUpload(): boolean {
    return (
      this.needReceipt === 'yes' ||
      this.needThankYou === 'yes'
    );
  }
  // 自動填入帳戶資料  //
  fillAccountInfo(): void {
    if (this.useAccountInfo) {
      this.donorName = this.accountName;
      this.phone = this.accountPhone;
    } else {
      this.donorName = '';
      this.phone = '';
    }
  }
  // 限制捐贈數量  //
  limitQuantityInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // 沒有輸入
    if (!input.value) {
      this.quantity = null;
      return;
    }
    let value = Number(input.value);
    // 最少 1
    if (value < 1) {
      value = 1;
    }
    // 不可以超過剩餘需求
    if (value > this.maxDonationQuantity) {
      value = this.maxDonationQuantity;
    }
    input.value = value.toString();
    this.quantity = value;
  }
  // 設定捐贈數量//
  setQuantity(value: number | null): void {
    if (value === null || value === undefined) {
      this.quantity = null;
      return;
    }
    if (value < 1) {
      this.quantity = 1;
      return;
    }
    if (value > this.maxDonationQuantity) {
      this.quantity = this.maxDonationQuantity;
      return;
    }
    this.quantity = value;
  }
  // textarea 自動增加高度  //
  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height =
      textarea.scrollHeight + 'px';
  }
  // 選擇捐贈完成證明  //
  onProofSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    this.proofFile = input.files[0];
    this.proofFileName = this.proofFile.name;
  }
  // 上傳捐贈完成證明  //
  uploadProof(): void {
    if (!this.proofFile) {
      alert('請先選擇捐贈完成證明');
      return;
    }
    console.log(
      '捐贈完成證明：',
      this.proofFile
    );
    alert(
      '捐贈完成證明已上傳，等待受助單位確認。'
    );
  }
  // 提交捐贈表單  //
  submitForm(): void {
    // 基本資料檢查
    if (
      !this.donorName ||
      !this.phone ||
      !this.actualMaterial ||
      !this.quantity ||
      !this.needReceipt ||
      !this.needThankYou
    ) {
      alert('請填寫完整的捐贈資料');
      return;
    }
    // 檢查數量
    if (
      this.quantity < 1 ||
      this.quantity > this.maxDonationQuantity
    ) {
      alert(
        `捐贈數量不可超過剩餘需求 ${this.maxDonationQuantity} ${this.demand?.unit ?? ''}`
      );
      return;
    }
    // 如果需要收據，必須填寫收據抬頭
    if (
      this.needReceipt === 'yes' &&
      !this.receiptTitle.trim()
    ) {
      alert('請填寫收據抬頭');
      return;
    }
    // 模擬送出資料    //
    console.log('捐贈申請資料：', {
      demandId: this.demand?.serialNo,
      donorName: this.donorName,
      phone: this.phone,
      actualMaterial: this.actualMaterial,
      quantity: this.quantity,
      unit: this.demand?.unit,
      needReceipt: this.needReceipt,
      receiptTitle: this.receiptTitle,
      taxId: this.taxId,
      needThankYou: this.needThankYou,
      note: this.note
    });
    // 顯示成功頁面
    this.submitted = true;
  }
  // 取消  //
  cancelForm(): void {

    this.router.navigate([
      '/donor/disaster'
    ]);
  }
  // 完成後返回災害救助//
  goToDisasterOpen(): void {

    this.router.navigate([
      '/donor/disaster'
    ]);
  }
}
