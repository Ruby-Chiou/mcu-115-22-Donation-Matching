import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

interface NewsItem {
  image: string;
  text: string;
  highlight: string;
  link: string;
}

interface LatestNewsItem {
  date: string;
  category: string;
  title: string;
  content: string;
  link: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {

  constructor(
    private router: Router
  ) {}

  goToDisaster(event: Event): void {
    event.preventDefault();

    this.router.navigate(['/donor/disaster']);
  }


  // =========================
  // 首頁輪播資料
  // =========================

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


  // =========================
  // 首頁最新消息
  // =========================

  protected readonly latestNewsList: LatestNewsItem[] = [
    {
    date: '26/09/12',
    category: '災情快訊',
    title: '花蓮部分地區道路通行狀況更新',
    content: '持續整理受災地區交通與救援相關資訊，協助捐助者掌握目前救援情況。',
    link: '/donor/disaster',
  },
  {
    date: '26/09/11',
    category: '救援資訊',
    title: '受災地區臨時安置與救援資源資訊',
    content: '提供避難、安置及相關救援資源資訊，方便有需要的民眾快速查詢。',
    link: '/donor/disaster',
  },
  {
    date: '26/09/10',
    category: '物資需求',
    title: '花蓮受災地區物資需求持續更新',
    content: '目前部分地區仍有民生物資需求，可前往災害救助專區查看詳細需求。',
    link: '/donor/disaster',
  },
  ];


  protected readonly currentIndex = signal(0);

  protected readonly currentNews = computed(
    () => this.newsList[this.currentIndex()]
  );


  // =========================
  // 輪播計時器
  // =========================

  private autoSlideTimer: ReturnType<typeof setInterval> | undefined;


  ngOnInit(): void {
    this.startAutoSlide();
  }


  ngOnDestroy(): void {
    this.stopAutoSlide();
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
    (this.currentIndex() + 1) %
    this.newsList.length;

  this.currentIndex.set(nextIndex);

  this.stopAutoSlide();
  this.startAutoSlide();
}
}
