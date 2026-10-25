import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Output, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CompanyCertificateRegistry } from '../../../core/auth/company-certificate.registry';
import { toLoginMessage } from '../../../core/auth/login-message';
import { SocialAuthService, SocialProvider } from '../../../core/services/auth/social-auth.service';
import { SupabaseService } from '../../../core/services/database/supabase.service';

@Component({
  selector: 'app-donor-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './donor-register.component.html',
  styleUrl: './donor-register.component.scss',
})
export class DonorRegisterComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly social = inject(SocialAuthService);
  private readonly certificates = inject(CompanyCertificateRegistry);
  private readonly router = inject(Router);

  @Output() backToRoleSelection = new EventEmitter<void>();
  @ViewChild('donorFormRef') donorFormRef!: ElementRef;

  kind: 'individual' | 'company' = 'individual';
  submitMessage = '';
  isError = false;
  submitting = false;

  donorForm = {
    email: '',
    accountName: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    companyName: '',
    taxId: '',
    representative: '',
    address: '',
    documentName: '',
  };

  onBackToRoleSelection(): void {
    this.backToRoleSelection.emit();
  }

  setKind(kind: 'individual' | 'company'): void {
    this.kind = kind;
    this.isError = false;
    this.submitMessage = '';
  }

  onDocument(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.donorForm.documentName = file?.name ?? '';
  }

  async socialRegister(provider: SocialProvider): Promise<void> {
    if (this.kind === 'company' || this.submitting) {
      return;
    }

    this.submitting = true;
    this.isError = false;
    this.submitMessage = '';

    try {
      await this.social.start(provider, null);
    } catch (error) {
      this.isError = true;
      this.submitMessage = toLoginMessage(error);
      this.submitting = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.submitting) {
      return;
    }

    const missingField = this.checkAndHighlightEmptyFields();
    if (missingField) {
      this.isError = true;
      this.submitMessage = '請完整填寫所有必要欄位。';
      return;
    }

    if (this.donorForm.password !== this.donorForm.confirmPassword) {
      this.isError = true;
      this.submitMessage = '密碼與確認密碼不一致。';
      return;
    }

    if (this.kind === 'company' && !/^\d{8}$/.test(this.donorForm.taxId.trim())) {
      this.isError = true;
      this.submitMessage = '統一編號需要 8 位數字。';
      return;
    }

    this.submitting = true;
    this.isError = false;
    this.submitMessage = '';

    const email = this.donorForm.email.trim();
    const displayName = this.kind === 'company' ? this.donorForm.companyName.trim() : this.donorForm.fullName.trim() || this.donorForm.accountName.trim();

    try {
      const { data, error } = await this.supabase.client.auth.signUp({
        email,
        password: this.donorForm.password,
        options: {
          data: {
            role: 'donor',
            donor_kind: this.kind,
            display_name: displayName,
            full_name: this.kind === 'company' ? this.donorForm.representative.trim() : this.donorForm.fullName.trim(),
            account_name: this.kind === 'company' ? this.donorForm.taxId.trim() : this.donorForm.accountName.trim(),
            phone: this.donorForm.phone.trim(),
            company_name: this.donorForm.companyName.trim(),
            tax_id: this.donorForm.taxId.trim(),
            representative: this.donorForm.representative.trim(),
            address: this.donorForm.address.trim(),
            document_name: this.donorForm.documentName,
          },
        },
      });

      if (error) {
        this.isError = true;
        this.submitMessage = /already registered/i.test(error.message) ? '此信箱已經註冊，請直接登入。' : toLoginMessage(error);
        return;
      }

      if (this.kind === 'company') {
        const card = this.certificates.issue({
          holderName: this.donorForm.representative,
          companyName: this.donorForm.companyName,
          taxId: this.donorForm.taxId,
          email,
          password: this.donorForm.password,
        });
        const verifyHint = data.session ? '' : '若登入時提示信箱尚未啟用，請先點啟用連結；那只是開啟帳號，不是身分審核。';
        this.submitMessage = `公司註冊已送出。管理者會查公開公司登記並打電話確認，不會用確認信當作身分審核。${verifyHint}這台裝置的憑證是「${card.agencyName}／${card.holderName}」。`;
        if (data.session) {
          await this.router.navigate(['/member'], { queryParams: { notice: 'company-review' } });
        }
        return;
      }

      if (data.session) {
        await this.router.navigateByUrl('/home');
        return;
      }

      this.submitMessage = '註冊已送出。請到信箱點啟用連結後即可登入，個人捐助者不需另外審核。';
    } catch (error) {
      this.isError = true;
      this.submitMessage = toLoginMessage(error);
    } finally {
      this.submitting = false;
    }
  }

  private checkAndHighlightEmptyFields(): HTMLElement | null {
    const formElement = this.donorFormRef?.nativeElement;
    if (!formElement) return null;

    const previousErrors = formElement.querySelectorAll('.input-error, .shake');
    previousErrors.forEach((el: Element) => el.classList.remove('input-error', 'shake'));

    let firstInvalidElement: HTMLElement | null = null;
    const checks =
      this.kind === 'company'
        ? [
            { val: this.donorForm.email, name: 'donorEmail' },
            { val: this.donorForm.companyName, name: 'companyName' },
            { val: this.donorForm.taxId, name: 'taxId' },
            { val: this.donorForm.representative, name: 'representative' },
            { val: this.donorForm.phone, name: 'phone' },
            { val: this.donorForm.address, name: 'address' },
            { val: this.donorForm.documentName, name: 'companyDocument' },
            { val: this.donorForm.password, name: 'donorPassword' },
            { val: this.donorForm.confirmPassword, name: 'donorConfirmPassword' },
          ]
        : [
            { val: this.donorForm.email, name: 'donorEmail' },
            { val: this.donorForm.accountName, name: 'donorAccountName' },
            { val: this.donorForm.fullName, name: 'fullName' },
            { val: this.donorForm.phone, name: 'phone' },
            { val: this.donorForm.password, name: 'donorPassword' },
            { val: this.donorForm.confirmPassword, name: 'donorConfirmPassword' },
          ];

    for (const item of checks) {
      if (!item.val) {
        const el = formElement.querySelector(`[name="${item.name}"]`) as HTMLElement;
        if (el && !firstInvalidElement) firstInvalidElement = el;
      }
    }

    if (firstInvalidElement) {
      firstInvalidElement.classList.add('input-error', 'shake');
      firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstInvalidElement.focus();
      setTimeout(() => firstInvalidElement?.classList.remove('shake'), 400);
    }

    return firstInvalidElement;
  }
}
