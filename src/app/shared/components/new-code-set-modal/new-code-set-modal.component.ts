import { Component, effect, OnDestroy, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-new-code-set-modal',
  standalone: false, // Preserved as requested
  templateUrl: './new-code-set-modal.component.html',
  styleUrls: ['./new-code-set-modal.component.scss'],
  providers: [EventService],
})
export class NewCodeSetModalComponent implements OnInit, OnDestroy {
  // Signals for state management
  public isOpen = signal<boolean>(false);
  public theme = signal<'light' | 'dark'>('light');

  // Dynamic Metadata Signals (Populated via NgRx Payload)
  public systems = signal<string[]>([]);
  public statuses = signal<string[]>([]);

  private eventSubs?: Subscription;
  basicsForm!: FormGroup;
  valuesForm!: FormGroup;

  constructor(
    private _fb: FormBuilder,
    protected eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
  ) {
    effect(() => {
      console.log(`[CodeSet Modal] Theme: ${this.theme()}`);
    });
  }

  ngOnInit(): void {
    this.initForms();
    this.subscribeToEvents();
  }

  private initForms() {
    this.basicsForm = this._fb.group({
      name: ['', Validators.required],
      system: ['', Validators.required],
      version: ['', Validators.required],
      oid: ['', Validators.required],
      meaning: [''],
      status: ['', Validators.required],
    });

    this.valuesForm = this._fb.group({
      values: this._fb.array([this.createValueRow()]),
    });
  }

  private subscribeToEvents() {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      if (!state?.items) return;
      const { event, payload } = state.items;

      // Logic for opening the main modal
      if (event === 'open_new_value_set_modal' || payload?.action === 'open_new_value_set_modal') {
        if (payload.metadataOptions) {
          this.systems.set(payload.metadataOptions.systems || []);
          this.statuses.set(payload.metadataOptions.statuses || []);
        }

        this.theme.set(payload?.theme || this.getActiveTheme());
        if (payload.defaults) {
          this.basicsForm.patchValue(payload.defaults);
        }

        this.isOpen.set(true);
      }

      // Logic to handle the confirmation from the shared ConfirmationModalComponent
      // This triggers when user clicks 'Confirm' in the confirmation modal
      if (
        event === 'confirmation_save_confirmed' ||
        payload?.action === 'confirmation_save_confirmed'
      ) {
        if (payload?.confirmed) {
          this.executeFinalSave();
        }
      }

      // Logic for closing the main modal
      if (
        event === 'close_new_value_set_modal' ||
        payload?.action === 'close_new_value_set_modal'
      ) {
        this.handleInternalClose();
      }
    });
  }

  get valueRows() {
    return this.valuesForm.get('values') as FormArray;
  }

  createValueRow(): FormGroup {
    return this._fb.group({
      code: ['', Validators.required],
      display: ['', Validators.required],
      system: [this.basicsForm?.get('system')?.value || ''],
      status: [this.basicsForm?.get('status')?.value || 'Active'],
    });
  }

  addRow() {
    this.addValueRow();
  }

  addValueRow() {
    this.valueRows.push(this.createValueRow());
  }

  removeValueRow(index: number) {
    if (this.valueRows.length > 1) this.valueRows.removeAt(index);
  }

  public close() {
    this.eventService.publish('nf', 'close_new_value_set_modal', {
      action: 'close_new_value_set_modal',
      theme: this.theme(),
      timestamp: new Date().toISOString(),
    });
    this.handleInternalClose();
  }

  /**
   * Updated to trigger shared ConfirmationModal instead of direct save
   */
  public confirmAction() {
    if (this.basicsForm.invalid || this.valuesForm.invalid) {
      this.basicsForm.markAllAsTouched();
      this.valuesForm.markAllAsTouched();
      return;
    }

    // Trigger confirmation modal with 'save' command
    this.eventService.publish('nf', 'open_confirmation_modal', {
      action: 'open_confirmation_modal',
      title: 'Confirm Code Set Creation',
      message: `Are you sure you want to create the code set "${this.basicsForm.get('name')?.value}"?`,
      command: 'save',
      itemName: this.basicsForm.get('name')?.value,
      theme: this.theme(),
    });
  }

  /**
   * Finalized method called only after confirmation is received
   */
  private executeFinalSave() {
    const payload = {
      basics: this.basicsForm.value,
      values: this.valuesForm.value.values,
      attribution: {
        createdBy: 'Current User',
        timestamp: new Date().toISOString(),
      },
      theme: this.theme(),
    };

    this.eventService.publish('nf', 'value_set_creation_complete', {
      action: 'value_set_creation_complete',
      payload: payload,
    });

    this.handleInternalClose();
  }

  private handleInternalClose() {
    this.isOpen.set(false);
    this.resetModalState();
  }

  private resetModalState() {
    this.basicsForm.reset();
    // Re-initialize with one empty row
    this.valuesForm.setControl('values', this._fb.array([this.createValueRow()]));
  }

  private getActiveTheme(): 'light' | 'dark' {
    return document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  }

  ngOnDestroy(): void {
    if (this.eventSubs) {
      this.eventSubs.unsubscribe();
    }
  }
}
