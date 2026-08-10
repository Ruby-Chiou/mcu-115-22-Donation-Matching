import { Component, computed, OnDestroy, OnInit, AfterViewInit, signal ,inject} from '@angular/core';
import { Router,RouterLink } from '@angular/router';
import * as L from 'leaflet';

// 修正 Leaflet 預設 Marker 圖片 404 問題
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
});

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
export class DonorDisasterLobbyComponent implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  // 地圖相關變數
  map!: L.Map;
  currentMarkers: L.Marker[] = [];
  private resizeObserver!: ResizeObserver;

  // 輪播新聞資料
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

  // 志工地點資料
  volunteerList = [
    {
      name: '花蓮縣光復鄉衛生所',
      location: '📍花蓮縣光復鄉大馬村中學街158號',
      lat: 23.671898,
      lng: 121.425941,
      needs: ['物資搬運', '環境清潔', '災民陪伴']
    },
    {
      name: '花蓮縣立光復國民中學',
      location: '📍花蓮縣光復鄉大馬村林森路200號',
      lat: 23.670939,
      lng: 121.426511,
      needs: ['物資整理', '物資搬運']
    },
    {
      name: '花蓮縣鳳林鎮長橋國民小學',
      location: '📍花蓮縣鳳林鎮長橋路2號',
      lat: 23.709583,
      lng: 121.419539,
      needs: ['災民服務', '物資發放', '環境整理']
    }
  ];
