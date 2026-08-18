import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DailyListComponent } from '../../../components/data-list/daily-list/daily-list.component';

@Component({
  selector: 'app-agency-daily-workspace',
  standalone: true,
  imports: [CommonModule, DailyListComponent],
  templateUrl: './agency-daily-workspace.component.html',
  styleUrl: './agency-daily-workspace.component.scss',
})
export class AgencyDailyWorkspaceComponent {}
