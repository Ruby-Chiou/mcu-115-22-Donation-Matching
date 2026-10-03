import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface GuideStep {
  number: number;
  title: string;
  description: string;
  icon: string;
}

interface FeatureGuide {
  title: string;
  description: string;
  icon: string;
  link: string;
  buttonText: string;
}

@Component({
  selector: 'app-platform-guide',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './platform-guide.component.html',
  styleUrl: './platform-guide.component.scss',
})
export class PlatformGuideComponent {
  selectedRole: 'donor' | 'recipient' = 'donor';

  donorSteps: GuideStep[] = [
    {
      number: 1,
      title: '瀏覽需求',
      description: '查看目前有哪些日常捐助或災害救助需求。',
      icon: 'fa-solid fa-magnifying-glass',
    },
    {
      number: 2,
      title: '查看需求詳細資訊',
      description: '確認需求物、需求原因、地點與剩餘需求。',
      icon: 'fa-solid fa-list-check',
    },
    {
      number: 3,
      title: '提交捐助',
      description: '選擇想提供的物資並填寫相關資料送出。',
      icon: 'fa-solid fa-hand-holding-heart',
    },
    {
      number: 4,
      title: '物品審核',
      description: '提交後由系統進行物品審查，通過後進入捐助流程。',
      icon: 'fa-solid fa-clipboard-check',
    },
    {
      number: 5,
      title: '寄出物資',
      description: '依照需求資訊將物資寄送至指定地點。',
      icon: 'fa-solid fa-box',
    },
    {
      number: 6,
      title: '物流追蹤',
      description: '填寫物流單號，掌握物資目前的配送進度。',
      icon: 'fa-solid fa-truck',
    },
  ];

  recipientSteps: GuideStep[] = [
    {
      number: 1,
      title: '建立需求',
      description: '填寫需求物資、數量、用途、地址與其他需求資訊。',
      icon: 'fa-solid fa-file-circle-plus',
    },
    {
      number: 2,
      title: '發布需求',
      description: '確認資料後將需求提交至平台，讓捐助者查看。',
      icon: 'fa-solid fa-bullhorn',
    },
    {
      number: 3,
      title: '管理需求',
      description: '查看目前已發布的需求與剩餘需求數量。',
      icon: 'fa-solid fa-list-check',
    },
    {
      number: 4,
      title: '即時更新',
      description: '依照實際狀況更新需求內容，維持資訊正確。',
      icon: 'fa-solid fa-rotate',
    },
    {
      number: 5,
      title: '查看捐助進度',
      description: '掌握目前收到的物資與處理進度。',
      icon: 'fa-solid fa-chart-line',
    },
    {
      number: 6,
      title: '志工招募',
      description: '發布所需人手、技能與地點等志工招募資訊。',
      icon: 'fa-solid fa-people-group',
    },
  ];

  donorFeatures: FeatureGuide[] = [
    {
      title: '日常捐助',
      description: '瀏覽社福機構發布的日常物資需求',
      icon: 'fa-solid fa-box-open',
      link: '/donor/daily',
      buttonText: '前往日常捐助',
    },
    {
      title: '災害救助',
      description: '查看受災地區需求與相關災害資訊',
      icon: 'fa-solid fa-triangle-exclamation',
      link: '/donor/disaster',
      buttonText: '前往災害救助',
    },
    {
      title: '物流資訊',
      description: '查詢捐助物資目前的配送進度',
      icon: 'fa-solid fa-truck-fast',
      link: '/tracking',
      buttonText: '查詢物流',
    },
    {
      title: 'AI 客服',
      description: '遇到平台操作問題時取得即時協助',
      icon: 'fa-solid fa-headset',
      link: '/customer-service/ai-chat',
      buttonText: '使用 AI 客服',
    },
  ];

  recipientFeatures: FeatureGuide[] = [
    {
      title: '日常需求管理區',
      description: '發布與管理日常物資需求',
      icon: 'fa-solid fa-box-open',
      link: '/agency/daily',
      buttonText: '查看相關功能',
    },
    {
      title: '災害需求管理區',
      description: '發布與更新災害期間的物資需求',
      icon: 'fa-solid fa-triangle-exclamation',
      link: '/agency/disaster',
      buttonText: '查看相關功能',
    },
    {
      title: '日常捐助審核',
      description: '查看並審核捐助物資，確認物資是否符合需求',
      icon: 'fa-solid fa-people-group',
      link: '/agency/item-review',
      buttonText: '查看相關功能',
    },
    {
      title: 'AI 客服',
      description: '遇到平台操作問題時取得協助',
      icon: 'fa-solid fa-headset',
      link: '/customer-service/ai-chat',
      buttonText: '使用 AI 客服',
    },
  ];

selectRole(role: 'donor' | 'recipient'): void {
    this.selectedRole = role;
  }
}
