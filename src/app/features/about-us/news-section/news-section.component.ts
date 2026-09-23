import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface NewsItem {
  id: number;
  category: 'disaster' | 'rescue' | 'supply';
  categoryName: string;
  date: string;
  location: string;
  title: string;
  content: string;
}

@Component({
  selector: 'app-news-section',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './news-section.component.html',
  styleUrl: './news-section.component.scss',
})
export class NewsSectionComponent {
  selectedCategory: 'all' | 'disaster' | 'rescue' | 'supply' = 'all';

  newsList: NewsItem[] = [
  {
    id: 1,
    category: 'disaster',
    categoryName: '災情快訊',
    date: '2026/09/12',
    location: '台東山區',
    title: '強降雨造成部分道路中斷',
    content:
      '受連日強降雨影響，部分山區道路出現落石與積水情況，目前部分路段暫時無法通行，相關單位持續進行道路清理。',
  },
  {
    id: 2,
    category: 'rescue',
    categoryName: '救援資訊',
    date: '2026/09/11',
    location: '南投地區',
    title: '臨時安置中心開放受災居民入住',
    content:
      '當地設立臨時安置中心，提供受災居民基本住宿、餐食及生活用品，相關避難資訊將持續更新。',
  },
  {
    id: 3,
    category: 'supply',
    categoryName: '物資需求',
    date: '2026/09/10',
    location: '花蓮地區',
    title: '災區急需飲用水與即食食品',
    content:
      '目前部分居民仍需要基本生活物資，優先需求包含瓶裝水、泡麵、罐頭及其他不需冷藏的食品。',
  },
  {
    id: 4,
    category: 'disaster',
    categoryName: '災情快訊',
    date: '2026/09/09',
    location: '嘉義山區',
    title: '部分地區發生土石滑落情況',
    content:
      '受降雨影響，部分山區道路出現土石滑落，目前已設置警戒區域，並提醒民眾避免前往危險路段。',
  },
  {
    id: 5,
    category: 'rescue',
    categoryName: '救援資訊',
    date: '2026/09/08',
    location: '宜蘭地區',
    title: '臨時醫療服務站開始提供服務',
    content:
      '救援單位於受災區域設置臨時醫療服務站，提供基本傷口處理、常備藥品及健康諮詢。',
  },
  {
    id: 6,
    category: 'supply',
    categoryName: '物資需求',
    date: '2026/09/07',
    location: '屏東地區',
    title: '安置中心徵求嬰幼兒用品',
    content:
      '安置中心目前需要奶粉、尿布、濕紙巾及兒童生活用品，相關物資將優先提供給有幼兒家庭。',
  },
  {
    id: 7,
    category: 'disaster',
    categoryName: '災情快訊',
    date: '2026/09/06',
    location: '花蓮沿海地區',
    title: '部分區域出現停電情況',
    content:
      '部分地區因災害造成供電中斷，目前正進行設備檢查與修復，居民可先至指定場所取得基本生活資源。',
  },
  {
    id: 8,
    category: 'rescue',
    categoryName: '救援資訊',
    date: '2026/09/05',
    location: '台南地區',
    title: '災後清理志工開始招募',
    content:
      '部分受災區域進入災後環境整理階段，目前開放志工協助清理家園、搬運物資及整理公共空間。',
  },
  {
    id: 9,
    category: 'supply',
    categoryName: '物資需求',
    date: '2026/09/04',
    location: '南投山區',
    title: '災區徵求清潔與消毒用品',
    content:
      '災後環境整理需要大量清潔用品，目前需求包含垃圾袋、手套、清潔劑及消毒用品等物資。',
  },
];

  get filteredNews(): NewsItem[] {
    if (this.selectedCategory === 'all') {
      return this.newsList;
    }

    return this.newsList.filter(
      (news) => news.category === this.selectedCategory
    );
  }

  get latestNews(): NewsItem {
    return this.newsList[0];
  }

  selectCategory(category: 'all' | 'disaster' | 'rescue' | 'supply'): void {
    this.selectedCategory = category;
  }
}
