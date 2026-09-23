import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DailyFilter } from '../../../components/filter/donor-daily-filter/donor-daily-filter.component';

@Component({
  selector: 'app-filter-base',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filter-base.component.html',
  styleUrls: ['./filter-base.component.scss'],
})
export class FilterBaseComponent {
  @Input() options: { key: string; values: string[] }[] = [];
  @Output() filterChange = new EventEmitter<DailyFilter>();

  selected: Record<string, string[]> = {};

  toggle(key: string, value: string): void {
    const arr = this.selected[key] ?? [];
    const index = arr.indexOf(value);
    if (index >= 0) arr.splice(index, 1);
    else arr.push(value);
    this.selected[key] = arr;

    this.emitFilter(); // 呼叫轉型方法
  }

  private emitFilter(): void {
    this.filterChange.emit({
      categories: this.selected['categories'] ?? [],
      targets: this.selected['targets'] ?? [],
      regions: this.selected['regions'] ?? [],
      receiveMethods: this.selected['receiveMethods'] ?? [],
      priorities: this.selected['priorities'] ?? [],
    });
  }

  get hasSelected(): boolean {
    return Object.keys(this.selected).some((k) => this.selected[k]?.length);
  }

  clearFilters(): void {
    this.selected = {};
    this.emitFilter();
  }
}
