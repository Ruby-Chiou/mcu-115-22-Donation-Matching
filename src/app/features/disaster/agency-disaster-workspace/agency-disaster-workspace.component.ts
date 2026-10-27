import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisasterListComponent } from '../../../components/data-list/disaster/disaster-list/disaster-list.component';
import { HelperListComponent } from '../../../components/data-list/disaster/helper-list/helper-list.component';

@Component({
  selector: 'app-agency-disaster-workspace',
  standalone: true,
  imports: [CommonModule, DisasterListComponent, HelperListComponent],
  templateUrl: './agency-disaster-workspace.component.html',
  styleUrl: './agency-disaster-workspace.component.scss',
})
export class AgencyDisasterWorkspaceComponent {
  activeType: 'material' | 'helper' = 'material';

  selectType(type: 'material' | 'helper'): void {
    this.activeType = type;
  }
}
