import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { DisasterDemandService } from '../../../core/services/agency-disaster-demand/disaster-demand.service';

export interface SupplyFilters {
  category: string[];
  priority: string[];
}

@Component({
  selector: 'app-donor-disaster-supply-filter',
  standalone: true,
  imports: [],
  templateUrl: './donor-disaster-supply-filter.component.html',
  styleUrl: './donor-disaster-supply-filter.component.scss',
})
export class DonorDisasterSupplyFilterComponent {
  private disasterDemandService = inject(DisasterDemandService);

  @Input()
  filters: SupplyFilters = {
    category: [],
    priority: [],
  };

  @Output()
  filtersChange = new EventEmitter<SupplyFilters>();

  get categoryOptions(): string[] {
    const demands = this.disasterDemandService.getDemands();
    return [...new Set(demands.map((demand) => demand.category).filter((category) => category !== ''))];
  }

  priorityOptions = ['普通', '緊急', '非常緊急'];

  toggleCategory(value: string): void {
    const category = this.filters.category;
    this.filters = {
      ...this.filters,
      category: category.includes(value)
        ? category.filter((item) => item !== value)
        : [...category, value],
    };
    this.emitFilters();
  }

  togglePriority(value: string): void {
    const priority = this.filters.priority;
    this.filters = {
      ...this.filters,
      priority: priority.includes(value)
        ? priority.filter((item) => item !== value)
        : [...priority, value],
    };
    this.emitFilters();
  }

  resetFilters(): void {
    this.filters = {
      category: [],
      priority: [],
    };
    this.emitFilters();
  }

  private emitFilters(): void {
    this.filtersChange.emit({
      category: [...this.filters.category],
      priority: [...this.filters.priority],
    });
  }
}
