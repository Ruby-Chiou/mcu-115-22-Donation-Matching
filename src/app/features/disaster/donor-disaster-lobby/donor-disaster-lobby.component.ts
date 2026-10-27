import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DisasterControlService } from '../../../core/services/disaster-control/disaster-control.service';
import { DonorDisasterPageComponent } from '../pages/donor-disaster-page/donor-disaster-page.component';
import { DisasterLocationsComponent } from '../disaster-locations/disaster-locations.component';

interface DisasterItem {
  image: string;
  text: string;
  highlight: string;
}

interface DisasterHistoryItem {
  text: string;
  highlight: string;
}

@Component({
  selector: 'app-donor-disaster-lobby',
  standalone: true,
  imports: [RouterLink, DonorDisasterPageComponent, DisasterLocationsComponent],
  templateUrl: './donor-disaster-lobby.component.html',
  styleUrl: './donor-disaster-lobby.component.scss',
})
export class DonorDisasterLobbyComponent implements OnInit, OnDestroy {
  protected readonly disasterData = inject(DisasterControlService).data;
  protected readonly closedNotice = signal('');

  protected readonly newsList: DisasterItem[] = [
    {
      image:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/%E8%BE%B2%E6%A5%AD%E9%83%A8%E6%9E%97%E6%A5%AD%E7%BD%B22025%E5%B9%B49%E6%9C%8826%E6%97%A5%E5%85%89%E5%BE%A9%E9%84%89%E7%81%BD%E5%8D%80%E7%A9%BA%E6%8B%8D01.jpg/960px-%E8%BE%B2%E6%A5%AD%E9%83%A8%E6%9E%97%E6%A5%AD%E7%BD%B22025%E5%B9%B49%E6%9C%8826%E6%97%A5%E5%85%89%E5%BE%A9%E9%84%89%E7%81%BD%E5%8D%80%E7%A9%BA%E6%8B%8D01.jpg',
      text: '花蓮馬太鞍溪堰塞湖災害',
      highlight: '2025年9月23日，台灣花蓮縣馬太鞍溪沿岸區域爆發嚴重水災。',
    },
    {
      image:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Rescue_workers_near_the_semi-collapsed_ten-story_Uranus_Building_on_Xuanyuan_Road_after_the_2024_Hualien_earthquake.jpg/960px-Rescue_workers_near_the_semi-collapsed_ten-story_Uranus_Building_on_Xuanyuan_Road_after_the_2024_Hualien_earthquake.jpg',
      text: '0403花蓮大地震',
      highlight:
        '4月3日上午7時58分發生芮氏規模7.2極淺層地震，震央位於花蓮外海，最大震度6強，全台劇烈搖晃，造成18至20人罹難、1,155人受傷，中橫與蘇花公路多處崩塌，天王星大樓等建物傾斜。',
    },
    {
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS6ip85lncdFZNoJoistp_g0g7Ppja2qWfW7g9K0Hm9CS8Ju-SCWU8GpAs&s=10',
      text: '米克拉颱風災害救援支持行動',
      highlight:
        '受米克拉颱風外圍環流及強烈西南氣流影響，全台各地降下驚人雨量，短時間內累積雨量突破歷史紀錄。屏東部分地區累積雨量超過500毫米，高雄美濃、大樹、台南、屏東等地陸續傳出嚴重積淹水，道路坍方、住家進水，居民被迫撤離家園；',
    },
  ];

  private autoSlideTimer: ReturnType<typeof setInterval> | undefined;

  ngOnInit(): void {
    if (this.disasterData().isOpen) {
      this.startAutoSlide();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  private startAutoSlide(): void {
    this.autoSlideTimer = setInterval(() => {
      const nextIndex = (this.disasterIndex() + 1) % this.newsList.length;
      this.disasterIndex.set(nextIndex);
    }, 3000);
  }

  private stopAutoSlide(): void {
    if (this.autoSlideTimer !== undefined) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = undefined;
    }
  }

  protected setSlide(index: number): void {
    this.disasterIndex.set(index);
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  protected showClosedNotice(label: string): void {
    this.closedNotice.set(label);
  }

  protected dismissClosedNotice(): void {
    this.closedNotice.set('');
  }

  protected readonly historyList: DisasterHistoryItem[] = [
    {
      text: '花蓮地震',
      highlight: '2024年花蓮地震，震央位於台灣花蓮縣秀林鄉，芮氏規模達7.1。造成18人死亡，1,155人受傷。',
    },
    {
      text: '高雄地震',
      highlight: '高雄美濃地震，震央位於台灣高雄市美濃區，芮氏規模達6.6。造成117人死亡，其中115人在台南市永康區維冠金龍大樓，551人受傷。',
    },
  ];

  protected readonly disasterIndex = signal(0);
  protected readonly disasterNews = computed(() => this.newsList[this.disasterIndex()]);
  protected readonly marqueeText = computed(() => {
    const data = this.disasterData();
    const parts: string[] = [];

    if (data.announcement.trim()) {
      parts.push(data.announcement.trim());
    }

    if (data.scheduledCloseAt) {
      parts.push(`預計關閉災害捐助時間：${formatCloseAt(data.scheduledCloseAt)}`);
    }

    return parts.join('　｜　');
  });
}

function formatCloseAt(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
