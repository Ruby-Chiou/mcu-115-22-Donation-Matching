import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-disaster-open-volunteer-form',
  imports: [FormsModule],
  templateUrl: './disaster-open-volunteer-form.component.html',
  styleUrl: './disaster-open-volunteer-form.component.scss',
})
export class DisasterOpenVolunteerFormComponent {

  volunteerName = '';
  phone = '';
  email = '';
  serviceItem = '';
  location = '';
  serviceDate = '';
  startTime = '';
  endTime = '';
  people = 1;
  note = '';
  constructor(private router: Router) {}
  cancel() {
    this.router.navigate(['/disaster/open']);
  }
  submitForm() {

    if (
      !this.volunteerName.trim() ||
      !this.phone.trim() ||
      !this.email.trim() ||
      !this.serviceItem ||
      !this.location ||
      !this.serviceDate ||
      !this.startTime ||
      !this.endTime ||
      !this.people ||
      !this.note.trim()
    ) {
      alert('請完整填寫所有欄位！');
      return;
    }
  // 檢查聯絡電話
    const phonePattern = /^09\d{8}$/;
    if (!phonePattern.test(this.phone)) {
      alert('請輸入正確的手機號碼格式，例如：0912345678');
      return;
    }
    if (this.startTime >= this.endTime) {
      alert('結束時間必須晚於開始時間！');
      return;
    }

    console.log({
      volunteerName: this.volunteerName,
      phone: this.phone,
      email: this.email,
      serviceItem: this.serviceItem,
      location: this.location,
      serviceDate: this.serviceDate,
      startTime: this.startTime,
      endTime: this.endTime,
      people: this.people,
      note: this.note,
    });

    alert('志工報名完成！');

    this.router.navigate(['/disaster/open']);
  }
}
