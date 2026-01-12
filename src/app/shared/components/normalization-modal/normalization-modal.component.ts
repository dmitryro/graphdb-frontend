import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-normalization-modal',
  standalone: false,
  templateUrl: './normalization-modal.component.html',
  styleUrls: ['./normalization-modal.component.scss'],
  providers: [EventService],
})
export class NormalizationModalComponent implements OnInit, OnDestroy {
  public isOpen = false;
  public theme: 'light' | 'dark' = 'dark';
  private eventSubs?: Subscription;

  normalizationForm!: FormGroup;

  @ViewChild('modalContainer') modalContainer?: ElementRef;

  constructor(
    private _fb: FormBuilder,
    protected eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Subscribe to the store to catch the normalization signal + theme context
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      if (state && state.items) {
        const itemEvent = state.items.event;
        const payload = state.items.payload;
        if (itemEvent === 'add_normalization_model') {
          // Extract theme from signal to ensure modal matches parent state
          this.theme = payload?.theme || 'dark';
          this.isOpen = true;
          console.log(`[NormalizationModal] Opening in ${this.theme} mode.`);
        }
      }
    });
  }

  private initForm() {
    this.normalizationForm = this._fb.group({
      name: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9_ ]+$')]],
      type: ['Canonical', Validators.required],
      properties: this._fb.array([]),
    });

    this.addProperty();
  }

  get properties(): FormArray {
    return this.normalizationForm.get('properties') as FormArray;
  }

  addProperty() {
    const propGroup = this._fb.group({
      propertyName: ['', Validators.required],
      propertyType: ['String', Validators.required], // Standard input allows for custom types
    });
    this.properties.push(propGroup);
  }

  removeProperty(index: number) {
    if (this.properties.length > 1) {
      this.properties.removeAt(index);
    }
  }

  public close() {
    this.isOpen = false;
    this.normalizationForm.reset({ type: 'Canonical' });
    while (this.properties.length > 0) {
      this.properties.removeAt(0);
    }
    this.addProperty();
  }

  public confirmAction() {
    if (this.normalizationForm.invalid) return;

    const payload = {
      ...this.normalizationForm.value,
      timestamp: new Date().toISOString(),
      // Ensure transaction is logged into the graph of events [cite: 2025-12-20]
      context: {
        method: 'execute_merge_query_with_context', // [cite: 2026-01-01]
        action_type: 'MPI_SCHEMA_NORMALIZATION',
        trace: `normalization_${Date.now()}`,
      },
    };

    // Publish to notify the list or header of the new record
    this.eventService.publish(payload.name, 'refresh_header', {
      action: 'normalization_model_added',
      payload: payload,
    });

    this.close();
  }

  ngOnDestroy(): void {
    if (this.eventSubs) this.eventSubs.unsubscribe();
  }
}
