import { DatePipe } from '@angular/common';
import { Component, AfterViewInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';

import { DisasterControlService } from '../../../core/services/disaster-control.service';
import { DonorDisasterPageComponent } from '../../../components/page/donor-disaster-page/donor-disaster-page.component';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
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
  imports: [DatePipe, RouterLink, DonorDisasterPageComponent],
  templateUrl: './donor-disaster-lobby.component.html',
  styleUrl: './donor-disaster-lobby.component.scss',
})
export class DonorDisasterLobbyComponent implements AfterViewInit {
  protected readonly disasterData = inject(DisasterControlService).data;
  private map!: L.Map;
  private currentMarkers: L.Marker[] = [];
  protected readonly newsList: DisasterItem[] = [
    {
      image:
        'https://upload.wikimedia.org/wikipedia/commons/7/79/%E8%BE%B2%E6%A5%AD%E9%83%A8%E6%9E%97%E6%A5%AD%E7%BD%B22025%E5%B9%B49%E6%9C%8826%E6%97%A5%E5%85%89%E5%BE%A9%E9%84%89%E7%81%BD%E5%8D%80%E7%A9%BA%E6%8B%8D01.jpg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original',
      text: '花蓮馬太鞍溪堰塞湖災害',
      highlight: '2025年9月23日，台灣花蓮縣馬太鞍溪沿岸區域爆發嚴重水災。',
    },
    {
      image:
        'https://upload.wikimedia.org/wikipedia/commons/0/02/Rescue_workers_near_the_semi-collapsed_ten-story_Uranus_Building_on_Xuanyuan_Road_after_the_2024_Hualien_earthquake.jpg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original',
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

  protected readonly disasterIndex = signal(0);
  protected readonly disasterNews = computed(() => this.newsList[this.disasterIndex()]);

  protected readonly volunteerList = [
    {
      name: '花蓮縣光復鄉衛生所',
      location: '📍花蓮縣光復鄉大馬村中學街158號',
      lat: 23.671898,
      lng: 121.425941,
      needs: ['物資搬運', '環境清潔', '災民陪伴'],
    },
    {
      name: '花蓮縣立光復國民中學',
      location: '📍花蓮縣光復鄉大馬村林森路200號',
      lat: 23.670939,
      lng: 121.426511,
      needs: ['物資整理', '物資搬運'],
    },
    {
      name: '花蓮縣鳳林鎮長橋國民小學',
      location: '📍花蓮縣鳳林鎮長橋里長橋路2號',
      lat: 23.709583,
      lng: 121.419539,
      needs: ['災民服務', '物資發放', '環境整理'],
    },
  ];

  protected readonly donationList = [
    {
      name: '花蓮縣光復鄉衛生所',
      location: '📍花蓮縣光復鄉大馬村中學街158號',
      lat: 23.671898,
      lng: 121.425941,
      needs: ['飲用水', '泡麵', '罐頭食品'],
    },
    {
      name: '花蓮縣光復鄉西南社區發展協會',
      location: '📍花蓮縣光復鄉南富村建國路二段111號',
      lat: 23.658455,
      lng: 121.449389,
      needs: ['奶粉', '尿布', '衛生用品'],
    },
    {
      name: '大進國小災民收容所',
      location: '📍花蓮縣光復鄉大進村糖廠街2號',
      lat: 23.654699,
      lng: 121.419135,
      needs: ['礦泉水', '乾糧', '清潔用品'],
    },
  ];

  ngAfterViewInit(): void {
    this.map = L.map('disaster-map').setView([23.7, 120.9], 7);
    L.tileLayer('https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}', {
      attribution: '國土測繪中心',
    }).addTo(this.map);
    setTimeout(() => this.map.invalidateSize(), 500);
  }

  protected selectType(event: Event): void {
    const type = (event.target as HTMLSelectElement).value;
    if (type === 'volunteer') {
      this.showMarkers(this.volunteerList, '目前需要志工');
    } else if (type === 'donation') {
      this.showMarkers(this.donationList, '目前需要捐助');
    } else {
      this.clearMarkers();
    }
  }

  private showMarkers(items: typeof this.volunteerList, title: string): void {
    this.clearMarkers();
    items.forEach((item) => {
      const marker = L.marker([item.lat, item.lng]).addTo(this.map).bindPopup(`
        <b>${item.name}</b><br><br>
        <b>${item.location}</b><br><br>
        <b>${title}</b><br><br>
        <b>需要：</b><br>
        ・${item.needs.join('<br>・')}
      `);
      this.currentMarkers.push(marker);
    });
  }

  private clearMarkers(): void {
    this.currentMarkers.forEach((marker) => this.map.removeLayer(marker));
    this.currentMarkers = [];
  }

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
}
