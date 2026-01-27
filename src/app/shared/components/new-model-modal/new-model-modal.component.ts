import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-new-model-modal',
  standalone: false,
  templateUrl: './new-model-modal.component.html',
  styleUrls: ['./new-model-modal.component.scss'],
  providers: [EventService],
})
export class NewModelModalComponent implements OnInit, OnDestroy {
  public isOpen = false;
  public theme: 'light' | 'dark' = 'dark';
  private eventSubs?: Subscription;

  normalizationForm!: FormGroup;

  // Available options for dropdowns
  public modelTypes = ['Canonical', 'Derived', 'External'];
  public modelStatuses = ['Draft', 'Active', 'Deprecated'];
  public dataTypes = ['Integer', 'String', 'Datetime', 'Date', 'Boolean', 'Float'];
  public constraintTypes = [
    'None',
    'Max Length',
    'Min Length',
    'Pattern',
    'Allowed Values',
    'Range',
  ];

  // Mock existing models for dependencies
  public existingModels = [
    { id: 1, name: 'Patient_Event' },
    { id: 2, name: 'Visit_Record' },
    { id: 3, name: 'Medication_Order' },
  ];

  // Review section expansion state
  public basicsExpanded = true;
  public structureExpanded = true;
  public dependenciesExpanded = true;

  // Separator key codes for chip input
  public separatorKeysCodes: number[] = [ENTER, COMMA];

  @ViewChild('modalContainer') modalContainer?: ElementRef;

  constructor(
    private _fb: FormBuilder,
    protected eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.subscribeToEvents();
  }

