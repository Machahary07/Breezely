import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar';
import { StatusSidebarComponent } from '../../components/status-sidebar/status-sidebar';
import { StatusNewUpdatesComponent } from '../../components/status-new-updates/status-new-updates';

@Component({
  selector: 'app-status',
  standalone: true,
  imports: [CommonModule, NavbarComponent, StatusSidebarComponent, StatusNewUpdatesComponent],
  templateUrl: './status.html',
  styleUrl: './status.sass'
})
export class StatusComponent {
  // Generate slightly random "uptime blocks" representing the last 60 days
  uptimeBlocks = Array(60).fill(1).map(() => Math.random() > 0.02);

  coreServices = [
    { name: 'Breezely Web App Dashboard', status: 'Operational', color: 'success' },
    { name: 'Intelligent Automation Core (AI)', status: 'Operational', color: 'success' },
    { name: 'Browser Extension Sync API', status: 'Operational', color: 'success' },
    { name: 'Firebase Authentication', status: 'Operational', color: 'success' },
    { name: 'Cloud Infrastructure / Hosting', status: 'Operational', color: 'success' }
  ];

  automationModules = [
    { name: 'Breeze (Browser Extension)', status: 'Operational', description: 'Script execution status updates', color: 'success' },
    { name: 'Canvas (Cloud Browser)', status: 'In Development', description: 'Live browser stream + chat responses', color: 'warning' },
    { name: 'Flows (Your Automations)', status: 'Operational', description: 'Flow run progress, step-by-step logs', color: 'success' },
    { name: 'Playbooks (Community Marketplace)', status: 'Maintenance', description: 'Live install + deployment status', color: 'warning' }
  ];

  newUpdates = [
    {
      date: 'Deployed',
      title: 'Structural Component Refactoring',
      badge: 'System',
      description: 'The Status Page has been modernized with a standalone navigation sidebar component, featuring high-performance scroll listeners and smooth-anchor-scrolling logic for a seamless desktop experience.'
    },
    {
      date: 'Deployed',
      title: 'Aesthetic Branded System Phase I',
      badge: 'Visual',
      description: 'Unified brand identity with a custom thin-glass navbar, a minimalist "Green Glow" thumb scrollbar, and a sleek, hand-crafted White Arrow custom cursor system pointing at -125°.'
    },
    {
      date: 'Coming Soon',
      title: 'Premium Control Console',
      badge: 'Feature',
      description: 'A completely new, Claude-inspired console environment for managing your browser automations. The update will introduce a responsive GSAP-animated sidebar, advanced chat inputs, and a cohesive dark-themed UI.'
    },
    {
      date: 'Coming Soon',
      title: 'Breeze (Breezely Extension) Updates',
      badge: 'Service',
      description: 'Real-time script execution status updates directly within the extension to keep you informed of automation progress.'
    },
    {
      date: 'Coming Soon',
      title: 'Canvas (Cloud Browser)',
      badge: 'Service',
      description: 'Interactive live browser streaming combined with real-time AI chat responses for a fully immersive cloud automation experience.'
    },
    {
      date: 'Coming Soon',
      title: 'Flows (Your Automations)',
      badge: 'Feature',
      description: 'Deep visibility into your automations with live flow run progress tracking and comprehensive step-by-step execution logs.'
    },
    {
      date: 'Coming Soon',
      title: 'Playbooks (Community Marketplace)',
      badge: 'Feature',
      description: 'A new marketplace experience featuring live installation tracking and instant deployment status for community-shared automations.'
    }
  ];

  pastIncidents = [
    { 
      date: 'Mar 28, 2026', 
      title: 'Frontend Build Compilation Error', 
      status: 'Resolved',
      message: 'A Sass syntax configuration mismatch caused intermittent frontend build failures during deployment. Component styles were successfully isolated and migrated to external generic stylesheets, fully resolving the pipeline.'
    },
    { 
      date: 'Mar 27, 2026', 
      title: 'Elevated API Response Times', 
      status: 'Resolved',
      message: 'We experienced slightly slower response times on the AI Engine API. The system auto-scaled to meet demand and latency returned to normal.'
    },
    { 
      date: 'Mar 26, 2026', 
      title: 'Authentication Sync Issue', 
      status: 'Resolved',
      message: 'A minor issue with Google Auth redirecting slower than usual was identified. Full resolution deployed.'
    }
  ];
}
