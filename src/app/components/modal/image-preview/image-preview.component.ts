import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-preview.component.html',
  styleUrl: './image-preview.component.scss',
})
export class ImagePreviewComponent {
  @Input() image = '';
  @Input() imageName = '';

  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }
}
