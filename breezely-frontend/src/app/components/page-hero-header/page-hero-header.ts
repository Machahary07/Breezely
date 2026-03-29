import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowDown } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-page-hero-header',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './page-hero-header.html',
  styleUrl: './page-hero-header.sass'
})
export class PageHeroHeader {
  @Input() title: string = '';
  @Input() heading: string = '';
  @Input() tagline: string = '';
  @Input() theme: 'light' | 'dark' = 'dark';
  
  faArrowDown = faArrowDown;
}
