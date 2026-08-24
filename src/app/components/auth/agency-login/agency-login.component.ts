import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-agency-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './agency-login.component.html',
  styleUrl: './agency-login.component.scss',
})
export class AgencyLoginComponent {
  @Output() backToRoleSelection = new EventEmitter<void>();

  submitMessage = '';

  loginForm = {
    credentialPin: '',
  };

  onSubmit(): void {
    if (!this.loginForm.credentialPin) {
      this.submitMessage = '請輸入憑證PIN碼。';
      return;
    }
    // TODO: 呼叫機構驗證登入 API
    this.submitMessage = '機構驗證登入成功（示意）';
  }

  onBackToRoleSelection(): void {
    this.backToRoleSelection.emit();
  }
}
