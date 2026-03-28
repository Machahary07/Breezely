import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar-icon-btn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-icon-btn.html',
  styleUrl: './sidebar-icon-btn.sass'
})
export class SidebarIconBtnComponent {
  @Input() label = '';
  @Input() icon: 'plus' | 'search' | 'settings' | 'chat' | 'flow' | 'book' | 'logout' = 'plus';
  @Input() active = false;
  @Input() danger = false;
  @Input() showLabel = true;
  @Output() clicked = new EventEmitter<void>();

  onClick() {
    this.clicked.emit();
  }
}
