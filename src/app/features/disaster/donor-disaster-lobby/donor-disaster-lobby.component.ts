import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DisasterControlService } from '../../../core/services/disaster-control/disaster-control.service';
import { DonorDisasterPageComponent } from '../../../components/page/donor-disaster-page/donor-disaster-page.component';
import { DisasterLocationsComponent } from '../../../features/disaster/disaster-locations/disaster-locations.component';

interface DisasterItem {
  image: string;
  text: string;
  highlight: string;
}
interface DisasterHistoryItem {
  text: string;
  highlight: string;
}

@Component({
  selector: 'app-donor-disaster-lobby',
  standalone: true,
  imports: [DatePipe, RouterLink, DonorDisasterPageComponent, DisasterLocationsComponent],
  templateUrl: './donor-disaster-lobby.component.html',
  styleUrl: './donor-disaster-lobby.component.scss',
})
export class DonorDisasterLobbyComponent {
  protected readonly disasterData = inject(DisasterControlService).data;
  protected readonly newsList: DisasterItem[] = [
    {
      image:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/%E8%BE%B2%E6%A5%AD%E9%83%A8%E6%9E%97%E6%A5%AD%E7%BD%B22025%E5%B9%B49%E6%9C%8826%E6%97%A5%E5%85%89%E5%BE%A9%E9%84%89%E7%81%BD%E5%8D%80%E7%A9%BA%E6%8B%8D01.jpg/960px-%E8%BE%B2%E6%A5%AD%E9%83%A8%E6%9E%97%E6%A5%AD%E7%BD%B22025%E5%B9%B49%E6%9C%8826%E6%97%A5%E5%85%89%E5%BE%A9%E9%84%89%E7%81%BD%E5%8D%80%E7%A9%BA%E6%8B%8D01.jpg',
      text: '花蓮馬太鞍溪堰塞湖災害',
      highlight: '2025年9月23日，台灣花蓮縣馬太鞍溪沿岸區域爆發嚴重水災。',
    },
    {
      image:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Rescue_workers_near_the_semi-collapsed_ten-story_Uranus_Building_on_Xuanyuan_Road_after_the_2024_Hualien_earthquake.jpg/960px-Rescue_workers_near_the_semi-collapsed_ten-story_Uranus_Building_on_Xuanyuan_Road_after_the_2024_Hualien_earthquake.jpg',
      text: '0403花蓮大地震',
      highlight:
        '4月3日上午7時58分發生芮氏規模7.2極淺層地震，震央位於花蓮外海，最大震度6強，全台劇烈搖晃，造成18至20人罹難、1,155人受傷，中橫與蘇花公路多處崩塌，天王星大樓等建物傾斜。',
    },
    {
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6ip85lncdFZNoJoistp_g0g7Ppja2qWfW7g9K0Hm9CS8Ju-SCWU8GpAs&s=10',
      text: '米克拉颱風災害救援支持行動',
      highlight:
        '受米克拉颱風外圍環流及強烈西南氣流影響，全台各地降下驚人雨量，短時間內累積雨量突破歷史紀錄。屏東部分地區累積雨量超過500毫米，高雄美濃、大樹、台南、屏東等地陸續傳出嚴重積淹水，道路坍方、住家進水，居民被迫撤離家園；',
    },
  ];

  // 宣告一個專門存放計時器的變數
  private autoSlideTimer: ReturnType<typeof setInterval> | undefined;

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
    if (this.autoSlideTimer !== undefined) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = undefined;
    }
  }

  // 手動點擊：切換圖片的同時，重新開始計時
  protected setSlide(index: number): void {
    this.disasterIndex.set(index); // 切換到點擊的那張
    this.stopAutoSlide(); // 煞車：停掉舊的計時器
    this.startAutoSlide(); // 重新發車：重新開始倒數 3 秒
  }
  protected readonly historyList: DisasterHistoryItem[] = [
    {
      text: '花蓮地震',
      highlight: '2024年花蓮地震，震央位於台灣花蓮縣秀林鄉，芮氏規模達7.1。造成18人死亡，1,155人受傷。',
    },
    {
      text: '高雄地震',
      highlight: '高雄美濃地震，震央位於台灣高雄市美濃區，芮氏規模達6.6。造成117人死亡，其中115人在台南市永康區維冠金龍大樓，551人受傷。',
    },
  ];
  protected readonly disasterIndex = signal(0);
  protected readonly disasterNews = computed(() => this.newsList[this.disasterIndex()]);


}
