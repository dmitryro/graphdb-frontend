import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';

@Component({
  selector: 'app-new-mapping-modal',
  standalone: false,
  templateUrl: './new-mapping-modal.component.html',
  styleUrls: ['./new-mapping-modal.component.scss'],
  providers: [EventService],
})
export class NewMappingModalComponent implements OnInit, OnDestroy {
  public isOpen = false;
  // This property is used by the [class.dark] and [class.light] bindings in your HTML
  public theme: 'light' | 'dark' = 'light';
  private eventSubs?: Subscription;
  public activeRowIndex: number | null = null;

  // Form Groups
  basicsForm!: FormGroup;
  scopeForm!: FormGroup;
  logicForm!: FormGroup;
  conditionsForm!: FormGroup;

  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  tags: string[] = [];
  confidenceLevels = ['Explicit', 'Inferred', 'Experimental'];
  transformationRules = [
    'Simple Rename / Alias',
    'Value Mapping',
    'Normalize Format',
    'Derived: Combine Values',
    'Derived: Split Value',
    'Derived: Derived Value',
    'Conditional: Conditional Mapping',
    'Fallback: Default Value',
    'Fallback: Null / Ignore',
  ];

  // Dropdown options for Scope Step
  sourceOptions = [
    { value: 'epic', label: 'Epic (E-HR System)' },
    { value: 'cerner', label: 'Cerner Health' },
    { value: 'internal_patient', label: 'Internal Patient Model' },
    { value: 'billing_schema', label: 'Billing Schema' },
  ];

  targetOptions = [
    { value: 'canonical_model', label: 'Canonical Patient Model' },
    { value: 'hl7_v2', label: 'HL7 v2 Feed' },
    { value: 'fhir_r4', label: 'FHIR R4 API' },
    { value: 'warehouse_v3', label: 'Data Warehouse v3' },
  ];

  // Directions with descriptive sub-labels
  directions = [
    {
      value: 'one-way',
      label: 'One-way',
      desc: 'Mapping applies from source to target only',
    },
    {
      value: 'bi-directional',
      label: 'Bi-directional',
      desc: 'Mapping applies in both directions',
    },
  ];

  constructor(
    private _fb: FormBuilder,
    protected eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.subscribeToEvents();
  }

  private subscribeToEvents() {
    // Subscribe to Store to catch theme and visibility signals
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      if (state?.items) {
        const itemEvent = state.items.event;
        const payload = state.items.payload;

        // Capture theme from payload when opening
        if (
          itemEvent === 'open_new_mapping_modal' ||
          payload?.action === 'open_new_mapping_modal'
        ) {
          this.theme = payload?.theme || this.getActiveTheme();
          this.isOpen = true;
        }

        // Logic to handle the confirmation from the shared ConfirmationModalComponent
        // Listens for the 'save' command confirmation
        if (
          itemEvent === 'confirmation_save_confirmed' ||
          payload?.action === 'confirmation_save_confirmed'
        ) {
          if (payload?.confirmed) {
            this.executeFinalSave();
          }
        }

        // Listen for external close signals
        if (
          itemEvent === 'close_new_mapping_modal' ||
          payload?.action === 'close_new_mapping_modal'
        ) {
          this.handleInternalClose();
        }
      }
    });
  }

  /**
   * Calculates the active theme based on CSS classes or system preferences.
   */
  private getActiveTheme(): 'light' | 'dark' {
    const isDark =
      document.body.classList.contains('dark-theme') ||
      document.body.classList.contains('dark-mode') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    return isDark ? 'dark' : 'light';
  }

  // --- Modal Signal Logic ---

  public close() {
    this.eventService.publish('nf', 'close_new_mapping_modal', {
      action: 'close_new_mapping_modal',
      theme: this.theme,
      context: 'user_cancelled_flow',
      timestamp: new Date().toISOString(),
    });

    this.handleInternalClose();
  }

  /**
   * Triggers the shared confirmation modal
   */
  public confirmAction() {
    if (this.basicsForm.invalid || this.scopeForm.invalid || this.logicForm.invalid) {
      this.basicsForm.markAllAsTouched();
      this.scopeForm.markAllAsTouched();
      this.logicForm.markAllAsTouched();
      return;
    }

    // Trigger the shared confirmation modal via NgRx/EventService
    this.eventService.publish('nf', 'open_confirmation_modal', {
      action: 'open_confirmation_modal',
      title: 'Confirm New Mapping',
      message: `Are you sure you want to save the mapping "${this.basicsForm.get('name')?.value}"?`,
      command: 'save',
      itemName: this.basicsForm.get('name')?.value,
      theme: this.theme,
    });
  }

  /**
   * Actual save logic called after confirmation
   */
  private executeFinalSave() {
    const payload = {
      basics: this.basicsForm.value,
      scope: this.scopeForm.value,
      logic: this.logicForm.value,
      conditions: this.conditionsForm.value,
      tags: this.tags,
      theme: this.theme,
      attribution: {
        createdBy: 'Current User',
        timestamp: new Date().toISOString(),
      },
    };

    // Signal the creation is complete
    this.eventService.publish('nf', 'mapping_creation_complete', {
      action: 'mapping_creation_complete',
      context: 'execute_mapping_merge',
      theme: this.theme,
      payload: payload,
    });

    this.handleInternalClose();
  }

  private handleInternalClose() {
    this.isOpen = false;
    this.resetModalState();
  }

  // --- Form Initialization & State Management ---

  private initForms() {
    this.basicsForm = this._fb.group({
      name: ['', Validators.required],
      description: [''],
      confidence: ['Explicit'],
    });

    this.scopeForm = this._fb.group({
      source: ['', Validators.required],
      target: ['', Validators.required],
      direction: ['one-way', Validators.required],
    });

    this.logicForm = this._fb.group({
      mappings: this._fb.array([this.createMappingRow()]),
    });

    this.conditionsForm = this._fb.group({
      applicability: ['Always applies'],
      exceptions: [''],
    });
  }

  get mappingRows() {
    return this.logicForm.get('mappings') as FormArray;
  }

  createMappingRow(): FormGroup {
    return this._fb.group({
      sourceElement: ['', Validators.required],
      targetElement: ['', Validators.required],
      rule: [''],
    });
  }

  addMappingRow() {
    this.mappingRows.push(this.createMappingRow());
  }

  removeMappingRow(index: number) {
    if (this.mappingRows.length > 1) this.mappingRows.removeAt(index);
  }

  private resetModalState() {
    this.basicsForm.reset({ confidence: 'Explicit' });
    this.scopeForm.reset({ direction: 'one-way' });
    this.logicForm.setControl('mappings', this._fb.array([this.createMappingRow()]));
    this.conditionsForm.reset({ applicability: 'Always applies' });
    this.tags = [];
  }

  // Chips logic
  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) this.tags.push(value);
    event.chipInput!.clear();
  }

  removeTag(tag: string): void {
    const index = this.tags.indexOf(tag);
    if (index >= 0) this.tags.splice(index, 1);
  }

  ngOnDestroy(): void {
    if (this.eventSubs) this.eventSubs.unsubscribe();
  }
}
