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
  styles: [`
    .avatar-container {
      border-radius: 8px;
      overflow: hidden;
      background: var(--breezely-green);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .placeholder {
      color: var(--black);
      font-family: var(--font-heading);
      font-weight: 700;
      font-size: 14px;
    }
  `]
})
export class UserAvatarComponent {
  @Input() photoURL: string | null = null;
  @Input() name: string = '';
  @Input() size: number = 32;

  getInitial() {
    return this.name ? this.name.charAt(0).toUpperCase() : 'B';
  }
}
