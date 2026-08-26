import { Injectable } from '@angular/core';

export interface DailyDonation {
  id: number;

  // 卡片
  title: string;
  image: string;
 category: string;
  target: string;
  quantity: number;
  organization: string;
  address: string;

  // 詳細頁
  status: string;
  receiveMethod: string;
  requestSummary: string;
  requestDescription: string;
  contactPerson: string;
  contactPhone: string;
  receiveLocation: string;
  otherDescription: string;
}

@Injectable({
  providedIn: 'root'
})
export class DonorDailyService {

  private dailyDonations: DailyDonation[] = [

    {
      id: 1,
      title: '白米',
      image: '',
      category: '食物',
      target: '身障',

      quantity: 100,
      organization: '社團法人臺東縣弱勢者關懷協會',
      address: '950 臺東縣臺東市 正氣北路266號',

      status: '全新',
      receiveMethod: '面交',
      requestSummary: '提供本會長期關懷之弱勢族群食用。',
      requestDescription:
        '物資狀態提醒：限全新暫不接受已開封的狀態，效期如只有三個月以下請先至底下留言板詢問，確認單位可以接收再請完成捐贈單。寄出前請檢查是否受潮、效期、包裝正常等。一同做好食品安全把關。',
      contactPerson: '張小明',
      contactPhone: '0912-345-678',
      receiveLocation: '950 臺東縣臺東市 正氣北路266號',
      otherDescription: '請於捐贈前確認物資包裝完整。'
    },

    {
      id: 2,
      title: '奶粉',
      image: '',
      category: '食品',
      target: '兒童',

      quantity: 50,
      organization: '財團法人花蓮縣社會福利基金會',
      address: '970 花蓮縣花蓮市中山路100號',

      status: '全新',
      receiveMethod: '面交',
      requestSummary: '提供弱勢家庭兒童日常營養所需。',
      requestDescription:
        '奶粉需為未開封新品，並確認有效期限至少三個月以上。',
      contactPerson: '李美玲',
      contactPhone: '0933-456-789',
      receiveLocation: '970 花蓮縣花蓮市中山路100號',
      otherDescription: '請先聯繫機構確認收件時間。'
    },

    {
      id: 3,
      title: '衛生紙',
      image: '',
      category: '生活用品',
      target: '長者',

      quantity: 80,
      organization: '社團法人臺北市老人福利協會',
      address: '100 臺北市中正區仁愛路100號',

      status: '全新',
      receiveMethod: '郵寄',
      requestSummary: '提供長者日常生活使用。',
      requestDescription:
        '希望捐贈全新未拆封衛生紙，包裝需完整且無破損。',
      contactPerson: '王大華',
      contactPhone: '0922-567-890',
      receiveLocation: '100 臺北市中正區仁愛路100號',
      otherDescription: '郵寄前請先與機構確認數量。'
    },

    {
      id: 4,
      title: '罐頭食品',
      image: '',
      category: '食物',
      target: '弱勢家庭',

      quantity: 120,
      organization: '社團法人高雄市弱勢關懷協會',
      address: '800 高雄市新興區中正三路200號',

      status: '全新',
      receiveMethod: '面交',
      requestSummary: '提供弱勢家庭及急難救助使用。',
      requestDescription:
        '罐頭食品需為全新未開封，並確認保存期限及包裝完整。',
      contactPerson: '陳志偉',
      contactPhone: '0955-678-901',
      receiveLocation: '800 高雄市新興區中正三路200號',
      otherDescription: '若數量較多，請事先聯絡安排收貨。'
    },

    {
      id: 5,
      title: '罐頭食品',
      image: '',
      category: '食物',
      target: '弱勢家庭',

      quantity: 120,
      organization: '社團法人高雄市弱勢關懷協會',
      address: '800 高雄市新興區中正三路200號',

      status: '全新',
      receiveMethod: '面交',
      requestSummary: '提供弱勢家庭及急難救助使用。',
      requestDescription:
        '罐頭食品需為全新未開封，並確認保存期限及包裝完整。',
      contactPerson: '陳志偉',
      contactPhone: '0955-678-901',
      receiveLocation: '800 高雄市新興區中正三路200號',
      otherDescription: '若數量較多，請事先聯絡安排收貨。'
    },
    {
      id: 6,
      title: '罐頭食品',
      image: '',
      category: '食物',
      target: '弱勢家庭',

      quantity: 120,
      organization: '社團法人高雄市弱勢關懷協會',
      address: '800 高雄市新興區中正三路200號',

      status: '全新',
      receiveMethod: '面交',
      requestSummary: '提供弱勢家庭及急難救助使用。',
      requestDescription:
        '罐頭食品需為全新未開封，並確認保存期限及包裝完整。',
      contactPerson: '陳志偉',
      contactPhone: '0955-678-901',
      receiveLocation: '800 高雄市新興區中正三路200號',
      otherDescription: '若數量較多，請事先聯絡安排收貨。'
    },
    {
      id: 7,
      title: '罐頭食品',
      image: '',
      category: '食物',
      target: '弱勢家庭',

      quantity: 120,
      organization: '社團法人高雄市弱勢關懷協會',
      address: '800 高雄市新興區中正三路200號',

      status: '全新',
      receiveMethod: '面交',
      requestSummary: '提供弱勢家庭及急難救助使用。',
      requestDescription:
        '罐頭食品需為全新未開封，並確認保存期限及包裝完整。',
      contactPerson: '陳志偉',
      contactPhone: '0955-678-901',
      receiveLocation: '800 高雄市新興區中正三路200號',
      otherDescription: '若數量較多，請事先聯絡安排收貨。'
    },
    {
      id: 8,
      title: '罐頭食品',
      image: '',
      category: '食物',
      target: '弱勢家庭',

      quantity: 120,
      organization: '社團法人高雄市弱勢關懷協會',
      address: '800 高雄市新興區中正三路200號',

      status: '全新',
      receiveMethod: '面交',
      requestSummary: '提供弱勢家庭及急難救助使用。',
      requestDescription:
        '罐頭食品需為全新未開封，並確認保存期限及包裝完整。',
      contactPerson: '陳志偉',
      contactPhone: '0955-678-901',
      receiveLocation: '800 高雄市新興區中正三路200號',
      otherDescription: '若數量較多，請事先聯絡安排收貨。'
    },
    {
      id: 9,
      title: '罐頭食品',
      image: '',
      category: '食物',
      target: '弱勢家庭',

      quantity: 120,
      organization: '社團法人高雄市弱勢關懷協會',
      address: '800 高雄市新興區中正三路200號',

      status: '全新',
      receiveMethod: '面交',
      requestSummary: '提供弱勢家庭及急難救助使用。',
      requestDescription:
        '罐頭食品需為全新未開封，並確認保存期限及包裝完整。',
      contactPerson: '陳志偉',
      contactPhone: '0955-678-901',
      receiveLocation: '800 高雄市新興區中正三路200號',
      otherDescription: '若數量較多，請事先聯絡安排收貨。'
    },
    {
      id: 10,
      title: '罐頭食品',
      image: '',
      category: '食物',
      target: '弱勢家庭',

      quantity: 120,
      organization: '社團法人高雄市弱勢關懷協會',
      address: '800 高雄市新興區中正三路200號',

      status: '全新',
      receiveMethod: '面交',
      requestSummary: '提供弱勢家庭及急難救助使用。',
      requestDescription:
        '罐頭食品需為全新未開封，並確認保存期限及包裝完整。',
      contactPerson: '陳志偉',
      contactPhone: '0955-678-901',
      receiveLocation: '800 高雄市新興區中正三路200號',
      otherDescription: '若數量較多，請事先聯絡安排收貨。'
    },
    {
      id: 11,
      title: '罐頭食品',
      image: '',
      category: '食物',
      target: '弱勢家庭',

      quantity: 120,
      organization: '社團法人高雄市弱勢關懷協會',
      address: '800 高雄市新興區中正三路200號',

      status: '全新',
      receiveMethod: '面交',
      requestSummary: '提供弱勢家庭及急難救助使用。',
      requestDescription:
        '罐頭食品需為全新未開封，並確認保存期限及包裝完整。',
      contactPerson: '陳志偉',
      contactPhone: '0955-678-901',
      receiveLocation: '800 高雄市新興區中正三路200號',
      otherDescription: '若數量較多，請事先聯絡安排收貨。'
    }
  ];

  getDailyDonations(): DailyDonation[] {
    return this.dailyDonations;
  }

  getDailyDonationById(id: number): DailyDonation | undefined {
    return this.dailyDonations.find(item => item.id === id);
  }
}
