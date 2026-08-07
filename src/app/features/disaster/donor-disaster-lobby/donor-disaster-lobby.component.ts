import {Component, computed, OnDestroy, OnInit, signal  } from '@angular/core';

interface disasterItem {
  image: string;
  text: string;
  highlight: string;
}
interface disasterItem1 {
  text: string;
  highlight: string;
}
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-donor-disaster-lobby',
  imports: [RouterLink],
  templateUrl: './donor-disaster-lobby.component.html',
  styleUrl: './donor-disaster-lobby.component.scss',
})
export class DonorDisasterLobbyComponent {
  protected readonly newsList: disasterItem[] = [
    {
      image: 'assets/images/lobby.jpg',
      text: '歡迎民眾協助捐助。',
      highlight: '目前花蓮災後物資募集開放中。',
    },
    {
      image: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/%E7%81%BD%E9%98%B2%E4%BA%BA%E5%93%A1%E6%8A%8A%E6%8F%A1%E9%BB%83%E9%87%91%E6%99%82%E9%96%93%E5%9F%B7%E8%A1%8C%E4%BB%BB%E5%8B%99.jpg?utm_source=zh.wikinews.org&utm_campaign=index&utm_content=original',
      text: '關懷南台震災',
      highlight: '南台灣6日凌晨3點57分發生規模6.4的強烈地震，造成多處房屋坍塌、人員傷亡，面對農曆年前發生如此突如其來的意外，中國信託金融控股公司以行動展現關懷，宣布捐款2000萬元協助賑災及災民安置事宜，盼協助強震受災居民盡早恢復正常生活。',
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
      image: 'https://tchina-kyodo.ismcdn.jp/mwimgs/2/e/414m/img_2eb8a913721347bba4273733214627f92108827.jpg',
      text:'熊本地震',
      highlight:'地震後發生爆炸事故的「永旺夢樂城熊本」商場，共有12人獲救，但其中7人死亡、5人受輕傷，目前持續搜救。八代市的日本製紙八代工廠，工廠煙囪因地震折斷倒塌，原先受困的11人已全數救出，但其中9人死亡。',

    },
    {
      image: 'https://i.ytimg.com/vi/Mg7dOTL9G10/maxresdefault.jpg',
      text:'美國西維吉尼亞州暴雨成災',
      highlight:'美國西維吉尼亞州7月23日遭遇極端暴雨襲擊，造成2人死亡，短短6小時內降雨量便突破5英吋(127mm)，導致當地溪流水位在5小時內急遽暴漲逾3-5公尺。 ',

    },
    {
      image: 'https://www.epochtimes.com/_next/image?url=https%3A%2F%2Fi.epochtimes.com%2Fassets%2Fuploads%2F2026%2F07%2Fid14817844-AFP__20260726__C39699P__v2__MidRes__FranceEnvironmentClimateWeatherWildfire.jpg&w=1200&q=75',
      text:'法國、西班牙野火',
      highlight:'07/23，法國爆發野火（紅色警戒），火情持續蔓延。燒毀面積：約 47,910 公頃（約 479 平方公里），為法國自 1949 年以來最大規模的森林火災之一。07/26，西班牙爆發野火（橙色警戒），火情持續蔓延。影響範圍：波及中部與南部（馬德里、阿維拉、托萊多、阿爾梅利亞、瓦倫西亞/卡斯特利翁）。',

    },
    {
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTExca_gDpuo6hWhuB4NZ96sUj3r3UxtZtuN4hjVN5wwnO3ZwKqv0SuP8w&s=10',
      text:'紅霞颱風侵襲中國',
      highlight:'7月20日生成，7月24日升格熱帶風暴-編號2612「紅霞」(Noul)。 7月25日8時，升格為中度颱風；7月26日香港天文台將其升格為強颱風，凌晨3點50分前後在廣東省惠州市惠東縣平海鎮沿海登陸，廣州約89萬人轉移。',

    },
  ];
  protected readonly disasterItem = signal(0);
 protected readonly disasterWorld = computed(() => this.worldList[this.disasterItem()]);
}
