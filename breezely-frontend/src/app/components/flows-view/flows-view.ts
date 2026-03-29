import { Component } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBolt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-flows-view',
  standalone: true,
  imports: [FontAwesomeModule],
  templateUrl: './flows-view.html',
  styleUrl: './flows-view.sass'
})
export class FlowsView {
  faSparkles = faBolt;
}
