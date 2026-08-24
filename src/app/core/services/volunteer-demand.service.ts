import { Injectable } from '@angular/core';
import { VolunteerDemand } from '../../models/volunteer/volunteer-demand';

@Injectable({
  providedIn: 'root',
})
export class VolunteerDemandService {
  private readonly volunteers: VolunteerDemand[] = [
    {
      id: 1,
      title: '物資搬運',
      serviceItems: ['物資搬運', '物資分類', '物資整理'],
      organization: '花蓮縣光復鄉衛生所',
      required: 10,
      registered: 6,
      location: '花蓮縣光復鄉',
      address: '花蓮縣光復鄉大馬村中學街158號',
      date: '2026/08/20',
      serviceTime: '08:00 - 17:00',
      description: '協助災區物資搬運、分類及整理。',
      requirements: ['年滿 18 歲', '能配合物資搬運工作', '請穿著方便活動的服裝'],
      contactPerson: '王先生',
      phone: '03-1234567',
      contactAddress: '花蓮縣花蓮市中山路 100 號',
    },
    {
      id: 2,
      title: '環境清潔',
      serviceItems: ['環境清潔', '物資搬運'],
      organization: '花蓮縣立光復國民中學',
      required: 8,
      registered: 3,
      location: '花蓮縣光復鄉',
      address: '花蓮縣光復鄉林森路200號',
      date: '2026/08/21',
      serviceTime: '09:00 - 16:00',
      description: '協助校園與周邊環境清潔。',
      requirements: ['年滿 18 歲', '能配合戶外清潔工作', '請穿著方便活動的服裝'],
      contactPerson: '李小姐',
      phone: '03-8765432',
      contactAddress: '花蓮縣光復鄉林森路200號',
    },
    {
      id: 3,
      title: '災民陪伴',
      serviceItems: ['災民陪伴', '物資發放', '生活協助'],
      organization: '花蓮縣鳳林鎮長橋國民小學',
      required: 6,
      registered: 2,
      location: '花蓮縣鳳林鎮',
      address: '花蓮縣鳳林鎮長橋里長橋路2號',
      date: '2026/08/22',
      serviceTime: '10:00 - 18:00',
      description: '陪伴安置中心居民並協助日常需求。',
      requirements: ['具備耐心與同理心', '配合現場工作人員指示', '工作期間維持良好溝通'],
      contactPerson: '陳先生',
      phone: '03-7654321',
      contactAddress: '花蓮縣鳳林鎮長橋路2號',
    },
  ];

  getVolunteers(): VolunteerDemand[] {
    return this.volunteers;
  }

  getVolunteerById(id: number): VolunteerDemand | undefined {
    return this.volunteers.find((volunteer) => volunteer.id === id);
  }
}
