import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: false,
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.scss'],
})
export class StatCardComponent {
  @Input() title = '';
  @Input() icon = '';
  @Input() metrics: { label: string; value: string }[] = [];
  @Input() isWarning = false;
}
