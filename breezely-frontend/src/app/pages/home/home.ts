import { Component, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar';
import { DownloadExtensionBtnComponent } from '../../components/download-extension-btn/download-extension-btn';
import { DownloadModalComponent } from '../../components/download-modal/download-modal';
import { CtaButtonComponent } from '../../components/cta-button/cta-button';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavbarComponent, DownloadExtensionBtnComponent, DownloadModalComponent, CtaButtonComponent],
  templateUrl: './home.html',
  styleUrl: './home.sass'
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('heroVideo') heroVideoRef!: ElementRef<HTMLVideoElement>;
  showModal = false;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser && this.heroVideoRef?.nativeElement) {
      const video = this.heroVideoRef.nativeElement;
      video.muted = true;
      video.playsInline = true;
      video.play().catch(() => {
        // Autoplay blocked — try again on first user interaction
        const playOnInteraction = () => {
          video.play().catch(() => {});
          document.removeEventListener('click', playOnInteraction);
          document.removeEventListener('touchstart', playOnInteraction);
        };
        document.addEventListener('click', playOnInteraction);
        document.addEventListener('touchstart', playOnInteraction);
      });
    }
  }
}
