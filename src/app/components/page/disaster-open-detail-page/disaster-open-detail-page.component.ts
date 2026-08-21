import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
interface Comment {
  user: string;
  date: string;
  content: string;
}

@Component({
  selector: 'app-disaster-open-detail-page',
  imports: [FormsModule],
  templateUrl: './disaster-open-detail-page.component.html',
  styleUrl: './disaster-open-detail-page.component.scss',
})
export class DisasterOpenDetailPageComponent {
  constructor(
    private router: Router
  ) {}
  goToSupplyForm() {
    this.router.navigate(['/disaster/open/supply/form']);
  }
  goBackToList() {
    this.router.navigate(['/disaster/open']);
  }
  // 目前輸入框的內容
  newComment = '';

  // 留言列表
  comments: Comment[] = [
    {
      user: '王小明',
      date: '2026/08/17',
      content: '請問目前還需要礦泉水嗎？'
    },
    {
      user: '陳小華',
      date: '2026/08/16',
      content: '已經準備好物資，希望可以幫助到災區。'
    }
  ];
  openDonate() {
    // 目前先做按鈕功能
    // 之後連接資料庫時，再改成真正的捐助流程
    alert('感謝您的捐助！');
  }

  // 發布留言
  addComment() {

    // 如果沒有輸入內容，就不發布
    if (!this.newComment.trim()) {
      return;
    }

    // 新增留言
    this.comments.unshift({
      user: '目前使用者',
      date: this.getToday(),
      content: this.newComment.trim()
    });

    // 清空輸入框
    this.newComment = '';
  }


  // 取得今天日期
  getToday(): string {

    const today = new Date();

    const year = today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      today.getDate()
    ).padStart(2, '0');

    return `${year}/${month}/${day}`;
  }

}
