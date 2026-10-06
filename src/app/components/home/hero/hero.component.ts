import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface NewsItem {
  image: string;
  text: string;
  highlight: string;
  link: string;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HomeHeroComponent implements OnInit, OnDestroy {
  protected readonly newsList: NewsItem[] = [
    {
      image: 'assets/images/H_1.jpg',
      text: '災害救助',
      highlight: '查看目前受災地區的物資需求',
      link: '/donor/disaster',
    },
    {
      image: 'assets/images/donate_h.png',
      text: '平台導覽',
      highlight: '快速了解捐助與平台操作方式',
      link: '/platform-guide',
    },
    {
      image: 'assets/images/H_2.jpeg',
      text: '日常捐助',
      highlight: '瀏覽目前社福機構的物資需求',
      link: '/donor/daily',
    },
  ];

  protected readonly currentIndex = signal(0);

  protected readonly currentNews = computed(
    () => this.newsList[this.currentIndex()]
  );

  private autoSlideTimer: ReturnType<typeof setInterval> | undefined;

  ngOnInit(): void {
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  protected setSlide(index: number): void {
    this.currentIndex.set(index);

    this.stopAutoSlide();
    this.startAutoSlide();
  }

  protected previousSlide(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const previousIndex =
      (this.currentIndex() - 1 + this.newsList.length) %
      this.newsList.length;

    this.currentIndex.set(previousIndex);

    this.stopAutoSlide();
    this.startAutoSlide();
  }

  protected nextSlide(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const nextIndex =
      (this.currentIndex() + 1) % this.newsList.length;

    this.currentIndex.set(nextIndex);

    this.stopAutoSlide();
    this.startAutoSlide();
  }

  private startAutoSlide(): void {
    this.autoSlideTimer = setInterval(() => {
      const nextIndex =
        (this.currentIndex() + 1) % this.newsList.length;

      this.currentIndex.set(nextIndex);
    }, 3000);
  }

  private stopAutoSlide(): void {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = undefined;
    }
  }
}
