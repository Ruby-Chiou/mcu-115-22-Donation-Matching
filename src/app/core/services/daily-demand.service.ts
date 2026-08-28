import { Injectable } from '@angular/core';
import { DailyDemand, CreateDailyDemand } from '../../models/agency/daily-demand';

@Injectable({
  providedIn: 'root',
})
export class DailyDemandService {
  demands: DailyDemand[] = [
    {
      id: 1,
      item: '白米',
      amount: 50,
      unit: '包',
      amountDescription: '每包5公斤，需完整包裝且無受潮情況。',
      reason: '服務對象近期家庭糧食不足，需要穩定補充基本主食。',
      description: '希望提供一般家庭食用白米，保存期限需充足，包裝不可破損或受潮。',
      category: '食品與飲用水',

      serviceTargets: {
        老人: true,
        嬰幼兒: false,
        孩童: true,
        青少年: false,
        身障: false,
        貧困: true,
        重症照護: false,
        動物: false,
        無家者: false,
      },
      customServiceTargets: ['低收入家庭'],

      conditions: {
        全新: '接受',
        二手: '不接受',
        有擦痕: '',
        過期: '不接受',
        毀損: '不接受',
      },
      customConditions: ['包裝完整', '不可受潮'],

      priority: '普通',
      status: '上架',
      remaining: 32,

      receiveMethod: {
        寄送: true,
        面交: false,
      },

      recipient: '王小美',
      address: '宜蘭縣宜蘭市中山路100號',
      phone: '0912345678',

      contactTimeWeekday: true,
      contactTimeWeekend: false,
      contactTimeMorning: true,
      contactTimeAfternoon: true,
      contactTimeEvening: false,

      brand: '不限品牌',
      note: '若數量不足，可依實際庫存分批提供。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-01T09:00:00.000Z',
      publishedAt: '2026-08-01T09:10:00.000Z',
      expectedOffShelfAt: '2026-09-30T09:10:00.000Z',
    },

    {
      id: 2,
      item: '成人紙尿褲',
      amount: 30,
      unit: '包',
      amountDescription: 'L號成人紙尿褲，每包約10至12片。',
      reason: '照護長者及行動不便者日常生活所需。',
      description: '希望提供吸收力良好的成人紙尿褲，以L號為主，尺寸可依實際需求調整。',
      category: '醫療與照護用品',

      serviceTargets: {
        老人: true,
        嬰幼兒: false,
        孩童: false,
        青少年: false,
        身障: true,
        貧困: true,
        重症照護: true,
        動物: false,
        無家者: false,
      },
      customServiceTargets: ['臥床長者', '照護家庭'],

      conditions: {
        全新: '接受',
        二手: '不接受',
        有擦痕: '',
        過期: '不接受',
        毀損: '不接受',
      },
      customConditions: ['未拆封'],

      priority: '緊急',
      status: '上架',
      remaining: 12,

      receiveMethod: {
        寄送: true,
        面交: true,
      },

      recipient: '陳怡君',
      address: '宜蘭縣羅東鎮民生路25號',
      phone: '0922334455',

      contactTimeWeekday: true,
      contactTimeWeekend: true,
      contactTimeMorning: false,
      contactTimeAfternoon: true,
      contactTimeEvening: true,

      brand: '不限品牌，但希望吸收力較佳。',
      note: '若可提供不同尺寸，請先聯絡確認。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-03T10:00:00.000Z',
      publishedAt: '2026-08-03T10:05:00.000Z',
      expectedOffShelfAt: '2026-09-02T10:05:00.000Z',
    },

    {
      id: 3,
      item: '嬰兒奶粉',
      amount: 20,
      unit: '罐',
      amountDescription: '0至1歲嬰幼兒適用奶粉。',
      reason: '協助有嬰幼兒的家庭補充日常奶粉。',
      description: '希望提供適合嬰幼兒食用的奶粉，品牌不限，但需在有效期限內。',
      category: '嬰幼兒用品',

      serviceTargets: {
        老人: false,
        嬰幼兒: true,
        孩童: true,
        青少年: false,
        身障: false,
        貧困: true,
        重症照護: false,
        動物: false,
        無家者: false,
      },
      customServiceTargets: ['嬰幼兒家庭'],

      conditions: {
        全新: '接受',
        二手: '不接受',
        有擦痕: '不接受',
        過期: '不接受',
        毀損: '不接受',
      },
      customConditions: ['有效期限至少6個月'],

      priority: '非常緊急',
      status: '上架',
      remaining: 5,

      receiveMethod: {
        寄送: true,
        面交: false,
      },

      recipient: '林雅婷',
      address: '宜蘭縣礁溪鄉溫泉路88號',
      phone: '0933445566',

      contactTimeWeekday: true,
      contactTimeWeekend: false,
      contactTimeMorning: true,
      contactTimeAfternoon: false,
      contactTimeEvening: true,

      brand: '品牌不限，若為特殊配方請先聯絡。',
      note: '奶粉有效期限請務必確認。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-05T08:30:00.000Z',
      publishedAt: '2026-08-05T08:40:00.000Z',
      expectedOffShelfAt: '2026-08-19T08:40:00.000Z',
    },

    {
      id: 4,
      item: '冬季外套',
      amount: 100,
      unit: '件',
      amountDescription: '成人及青少年冬季外套，尺寸不限。',
      reason: '冬季來臨前協助弱勢家庭準備保暖衣物。',
      description: '男女款皆可，顏色不限，以乾淨、完整且仍可正常穿著為主。',
      category: '衣物與保暖用品',

      serviceTargets: {
        老人: true,
        嬰幼兒: false,
        孩童: true,
        青少年: true,
        身障: true,
        貧困: true,
        重症照護: false,
        動物: false,
        無家者: true,
      },
      customServiceTargets: ['街友', '弱勢家庭'],

      conditions: {
        全新: '接受',
        二手: '接受',
        有擦痕: '接受',
        過期: '',
        毀損: '不接受',
      },
      customConditions: ['可接受些微使用痕跡'],

      priority: '普通',
      status: '上架',
      remaining: 70,

      receiveMethod: {
        寄送: false,
        面交: true,
      },

      recipient: '張志豪',
      address: '宜蘭縣冬山鄉冬山路200號',
      phone: '0944556677',

      contactTimeWeekday: false,
      contactTimeWeekend: true,
      contactTimeMorning: false,
      contactTimeAfternoon: true,
      contactTimeEvening: false,

      brand: '不限品牌',
      note: '尺寸較多者可先提供尺寸清單。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-06T11:00:00.000Z',
      publishedAt: '2026-08-06T11:10:00.000Z',
      expectedOffShelfAt: '2026-10-05T11:10:00.000Z',
    },

    {
      id: 5,
      item: '洗衣精',
      amount: 80,
      unit: '瓶',
      amountDescription: '一般家庭用洗衣精，每瓶約2公升。',
      reason: '提供弱勢家庭日常清潔用品。',
      description: '液體洗衣精、洗衣粉皆可，容量不限，但希望以一般家庭使用規格為主。',
      category: '清潔與衛生用品',

      serviceTargets: {
        老人: false,
        嬰幼兒: false,
        孩童: false,
        青少年: false,
        身障: false,
        貧困: true,
        重症照護: false,
        動物: false,
        無家者: true,
      },
      customServiceTargets: ['獨居者'],

      conditions: {
        全新: '接受',
        二手: '',
        有擦痕: '',
        過期: '不接受',
        毀損: '不接受',
      },
      customConditions: ['瓶身無破損'],

      priority: '普通',
      status: '隱藏',
      remaining: 80,

      receiveMethod: {
        寄送: true,
        面交: true,
      },

      recipient: '李佩珊',
      address: '宜蘭縣蘇澳鎮中正路56號',
      phone: '0955667788',

      contactTimeWeekday: true,
      contactTimeWeekend: true,
      contactTimeMorning: true,
      contactTimeAfternoon: true,
      contactTimeEvening: false,

      brand: '不限品牌',
      note: '目前暫時隱藏，待確認實際需求後重新上架。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-07T09:00:00.000Z',
    },

    {
      id: 6,
      item: '女性衛生棉',
      amount: 200,
      unit: '包',
      amountDescription: '日用、夜用皆可，尺寸不限。',
      reason: '提供女性服務對象日常生理用品。',
      description: '希望提供未拆封衛生棉，日用及夜用皆可，品牌不限。',
      category: '女性生理用品',

      serviceTargets: {
        老人: false,
        嬰幼兒: false,
        孩童: false,
        青少年: true,
        身障: true,
        貧困: true,
        重症照護: false,
        動物: false,
        無家者: true,
      },
      customServiceTargets: ['女性弱勢族群'],

      conditions: {
        全新: '接受',
        二手: '不接受',
        有擦痕: '不接受',
        過期: '不接受',
        毀損: '不接受',
      },
      customConditions: ['未拆封'],

      priority: '緊急',
      status: '上架',
      remaining: 120,

      receiveMethod: {
        寄送: true,
        面交: false,
      },

      recipient: '吳佳玲',
      address: '宜蘭縣宜蘭市健康路123號',
      phone: '0966778899',

      contactTimeWeekday: true,
      contactTimeWeekend: false,
      contactTimeMorning: false,
      contactTimeAfternoon: true,
      contactTimeEvening: true,

      brand: '不限品牌',
      note: '可接受不同品牌混合提供。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-08T14:00:00.000Z',
      publishedAt: '2026-08-08T14:10:00.000Z',
      expectedOffShelfAt: '2026-09-07T14:10:00.000Z',
    },

    {
      id: 7,
      item: '寵物飼料',
      amount: 40,
      unit: '包',
      amountDescription: '犬用或貓用乾飼料皆可，每包至少2公斤。',
      reason: '協助弱勢飼主及動物照護單位。',
      description: '狗飼料、貓飼料皆可，若為特殊配方請註明適用對象。',
      category: '寵物與動物用品',

      serviceTargets: {
        老人: false,
        嬰幼兒: false,
        孩童: false,
        青少年: false,
        身障: false,
        貧困: true,
        重症照護: false,
        動物: true,
        無家者: false,
      },
      customServiceTargets: ['弱勢飼主', '中途之家'],

      conditions: {
        全新: '接受',
        二手: '不接受',
        有擦痕: '',
        過期: '不接受',
        毀損: '不接受',
      },
      customConditions: ['有效期限內'],

      priority: '普通',
      status: '上架',
      remaining: 25,

      receiveMethod: {
        寄送: false,
        面交: true,
      },

      recipient: '許家豪',
      address: '宜蘭縣五結鄉中興路77號',
      phone: '0977889900',

      contactTimeWeekday: false,
      contactTimeWeekend: true,
      contactTimeMorning: true,
      contactTimeAfternoon: false,
      contactTimeEvening: true,

      brand: '不限品牌',
      note: '請於提供前確認犬貓種類。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-09T10:00:00.000Z',
      publishedAt: '2026-08-09T10:15:00.000Z',
      expectedOffShelfAt: '2026-10-08T10:15:00.000Z',
    },

    {
      id: 8,
      item: 'LED手電筒',
      amount: 25,
      unit: '支',
      amountDescription: '可攜式LED手電筒，需附電池或可充電。',
      reason: '提供防災及緊急照明使用。',
      description: '希望亮度足夠且操作簡單，若附電池請確認電池仍可正常使用。',
      category: '防災與照明用品',

      serviceTargets: {
        老人: true,
        嬰幼兒: false,
        孩童: false,
        青少年: false,
        身障: true,
        貧困: true,
        重症照護: true,
        動物: false,
        無家者: true,
      },
      customServiceTargets: ['防災家庭'],

      conditions: {
        全新: '接受',
        二手: '接受',
        有擦痕: '接受',
        過期: '',
        毀損: '不接受',
      },
      customConditions: ['功能正常'],

      priority: '非常緊急',
      status: '上架',
      remaining: 8,

      receiveMethod: {
        寄送: true,
        面交: true,
      },

      recipient: '黃志偉',
      address: '宜蘭縣頭城鎮開蘭路66號',
      phone: '0988990011',

      contactTimeWeekday: true,
      contactTimeWeekend: true,
      contactTimeMorning: true,
      contactTimeAfternoon: true,
      contactTimeEvening: true,

      brand: '不限品牌',
      note: '若為充電式產品請附充電線。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-10T08:00:00.000Z',
      publishedAt: '2026-08-10T08:05:00.000Z',
      expectedOffShelfAt: '2026-08-24T08:05:00.000Z',
    },

    {
      id: 9,
      item: '手機充電線',
      amount: 60,
      unit: '條',
      amountDescription: 'USB Type-C充電線，長度1公尺以上。',
      reason: '提供無家者及弱勢服務對象維持通訊。',
      description: 'Type-C規格為主，需能正常充電，長度至少1公尺。',
      category: '通訊與求救用品',

      serviceTargets: {
        老人: false,
        嬰幼兒: false,
        孩童: false,
        青少年: true,
        身障: false,
        貧困: true,
        重症照護: true,
        動物: false,
        無家者: true,
      },
      customServiceTargets: ['需要通訊協助者'],

      conditions: {
        全新: '接受',
        二手: '接受',
        有擦痕: '接受',
        過期: '',
        毀損: '不接受',
      },
      customConditions: ['可接受些微外觀使用痕跡'],

      priority: '緊急',
      status: '上架',
      remaining: 41,

      receiveMethod: {
        寄送: true,
        面交: false,
      },

      recipient: '周明哲',
      address: '宜蘭縣羅東鎮公正路150號',
      phone: '0999001122',

      contactTimeWeekday: true,
      contactTimeWeekend: true,
      contactTimeMorning: false,
      contactTimeAfternoon: false,
      contactTimeEvening: true,

      brand: '不限品牌，Apple Lightning及Type-C皆可。',
      note: '請勿提供已斷裂或接觸不良的充電線。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-11T12:00:00.000Z',
      publishedAt: '2026-08-11T12:10:00.000Z',
      expectedOffShelfAt: '2026-09-10T12:10:00.000Z',
    },

    {
      id: 10,
      item: '鍋具',
      amount: 15,
      unit: '組',
      amountDescription: '一般家庭使用鍋具組。',
      reason: '協助安置家庭恢復基本生活用品。',
      description: '湯鍋、炒鍋或鍋具組皆可，需能正常使用。',
      category: '生活與炊事用品',

      serviceTargets: {
        老人: false,
        嬰幼兒: false,
        孩童: true,
        青少年: false,
        身障: true,
        貧困: true,
        重症照護: false,
        動物: false,
        無家者: false,
      },
      customServiceTargets: ['受災安置家庭'],

      conditions: {
        全新: '接受',
        二手: '接受',
        有擦痕: '接受',
        過期: '',
        毀損: '不接受',
      },
      customConditions: ['鍋底不可嚴重變形'],

      priority: '普通',
      status: '下架',
      remaining: 0,

      receiveMethod: {
        寄送: false,
        面交: true,
      },

      recipient: '蔡宜芳',
      address: '宜蘭縣壯圍鄉壯五路33號',
      phone: '0900112233',

      contactTimeWeekday: true,
      contactTimeWeekend: false,
      contactTimeMorning: true,
      contactTimeAfternoon: true,
      contactTimeEvening: false,

      brand: '不限品牌',
      note: '需求已完成，因此目前已下架。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-07-01T09:00:00.000Z',
      publishedAt: '2026-07-01T09:10:00.000Z',
      expectedOffShelfAt: '2026-08-26T09:10:00.000Z',
    },

    {
      id: 11,
      item: '折疊床',
      amount: 8,
      unit: '張',
      amountDescription: '單人折疊床，收納後方便搬運。',
      reason: '提供臨時安置家庭使用。',
      description: '床架需完整且可正常收折，床面不可有明顯破損。',
      category: '居住安置與修繕用品',

      serviceTargets: {
        老人: false,
        嬰幼兒: false,
        孩童: false,
        青少年: false,
        身障: true,
        貧困: true,
        重症照護: true,
        動物: false,
        無家者: true,
      },
      customServiceTargets: ['臨時安置戶', '獨居長者'],

      conditions: {
        全新: '接受',
        二手: '接受',
        有擦痕: '接受',
        過期: '',
        毀損: '不接受',
      },
      customConditions: ['床架功能正常', '無明顯鏽蝕'],

      priority: '緊急',
      status: '上架',
      remaining: 3,

      receiveMethod: {
        寄送: false,
        面交: true,
      },

      recipient: '林建宏',
      address: '宜蘭縣員山鄉員山路99號',
      phone: '0911223344',

      contactTimeWeekday: false,
      contactTimeWeekend: true,
      contactTimeMorning: false,
      contactTimeAfternoon: true,
      contactTimeEvening: true,

      brand: '不限品牌',
      note: '物品較大，面交時請提前確認車輛空間。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-12T15:00:00.000Z',
      publishedAt: '2026-08-12T15:20:00.000Z',
      expectedOffShelfAt: '2026-09-11T15:20:00.000Z',
    },

    {
      id: 12,
      item: '礦泉水',
      amount: 999,
      unit: '箱',
      amountDescription: '每箱24瓶，每瓶600毫升。',
      reason: '提供弱勢家庭及臨時安置場所飲用。',
      description: '一般瓶裝飲用水即可，需在有效期限內，包裝完整無破損。',
      category: '食品與飲用水',

      serviceTargets: {
        老人: true,
        嬰幼兒: true,
        孩童: true,
        青少年: true,
        身障: true,
        貧困: true,
        重症照護: true,
        動物: false,
        無家者: true,
      },
      customServiceTargets: ['臨時避難所'],

      conditions: {
        全新: '接受',
        二手: '不接受',
        有擦痕: '',
        過期: '不接受',
        毀損: '不接受',
      },
      customConditions: ['瓶身無破損'],

      priority: '普通',
      status: '上架',
      remaining: 999,

      receiveMethod: {
        寄送: true,
        面交: true,
      },

      recipient: '鄭雅文',
      address: '宜蘭縣宜蘭市環河路12號',
      phone: '0922446688',

      contactTimeWeekday: true,
      contactTimeWeekend: true,
      contactTimeMorning: true,
      contactTimeAfternoon: true,
      contactTimeEvening: true,

      brand: '不限品牌',
      note: '此筆資料用於測試較大數量及多需求對象。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-13T08:00:00.000Z',
      publishedAt: '2026-08-13T08:10:00.000Z',
      expectedOffShelfAt: '2026-10-12T08:10:00.000Z',
    },

    {
      id: 13,
      item: '兒童運動鞋',
      amount: 35,
      unit: '雙',
      amountDescription: '國小孩童適用鞋款，尺寸20至24號皆可。',
      reason: '提供弱勢兒童上學及日常活動使用。',
      description: '希望鞋底仍有足夠止滑能力，男女款皆可，顏色不限。',
      category: '衣物與保暖用品',

      serviceTargets: {
        老人: false,
        嬰幼兒: false,
        孩童: true,
        青少年: true,
        身障: true,
        貧困: true,
        重症照護: false,
        動物: false,
        無家者: false,
      },
      customServiceTargets: ['弱勢兒童'],

      conditions: {
        全新: '接受',
        二手: '接受',
        有擦痕: '接受',
        過期: '',
        毀損: '不接受',
      },
      customConditions: ['鞋底不可嚴重磨損'],

      priority: '普通',
      status: '上架',
      remaining: 18,

      receiveMethod: {
        寄送: true,
        面交: true,
      },

      recipient: '郭怡萱',
      address: '宜蘭縣三星鄉三星路45號',
      phone: '0933557799',

      contactTimeWeekday: true,
      contactTimeWeekend: true,
      contactTimeMorning: true,
      contactTimeAfternoon: false,
      contactTimeEvening: false,

      brand: '不限品牌',
      note: '若尺寸不同，可先提供尺寸與數量。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-14T10:00:00.000Z',
      publishedAt: '2026-08-14T10:15:00.000Z',
      expectedOffShelfAt: '2026-10-13T10:15:00.000Z',
    },

    {
      id: 14,
      item: '長照照護墊',
      amount: 120,
      unit: '片',
      amountDescription: '成人照護使用，尺寸不限。',
      reason: '協助長期照護家庭減輕照護用品支出。',
      description: '拋棄式照護墊即可，需完整未拆封，吸收力正常。',
      category: '醫療與照護用品',

      serviceTargets: {
        老人: true,
        嬰幼兒: false,
        孩童: false,
        青少年: false,
        身障: true,
        貧困: true,
        重症照護: true,
        動物: false,
        無家者: false,
      },
      customServiceTargets: ['長照家庭'],

      conditions: {
        全新: '接受',
        二手: '不接受',
        有擦痕: '不接受',
        過期: '不接受',
        毀損: '不接受',
      },
      customConditions: ['未拆封'],

      priority: '非常緊急',
      status: '上架',
      remaining: 20,

      receiveMethod: {
        寄送: true,
        面交: false,
      },

      recipient: '吳淑芬',
      address: '宜蘭縣羅東鎮站前路18號',
      phone: '0944668800',

      contactTimeWeekday: true,
      contactTimeWeekend: false,
      contactTimeMorning: true,
      contactTimeAfternoon: true,
      contactTimeEvening: true,

      brand: '不限品牌',
      note: '照護用品需求較急，請優先聯絡。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-15T07:30:00.000Z',
      publishedAt: '2026-08-15T07:40:00.000Z',
      expectedOffShelfAt: '2026-08-29T07:40:00.000Z',
    },

    {
      id: 15,
      item: '大容量保溫瓶',
      amount: 12,
      unit: '個',
      amountDescription: '容量約1500毫升以上。',
      reason: '供戶外服務及長時間外出使用。',
      description: '需具備保溫功能，容量以1500毫升以上為佳。',
      category: '生活與炊事用品',

      serviceTargets: {
        老人: false,
        嬰幼兒: false,
        孩童: false,
        青少年: true,
        身障: true,
        貧困: true,
        重症照護: false,
        動物: false,
        無家者: true,
      },
      customServiceTargets: ['戶外服務人員'],

      conditions: {
        全新: '接受',
        二手: '接受',
        有擦痕: '接受',
        過期: '',
        毀損: '不接受',
      },
      customConditions: ['瓶蓋完整', '無漏水'],

      priority: '普通',
      status: '上架',
      remaining: 6,

      receiveMethod: {
        寄送: false,
        面交: true,
      },

      recipient: '何俊賢',
      address: '宜蘭縣礁溪鄉中山路101號',
      phone: '0955779900',

      contactTimeWeekday: false,
      contactTimeWeekend: true,
      contactTimeMorning: false,
      contactTimeAfternoon: true,
      contactTimeEvening: true,

      brand: '不限品牌',
      note: '希望以不鏽鋼材質為主。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-16T13:00:00.000Z',
      publishedAt: '2026-08-16T13:15:00.000Z',
      expectedOffShelfAt: '2026-10-15T13:15:00.000Z',
    },

    {
      id: 16,
      item: '急救箱',
      amount: 10,
      unit: '組',
      amountDescription: '基本家庭急救用品組。',
      reason: '提供弱勢家庭及社區據點基本急救用品。',
      description: '希望包含基本紗布、繃帶、消毒用品等，內容物需在有效期限內。',
      category: '醫療與照護用品',

      serviceTargets: {
        老人: true,
        嬰幼兒: true,
        孩童: true,
        青少年: true,
        身障: true,
        貧困: true,
        重症照護: true,
        動物: true,
        無家者: true,
      },
      customServiceTargets: ['社區據點', '志工服務站', '臨時避難場所'],

      conditions: {
        全新: '接受',
        二手: '',
        有擦痕: '',
        過期: '不接受',
        毀損: '不接受',
      },
      customConditions: ['藥品及耗材不得過期', '外盒完整'],

      priority: '緊急',
      status: '上架',
      remaining: 4,

      receiveMethod: {
        寄送: true,
        面交: true,
      },

      recipient: '蘇冠廷',
      address: '宜蘭縣五結鄉利成路38號',
      phone: '0966880011',

      contactTimeWeekday: true,
      contactTimeWeekend: true,
      contactTimeMorning: true,
      contactTimeAfternoon: true,
      contactTimeEvening: false,

      brand: '不限品牌',
      note: '內容物若不完整，請先告知可提供的品項。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-17T09:00:00.000Z',
      publishedAt: '2026-08-17T09:10:00.000Z',
      expectedOffShelfAt: '2026-09-16T09:10:00.000Z',
    },

    {
      id: 17,
      item: '清潔消毒用品組',
      amount: 9999,
      unit: '組',
      amountDescription: '包含酒精、清潔劑、垃圾袋及其他日常清潔用品。',
      reason: '測試大量需求數量及長文字內容。',
      description:
        '可接受各種家庭清潔用品，包含酒精、清潔劑、垃圾袋、抹布、手套等，只要產品仍在有效期限內且包裝完整即可提供，若數量較多可以分批配送。',
      category: '清潔與衛生用品',

      serviceTargets: {
        老人: true,
        嬰幼兒: true,
        孩童: true,
        青少年: false,
        身障: true,
        貧困: true,
        重症照護: true,
        動物: false,
        無家者: true,
      },
      customServiceTargets: ['社區清潔隊', '弱勢家庭'],

      conditions: {
        全新: '接受',
        二手: '',
        有擦痕: '接受',
        過期: '不接受',
        毀損: '不接受',
      },
      customConditions: ['未拆封優先', '瓶身無滲漏', '效期至少三個月'],

      priority: '普通',
      status: '上架',
      remaining: 8888,

      receiveMethod: {
        寄送: true,
        面交: true,
      },

      recipient: '測試長文字資料使用者',
      address: '宜蘭縣宜蘭市神農路一段100號',
      phone: '0977990011',

      contactTimeWeekday: true,
      contactTimeWeekend: true,
      contactTimeMorning: true,
      contactTimeAfternoon: true,
      contactTimeEvening: true,

      brand: '品牌不限，只要符合基本清潔用品需求且產品包裝完整、有效期限充足即可接受。',
      note: '這筆資料主要用於測試需求物、需求描述、品牌、備註及數量等欄位的較長文字顯示與限制效果。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-18T11:00:00.000Z',
      publishedAt: '2026-08-18T11:20:00.000Z',
      expectedOffShelfAt: '2026-10-17T11:20:00.000Z',
    },

    {
      id: 18,
      item: '兒童書籍',
      amount: 75,
      unit: '本',
      amountDescription: '適合國小至國中學生閱讀。',
      reason: '提供弱勢兒童閱讀及學習資源。',
      description: '故事書、科普書、工具書皆可，內容需適合兒童閱讀。',
      category: '其他',

      serviceTargets: {
        老人: false,
        嬰幼兒: false,
        孩童: true,
        青少年: true,
        身障: true,
        貧困: true,
        重症照護: false,
        動物: false,
        無家者: false,
      },
      customServiceTargets: ['偏鄉學童'],

      conditions: {
        全新: '接受',
        二手: '接受',
        有擦痕: '接受',
        過期: '',
        毀損: '不接受',
      },
      customConditions: ['內頁完整', '可有輕微書寫痕跡'],

      priority: '普通',
      status: '隱藏',
      remaining: 75,

      receiveMethod: {
        寄送: false,
        面交: true,
      },

      recipient: '陳冠宇',
      address: '宜蘭縣三星鄉三星路二段88號',
      phone: '0988001122',

      contactTimeWeekday: false,
      contactTimeWeekend: true,
      contactTimeMorning: true,
      contactTimeAfternoon: true,
      contactTimeEvening: false,

      brand: '',
      note: '等待服務單位確認實際需求。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-19T10:00:00.000Z',
    },

    {
      id: 19,
      item: '口罩',
      amount: 500,
      unit: '片',
      amountDescription: '成人及兒童醫療口罩皆可。',
      reason: '提供日常防護使用。',
      description: '醫療口罩、一般防護口罩皆可，需完整未拆封。',
      category: '醫療與照護用品',

      serviceTargets: {
        老人: true,
        嬰幼兒: false,
        孩童: true,
        青少年: true,
        身障: true,
        貧困: true,
        重症照護: true,
        動物: false,
        無家者: true,
      },
      customServiceTargets: ['需要防護用品者'],

      conditions: {
        全新: '接受',
        二手: '不接受',
        有擦痕: '不接受',
        過期: '不接受',
        毀損: '不接受',
      },
      customConditions: ['未拆封', '包裝完整'],

      priority: '非常緊急',
      status: '上架',
      remaining: 250,

      receiveMethod: {
        寄送: true,
        面交: false,
      },

      recipient: '王志明',
      address: '宜蘭縣羅東鎮中正北路66號',
      phone: '0901223344',

      contactTimeWeekday: true,
      contactTimeWeekend: true,
      contactTimeMorning: true,
      contactTimeAfternoon: true,
      contactTimeEvening: true,

      brand: '不限品牌',
      note: '成人及兒童尺寸皆可，請註明尺寸比例。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-20T07:00:00.000Z',
      publishedAt: '2026-08-20T07:05:00.000Z',
      expectedOffShelfAt: '2026-09-03T07:05:00.000Z',
    },

    {
      id: 20,
      item: '居家修繕工具組',
      amount: 20,
      unit: '組',
      amountDescription: '基本螺絲起子、鉗子、扳手等居家修繕工具。',
      reason: '協助居住環境需要簡易修繕的家庭。',
      description: '希望提供基本居家修繕工具，工具可有使用痕跡但必須能正常操作。',
      category: '居住安置與修繕用品',

      serviceTargets: {
        老人: true,
        嬰幼兒: false,
        孩童: false,
        青少年: false,
        身障: true,
        貧困: true,
        重症照護: false,
        動物: false,
        無家者: true,
      },
      customServiceTargets: ['居住環境修繕戶', '獨居老人', '弱勢家庭'],

      conditions: {
        全新: '接受',
        二手: '接受',
        有擦痕: '接受',
        過期: '',
        毀損: '不接受',
      },
      customConditions: ['工具功能正常', '不可缺少主要零件'],

      priority: '緊急',
      status: '上架',
      remaining: 9,

      receiveMethod: {
        寄送: false,
        面交: true,
      },

      recipient: '林國華',
      address: '宜蘭縣冬山鄉義成路三段58號',
      phone: '0915667788',

      contactTimeWeekday: true,
      contactTimeWeekend: true,
      contactTimeMorning: false,
      contactTimeAfternoon: true,
      contactTimeEvening: true,

      brand: '不限品牌，可接受二手工具，但需確認工具仍可正常使用。',
      note: '體積較大，建議優先安排面交。',

      image: [],
      imageFileNames: [],

      createdAt: '2026-08-21T14:00:00.000Z',
      publishedAt: '2026-08-21T14:10:00.000Z',
      expectedOffShelfAt: '2026-09-20T14:10:00.000Z',
    },
  ];

  addDemand(demand: CreateDailyDemand) {
    this.demands.push({
      ...demand,
      id: this.demands.length + 1,
    });
  }
  getDemands() {
    return this.demands;
  }

  getDemandById(id: number): DailyDemand | undefined {
    return this.demands.find((demand) => demand.id === id);
  }

  updateDemand(updatedDemand: DailyDemand) {
    const index = this.demands.findIndex((item) => item.id === updatedDemand.id);

    if (index !== -1) {
      this.demands[index] = updatedDemand;
    }
  }

  deleteDemand(id: number) {
    this.demands = this.demands.filter((item) => item.id !== id);
  }
}
