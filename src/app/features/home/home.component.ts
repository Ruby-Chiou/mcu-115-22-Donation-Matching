import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DonorDailyLobbyComponent } from '../daily/donor-daily-lobby/donor-daily-lobby.component';

// 1. 定義最新消息的資料結構
interface NewsItem {
  image: string;
  text: string;
  highlight: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, DonorDailyLobbyComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  protected readonly newsList: NewsItem[] = [
    {
      image: 'assets/images/lobby.jpg',
      text: '歡迎民眾協助捐助。',
      highlight: '目前花蓮災後物資募集開放中。',
    },
    {
      image: 'https://api.fnkr.net/testimg/200x200/DDDDDD/999999/?text=img', //網址是示意圖片
      text: '智慧捐助媒合平台操作教學',
      highlight: '簡單易懂的指引就在這裡',
    },
    {
      image: 'https://api.fnkr.net/testimg/200x200/DDDDDD/999999/?text=img',
      text: '新物資需求已上架',
      highlight: '請移步至「日常捐助」專區瀏覽',
    },
  ];

  protected readonly currentIndex = signal(0);
  protected readonly currentNews = computed(() => this.newsList[this.currentIndex()]);

  // 宣告一個專門存放計時器的變數
  private autoSlideTimer: any;

  // 當這個頁面被打開（初始化）時，立刻啟動自動播放
  ngOnInit(): void {
    this.startAutoSlide();
  }

  // 當使用者離開這個頁面（銷毀）時，一定要把計時器殺掉
  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  // --- 以下是控制邏輯 ---

  private startAutoSlide(): void {
    // 設定每 3000 毫秒（3秒）執行一次括號裡的動作
    this.autoSlideTimer = setInterval(() => {
      // 邏輯：(目前的數字 + 1) 除以 總張數的餘數。這樣 0->1->2->0 就能無限循環
      const nextIndex = (this.currentIndex() + 1) % this.newsList.length;
      this.currentIndex.set(nextIndex);
    }, 3000);
  }

  private stopAutoSlide(): void {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
    }
  }

  // 手動點擊：切換圖片的同時，重新開始計時
  protected setSlide(index: number): void {
    this.currentIndex.set(index); // 切換到點擊的那張
    this.stopAutoSlide(); // 煞車：停掉舊的計時器
    this.startAutoSlide(); // 重新發車：重新開始倒數 3 秒
  }
}
