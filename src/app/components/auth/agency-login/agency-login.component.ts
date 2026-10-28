import { Component, EventEmitter, Output, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { AgencyCertificateRegistry } from '../../../core/auth/agency-certificate.registry';
import { toLoginMessage } from '../../../core/auth/login-message';
import { AuthRedirectService } from '../../../core/services/auth/auth-redirect.service';
import { NaturalPersonGateComponent } from '../natural-person-gate/natural-person-gate.component';

@Component({
  selector: 'app-agency-login',
  standalone: true,
  imports: [NaturalPersonGateComponent],
  templateUrl: './agency-login.component.html',
  styleUrl: './agency-login.component.scss',
})
export class AgencyLoginComponent {
  private readonly redirect = inject(AuthRedirectService);
  private readonly route = inject(ActivatedRoute);
  private readonly certificates = inject(AgencyCertificateRegistry);

  @Output() backToRoleSelection = new EventEmitter<void>();

  submitMessage = '';
  isError = false;
  submitting = false;
  gateOpen = false;

  protected certificateCards() {
    return this.certificates.list();
  }

  openCertificateGate(): void {
    this.gateOpen = true;
    this.isError = false;
    this.submitMessage = '';
  }

  closeCertificateGate(): void {
    this.gateOpen = false;
  }

  async onCertificateVerified(certificateId: string): Promise<void> {
    const login = this.certificates.findLogin(certificateId);
    if (!login) {
      this.gateOpen = false;
      this.isError = true;
      this.submitMessage = '找不到這張憑證對應的受助者帳號。';
      return;
    }

    this.submitting = true;
    this.isError = false;
    this.submitMessage = '';

    try {
      this.submitMessage = '憑證驗證成功，即將進入受助者後台…';
      await this.redirect.signIn(
        login.email,
        login.password,
        false,
        this.route.snapshot.queryParamMap.get('returnUrl'),
      );
    } catch (error) {
      this.gateOpen = false;
      this.isError = true;
      this.submitMessage = toLoginMessage(error);
      this.submitting = false;
    }
  }

  onBackToRoleSelection(): void {
    this.backToRoleSelection.emit();
  }
}
