import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface MaterialNeed {
  id: number;
  item: string;
  quantity: number;
  unit: string;

}

interface VolunteerNeed {
  id: number;
  title: string;
  people: number;
  location: string;

}

interface DisasterSection {
  id: number;
  sectionTitle: string;
  title: string;
  description: string;
  backgroundImage:string;

  materialNeeds: MaterialNeed[];
  volunteerNeeds: VolunteerNeed[];
}

@Component({
  selector: 'app-needs',
  imports: [RouterLink],
  templateUrl: './needs.component.html',
  styleUrl: './needs.component.scss',
})
export class NeedsComponent {

  protected readonly sections = signal<DisasterSection[]>([
    {
      id: 1,
      sectionTitle: '土石流災害救助',
      title: '花蓮馬太鞍溪堰塞湖災害',
      description:
        '查看目前災區所需的物資與志工需求，您的每一份捐助與每一次參與，都能為受災家庭帶來更多希望。 \n\n'
        +'2025年9月23日，台灣花蓮縣馬太鞍溪沿岸區域爆發嚴重水災， \n\n'
        +'其肇因於2024年4月3日花蓮地震鬆動土石與2025年7月21日颱風薇帕外圍環流夾帶的雨勢引發山崩， \n\n'
        +'並於馬太鞍溪上游萬榮鄉處形成巨大的堰塞湖。',
       backgroundImage:'https://upload.wikimedia.org/wikipedia/commons/5/5b/%E8%BE%B2%E6%A5%AD%E9%83%A8%E6%9E%97%E6%A5%AD%E7%BD%B22025%E5%B9%B49%E6%9C%8826%E6%97%A5%E8%8A%B1%E8%93%AE%E9%A6%AC%E5%A4%AA%E9%9E%8D%E6%BA%AA%E5%A0%B0%E5%A1%9E%E6%B9%96%E7%A9%BA%E6%8B%8D%E5%BD%B1%E5%83%8F01.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=original',
      materialNeeds: [
        {
          id: 1,
          item: '礦泉水',
          quantity: 100,
          unit: '箱',

        },
        {
          id: 2,
          item: '泡麵',
          quantity: 80,
          unit: '箱',
        },
        {
          id: 3,
          item: '毛毯',
          quantity: 50,
          unit: '件',
        },

      ],

      volunteerNeeds: [
        {
          id: 1,
          title: '路面清理',
          people: 700,
          location: '光復鄉',

        },
        {
          id: 2,
          title: '物資分類',
          people: 100,
          location: '萬榮鄉',
        },
        {
          id: 3,
          title: '疏通排水',
          people: 200,
          location: '鳳林鎮',
        },
        {
          id: 4,
          title: '清理淤泥',
          people: 100,
          location: '壽豐鄉',
        },
      ],
    },
    {
      id: 2,
      sectionTitle: '地震救助',
      title: '2024年花蓮地震（又稱0403花蓮地震）',
      description:
        '生於當地時間4月3日上午7時58分09秒，震央位於台灣花蓮縣壽豐鄉，芮氏規模7.1，震源深度為19.7公里，\n\n'+
        '並在花蓮縣秀林鄉和平村觀測到中央氣象署地震分級中最大震度6強的地震和麥卡利震度分級中的8度， \n\n'+
        '持續搖晃共大約98秒，期間臺灣全島都感受到明顯搖晃。\n\n'+
        '這場地震肇因於嶺頂斷層的錯動，另有學者認為，這次地震可能是由嶺頂斷層與米崙斷層同時活動所引起。',
      backgroundImage:'https://upload.wikimedia.org/wikipedia/commons/0/02/Rescue_workers_near_the_semi-collapsed_ten-story_Uranus_Building_on_Xuanyuan_Road_after_the_2024_Hualien_earthquake.jpg?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original',

      materialNeeds: [
        {
          id: 1,
          item: '飲用水',
          quantity:100,
          unit: '箱',
        },
        {
          id: 2,
          item: '生活物資',
          quantity: 8000,
          unit: '份',
        },
        {
          id: 3,
          item: '毛毯',
          quantity: 500,
          unit: '件',
        },
        {
          id: 4,
          item: '手電筒',
          quantity: 300,
          unit: '隻',
        },
        {
          id: 5,
          item: '手套',
          quantity: 1000,
          unit: '雙',
        },
      ],

      volunteerNeeds: [
        {
          id: 1,
          title: '環境清理',
          people: 100,
          location: '花蓮市區',
        },
        {
          id: 2,
          title: '物資發放',
          people: 50,
          location: '花蓮市區',
        },
        {
          id: 2,
          title: '物資統籌',
          people: 50,
          location: '花蓮市區',
        },
      ],
    },
    {
      id: 3,
      sectionTitle: '風災救助',
      title: '米克拉颱風災害救援支持行動',
      description:
        '第7號輕度/強烈颱風米克拉（Typhoon Mekkhala）\n\n'+
        '於2026年6月下旬北上經過琉球附近海面。雖然其暴風圈未直接登陸台灣， \n\n'+
        '但其外圍環流與滯留鋒面、增強西南風疊加，猶如「大氣引水幫浦」般灌入大量水氣，\n\n'+
        '導致南部地區降下致災性暴雨，高雄市旗山溪洲地區道路瞬間化為汪洋，黃色泥水灌進整條街道，農會周邊與眾多商家貨物全數泡水，高屏地區共發布高達93條土石流警戒。 \n\n'+
        '以及其他地區災情的增加。',
      backgroundImage:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6ip85lncdFZNoJoistp_g0g7Ppja2qWfW7g9K0Hm9CS8Ju-SCWU8GpAs&s=10',

      materialNeeds: [
        {
          id: 1,
          item: '熱食',
          quantity:100000,
          unit: '份',
        },
        {
          id: 2,
          item: '生活物資',
          quantity: 8000,
          unit: '份',
        },
        {
          id: 3,
          item: '環境清理消毒藥劑',
          quantity: 8000,
          unit: '支',
        },
      ],

      volunteerNeeds: [
        {
          id: 1,
          title: '清掃路面',
          people: 50,
          location: '台南市永康區',
        },
        {
          id: 2,
          title: '物資發放',
          people: 15,
          location: '高雄旗山區',
        },
      ],
    }

  ]);
}
