import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DisasterClosedModalService } from '../../../core/services/disaster-control/disaster-closed-modal.service';
import { DisasterControlService } from '../../../core/services/disaster-control/disaster-control.service';

interface NewsItem {
  image: string;
  text: string;
  highlight: string;
  link: string;
  source: string;
  disasterOnly?: boolean;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HomeHeroComponent implements OnInit, OnDestroy {
  private readonly disaster = inject(DisasterControlService);
  private readonly closedModal = inject(DisasterClosedModalService);

  /** 首頁輪播仍保留災害頁；關閉時點擊改跳出提示，不直接進入捐助動作。 */
  protected readonly newsList = signal<NewsItem[]>([
    {
      image: 'assets/images/H_1.jpg',
      text: '災害救助',
      highlight: '查看目前受災地區的物資需求',
      link: '/donor/disaster',
      source: '圖片來源：基督教救助協會',
      disasterOnly: true,
    },
    {
      image: 'assets/images/donate_h.png',
      text: '平台導覽',
      highlight: '快速了解捐助與平台操作方式',
      link: '/platform-guide',
      source: '',
    },
    {
      image: 'assets/images/H_2.jpeg',
      text: '日常捐助',
      highlight: '瀏覽目前社福機構的物資需求',
      link: '/donor/daily',
      source: '圖片來源：台灣好新聞',
    },
  ]);

  protected readonly currentIndex = signal(0);

  protected readonly currentNews = computed(() => {
    const list = this.newsList();
    return list[this.currentIndex() % list.length];
  });

  private autoSlideTimer: ReturnType<typeof setInterval> | undefined;

  ngOnInit(): void {
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  protected setSlide(index: number): void {
    const max = this.newsList().length;
    this.currentIndex.set(((index % max) + max) % max);
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  protected previousSlide(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const max = this.newsList().length;
    this.currentIndex.set((this.currentIndex() - 1 + max) % max);
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  protected nextSlide(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const max = this.newsList().length;
    this.currentIndex.set((this.currentIndex() + 1) % max);
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  protected onHeroNavigate(event: Event): void {
    const news = this.currentNews();
    if (news.disasterOnly && !this.disaster.data().isOpen) {
      event.preventDefault();
      this.closedModal.show();
    }
  }

  private startAutoSlide(): void {
    this.stopAutoSlide();
    this.autoSlideTimer = setInterval(() => {
      const max = this.newsList().length;
      this.currentIndex.set((this.currentIndex() + 1) % max);
    }, 3000);
  }

  private stopAutoSlide(): void {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = undefined;
    }
  }
}
