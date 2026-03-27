import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-status',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './status.html',
  styleUrl: './status.sass'
})
export class StatusComponent {
  // Generate slightly random "uptime blocks" representing the last 60 days
  uptimeBlocks = Array(60).fill(1).map(() => Math.random() > 0.02);

  services = [
    { name: 'Breezely Web App Dashboard', status: 'Operational', color: 'success' },
    { name: 'Intelligent Automation Core (AI)', status: 'Operational', color: 'success' },
    { name: 'Browser Extension Sync API', status: 'Operational', color: 'success' },
    { name: 'Firebase Authentication', status: 'Operational', color: 'success' },
    { name: 'Cloud Infrastructure / Hosting', status: 'Operational', color: 'success' }
  ];

  pastIncidents = [
    { 
      date: 'Mar 26, 2026', 
      title: 'Elevated API Response Times', 
      status: 'Resolved',
      message: 'We experienced slightly slower response times on the AI Engine API. The system auto-scaled to meet demand and latency returned to normal.'
    },
    { 
      date: 'Mar 20, 2026', 
      title: 'Authentication Sync Issue', 
      status: 'Resolved',
      message: 'A minor issue with Google Auth redirecting slower than usual was identified. Full resolution deployed.'
    }
  ];
}
