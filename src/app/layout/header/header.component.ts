import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  navItems = [
    {
      name: '日常捐助',
      link: '/donor',
      sub: [
        { name: '更多需求', link: '/donor/daily' },
        { name: '訂單詳情', link: '/orders' },
        { name: '捐助感謝', link: '/thanks-wall' },
      ],
    },
    {
      name: '物流資訊',
      link: '/logistics',
      sub: [
        { name: '配送查詢', link: '/tracking' },
        { name: '配送據點', link: '/locations' },
      ],
    },
    {
      name: '客服中心',
      link: '/Customer-Service-Center',
      sub: [
        { name: '常見問題', link: '/faq' },
        { name: 'AI 客服', link: '/ai-chat' },
        { name: '真人客服', link: '/human-chat' },
      ],
    },
    {
      name: '關於我們',
      link: '/about-us',
      sub: [
        { name: '平台介紹', link: '/intro' },
        { name: '最新消息', link: '/news-section' },
        { name: '聯絡我們', link: '/contact-us' },
      ],
    },
  ];
}
