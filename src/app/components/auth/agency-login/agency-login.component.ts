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

  // 啟動行動自然人憑證 (FIDO) 驗證流程
  launchFidoLogin(): void {
    // TODO: 串接政府 FIDO 驗證 API 或重新導向至憑證閘道
    this.submitMessage = '正在導向至內政部行動自然人憑證驗證頁面...（示意）';
  }

  onBackToRoleSelection(): void {
    this.backToRoleSelection.emit();
  }
}