  private subscribeToEvents() {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      if (state && state.items) {
        const itemEvent = state.items.event;
        const payload = state.items.payload;

        // Handle Modal Opening
        if (itemEvent === 'open_new_model_modal' || payload?.action === 'open_new_model_modal') {
          this.theme = payload?.theme || this.getActiveTheme();
          this.isOpen = true;
          console.log(`[NewModelModal] Opening in ${this.theme} mode.`);
        }

        // Handle Confirmation Signal from Shared Modal
        if (
          itemEvent === 'confirmation_save_confirmed' ||
          payload?.action === 'confirmation_save_confirmed'
        ) {
          if (payload?.confirmed) {
            this.executeFinalSave();
          }
        }

        // Handle Closing Signal
        if (itemEvent === 'close_new_model_modal' || payload?.action === 'close_new_model_modal') {
          this.handleInternalClose();
        }
      }
    });
  }

  private initForm() {
    this.normalizationForm = this._fb.group({
      // Step 1: Basics
      name: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9_ ]+$')]],
      description: [''],
      tags: [[]],
      type: ['Canonical', Validators.required],
      status: ['Draft', Validators.required],

      // Step 2: Structure
      fields: this._fb.array([]),

      // Step 3: Dependencies
      dependencies: this._fb.array([]),
    });

    this.addField();
  }

  // Field management (Step 2)
  get fields(): FormArray {
    return this.normalizationForm.get('fields') as FormArray;
  }

  addField() {
    const fieldGroup = this._fb.group({
      fieldName: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9_]+$')]],
      dataType: ['String', Validators.required],
      required: [false],
      description: [''],
      constraint: ['None'],
      constraintDetails: [''],
    });

    fieldGroup.get('constraint')?.valueChanges.subscribe(constraint => {
      const detailsControl = fieldGroup.get('constraintDetails');
      if (constraint && constraint !== 'None') {
        detailsControl?.setValidators([Validators.required]);
      } else {
        detailsControl?.clearValidators();
        detailsControl?.setValue('');
      }
      detailsControl?.updateValueAndValidity();
    });

    fieldGroup.get('dataType')?.valueChanges.subscribe(dataType => {
      const constraintControl = fieldGroup.get('constraint');
      const currentConstraint = constraintControl?.value;

      if (!this.isConstraintCompatible(currentConstraint, dataType)) {
        constraintControl?.setValue('None');
      }
    });

    this.fields.push(fieldGroup);
  }

  removeField(index: number) {
    if (this.fields.length > 1) {
      this.fields.removeAt(index);
    }
  }

  getAvailableConstraints(dataType: string): string[] {
    const typeMap: Record<string, string[]> = {
      String: ['None', 'Max Length', 'Min Length', 'Pattern', 'Allowed Values'],
      Integer: ['None', 'Range', 'Allowed Values'],
      Float: ['None', 'Range'],
      Date: ['None', 'Range'],
      Datetime: ['None', 'Range'],
      Boolean: ['None', 'Allowed Values'],
    };
    return typeMap[dataType] || ['None'];
  }

  isConstraintCompatible(constraint: string, dataType: string): boolean {
    if (!constraint || constraint === 'None') return true;
    return this.getAvailableConstraints(dataType).includes(constraint);
  }

  // Dependency management (Step 3)
  get dependencies(): FormArray {
    return this.normalizationForm.get('dependencies') as FormArray;
  }

  addDependency() {
    const depGroup = this._fb.group({
      modelId: ['', Validators.required],
      relationship: ['', Validators.required],
    });
    this.dependencies.push(depGroup);
  }

  removeDependency(index: number) {
    this.dependencies.removeAt(index);
  }

  // Tag management
  addTag(tagInput: HTMLInputElement) {
    const tag = tagInput.value.trim();
    if (tag) {
      const currentTags = this.normalizationForm.get('tags')?.value || [];
      if (!currentTags.includes(tag)) {
        this.normalizationForm.patchValue({
          tags: [...currentTags, tag],
        });
      }
      tagInput.value = '';
    }
  }

  addTagFromChipInput(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      const currentTags = this.normalizationForm.get('tags')?.value || [];
      if (!currentTags.includes(value)) {
        this.normalizationForm.patchValue({
          tags: [...currentTags, value],
        });
      }
    }
    event.chipInput!.clear();
  }

  removeTag(tag: string) {
    const currentTags = this.normalizationForm.get('tags')?.value || [];
    this.normalizationForm.patchValue({
      tags: currentTags.filter((t: string) => t !== tag),
    });
  }

  getModelNameById(modelId: number): string {
    return this.existingModels.find(m => m.id === modelId)?.name || '';
  }

  getConstraintPlaceholder(constraintType: string): string {
    switch (constraintType) {
      case 'Max Length':
      case 'Min Length':
        return 'e.g. 255';
      case 'Pattern':
        return 'e.g. ^[A-Z]+$';
      case 'Allowed Values':
        return 'e.g. value1, value2';
      case 'Range':
        return 'Min, Max';
      default:
        return '';
    }
  }

  // Step validation
  isStep1Valid(): boolean {
    const nameControl = this.normalizationForm.get('name');
    const typeControl = this.normalizationForm.get('type');
    const statusControl = this.normalizationForm.get('status');
    return !!(nameControl?.valid && typeControl?.valid && statusControl?.valid);
  }

  isStep2Valid(): boolean {
    return this.fields.length > 0 && this.fields.controls.every(field => field.valid);
  }

  // Modal actions
  public close() {
    this.eventService.publish('nf', 'close_new_model_modal', {
      action: 'close_new_model_modal',
      theme: this.theme,
    });
    this.handleInternalClose();
  }

  private handleInternalClose() {
    this.isOpen = false;
    this.normalizationForm.reset({
      type: 'Canonical',
      status: 'Draft',
      tags: [],
    });

    while (this.fields.length > 0) {
      this.fields.removeAt(0);
    }
    while (this.dependencies.length > 0) {
      this.dependencies.removeAt(0);
    }

    this.addField();
  }

  /**
   * Triggers the shared confirmation modal
   */
  public confirmAction() {
    if (this.normalizationForm.invalid) {
      this.normalizationForm.markAllAsTouched();
      return;
    }

    this.eventService.publish('nf', 'open_confirmation_modal', {
      action: 'open_confirmation_modal',
      title: 'Confirm Model Creation',
      message: `Do you want to finalize and save the data model "${this.normalizationForm.get('name')?.value}"?`,
      command: 'save',
      itemName: this.normalizationForm.get('name')?.value,
      theme: this.theme,
    });
  }

  /**
   * Final execution logic after user confirms save
   */
  private executeFinalSave() {
    const payload = {
      ...this.normalizationForm.value,
      timestamp: new Date().toISOString(),
      context: {
        method: 'execute_merge_query_with_context',
        action_type: 'MPI_SCHEMA_NORMALIZATION',
        trace: `normalization_${Date.now()}`,
      },
    };

    this.eventService.publish(payload.name, 'refresh_header', {
      action: 'normalization_model_added',
      payload: payload,
    });

    this.handleInternalClose();
  }

  private getActiveTheme(): 'light' | 'dark' {
    return document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  }

  ngOnDestroy(): void {
    if (this.eventSubs) this.eventSubs.unsubscribe();
  }
}
