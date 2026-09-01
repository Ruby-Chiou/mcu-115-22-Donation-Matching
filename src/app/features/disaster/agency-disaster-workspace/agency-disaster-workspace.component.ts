import { VolunteerDetailComponent } from './../../../components/data-list/volunteer-detail/volunteer-detail.component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisasterListComponent } from '../../../components/data-list/disaster/disaster-list/disaster-list.component';
import { VolunteerListComponent } from '../../../components/data-list/volunteer-list/volunteer-list.component';

@Component({
  selector: 'app-agency-disaster-workspace',
  standalone: true,
  imports: [CommonModule, DisasterListComponent, VolunteerListComponent],
  templateUrl: './agency-disaster-workspace.component.html',
  styleUrl: './agency-disaster-workspace.component.scss',
})
export class AgencyDisasterWorkspaceComponent {}
