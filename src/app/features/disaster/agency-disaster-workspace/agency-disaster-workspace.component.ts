import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemandListComponent } from '../../../components/demand-list/demand-list.component';

@Component({
  selector: 'app-agency-disaster-workspace',
  standalone: true,
  imports: [CommonModule, DemandListComponent],
  templateUrl: './agency-disaster-workspace.component.html',
  styleUrl: './agency-disaster-workspace.component.scss',
})
export class AgencyDisasterWorkspaceComponent {}
