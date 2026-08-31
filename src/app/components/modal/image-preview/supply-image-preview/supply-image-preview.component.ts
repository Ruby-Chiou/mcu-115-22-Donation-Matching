import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-supply-image-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './supply-image-preview.component.html',
  styleUrl: './supply-image-preview.component.scss',
})
export class SupplyImagePreviewComponent {
  @Input() image = '';
  @Input() imageName = '';

  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }
}
