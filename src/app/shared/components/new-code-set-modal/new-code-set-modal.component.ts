import { Component, effect, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

export interface CodeEntry {
  codeValue: string;
  label: string;
  description?: string;
  status: string;
}

@Component({
  selector: 'app-new-code-set-modal',
  standalone: false,
  templateUrl: './new-code-set-modal.component.html',
  styleUrls: ['./new-code-set-modal.component.scss'],
  providers: [EventService],
})
export class NewCodeSetModalComponent implements OnInit, OnDestroy {
  // Signals for state management
  public isOpen = signal<boolean>(false);
  public theme = signal<'light' | 'dark'>('light');
  public showAddCodeModal = signal<boolean>(false);
  public activeStep = signal<number>(0);
  public reviewSnapshot = signal<any>(null);

  // Step indicator states
  public step1Complete = signal<boolean>(false);
  public step2Complete = signal<boolean>(false);
  public step3Complete = signal<boolean>(false);
  public step4Complete = signal<boolean>(false);

  // Codes management
  public codesArray = signal<CodeEntry[]>([]);
  public addCodesNow = signal<boolean>(true);

  // Step 5: Created code set data
  public createdCodeSetId = signal<string | null>(null);
  public createdCodeSetName = signal<string>('');
  public createdCodeSetData = signal<any>(null);

  // Dynamic Metadata Signals (for future compatibility)
  public systems = signal<string[]>([]);
  public statuses = signal<string[]>([]);

  private eventSubs?: Subscription;

  // Step Forms
  basicsForm!: FormGroup;
  semanticsForm!: FormGroup;
  structureForm!: FormGroup;

  // Dropdown options
  meaningTypes = [
    'Enumerated categories (e.g., status, type)',
    'Ordinal (ordered values)',
    'Classification / taxonomy',
    'Identifier / reference',
  ];
  canonicalReps = ['Code only (e.g., A1)', 'Code + label (e.g., A1 – Active)', 'Label only'];
  codeValueTypes = ['String', 'Integer', 'Alphanumeric'];

  constructor(
    private _fb: FormBuilder,
    protected eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
  ) {
    effect(() => {
      console.log(`[CodeSet Modal] Theme: ${this.theme()}, Step: ${this.activeStep()}`);
    });
  }

  ngOnInit(): void {
    this.initForms();
    this.subscribeToEvents();
  }

  private initForms() {
    // Step 1: Basics
    this.basicsForm = this._fb.group({
      name: ['', Validators.required],
      description: [''],
      codeSystem: [''],
      severity: ['Critical', Validators.required],
    });
    // Step 2: Semantics
    this.semanticsForm = this._fb.group({
      meaningType: ['', Validators.required],
      canonicalRepresentation: ['', Validators.required],
      extensible: ['yes', Validators.required],
      deprecatedAllowed: [false],
    });
    // Step 3: Structure
    this.structureForm = this._fb.group({
      codeValueType: ['', Validators.required],
      uniquenessScope: ['local', Validators.required],
    });
  }

  private subscribeToEvents() {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      // 1. Safeguard: Check if state or items exist
      if (!state || !state.items) return;
      const itemEvent = state.items.event;
      const payload = state.items.payload;

      // --- Main Modal Open ---
      if (
        ['open_new_code_set_modal', 'open_new_value_set_modal'].includes(itemEvent) ||
        ['open_new_code_set_modal', 'open_new_value_set_modal'].includes(payload?.action)
      ) {
        this.theme.set(payload?.theme || this.getActiveTheme());
        if (payload?.defaults) {
          this.basicsForm.patchValue(payload.defaults);
        }
        this.isOpen.set(true);
        this.activeStep.set(0);
      }

      // --- Add Code Success (The payload listener) ---
      if (itemEvent === 'code_added_to_set' || payload?.action === 'code_added_to_set') {
        if (payload?.code) {
          this.codesArray.update(currentCodes => [...currentCodes, payload.code]);
          console.log('[Parent] Code added to list:', payload.code);
        }
        this.showAddCodeModal.set(false);
      }

      // --- Add Code Modal Close ---
      if (itemEvent === 'close_add_code_modal' || payload?.action === 'close_add_code_modal') {
        this.showAddCodeModal.set(false);
      }

      // --- Final Save Confirmation ---
      if (
        itemEvent === 'confirmation_save_confirmed' ||
        payload?.action === 'confirmation_save_confirmed'
      ) {
        // MATCHED: Checking for 'save' command as sent by confirmCreate()
        if (payload?.command === 'save' && payload?.confirmed) {
          this.executeFinalSave();
        }
      }

      // --- Main Modal Close ---
      if (
        ['close_new_code_set_modal', 'close_new_value_set_modal'].includes(itemEvent) ||
        ['close_new_code_set_modal', 'close_new_value_set_modal'].includes(payload?.action)
      ) {
        //this.handleInternalClose();
      }
    });
  }

  nextStep() {
    const currentStep = this.activeStep();
    if (currentStep === 0 && this.basicsForm.valid) {
      this.step1Complete.set(true);
      this.activeStep.set(1);
    } else if (currentStep === 1 && this.semanticsForm.valid) {
      this.step2Complete.set(true);
      this.activeStep.set(2);
    } else if (currentStep === 2 && this.structureForm.valid) {
      this.step3Complete.set(true);
      this.captureReviewSnapshot();
      this.activeStep.set(3);
    } else if (currentStep === 3) {
      // FROM REVIEW, GO TO CREATE - triggers confirmCreate
      this.confirmCreate();
    } else if (currentStep === 4) {
      // FROM CONNECT STEP, CLOSE MODAL
      this.finishWithoutConnecting();
    }
  }

  prevStep() {
    const currentStep = this.activeStep();
    if (currentStep > 0) {
      this.activeStep.set(currentStep - 1);
    }
  }

  goToStep(step: number) {
    if (
      step === 0 ||
      (step === 1 && this.step1Complete()) ||
      (step === 2 && this.step2Complete()) ||
      (step === 3 && this.step3Complete()) ||
      (step === 4 && this.step4Complete())
    ) {
      this.activeStep.set(step);
    }
  }

  private captureReviewSnapshot() {
    const snapshot = {
      basics: {
        name: this.basicsForm.get('name')?.value,
        description: this.basicsForm.get('description')?.value,
        codeSystem: this.basicsForm.get('codeSystem')?.value,
        severity: this.basicsForm.get('severity')?.value,
      },
      semantics: {
        meaningType: this.semanticsForm.get('meaningType')?.value,
        canonicalRepresentation: this.semanticsForm.get('canonicalRepresentation')?.value,
        extensible: this.semanticsForm.get('extensible')?.value,
        deprecatedAllowed: this.semanticsForm.get('deprecatedAllowed')?.value,
      },
      structure: {
        codeValueType: this.structureForm.get('codeValueType')?.value,
        uniquenessScope: this.structureForm.get('uniquenessScope')?.value,
      },
      codes: this.codesArray(),
    };
    this.reviewSnapshot.set(snapshot);
  }

  public openAddCodeModal() {
    const codeSetData = {
      name: this.basicsForm.get('name')?.value || 'New Code Set',
      codeValueType: this.structureForm.get('codeValueType')?.value,
      uniquenessScope: this.structureForm.get('uniquenessScope')?.value,
      existingCodes: this.codesArray(),
      deprecatedAllowed: this.semanticsForm.get('deprecatedAllowed')?.value,
    };
    this.eventService.publish('nf', 'open_add_new_code_modal', {
      action: 'open_add_new_code_modal',
      codeSetData: codeSetData,
      theme: this.theme(),
    });
    this.showAddCodeModal.set(true);
  }

  removeCode(index: number) {
    const currentCodes = this.codesArray();
    this.codesArray.set(currentCodes.filter((_, i) => i !== index));
  }

  public close() {
    // Aligned with NewModelModalComponent: Notify store before closing internally
    this.eventService.publish('nf', 'close_new_code_set_modal', {
      action: 'close_new_code_set_modal',
      theme: this.theme(),
    });
    this.handleInternalClose();
  }

  public confirmCreate() {
    if (this.basicsForm.invalid || this.semanticsForm.invalid || this.structureForm.invalid) {
      return;
    }
    this.eventService.publish('nf', 'open_confirmation_modal', {
      action: 'open_confirmation_modal',
      title: 'Confirm Code Set Creation',
      message: `Are you sure you want to create the code set "${this.basicsForm.get('name')?.value}"?`,
      command: 'save',
      itemName: this.basicsForm.get('name')?.value,
      theme: this.theme(),
    });
  }

  private executeFinalSave() {
    const payload = {
      basics: this.basicsForm.value,
      semantics: this.semanticsForm.value,
      structure: this.structureForm.value,
      codes: this.codesArray(),
      attribution: {
        createdBy: 'Current User',
        timestamp: new Date().toISOString(),
      },
      theme: this.theme(),
    };
    // Generate mock ID for the created code set
    const codeSetId = `cs_${Date.now()}`;
    const codeSetName = this.basicsForm.get('name')?.value;
    // Store created code set data
    this.createdCodeSetId.set(codeSetId);
    this.createdCodeSetName.set(codeSetName);
    this.createdCodeSetData.set(payload);
    this.eventService.publish('nf', 'code_set_creation_complete', {
      action: 'code_set_creation_complete',
      payload: payload,
      codeSetId: codeSetId,
      codeSetName: codeSetName,
    });
    console.log('[CODE SET] Created:', payload);
    // Mark step 4 complete and navigate to Step 5 (Connect)
    this.step4Complete.set(true);
    this.activeStep.set(4);
    // DO NOT close the modal - user sees Step 5
  }

  /**
   * Opens Map Code Set component from newly created code set
   * Uses EXACT format from normalization.component.ts generateSourceCodeRows
   */
  public createMappingWithCodeSet() {
    console.log('[NewCodeSetModal] Opening Map Code Set with', this.codesArray().length, 'codes');

    // Transform codesArray into sourceCodeRows with EXACT property names
    const sourceCodeRows = this.codesArray().map((code, index) => ({
      id: `row-${index}`,
      sourceCode: code.codeValue || '',
      sourceLabel: code.label || '',
      targetCode: '',
      targetLabel: '',
      mappingType: 'Direct',
      hasWarning: false,
    }));

    // Prepare mapping data in EXACT format from normalization.component.ts
    const mappingData = {
      id: this.createdCodeSetId(),
      sourceCodeSet: this.createdCodeSetName(),
      targetCodeSet: '',
      sourceCodeRows: sourceCodeRows,
    };

    console.log('[NewCodeSetModal] Publishing mapping data →', {
      sourceCodeSet: mappingData.sourceCodeSet,
      rowCount: sourceCodeRows.length,
      firstRowExample: sourceCodeRows[0] || 'no rows',
    });

    // Close this modal AFTER user clicks "Map Code Set"
    this.handleInternalClose();

    // Publish event to open Map Code Set (same as Codes tab)
    this.eventService.publish('nf', 'open_map_code_set', {
      action: 'open_map_code_set',
      codeSetId: this.createdCodeSetId(),
      fullData: mappingData,
    });

    // Update breadcrumb
    const breadcrumbPath = [
      { label: 'Normalization', target: 'ROOT' },
      { label: 'Codes', target: 'TAB_CODES' },
      { label: `Map: ${this.createdCodeSetName()}`, target: 'MAP_CODE_SET', active: true },
    ];
    this.eventService.publish('nf', 'update_breadcrumb', { path: breadcrumbPath });
  }

  /**
   * Opens the Create New Validation Rule modal with the newly created code set pre-selected
   */
  public createValidationRuleForCodeSet() {
    const codeSetData = {
      id: this.createdCodeSetId(),
      name: this.createdCodeSetName(),
      system: this.basicsForm.get('codeSystem')?.value,
      codeValueType: this.structureForm.get('codeValueType')?.value,
      codes: this.codesArray(),
    };
    // Close this modal first
    this.handleInternalClose();
    // Open the new validation rule modal with code set pre-selected
    this.eventService.publish('nf', 'open_new_code_set_validation_rule_modal', {
      action: 'open_new_code_set_validation_rule_modal',
      codeSetData: codeSetData,
      preselectedCodeSet: {
        id: this.createdCodeSetId(),
        name: this.createdCodeSetName(),
      },
      theme: this.theme(),
    });
  }

  /**
   * Opens the code set detail view in the same context
   */
  public viewCodeSetDetails() {
    const codeSetData = {
      id: this.createdCodeSetId(),
      name: this.createdCodeSetName(),
      ...this.createdCodeSetData(),
    };
    // Publish event to open code set detail panel
    this.eventService.publish('nf', 'open_code_set_detail', {
      action: 'open_code_set_detail',
      codeSetId: this.createdCodeSetId(),
      codeSetData: codeSetData,
    });
    // Close modal
    this.handleInternalClose();
  }

  /**
   * User chooses "Not now" - just close the modal
   */
  public finishWithoutConnecting() {
    // Just close the modal - code set is already created
    this.handleInternalClose();
  }

  private handleInternalClose() {
    this.isOpen.set(false);
    this.activeStep.set(0);
    this.resetModalState();
  }

  private resetModalState() {
    this.activeStep.set(0);
    this.step1Complete.set(false);
    this.step2Complete.set(false);
    this.step3Complete.set(false);
    this.step4Complete.set(false);
    this.reviewSnapshot.set(null);
    this.codesArray.set([]);
    this.addCodesNow.set(true);
    // Reset Step 5 data
    this.createdCodeSetId.set(null);
    this.createdCodeSetName.set('');
    this.createdCodeSetData.set(null);
    this.basicsForm.reset({ severity: 'Critical' });
    this.semanticsForm.reset({ extensible: 'yes', deprecatedAllowed: false });
    this.structureForm.reset({ uniquenessScope: 'local' });
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
