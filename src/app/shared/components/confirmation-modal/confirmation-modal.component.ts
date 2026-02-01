import { Component, OnDestroy, OnInit } from '@angular/core';
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

interface ConfirmationPayload {
  message?: string;
  command?: 'save' | 'delete' | 'reset' | 'confirm' | 'discard';
  itemName?: string;
  title?: string;
  theme?: 'dark' | 'light';
}

@Component({
  selector: 'app-confirmation-modal',
  standalone: false,
  templateUrl: './confirmation-modal.component.html',
  styleUrl: './confirmation-modal.component.scss',
})
export class ConfirmationModalComponent implements OnInit, OnDestroy {
  isVisible = false;
  private eventSubs?: Subscription;

  // Data bindings
  title = 'Confirmation';
  message = 'Are you sure you want to proceed?';
  command: 'save' | 'delete' | 'confirm' | 'discard' | 'reset' = 'confirm';
  itemName = '';
  theme: 'dark' | 'light' = 'dark'; // Default to dark

  constructor(
    private eventStore: Store<{ nf: EventState }>,
    private eventService: EventService,
  ) {}

  ngOnInit(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      const eventName = state?.items?.event;
      const payload: ConfirmationPayload = state?.items?.payload;

      if (eventName === 'open_confirmation_modal') {
        this.open(payload);
      }
    });
  }

  private open(payload: any): void {
    // Use any here or ensure the publisher matches interface
    this.message = payload?.message || 'Are you sure you want to proceed?';

    // Explicitly extract command, ensuring it defaults correctly if missing
    this.command = payload?.command || 'confirm';

    this.itemName = payload?.itemName || '';
    this.theme = payload?.theme || 'dark';

    if (payload?.title) {
      this.title = payload.title;
    } else {
      this.title = this.command === 'delete' ? 'Delete Confirmation' : 'Confirm Action';
    }

    this.isVisible = true;
  }

  close(): void {
    this.isVisible = false;
  }

  executeAction(): void {
    // Publish a response event so the calling component knows the user confirmed
    this.eventService.publish('nf', `confirmation_${this.command}_confirmed`, {
      itemName: this.itemName,
      confirmed: true,
      command: this.command,
      action: `confirmation_${this.command}_confirmed`,
    });
    this.close();
  }

  ngOnDestroy(): void {
    this.eventSubs?.unsubscribe();
  }
}
