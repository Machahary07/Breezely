import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cta-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cta-button.html',
  styleUrl: './cta-button.sass'
})
export class CtaButtonComponent {
  @Input() text = 'Let\'s Breeze';
  @Input() link = '#';
  @Input() id = 'cta-button';
}
