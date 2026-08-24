import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { HeaderComponent } from './components/layout/header/header.component'; // 引入導覽列
import { FooterComponent } from './components/layout/footer/footer.component';
import { DisasterClosedModalService } from './core/services/disaster-closed-modal.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class App {
  protected readonly title = signal('donation-matching');
  protected readonly closedModal: DisasterClosedModalService = inject(DisasterClosedModalService);

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const blockClosedDisasterClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const isClosed = localStorage.getItem('disasterOpen') !== 'true';
      const isDisasterOpenPage = this.router.url.startsWith('/disaster/open');
      const isInteractiveControl = target?.closest(
        'button, a, input, textarea, select, [role="button"]'
      );

      if (
        isClosed &&
        isDisasterOpenPage &&
        isInteractiveControl &&
        !target?.closest('.disaster-closed-modal')
      ) {
        event.preventDefault();
        event.stopPropagation();
        this.closedModal.show();
      }
    };

    document.addEventListener('click', blockClosedDisasterClick, true);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('click', blockClosedDisasterClick, true);
    });
  }

  goToDisasterLobby(): void {
    this.closedModal.hide();
    this.router.navigate(['/donor/disaster']);
  }

  //開發者頁面切換面板(之後要刪)
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
