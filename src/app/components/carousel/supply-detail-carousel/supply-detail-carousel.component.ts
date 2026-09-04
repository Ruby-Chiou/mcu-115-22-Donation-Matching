import {
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from '@angular/core';

@Component({
  selector: 'app-supply-detail-carousel',
  standalone: true,
  templateUrl: './supply-detail-carousel.component.html',
  styleUrl: './supply-detail-carousel.component.scss'
})
export class SupplyDetailCarouselComponent
  implements OnChanges, OnDestroy {

  @Input() images: string[] = [];

  currentIndex = 0;

  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images']) {

      console.log('Carousel images:', this.images);

      this.currentIndex = 0;

      this.startAutoPlay();
    }
  }

  /**
   * 下一張
   */
  nextImage(): void {

    if (this.images.length <= 1) {
      return;
    }

    this.currentIndex =
      (this.currentIndex + 1) % this.images.length;

    console.log('下一張:', this.currentIndex);

    // 手動切換後重新計時
    this.startAutoPlay();

    this.cdr.detectChanges();
  }

  /**
   * 上一張
   */
  prevImage(): void {

    if (this.images.length <= 1) {
      return;
    }

    this.currentIndex =
      (this.currentIndex - 1 + this.images.length)
      % this.images.length;

    console.log('上一張:', this.currentIndex);

    // 手動切換後重新計時
    this.startAutoPlay();

    this.cdr.detectChanges();
  }

  /**
   * 點擊底下圓點
   */
  goToImage(index: number): void {

    if (index < 0 || index >= this.images.length) {
      return;
    }

    this.currentIndex = index;

    console.log('指定圖片:', this.currentIndex);

    // 點圓點後重新計時
    this.startAutoPlay();

    this.cdr.detectChanges();
  }

  /**
   * 自動輪播
   */
  startAutoPlay(): void {

    this.stopAutoPlay();

    // 0 張或 1 張都不需要輪播
    if (this.images.length <= 1) {
      console.log('圖片數量不足:', this.images.length);
      return;
    }

    this.timer = setTimeout(() => {

      this.currentIndex =
        (this.currentIndex + 1) % this.images.length;

      console.log('目前圖片:', this.currentIndex);

      this.cdr.detectChanges();

      this.startAutoPlay();

    }, 3000);
  }

  /**
   * 停止輪播
   */
  stopAutoPlay(): void {

    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }
}
