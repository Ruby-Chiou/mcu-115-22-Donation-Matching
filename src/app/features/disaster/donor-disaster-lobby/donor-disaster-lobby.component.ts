import {Component, computed, OnDestroy, OnInit, signal} from '@angular/core';
import { RouterLink } from '@angular/router';
interface disasterItem {
  image: string;
  text: string;
  highlight: string;
}
interface disasterItem1 {
  text: string;
  highlight: string;
}


@Component({
  selector: 'app-donor-disaster-lobby',
  imports: [RouterLink],
  templateUrl: './donor-disaster-lobby.component.html',
  styleUrl: './donor-disaster-lobby.component.scss',
})
export class DonorDisasterLobbyComponent {
  protected readonly newsList: disasterItem[] = [
    {
      image: 'https://upload.wikimedia.org/wikipedia/commons/7/79/%E8%BE%B2%E6%A5%AD%E9%83%A8%E6%9E%97%E6%A5%AD%E7%BD%B22025%E5%B9%B49%E6%9C%8826%E6%97%A5%E5%85%89%E5%BE%A9%E9%84%89%E7%81%BD%E5%8D%80%E7%A9%BA%E6%8B%8D01.jpg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original',
      text: '花蓮馬太鞍溪堰塞湖災害',
      highlight: '2025年9月23日，台灣花蓮縣馬太鞍溪沿岸區域爆發嚴重水災。',
    },
    {
      image: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Rescue_workers_near_the_semi-collapsed_ten-story_Uranus_Building_on_Xuanyuan_Road_after_the_2024_Hualien_earthquake.jpg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original',
      text: '0403花蓮大地震',
      highlight: '4月3日上午7時58分發生芮氏規模7.2極淺層地震，震央位於花蓮外海，最大震度6強，全台劇烈搖晃，造成18至20人罹難、1,155人受傷，中橫與蘇花公路多處崩塌，天王星大樓等建物傾斜。',
    },
    {
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6ip85lncdFZNoJoistp_g0g7Ppja2qWfW7g9K0Hm9CS8Ju-SCWU8GpAs&s=10',
      text: '米克拉颱風災害救援支持行動',
      highlight: '受米克拉颱風外圍環流及強烈西南氣流影響，全台各地降下驚人雨量，短時間內累積雨量突破歷史紀錄。屏東部分地區累積雨量超過500毫米，高雄美濃、大樹、台南、屏東等地陸續傳出嚴重積淹水，道路坍方、住家進水，居民被迫撤離家園；',
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
 protected readonly historyList: disasterItem1[] = [
    {
      text:'花蓮地震',
      highlight:'2024年花蓮地震，震央位於台灣花蓮縣秀林鄉，芮氏規模達7.1。造成18人死亡，1,155人受傷。',

    },
    {
      text:'高雄地震',
      highlight:'高雄美濃地震，震央位於台灣高雄市美濃區，芮氏規模達6.6。造成117人死亡，其中115人在台南市永康區維冠金龍大樓，551人受傷。',

    },
  ];
  protected readonly disasterItem1 = signal(0);
 protected readonly disasterHistory = computed(() => this.historyList[this.disasterItem1()]);
 protected readonly worldList: disasterItem[] = [
    {
      image: 'https://upload.wikimedia.org/wikipedia/commons/8/85/2026_Kumamoto_Earthquake_July_30_NPA.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original',
      text:'熊本地震',
      highlight:'地震後發生爆炸事故的「永旺夢樂城熊本」商場，共有12人獲救，但其中7人死亡、5人受輕傷，目前持續搜救。八代市的日本製紙八代工廠，工廠煙囪因地震折斷倒塌，原先受困的11人已全數救出，但其中9人死亡。',

    },
    {
      image: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Maysak_impacted_in_Sanya-20260704_%283%29.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original',
      text:'強烈熱帶風暴梅莎',
      highlight:'梅莎重創廣西，引發嚴重洪澇災害並造成傷亡損失，國家防災減災救災委員會於7月6日啟動四級救災應急響應。國家發改委緊急撥付¥1億元中央預算內投資，以協助當地盡快恢復正常運作。 ',

    },
    {
      image: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Incendio_Los_Gallardos%2C_Los_Pinos_03.jpg?utm_source=zh.wikipedia.org&utm_campaign=imageinfo&utm_content=original',
      text:'法國、西班牙野火',
      highlight:'07/23，法國爆發野火（紅色警戒），火情持續蔓延。燒毀面積：約 47,910 公頃（約 479 平方公里），為法國自 1949 年以來最大規模的森林火災之一。07/26，西班牙爆發野火（橙色警戒），火情持續蔓延。影響範圍：波及中部與南部（馬德里、阿維拉、托萊多、阿爾梅利亞、瓦倫西亞/卡斯特利翁）。',

    },
    {
      image: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Shenzhen_during_Typhoon_Noul_%282026%29_06.jpg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original',
      text:'紅霞颱風侵襲中國',
      highlight:'7月20日生成，7月24日升格熱帶風暴-編號2612紅霞。 7月25日8時，升格為中度颱風；7月26日香港天文台將其升格為強颱風，凌晨3點50分前後在廣東省惠州市惠東縣平海鎮沿海登陸，廣州約89萬人轉移。',

    },
  ];
  protected readonly disasterItem = signal(0);
 protected readonly disasterWorld = computed(() => this.worldList[this.disasterItem()]);
}
