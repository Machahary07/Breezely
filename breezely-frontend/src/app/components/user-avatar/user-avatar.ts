import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar-container" [style.width.px]="size" [style.height.px]="size">
      <img *ngIf="photoURL" [src]="photoURL" [alt]="name" />
      <div *ngIf="!photoURL" class="placeholder">
        {{ getInitial() }}
      </div>
    </div>
  `,
  styleUrl: './user-avatar.sass'
})
export class UserAvatarComponent {
  @Input() photoURL: string | null = null;
  @Input() name: string = '';
  @Input() size: number = 32;

  getInitial() {
    return this.name ? this.name.charAt(0).toUpperCase() : 'B';
  }
}
