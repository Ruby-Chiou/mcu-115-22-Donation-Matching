/** DOM 捲動輔助：只給元件／UI 層使用，不放進 domain logic。 */

export function scrollWindowToTop(behavior: ScrollBehavior | 'instant' = 'instant'): void {
  window.scrollTo({ top: 0, behavior: behavior as ScrollBehavior });
}

export function scrollToFirstMatching(selector: string, options?: ScrollIntoViewOptions): HTMLElement | null {
  const element = document.querySelector(selector) as HTMLElement | null;
  if (!element) {
    return null;
  }

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    ...options,
  });

  return element;
}
