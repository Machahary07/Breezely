import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar';
import { PageHeroHeader } from '../../components/page-hero-header/page-hero-header';

@Component({
  selector: 'app-platform',
  standalone: true,
  imports: [CommonModule, NavbarComponent, PageHeroHeader],
  templateUrl: './platform.html',
  styleUrl: './platform.sass',
})
export class PlatformPage {}
