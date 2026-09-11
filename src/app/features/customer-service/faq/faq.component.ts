// faq-panel.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FaqItem {
  id: number;
  question: string;
  answer: string[];
}

@Component({
  selector: 'app-faq-panel',
  standalone: true, // ← 必須設定為 true
  imports: [CommonModule, FormsModule], // ← 如果使用 ngFor 等指令需要引入
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
})
export class FAQComponent {
  activeFaqRole = signal<'general' | 'donor' | 'recipient'>('general');
  expandedFaqId: number | null = null;

  generalFaqs: FaqItem[] = [
  {
    id: 1,
    question: '這個平台提供什麼服務？',
    answer: [
      '本平台提供捐助者與社福團體、受助機構之間的物資媒合服務。',
      '捐助者可發布可捐贈的物資，受助機構可依需求提出申請。',
      '平台協助雙方完成物資資訊與需求的媒合。'
    ]
  },
  {
    id: 2,
    question: '平台可以進行金錢捐助嗎？',
    answer: [
      '不可以，本平台目前僅提供物資媒合服務。',
      '平台不提供現金、匯款、轉帳、信用卡或其他金錢捐助功能。',
      '請僅發布與申請實體物資。'
    ]
  },
  {
    id: 3,
    question: '如何註冊帳號？',
    answer: [
      '在首頁或登入頁面點擊「註冊」。',
      '選擇註冊身分為「捐助者」或「受助者」。',
      '填寫帳號、電子郵件、密碼與必要資料。',
      '完成驗證或審核後，即可登入使用平台。'
    ]
  },
  {
    id: 4,
    question: '忘記密碼怎麼辦？',
    answer: [
      '前往登入頁面並點擊「忘記密碼」。',
      '輸入註冊帳號使用的電子郵件。',
      '依照系統寄送的重設密碼通知完成設定。',
      '設定完成後，請使用新密碼重新登入。'
    ]
  },
  {
    id: 5,
    question: '如何聯絡管理員？',
    answer: [
      '可透過平台提供的聯絡方式向管理員詢問。',
      '請清楚說明遇到的問題、帳號身分與相關物資或申請資訊。',
      '管理員將依問題內容協助處理或提供後續說明。'
    ]
  }
];

donorFaqs: FaqItem[] = [
  {
    id: 31,
    question: '捐助者可以捐贈哪些項目？',
    answer: [
      '捐助者僅能捐贈實體物資，例如生活用品、食品、衣物、文具或其他平台允許的物資。',
      '發布前請確認物資仍可正常使用，且資訊描述正確。',
    ]
  },
  {
    id: 32,
    question: '如何捐助物資？',
    answer: [
      '登入捐助者帳號後，進入「日常捐助」或「災害救助」頁面。',
      '選擇物資分類，填寫物資名稱、數量、保存或使用狀況與照片。',
      '填寫可交付地點、交付方式或其他注意事項。',
      '確認內容無誤後送出，等待受助機構申請或平台媒合。'
    ]
  },
  {
    id: 33,
    question: '捐助物資後可以修改或取消嗎？',
    answer: [
      '尚未被申請、媒合或確認交付的物資，通常可於捐助紀錄中修改或取消。',
      '若已有受助機構提出申請，請聯絡管理員協助處理。'
    ]
  },
  {
    id: 34,
    question: '如何知道物資是否已被申請？',
    answer: [
      '登入後可前往「歷史紀錄」查看物資狀態。',
      '系統會顯示物資是否公開中、被申請、媒合中、已媒合或已完成。',
      '收到受助機構申請或媒合通知時，請依平台指示確認後續安排。'
    ]
  },
  {
    id: 35,
    question: '捐助者需要支付費用或提供金錢嗎？',
    answer: [
      '不需要，本平台不提供金錢捐助、付款、匯款或代收款服務。',
      '捐助者僅需依平台流程提供實體物資，若選擇寄送需自行負擔運費。',
      '若有人要求透過平台進行轉帳、付款或提供金融資料，請勿操作並立即聯絡管理員。'
    ]
  }
];

recipientFaqs: FaqItem[] = [
  {
    id: 51,
    question: '誰可以註冊為受助者？',
    answer: [
      '受助者帳號僅開放社會福利團體、非營利組織、公益機構或其他符合平台規範的受助機構申請。',
      '一般個人使用者目前無法以受助者身分註冊或申請物資。',
      '註冊時請填寫真實且可供查核的機構資料。'
    ]
  },
  {
    id: 52,
    question: '受助者註冊後是否需要審核？',
    answer: [
      '需要，受助機構提交註冊資料後，平台會進行身分與機構資格審核。',
      '請提供機構名稱、聯絡方式、地址及平台要求的證明資料。',
      '審核完成後，受助者帳號才能使用物資申請與媒合功能。'
    ]
  },
  {
    id: 53,
    question: '受助者如何申請物資？',
    answer: [
      '登入已通過審核的受助者帳號。',
      '進入物資列表，申請需要捐助的物資。',
      '填寫申請數量、用途與需求說明。',
      '送出申請後，等待平台完成媒合作業。'
    ]
  },
  {
    id: 54,
    question: '受助者可以申請現金或金錢補助嗎？',
    answer: [
      '不可以，本平台僅提供實體物資的媒合。',
      '受助者只能申請平台上發布的物資，不可提出現金、匯款、補助金或其他金錢需求。',
      '請在申請時清楚說明物資用途，協助捐助者與平台進行媒合。'
    ]
  },
  {
    id: 55,
    question: '申請物資後如何查看進度？',
    answer: [
      '登入後進入「歷史紀錄」頁面。',
      '可查看申請中的物資、審核或媒合狀態，以及後續交付資訊。',
      '若申請被退回或需要補充資料，請依系統通知完成修改。',
      '若對狀態有疑問，請透過平台聯絡管理員。'
    ]
  }
];

  changeFaqRole(role: 'general' | 'donor' | 'recipient') {
    this.activeFaqRole.set(role);
    this.expandedFaqId = null;
  }

  toggleFaq(id: number) {
    this.expandedFaqId = this.expandedFaqId === id ? null : id;
  }

  searchQuery = signal('');
  filteredGeneralFaqs: FaqItem[] = [];
  filteredDonorFaqs: FaqItem[] = [];
  filteredRecipientFaqs: FaqItem[] = [];

  ngOnInit() {
    this.filterFaqs();
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.filterFaqs();
  }

  filterFaqs() {
    const query = this.searchQuery().toLowerCase().trim();

    const filterByQuestion = (faqs: FaqItem[]) => (query ? faqs.filter((faq) => faq.question.toLowerCase().includes(query)) : faqs);

    this.filteredGeneralFaqs = filterByQuestion(this.generalFaqs);
    this.filteredDonorFaqs = filterByQuestion(this.donorFaqs);
    this.filteredRecipientFaqs = filterByQuestion(this.recipientFaqs);
  }
}
