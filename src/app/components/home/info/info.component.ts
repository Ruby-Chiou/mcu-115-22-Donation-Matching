import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface LatestNewsItem {
  date: string;
  category: string;
  title: string;
  content: string;
  link: string;
}

@Component({
  selector: 'app-info',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './info.component.html',
  styleUrl: './info.component.scss',
})
export class HomeInfoComponent {

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
}
