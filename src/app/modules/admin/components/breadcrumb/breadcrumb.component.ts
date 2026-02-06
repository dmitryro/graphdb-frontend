import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

export interface BreadcrumbItem {
  label: string;
  target?: string; // e.g., 'TAB_MAPPINGS', 'VIEW_MAPPING', 'VIEW_CODE_SET_MAPPING'
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
      const data = state?.items?.payload;

      if (eventName === 'update_breadcrumb' && data?.path) {
        this.items = data.path;
      }
    });
  }

  /**
   * Navigates back based on the target property.
   * Handles Mappings, Models, Rules, and Code Set Mappings consistently.
   */
  onItemClick(item: BreadcrumbItem, index: number): void {
    // If it's the current active page, do nothing
    if (index === this.items.length - 1) return;

    // 1. Handle navigation back to View Mapping
    if (item.target === 'VIEW_MODEL_MAPPING') {
      this.eventService.publish('nf', 'breadcrumb_navigate', { target: 'VIEW_MODEL_MAPPING' });
      return;
    }

    // 2. Handle navigation back to View Model
    if (item.target === 'VIEW_MODEL') {
      this.eventService.publish('nf', 'breadcrumb_navigate', { target: 'VIEW_MODEL' });
      return;
    }

    // 3. Handle navigation back to View Rule
    if (item.target === 'VIEW_RULE') {
      this.eventService.publish('nf', 'breadcrumb_navigate', { target: 'VIEW_RULE' });
      return;
    }

    // 4. Handle navigation back to View Rule
    if (item.target === 'VIEW_CODE_SET_RULE') {
      this.eventService.publish('nf', 'breadcrumb_navigate', { target: 'VIEW_CODE_SET_RULE' });
      return;
    }

    // 5. Handle navigation back to View Rule
    if (item.target === 'VIEW_MODEL_RULE') {
      this.eventService.publish('nf', 'breadcrumb_navigate', { target: 'VIEW_MODEL_RULE' });
      return;
    }

    // 6. Handle navigation back to View Rule
    if (item.target === 'VIEW_MIXED_RULE') {
      this.eventService.publish('nf', 'breadcrumb_navigate', { target: 'VIEW_MIXED_RULE' });
      return;
    }

    // 7. NEW: Handle navigation back to View Code Set Mapping specifically
    if (item.target === 'VIEW_CODE_SET_MAPPING') {
      this.eventService.publish('nf', 'breadcrumb_navigate', { target: 'VIEW_CODE_SET_MAPPING' });
      return;
    }

    // 8. NEW: Handle navigation back to Mixed  Mapping specifically
    if (item.target === 'VIEW_MIXED_MAPPING') {
      this.eventService.publish('nf', 'breadcrumb_navigate', { target: 'VIEW_MIXED_MAPPING' });
      return;
    }

    // 5. Logic for further back navigation (Tabs or Root)
    if (item.target === 'ROOT') {
      this.closeAllActiveEdits();
      this.eventService.publish('nf', 'breadcrumb_navigate', { target: 'ROOT' });
    } else if (item.target?.startsWith('TAB_')) {
      this.closeAllActiveEdits();
      this.eventService.publish('nf', 'breadcrumb_navigate', {
        target: item.target,
        tabIndex: index,
      });
    }
  }

  /**
   * Cleanly signals to close any active editors before navigating back in the hierarchy.
   * Updated to include code set specific cleanup.
   */
  private closeAllActiveEdits(): void {
    this.eventService.publish('nf', 'close_edit_mapping', { action: 'close_edit_mapping' });
    this.eventService.publish('nf', 'close_edit_model', { action: 'close_edit_model' });
    this.eventService.publish('nf', 'close_edit_rule', { action: 'close_edit_rule' });

    // Signal for Code Set editor cleanup
    this.eventService.publish('nf', 'close_edit_codeset', { action: 'close_edit_codeset' });
  }

  ngOnDestroy(): void {
    this.eventSubs?.unsubscribe();
  }
}
