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
    { title: 'Premium Control Console v1.0', description: 'The new Claude-inspired console environment is now live! It features a highly performant CSS-only responsive sidebar, a comprehensive dual-pane Customization drawer for storing provider API Keys, and integrated controls for Incognito and Breezely extensions.' },
    { title: 'Improved Status Page', description: 'Modernized Status Page with sleek new sidebar and custom scrollbar UI.' }
  ];
}
