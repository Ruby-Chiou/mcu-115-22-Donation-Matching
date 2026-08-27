import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { VolunteerDemandService } from '../../../core/services/volunteer-demand.service';
import { VolunteerDemand } from '../../../models/volunteer/volunteer-demand';

@Component({
  selector: 'app-donor-disaster-volunteer-form',
  imports: [FormsModule],
  templateUrl: './donor-disaster-volunteer-form.component.html',
  styleUrl: './donor-disaster-volunteer-form.component.scss',
})
export class DisasterOpenVolunteerFormComponent implements OnInit {

  volunteer!: VolunteerDemand;
  serviceItems: string[] = [];

  volunteerName = '';
  phone = '';
  email = '';
  serviceItem = '';
  location = '';
  serviceDate = '';
  startTime = '';
  endTime = '';
  note = '';
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private volunteerDemandService: VolunteerDemandService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const volunteer = this.volunteerDemandService.getVolunteerById(id);

    if (!volunteer) {
      this.router.navigate(['/donor/disaster']);
      return;
    }

    this.volunteer = volunteer;
    this.serviceItems = volunteer.serviceItems;
    this.location = volunteer.location;
    this.serviceDate = volunteer.date.replace(/\//g, '-');

    const [startTime, endTime] = volunteer.serviceTime.split(' - ');
    this.startTime = startTime ?? '';
    this.endTime = endTime ?? '';
  }
  cancel() {
    this.router.navigate(['/donor/disaster']);
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
      note: this.note,
    });

    alert('志工報名完成！');

    this.router.navigate(['/donor/disaster']);
  }
}
