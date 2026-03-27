import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './coming-soon.html',
  styleUrl: './coming-soon.sass'
})
export class ComingSoonComponent {
}
