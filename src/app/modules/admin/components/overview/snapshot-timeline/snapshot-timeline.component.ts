import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-snapshot-timeline',
  standalone: false,
  templateUrl: './snapshot-timeline.component.html',
  styleUrls: ['./snapshot-timeline.component.scss'],
})
export class SnapshotTimelineComponent {
  @Input() snapshots: { name: string; date: string; active?: boolean }[] = [];
}
