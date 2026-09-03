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

  startAutoPlay(): void {
    this.stopAutoPlay();

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
