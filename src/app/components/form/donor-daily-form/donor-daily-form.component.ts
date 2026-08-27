import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { DonorDailyService, DailyDonation } from '../../../core/services/donor-daily.service';

@Component({
  selector: 'app-donor-daily-form',
  imports: [FormsModule],
  templateUrl: './donor-daily-form.component.html',
  styleUrl: './donor-daily-form.component.scss',
})
export class DonorDailyFormComponent {
  donation?: DailyDonation;
  private readonly donationId: number;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private donorDailyService: DonorDailyService
  ) {
    this.donationId = Number(this.route.snapshot.paramMap.get('id'));
    this.donation = this.donorDailyService.getDailyDonationById(this.donationId);

  }

  cancelForm(): void {
    this.router.navigate(['/donor/daily/detail', this.donationId]);
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
  fillAccountInfo() {
    if (this.useAccountInfo) {
      this.donorName = this.accountName;
      this.phone = this.accountPhone;
    }
    else {
      this.donorName = '';
      this.phone = '';
    }
  }
  materialFile: File | null = null;
materialFileName = '';

onMaterialFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;

  if (input.files && input.files.length > 0) {
    this.materialFile = input.files[0];
    this.materialFileName = this.materialFile.name;
  }
}
  // 是否已完成第一階段
  submitted = false;
  formSubmitted = false;
  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
  // 選擇捐贈完成證明
  onProofSelected(event: Event) {
    const input =
      event.target as HTMLInputElement;
    if (!input.files ||
        input.files.length === 0) {
      return;
    }
    this.proofFile = input.files[0];
    this.proofFileName =this.proofFile.name;
  }
  // 上傳捐贈完成證明
  uploadProof() {
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
  submitForm(form: NgForm): void {
    this.formSubmitted = true;
    form.control.markAllAsTouched();

    if (
      form.invalid ||
      !this.materialFile ||
      (this.needReceipt === 'yes' && !this.receiptTitle)
    ) {
      const firstInvalidField = document.querySelector<HTMLElement>(
        'form .ng-invalid:not(form)'
      );
      firstInvalidField?.focus();
      
      return;
    }
    // 如果需要收據，就必須填寫抬頭
    if (this.needReceipt === 'yes' && !this.receiptTitle) {
      alert('請填寫收據抬頭');
      return;
    }
    // 顯示捐贈申請成功頁
    this.submitted = true;
    console.log(
      '捐贈申請資料：',
      {
        donorName: this.donorName,
        phone: this.phone,
        actualMaterial:this.actualMaterial,
        quantity:this.quantity,
        materialFile: this.materialFile,
        needReceipt:this.needReceipt,
        needThankYou:this.needThankYou,
        receiptTitle:this.receiptTitle,
        taxId:this.taxId,
        note: this.note
      }
    );

  }
  goToDisasterOpen() {
    this.router.navigate(['/disaster/open']);
  }
}
