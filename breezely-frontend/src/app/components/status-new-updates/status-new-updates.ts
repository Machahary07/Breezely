import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-new-updates',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-new-updates.html',
  styleUrl: './status-new-updates.sass'
})
export class StatusNewUpdatesComponent {
  updates = [
    { title: 'New Update!', description: 'Improved Status Page.' }
  ];
}
