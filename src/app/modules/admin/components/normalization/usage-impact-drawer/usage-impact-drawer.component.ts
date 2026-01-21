import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-usage-impact-drawer',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './usage-impact-drawer.component.html',
  styleUrls: ['./usage-impact-drawer.component.scss'],
})
export class UsageImpactDrawerComponent implements OnInit, OnDestroy {
  mappingData: any = null;
  // This must match the variable used in [class.open] in the HTML
  showUsagePanel = false;

  private eventSubs?: Subscription;

  constructor(
    private eventStore: Store<{ nf: EventState }>,
    private eventService: EventService,
  ) {}

  ngOnInit(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      const eventName = state?.items?.event;
      const data = state?.items?.payload;

      if (eventName === 'open_usage_impact_drawer') {
        this.mappingData = data.fullData;
        this.showUsagePanel = true;
      }

      if (eventName === 'close_usage_impact_drawer') {
        this.showUsagePanel = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.eventSubs?.unsubscribe();
  }

  toggleUsageAndImpact(): void {
    this.showUsagePanel = false;
    this.eventService.publish('nf', 'close_usage_impact_drawer', {
      action: 'close_usage_impact_drawer',
    });
  }
}
