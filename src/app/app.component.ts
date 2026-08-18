import { Component, signal, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { HeaderComponent } from './components/layout/header/header.component'; // 引入導覽列
import { FooterComponent } from './components/layout/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App {
  protected readonly title = signal('donation-matching');

  //開發者頁面切換面板(之後要刪)
  private router = inject(Router);

  switchRole(role: string) {
    // 這裡可以把身份存到 localStorage，或者存在全域 Service 裡
    localStorage.setItem('currentRole', role);
    console.log('已切換身份為:', role);

    // 依據身份自動跳轉到對應的頁面，方便測試
    if (role === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    } else if (role === 'donor') {
      this.router.navigate(['/donor/daily']);
    } else if (role === 'agency') {
      this.router.navigate(['/agency/daily']);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
