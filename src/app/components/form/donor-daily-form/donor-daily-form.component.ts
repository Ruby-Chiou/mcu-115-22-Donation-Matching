import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { DailyDemandService } from '../../../core/services/daily-demand.service';
import { DailyDemand } from '../../../models/agency/daily-demand';

@Component({
  selector: 'app-donor-daily-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './donor-daily-form.component.html',
  styleUrl: './donor-daily-form.component.scss',
})
export class DonorDailyFormComponent {
  demand?: DailyDemand;
  private readonly demandId: number;

  // 圖片預覽
  showImagePreview = false;
  previewImage = '';
  previewImageName = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private demandService: DailyDemandService
  ) {
    this.demandId = Number(this.route.snapshot.paramMap.get('id'));
    this.demand = this.demandService.getDemandById(this.demandId);

  }

  cancelForm(): void {
    this.router.navigate(['/donor/daily/detail', this.demandId]);
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
  // 捐贈者上傳的圖片
materialFiles: File[] = [];

// 圖片預覽用
materialPreviewImages: string[] = [];

onMaterialFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;

  if (input.files && input.files.length > 0) {
    return;
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

  if (form.invalid) {
    const firstInvalidField = document.querySelector<HTMLElement>(
      'form .ng-invalid:not(form)'
    );

    firstInvalidField?.focus();
    return;
  }

  if (this.materialFiles.length === 0) {
    alert('請先上傳物資照片');
    return;
  }

  if (this.needReceipt === 'yes' && !this.receiptTitle) {
    alert('請填寫收據抬頭');
    return;
  }

  this.submitted = true;

  console.log('捐贈申請資料：', {
    donorName: this.donorName,
    phone: this.phone,
    actualMaterial: this.actualMaterial,
    quantity: this.quantity,
    materialFiles: this.materialFiles,
    needReceipt: this.needReceipt,
    needThankYou: this.needThankYou,
    receiptTitle: this.receiptTitle,
    taxId: this.taxId,
    note: this.note
  });
}
  goToDisasterOpen() {
    this.router.navigate(['/disaster/open']);
  }
  onImageSelected(event: Event): void {
  const input = event.target as HTMLInputElement;

  if (!input.files || input.files.length === 0) {
    return;
  }

  const file = input.files[0];

  // 最多 5 張
  if (this.materialFiles.length >= 5) {
    alert('最多只能上傳 5 張圖片');
    input.value = '';
    return;
  }

  // 限制 5MB
  if (file.size > 5 * 1024 * 1024) {
    alert('圖片大小不可超過 5MB');
    input.value = '';
    return;
  }

  // 加入捐贈表單自己的圖片
  this.materialFiles.push(file);

  // 建立預覽圖片
  const reader = new FileReader();

  reader.onload = () => {
    this.materialPreviewImages.push(reader.result as string);
  };

  reader.readAsDataURL(file);

  // 清空 input
  input.value = '';
}
  removeImage(index: number): void {
  this.materialFiles.splice(index, 1);
  this.materialPreviewImages.splice(index, 1);
}

  openImagePreview(image: string | undefined, imageName: string): void {
    if (!image) return;
    this.previewImage = image;
    this.previewImageName = imageName;
    this.showImagePreview = true;
  }

  closeImagePreview(): void {
    this.showImagePreview = false;
    this.previewImage = '';
    this.previewImageName = '';
  }
  materialVideoFiles: File[] = [];

onVideoSelected(event: Event): void {
const input = event.target as HTMLInputElement;

if (!input.files || input.files.length === 0) {
return;
}

const file = input.files[0];

// 檢查檔案大小：5MB
if (file.size > 5 * 1024 * 1024) {
alert('影片大小不能超過 5MB');
input.value = '';
return;
}

// 檢查是否為影片
if (!file.type.startsWith('video/')) {
alert('請選擇影片檔案');
input.value = '';
return;
}

// 最多 5 個媒體
if (this.materialFiles.length + this.materialVideoFiles.length >= 5) {
alert('最多只能上傳 5 個照片或影片');
input.value = '';
return;
}

this.materialVideoFiles.push(file);

console.log('目前影片：', this.materialVideoFiles);
}

}
