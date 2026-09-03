import {Component, computed, OnDestroy, OnInit, signal  } from '@angular/core';

interface disasterItem {
  image: string;
  text: string;
  highlight: string;
}


@Component({
  selector: 'app-donor-disaster-lobby',
  imports: [],
  templateUrl: './donor-disaster-lobby.component.html',
  styleUrl: './donor-disaster-lobby.component.scss',
})
export class DonorDisasterLobbyComponent {protected readonly newsList: disasterItem[] = [
    {
      image: 'assets/images/lobby.jpg',
      text: '歡迎民眾協助捐助。',
      highlight: '目前花蓮災後物資募集開放中。',
    },
    {
      image: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/%E7%81%BD%E9%98%B2%E4%BA%BA%E5%93%A1%E6%8A%8A%E6%8F%A1%E9%BB%83%E9%87%91%E6%99%82%E9%96%93%E5%9F%B7%E8%A1%8C%E4%BB%BB%E5%8B%99.jpg?utm_source=zh.wikinews.org&utm_campaign=index&utm_content=original', //網址是示意圖片
      text: '關懷南臺震災',
      highlight: '南臺灣6日凌晨3點57分發生規模6.4的強烈地震，造成多處房屋坍塌、人員傷亡，面對農曆年前發生如此突如其來的意外，中國信託金融控股公司以行動展現關懷，宣布捐款2000萬元協助賑災及災民安置事宜，盼協助強震受災居民盡早恢復正常生活。',
    },
    {
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6ip85lncdFZNoJoistp_g0g7Ppja2qWfW7g9K0Hm9CS8Ju-SCWU8GpAs&s=10',
      text: '米克拉颱風災害救援支持行動',
      highlight: '受米克拉颱風外圍環流及強烈西南氣流影響，全臺各地降下驚人雨量，短時間內累積雨量突破歷史紀錄。屏東部分地區累積雨量超過500毫米，高雄美濃、大樹、臺南、屏東等地陸續傳出嚴重積淹水，道路坍方、住家進水，居民被迫撤離家園；花蓮萬里溪上游堰塞湖更因暴雨水位暴漲，存在潰壩風險，下游居民緊急撤離避難。',
    },
  ];

  protected readonly disasterIndex = signal(0);
  protected readonly disasterNews = computed(() => this.newsList[this.disasterIndex()]);

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
      const nextIndex = (this.disasterIndex() + 1) % this.newsList.length;
      this.disasterIndex.set(nextIndex);
    }, 3000);
  }

  private stopAutoSlide(): void {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
    }
  }

  // 手動點擊：切換圖片的同時，重新開始計時
  protected setSlide(index: number): void {
    this.disasterIndex.set(index); // 切換到點擊的那張
    this.stopAutoSlide(); // 煞車：停掉舊的計時器
    this.startAutoSlide(); // 重新發車：重新開始倒數 3 秒
  }
}

