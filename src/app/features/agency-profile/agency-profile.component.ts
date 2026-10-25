import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { BeneficiaryPublicProfileService } from '../../core/services/agency/beneficiary-public-profile.service';
import {
  AGENCY_CITY_OPTIONS,
  AGENCY_IMAGE_ACCEPT,
  AGENCY_INTRO_IMAGE_LIMIT,
  AgencyProfileDraft,
  AgencyProfileService,
} from '../../core/services/agency/agency-profile.service';
import { AgencyVerificationService } from '../../core/services/agency-verification/agency-verification.service';

@Component({
  selector: 'app-agency-profile',
  imports: [FormsModule, RouterLink],
  templateUrl: './agency-profile.component.html',
  styleUrl: './agency-profile.component.scss',
})
export class AgencyProfileComponent implements OnInit {
  private readonly profiles = inject(AgencyProfileService);
  private readonly documents = inject(AgencyVerificationService);
  private readonly publicProfiles = inject(BeneficiaryPublicProfileService);

  protected readonly cities = AGENCY_CITY_OPTIONS;
  protected readonly imageAccept = AGENCY_IMAGE_ACCEPT.join(',');
  protected readonly introLimit = AGENCY_INTRO_IMAGE_LIMIT;

  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly uploading = signal(false);
  protected readonly loadError = signal('');
  protected readonly notice = signal('');
  protected readonly noticeError = signal(false);
  protected draft: AgencyProfileDraft | null = null;
  protected newTarget = '';

  ngOnInit(): void {
    void this.load();
  }

  protected statusLabel(): string {
    const status = this.profiles.profile()?.verificationStatus;
    if (status === 'approved') {
      return '資格已確認';
    }
    if (status === 'rejected') {
      return '未通過';
    }
    return '審核中';
  }

  protected email(): string {
    return this.profiles.profile()?.email || '未綁定';
  }

  protected previewLink(): string[] {
    const name = this.draft?.agencyName.trim();
    return name ? ['/donor/beneficiaries', name] : ['/donor/beneficiaries'];
  }

  protected async save(): Promise<void> {
    if (!this.draft || this.saving()) {
      return;
    }

    if (!this.draft.agencyName.trim()) {
      this.showNotice('請填寫機構名稱。', true);
      return;
    }

    this.saving.set(true);
    this.notice.set('');

    try {
      await this.profiles.save(this.draft);
      this.draft = this.profiles.draftFrom(this.profiles.profile()!);
      await this.publicProfiles.refresh();
      this.showNotice('已儲存。公開欄位會出現在受助機構專區與需求詳情。', false);
    } catch (error) {
      console.error(error);
      this.showNotice(error instanceof Error && error.message ? error.message : '儲存失敗，請稍後再試。', true);
    } finally {
      this.saving.set(false);
    }
  }

  protected async onCoverSelected(event: Event): Promise<void> {
    const file = this.takeFile(event);
    if (!file || !this.draft) {
      return;
    }

    await this.upload(file, (url) => {
      this.draft!.image = url;
    });
  }

  protected async onIntroSelected(event: Event): Promise<void> {
    const file = this.takeFile(event);
    if (!file || !this.draft) {
      return;
    }

    if (this.draft.introImages.length >= this.introLimit) {
      this.showNotice(`介紹圖片最多 ${this.introLimit} 張。`, true);
      return;
    }

    await this.upload(file, (url) => {
      this.draft!.introImages = [...this.draft!.introImages, url];
      if (!this.draft!.image) {
        this.draft!.image = url;
      }
    });
  }

  protected removeIntro(index: number): void {
    if (!this.draft) {
      return;
    }

    const removed = this.draft.introImages[index];
    this.draft.introImages = this.draft.introImages.filter((_, itemIndex) => itemIndex !== index);
    if (this.draft.image === removed) {
      this.draft.image = this.draft.introImages[0] ?? '';
    }
  }

  protected useAsCover(url: string): void {
    if (this.draft) {
      this.draft.image = url;
    }
  }

  protected addTarget(): void {
    const value = this.newTarget.trim();
    if (!value || !this.draft || this.draft.serviceTargets.includes(value)) {
      this.newTarget = '';
      return;
    }

    this.draft.serviceTargets = [...this.draft.serviceTargets, value];
    this.newTarget = '';
  }

  protected removeTarget(target: string): void {
    if (!this.draft) {
      return;
    }

    this.draft.serviceTargets = this.draft.serviceTargets.filter((item) => item !== target);
  }

  protected async onVerificationFile(event: Event): Promise<void> {
    const file = this.takeFile(event);
    const uid = this.profiles.profile()?.uid;
    if (!file || !this.draft || !uid) {
      return;
    }

    this.uploading.set(true);
    this.notice.set('');

    try {
      this.draft.verificationDocumentUrl = await this.documents.storeFile(uid, file);
      this.showNotice('證明文件已上傳，管理者可以開啟查看。', false);
    } catch (error) {
      this.showNotice(error instanceof Error ? error.message : '證明文件上傳失敗。', true);
    } finally {
      this.uploading.set(false);
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');

    try {
      const profile = await this.profiles.loadOwn();
      this.draft = this.profiles.draftFrom(profile);
    } catch (error) {
      console.error(error);
      this.loadError.set('機構資料讀取失敗，請確認目前是以受助者身分登入。');
    } finally {
      this.loading.set(false);
    }
  }

  private async upload(file: File, apply: (url: string) => void): Promise<void> {
    this.uploading.set(true);
    this.notice.set('');

    try {
      apply(await this.profiles.uploadPublicImage(file));
      this.showNotice('圖片已上傳，按儲存後才會公開。', false);
    } catch (error) {
      this.showNotice(error instanceof Error ? error.message : '圖片上傳失敗。', true);
    } finally {
      this.uploading.set(false);
    }
  }

  private takeFile(event: Event): File | null {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    return file;
  }

  private showNotice(text: string, isError: boolean): void {
    this.notice.set(text);
    this.noticeError.set(isError);
  }
}
