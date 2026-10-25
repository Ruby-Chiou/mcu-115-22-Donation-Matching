import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, NgZone, Output, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AgencyCertificateRegistry } from '../../../core/auth/agency-certificate.registry';
import { AgencyVerificationService } from '../../../core/services/agency-verification/agency-verification.service';
import { toLoginMessage } from '../../../core/auth/login-message';
import { AuthSessionService } from '../../../core/services/auth/auth-session.service';
import { SupabaseService } from '../../../core/services/database/supabase.service';

@Component({
  selector: 'app-agency-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './agency-register.component.html',
  styleUrl: './agency-register.component.scss',
})
export class AgencyRegisterComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthSessionService);
  private readonly certificates = inject(AgencyCertificateRegistry);
  private readonly documents = inject(AgencyVerificationService);
  private verificationFile: File | null = null;
  private readonly zone = inject(NgZone);

  @Output() backToRoleSelection = new EventEmitter<void>();
  @ViewChild('agencyFormRef') agencyFormRef!: ElementRef;

  submitMessage = '';
  submitting = false;

  agencyForm = {
    email: '',
    password: '',
    confirmPassword: '',
    agencyName: '',
    registrationNumber: '',
    representative: '',
    contactPhone: '',
    defaultAddress: '',
    contactPersonName: '',
    contactPersonTitle: '',
    department: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
    verificationDocumentUrl: '',
    verificationStatus: 'pending',
    consentToContact: false,
    agreeToTerms: false,
  };

  onBackToRoleSelection(): void {
    this.backToRoleSelection.emit();
  }

  onVerificationFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    this.verificationFile = file;
    this.agencyForm.verificationDocumentUrl = file.name;
    this.submitMessage = '已選取驗證文件';
  }

  async onSubmit(): Promise<void> {
    if (this.submitting) {
      return;
    }

    const missingField = this.checkAndHighlightEmptyFields();
    if (missingField) {
      this.submitMessage = '請完整填寫所有必要欄位並勾選同意事項。';
      return;
    }

    if (this.agencyForm.password !== this.agencyForm.confirmPassword) {
      this.submitMessage = '密碼與確認密碼不一致。';
      return;
    }

    this.submitting = true;
    this.submitMessage = '';

    try {
      const email = this.agencyForm.email.trim();
      const password = this.agencyForm.password;
      const { data, error } = await this.supabase.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'agency',
            display_name: this.agencyForm.agencyName.trim(),
            agency_name: this.agencyForm.agencyName.trim(),
            registration_number: this.agencyForm.registrationNumber.trim(),
            representative: this.agencyForm.representative.trim(),
            contact_phone: this.agencyForm.contactPhone.trim(),
            default_address: this.agencyForm.defaultAddress.trim(),
            contact_person_name: this.agencyForm.contactPersonName.trim(),
            contact_person_title: this.agencyForm.contactPersonTitle.trim(),
            department: this.agencyForm.department.trim(),
            contact_person_phone: this.agencyForm.contactPersonPhone.trim(),
            contact_person_email: this.agencyForm.contactPersonEmail.trim(),
            verification_document_url: this.agencyForm.verificationDocumentUrl.trim(),
            consent_to_contact: this.agencyForm.consentToContact,
            agree_to_terms: this.agencyForm.agreeToTerms,
          },
        },
      });

      if (error) {
        if (/already registered|already been registered/i.test(error.message)) {
          await this.refreshExistingCertificate(email, password);
          return;
        }

        this.submitMessage = toLoginMessage(error);
        return;
      }

      const card = this.certificates.issue({
        holderName: this.agencyForm.contactPersonName,
        agencyName: this.agencyForm.agencyName,
        registrationNumber: this.agencyForm.registrationNumber,
        email,
        password,
      });

      const fileNote = await this.keepVerificationFile(data.user?.id);

      if (data.session) {
        await this.auth.signOut();
      }

      const mailboxNote = data.session ? '' : '若信箱收到系統信，那只是確認信箱可以收信，點了也不算資格通過。';
      this.submitMessage = `註冊已送出。管理者會用這些資料到公開可查的社福網站核對，再撥打網站上公布的電話，確認機構存在、註冊人存在，以及是否向本平台註冊。${mailboxNote}${fileNote}核對完成後，用這台裝置的憑證登入，請選擇「${card.agencyName}／${card.holderName}」，憑證序號 ${card.serial}。`;
    } catch (error) {
      this.submitMessage = toLoginMessage(error);
    } finally {
      this.zone.run(() => {
        this.submitting = false;
      });
    }
  }

  private async refreshExistingCertificate(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) {
      this.submitMessage = '此信箱已經註冊。請回到登入，選擇當初核發的機構憑證。';
      return;
    }

    const fileNote = await this.keepVerificationFile(data.user?.id);
    const card = this.certificates.issue({
      holderName: this.agencyForm.contactPersonName,
      agencyName: this.agencyForm.agencyName,
      registrationNumber: this.agencyForm.registrationNumber,
      email,
      password,
    });
    await this.auth.signOut();
    this.submitMessage = `此信箱已有帳號，憑證已重新核發到這台裝置。${fileNote}登入時請選擇「${card.agencyName}／${card.holderName}」。`;
  }

  private async keepVerificationFile(userId: string | undefined): Promise<string> {
    if (!this.verificationFile || !userId) {
      return '證明文件沒有存進系統。';
    }

    try {
      await this.documents.storeFile(userId, this.verificationFile);
      return '';
    } catch (error) {
      console.error(error);
      return '證明文件沒有存進系統，管理者將無法打開檔案。';
    }
  }

  private checkAndHighlightEmptyFields(): HTMLElement | null {
    const formElement = this.agencyFormRef?.nativeElement;
    if (!formElement) return null;

    const previousErrors = formElement.querySelectorAll('.input-error, .shake');
    previousErrors.forEach((el: Element) => el.classList.remove('input-error', 'shake'));

    let firstInvalidElement: HTMLElement | null = null;
    const checks = [
      { val: this.agencyForm.email, name: 'agencyEmail' },
      { val: this.agencyForm.agencyName, name: 'agencyAgencyName' },
      { val: this.agencyForm.registrationNumber, name: 'agencyRegistrationNumber' },
      { val: this.agencyForm.representative, name: 'agencyRepresentative' },
      { val: this.agencyForm.contactPhone, name: 'agencyContactPhone' },
      { val: this.agencyForm.defaultAddress, name: 'agencyDefaultAddress' },
      { val: this.agencyForm.contactPersonName, name: 'contactPersonName' },
      { val: this.agencyForm.contactPersonTitle, name: 'contactPersonTitle' },
      { val: this.agencyForm.department, name: 'department' },
      { val: this.agencyForm.contactPersonPhone, name: 'contactPersonPhone' },
      { val: this.agencyForm.contactPersonEmail, name: 'contactPersonEmail' },
      { val: this.agencyForm.verificationDocumentUrl, name: 'verificationFileInput' },
      { val: this.agencyForm.password, name: 'agencyPassword' },
      { val: this.agencyForm.confirmPassword, name: 'agencyConfirmPassword' },
      { val: this.agencyForm.consentToContact, name: 'consentToContact' },
      { val: this.agencyForm.agreeToTerms, name: 'agreeToTerms' },
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
