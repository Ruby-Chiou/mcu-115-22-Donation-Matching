import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DisasterDemandService } from '../../../core/services/disaster-demand.service';
import { DisasterDemand } from '../../../models/agency/demand';

@Component({
  selector: 'app-donor-disaster-supply-form',
  imports: [FormsModule],
  templateUrl: './donor-disaster-supply-form.component.html',
  styleUrl: './donor-disaster-supply-form.component.scss',
})
export class DonorDisasterSupplyFormComponent implements OnInit {

  demand: DisasterDemand | undefined;

  // 目前這筆需求最多可以捐多少
  maxDonationQuantity = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private disasterDemandService: DisasterDemandService
  ) {}

  ngOnInit(): void {
    // 從網址取得需求 id
    const id = Number(this.route.snapshot.paramMap.get('id'));
    // 沒有取得 id
    if (!id) {
      alert('找不到需求資料');
      this.router.navigate(['/donor/disaster']);
      return;
    }
    // 根據 id 取得需求
    this.demand = this.disasterDemandService.getDemandById(id);
    // 找不到需求
    if (!this.demand) {
      alert('此需求不存在或已失效');
      this.router.navigate(['/donor/disaster']);
      return;
    }

    // 剩餘需求 = 最大捐贈數量
    this.maxDonationQuantity = this.demand.remaining?? 0;
    console.log('目前捐贈需求：', this.demand);
    console.log('物資：', this.demand.item);
    console.log('剩餘數量：', this.demand.remaining);
    console.log('單位：', this.demand.unit);
    console.log('地址：', this.demand.address);
    console.log('電話：', this.demand.phone);
  }


  cancelForm(): void {
    this.router.navigate(['/donor/disaster']);
  }

  donorName = '';
  phone = '';

  // 自動填入帳戶資料
  useAccountInfo = false;
  accountName = '王小明';
  accountPhone = '0912345678';

  actualMaterial = '';

  quantity: number | null = null;
  note = '';

  needReceipt = '';
  needThankYou = '';

  receiptTitle = '';
  taxId = '';

  proofFile: File | null = null;
  proofFileName = '';

  // 捐贈完成證明
  get needProofUpload(): boolean {
    return (
      this.needReceipt === 'yes' ||
      this.needThankYou === 'yes'
    );
  }

  // 自動填入帳戶資料
  fillAccountInfo(): void {

    if (this.useAccountInfo) {

      this.donorName = this.accountName;
      this.phone = this.accountPhone;

    } else {

      this.donorName = '';
      this.phone = '';

    }
  }

  // 限制捐贈數量
  limitQuantityInput(event: Event): void {

    const input = event.target as HTMLInputElement;

    let value = Number(input.value);

    // 沒有輸入
    if (!input.value) {
      this.quantity = null;
      return;
    }

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

  // 設定捐贈數量
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

  // 是否已完成第一階段
  submitted = false;

  autoResize(event: Event): void {

    const textarea =
      event.target as HTMLTextAreaElement;

    textarea.style.height = 'auto';
    textarea.style.height =
      textarea.scrollHeight + 'px';
  }

  // 選擇捐贈完成證明
  onProofSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    if (
      !input.files ||
      input.files.length === 0
    ) {
      return;
    }

    this.proofFile = input.files[0];

    this.proofFileName =
      this.proofFile.name;
  }

  // 上傳捐贈完成證明
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

  submitForm(): void {

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

    // 再檢查一次數量
    if (
      this.quantity < 1 ||
      this.quantity > this.maxDonationQuantity
    ) {

      alert(
        `捐贈數量不可超過剩餘需求 ${this.maxDonationQuantity} ${this.demand?.unit ?? ''}`
      );

      return;
    }

    // 如果需要收據，就必須填寫抬頭
    if (
      this.needReceipt === 'yes' &&
      !this.receiptTitle
    ) {

      alert('請填寫收據抬頭');

      return;
    }

    // 顯示捐贈申請成功頁
    this.submitted = true;

    console.log(
      '捐贈申請資料：',
      {
        demandId: this.demand?.id,
        donorName: this.donorName,
        phone: this.phone,
        actualMaterial: this.actualMaterial,
        quantity: this.quantity,
        needReceipt: this.needReceipt,
        needThankYou: this.needThankYou,
        receiptTitle: this.receiptTitle,
        taxId: this.taxId,
        note: this.note
      }
    );
  }

  goToDisasterOpen(): void {
    this.router.navigate(['/donor/disaster']);
  }
}
