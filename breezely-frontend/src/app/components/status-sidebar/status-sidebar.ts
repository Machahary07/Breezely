import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-sidebar.html',
  styleUrl: './status-sidebar.sass'
})
export class StatusSidebarComponent {
  activeSection = 'uptime';

  scrollTo(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  @HostListener('window:scroll')
  onScroll() {
    const sections = ['uptime', 'services', 'modules', 'updates', 'incidents'];
    let current = this.activeSection;

    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        if (element.getBoundingClientRect().top <= 200) {
          current = section;
        }
      }
    }
    this.activeSection = current;
  }
}
