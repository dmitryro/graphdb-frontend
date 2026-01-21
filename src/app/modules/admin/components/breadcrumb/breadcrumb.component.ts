import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

export interface BreadcrumbItem {
  label: string;
  target?: string; // e.g., 'TAB_MAPPINGS', 'ROOT_NORMALIZATION'
  active?: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
  items: BreadcrumbItem[] = [];
  private eventSubs?: Subscription;

  constructor(
    private eventStore: Store<{ nf: EventState }>,
    private eventService: EventService,
  ) {}

  ngOnInit(): void {
    this.subscribeToBreadcrumbUpdates();
  }

  private subscribeToBreadcrumbUpdates(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      const eventName = state?.items?.event;
      // The EventService wraps your data in a property called 'payload'
      const data = state?.items?.payload;

      if (eventName === 'update_breadcrumb' && data?.path) {
        this.items = data.path;
      }
    });
  }

  /**
   * Navigates back to a specific view based on the target property.
   * Passing 3 arguments to match the EventService.publish definition.
   */
  onItemClick(item: BreadcrumbItem, index: number): void {
    if (index === this.items.length - 1) return;

    // 1. Handle navigation back to View Mapping specifically
    if (item.target === 'VIEW_MAPPING') {
      this.eventService.publish('nf', 'breadcrumb_navigate', { target: 'VIEW_MAPPING' });
      return; // EditMappingComponent will catch this and call its own onCancel()
    }

    // 2. Existing logic for further back navigation
    if (item.target === 'ROOT') {
      this.eventService.publish('nf', 'close_edit_mapping', { action: 'close_edit_mapping' });
      this.eventService.publish('nf', 'breadcrumb_navigate', { target: 'ROOT' });
    } else if (item.target?.startsWith('TAB_')) {
      this.eventService.publish('nf', 'close_edit_mapping', { action: 'close_edit_mapping' });
      this.eventService.publish('nf', 'breadcrumb_navigate', {
        target: item.target,
        tabIndex: index,
      });
    }
  }

  ngOnDestroy(): void {
    this.eventSubs?.unsubscribe();
  }
}
