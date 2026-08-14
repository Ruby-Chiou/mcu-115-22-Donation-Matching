import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisasterListComponent } from '../../../components/disaster-list/disaster-list.component';

@Component({
  selector: 'app-agency-disaster-workspace',
  standalone: true,
  imports: [CommonModule, DisasterListComponent],
  templateUrl: './agency-disaster-workspace.component.html',
  styleUrl: './agency-disaster-workspace.component.scss',
})
export class AgencyDisasterWorkspaceComponent {}
