import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBrain } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-playbooks-view',
  standalone: true,
  imports: [FontAwesomeModule],
  templateUrl: './playbooks-view.html',
  styleUrl: './playbooks-view.sass'
})
export class PlaybooksView {
  faAnthropic = faBrain;
}