donationList = [
  {
    name: '花蓮縣光復鄉衛生所',
    location:'📍花蓮縣光復鄉大馬村中學街158號',
    lat: 23.671898,
    lng: 121.425941,
    needs: [
      '飲用水',
      '泡麵',
      '罐頭食品'
    ]
  },

  {
    name: '花蓮縣光復鄉西南社區發展協會',
    location:'📍花蓮縣光復鄉南富村建國路二段111號',
    lat: 23.658455,
    lng: 121.449389,
    needs: [
      '奶粉',
      '尿布',
      '衛生用品'
    ]
  },

  {
    name: '大進國小災民收容所',
    location:'📍花蓮縣光復鄉大進村糖廠街2號',
    lat: 23.654699,
    lng: 121.419135,
    needs: [
      '礦泉水',
      '乾糧',
      '清潔用品'
    ]
  }
];
  protected readonly disasterIndex = signal(0);
  protected readonly disasterNews = computed(() => this.newsList[this.disasterIndex()]);
  private autoSlideTimer: any;

  // 1. 生命週期：頁面打開時啟動自動輪播
  ngOnInit(): void {
    this.startAutoSlide();
  }

  // 2. 生命週期：DOM 畫面載入完畢後初始化地圖（補上關鍵的 ngAfterViewInit）
  ngAfterViewInit(): void {
    this.initMap();
  }

  // 3. 生命週期：頁面銷毀時清理資源
  ngOnDestroy(): void {
    this.stopAutoSlide();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.map) {
      this.map.remove();
    }
  }

  // --- 地圖邏輯 ---
  private initMap(): void {
const mapContainer = document.getElementById('map');

  // 檢查如果畫面上找不到 map 容器，就先中斷，避免丟出 Exception 導致程式崩潰
  if (!mapContainer) {
    console.warn('Map container #map not found in DOM.');
    return;
  }

  // 確保 mapContainer 尚未被初始化過
  if (this.map) {
    this.map.remove();
  }
  this.map = L.map('map')
    .setView([23.7, 120.9], 7);

  L.tileLayer(
    'https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}',
    {
      attribution: '點擊地圖進入'
    }
  ).addTo(this.map);

    this.map.on('click', () => {
      //跳轉到專案內部的 Angular 頁面（請修改成你的路由路徑）
      this.router.navigate(['/disaster-locations']);
    });

  // 防止地圖拼圖錯位
  const mapEl = document.getElementById('map');

  if (mapEl) {

    this.resizeObserver = new ResizeObserver(() => {
      this.map.invalidateSize();
    });

    this.resizeObserver.observe(mapEl);

  }


  // ⭐ 一次顯示全部需求地點
  this.showAllLocations();
}
  clearMarkers(): void {
    this.currentMarkers.forEach(marker => this.map.removeLayer(marker));
    this.currentMarkers = [];
  }

  showAllLocations(): void {

  // 志工地點
  this.volunteerList.forEach(item => {

    const marker = L.marker([
      item.lat,
      item.lng
    ])
      .addTo(this.map)
      .bindPopup(`
        <b>${item.name}</b>
        <br><br>

        <b>${item.location}</b>
        <br><br>

        <b>目前需要志工</b>
        <br><br>

        <b>需要：</b>
        <br>
        ・${item.needs.join('<br>・')}
      `);

    this.currentMarkers.push(marker);

  });


  // 捐助地點
  this.donationList.forEach(item => {

    const marker = L.marker([
      item.lat,
      item.lng
    ])
      .addTo(this.map)
      .bindPopup(`
        <b>${item.name}</b>
        <br><br>

        <b>${item.location}</b>
        <br><br>

        <b>目前需要捐助</b>
        <br><br>

        <b>需要：</b>
        <br>
        ・${item.needs.join('<br>・')}
      `);

    this.currentMarkers.push(marker);

  });

}
  // --- 輪播控制邏輯 ---
  private startAutoSlide(): void {
    this.autoSlideTimer = setInterval(() => {
      const nextIndex = (this.disasterIndex() + 1) % this.newsList.length;
      this.disasterIndex.set(nextIndex);
    }, 3000);
  }

  private stopAutoSlide(): void {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
    }
  }

  protected setSlide(index: number): void {
    this.disasterIndex.set(index);
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  // 世界災害與歷史資料
  protected readonly historyList: disasterItem1[] = [
    {
      text: '花蓮地震',
      highlight: '2024年花蓮地震，震央位於台灣花蓮縣秀林鄉，芮氏規模達7.1。造成18人死亡，1,155人受傷。',
    },
    {
      text: '高雄地震',
      highlight: '高雄美濃地震，震央位於台灣高雄市美濃區，芮氏規模達6.6。造成117人死亡，其中115人在台南市永康區維冠金龍大樓，551人受傷。',
    },
  ];
  protected readonly disasterItem1 = signal(0);
  protected readonly disasterHistory = computed(() => this.historyList[this.disasterItem1()]);

  protected readonly worldList: disasterItem[] = [
    {
      image: 'https://upload.wikimedia.org/wikipedia/commons/8/85/2026_Kumamoto_Earthquake_July_30_NPA.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original',
      text: '熊本地震',
      highlight: '地震後發生爆炸事故的「永旺夢樂城熊本」商場，共有12人獲救，但其中7人死亡、5人受輕傷，目前持續搜救。八代市的日本製紙八代工廠，工廠煙囪因地震折斷倒塌，原先受困的11人已全數救出，但其中9人死亡。',
    },
    {
      image: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Maysak_impacted_in_Sanya-20260704_%283%29.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original',
      text: '強烈熱帶風暴梅莎',
      highlight: '梅莎重創廣西，引發嚴重洪澇災害並造成傷亡損失，國家防災減災救災委員會於7月6日啟動四級救災應急響應。國家發改委緊急撥付¥1億元中央預算內投資，以協助當地盡快恢復正常運作。 ',
    },
    {
      image: 'https://upload.wikimedia.org/wikipedia/commons/2/21/Incendio_Los_Gallardos%2C_Los_Pinos_03.jpg?utm_source=zh.wikipedia.org&utm_campaign=imageinfo&utm_content=original',
      text: '法國、西班牙野火',
      highlight: '07/23，法國爆發野火（紅色警戒），火情持續蔓延。燒毀面積：約 47,910 公頃（約 479 平方公里），為法國自 1949 年以來最大規模的森林火災之一。07/26，西班牙爆發野火（橙色警戒），火情持續蔓延。影響範圍：波及中部與南部（馬德里、阿維拉、托萊多、阿爾梅利亞、瓦倫西亞/卡斯特利翁）。',
    },
    {
      image: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Shenzhen_during_Typhoon_Noul_%282026%29_06.jpg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original',
      text: '紅霞颱風侵襲中國',
      highlight: '7月20日生成，7月24日升格熱帶風暴-編號2612「紅霞」(Noul)。 7月25日8時，升格為中度颱風；7月26日香港天文台將其升格為強颱風，凌晨3點50分前後在廣東省惠州市惠東縣平海鎮沿海登陸，廣州約89萬人轉移。',
    },
  ];
  protected readonly disasterItem = signal(0);
  protected readonly disasterWorld = computed(() => this.worldList[this.disasterItem()]);
}
