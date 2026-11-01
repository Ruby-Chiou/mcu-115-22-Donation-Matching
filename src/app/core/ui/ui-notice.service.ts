import { Injectable, signal } from '@angular/core';

export type UiNoticeKind = 'alert' | 'confirm' | 'prompt';

export interface UiNoticeState {
  kind: UiNoticeKind;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  inputValue: string;
  inputPlaceholder: string;
  resolve: (value: boolean | string | null) => void;
}

/** 全站提示／確認框；取代小黑條原生 alert、confirm、prompt。 */
@Injectable({ providedIn: 'root' })
export class UiNoticeService {
  readonly active = signal<UiNoticeState | null>(null);

  info(body: string, title = '提示'): Promise<void> {
    return this.open('alert', title, body).then(() => undefined);
  }

  /** 相容 alert('單行文字')：標題用提示，內文為訊息。 */
  alert(message: string): Promise<void> {
    return this.info(String(message ?? ''), '提示');
  }

  confirm(body: string, title = '請確認', confirmLabel = '確定', cancelLabel = '取消'): Promise<boolean> {
    return this.open('confirm', title, body, confirmLabel, cancelLabel).then((value) => value === true);
  }

  prompt(
    body: string,
    title = '請輸入',
    defaultValue = '',
    confirmLabel = '確定',
    cancelLabel = '取消',
  ): Promise<string | null> {
    return this.open('prompt', title, body, confirmLabel, cancelLabel, defaultValue).then((value) => {
      if (typeof value === 'string') {
        return value;
      }
      return null;
    });
  }

  close(result: boolean | string | null = true): void {
    const current = this.active();
    if (!current) {
      return;
    }
    this.active.set(null);
    current.resolve(result);
  }

  private open(
    kind: UiNoticeKind,
    title: string,
    body: string,
    confirmLabel = '知道了',
    cancelLabel = '取消',
    inputValue = '',
    inputPlaceholder = '',
  ): Promise<boolean | string | null> {
    return new Promise<boolean | string | null>((resolve) => {
      const previous = this.active();
      if (previous) {
        previous.resolve(previous.kind === 'prompt' ? null : false);
      }
      this.active.set({
        kind,
        title,
        body,
        confirmLabel,
        cancelLabel,
        inputValue,
        inputPlaceholder,
        resolve,
      });
    });
  }
}

/** 把原生 alert 導到漂亮提示框（不阻斷後續程式；確認請改用 UiNoticeService.confirm）。 */
export function installUiNoticeBridge(notices: UiNoticeService, runInZone?: (fn: () => void) => void): void {
  window.alert = (message?: unknown) => {
    const show = () => {
      void notices.alert(String(message ?? ''));
    };
    if (runInZone) {
      runInZone(show);
      return;
    }
    show();
  };
}
