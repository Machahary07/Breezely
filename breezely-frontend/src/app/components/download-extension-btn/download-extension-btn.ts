import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-download-extension-btn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './download-extension-btn.html',
  styleUrl: './download-extension-btn.sass'
})
export class DownloadExtensionBtnComponent {
  @Output() downloadClick = new EventEmitter<void>();

  onClick(event: MouseEvent): void {
    event.preventDefault();
    this.downloadClick.emit();
  }
}
