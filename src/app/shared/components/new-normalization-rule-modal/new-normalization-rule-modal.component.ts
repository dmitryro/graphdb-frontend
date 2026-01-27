import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldDefaultOptions,
} from '@angular/material/form-field';
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-new-normalization-rule-modal',
  standalone: false,
  templateUrl: './new-normalization-rule-modal.component.html',
  styleUrls: ['./new-normalization-rule-modal.component.scss'],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { hideRequiredMarker: true } as MatFormFieldDefaultOptions,
    },
    EventService,
  ],
})
export class NewNormalizationRuleModalComponent implements OnInit, OnDestroy {
  // Signals for state management
  public isOpen = signal<boolean>(false);
  public theme = signal<'light' | 'dark'>('dark');
  public activeStep = signal<number>(0);

  // Snapshot signal to hold data specifically for Step 4 review
  public reviewSnapshot = signal<any>(null);

  // Store all transformation type configurations as user switches between them
  private transformationConfigs = new Map<string, any>();

  // Dynamic Metadata Signals from Payload
  public severities = signal<string[]>([]);
  public scopes = signal<string[]>([]);
  public triggers = signal<string[]>([]);
  public logicTypes = signal<string[]>([]);
  public availableFields = signal<string[]>([]);
  public targetModel = signal<string>('');
  public availableModels = signal<string[]>([]);

  // Severity descriptions for Step 1
  public severityDescriptions: Record<string, string> = {
    Critical: 'Breaks canonical integrity if incorrect',
    High: 'Significant downstream impact',
    Medium: 'Moderate normalization impact',
    Low: 'Informational or minor adjustment',
  };

  private eventSubs?: Subscription;
  basicsForm!: FormGroup;
  scopeForm!: FormGroup;
  logicForm!: FormGroup;

  constructor(
    private _fb: FormBuilder,
    protected eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.subscribeToEvents();
  }

  private initForms() {
    this.basicsForm = this._fb.group({
      model: ['', Validators.required],
      name: ['', Validators.required],
      description: [
        'Describe what this transformation does, any assumptions, or when it should be used.',
      ],
      severity: ['Medium', Validators.required],
    });

    this.scopeForm = this._fb.group({
      scope: ['', Validators.required],
      targetField: [''],
      trigger: ['', Validators.required],
    });

    this.logicForm = this._fb.group({
      // Only the type selection is strictly required to move forward
      logicType: ['', Validators.required],

      // These fields are temporary "buffers" for the Add buttons.
      // We keep them optional so they don't block the Next button if left empty.
      sourceField: [''],
      fromUnit: [''],
      toUnit: [''],
      newName: [''],
      formula: [''],
      resultType: ['Integer'], // Defaulting helps consistency
      defaultValue: [''],

      // These arrays hold the actual data that matters
      mappings: this._fb.array([]),
      aliases: this._fb.array([]),
      conversions: this._fb.array([]),
      formulas: this._fb.array([]),
      defaults: this._fb.array([]),
      nullify: this._fb.array([]),
    });

    // Watch for scope changes
    this.scopeForm.get('scope')?.valueChanges.subscribe(scope => {
      const targetField = this.scopeForm.get('targetField');
      if (scope === 'Field-level') {
        targetField?.setValidators(Validators.required);
      } else {
        targetField?.clearValidators();
      }
      targetField?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private subscribeToEvents() {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      if (!state?.items) return;
      const { event, payload } = state.items;

      // --- MODAL OPEN LOGIC ---
      if (
        event === 'open_normalization_rule_modal' ||
        payload?.action === 'open_new_normalization_rule_modal'
      ) {
        if (payload.metadataOptions) {
          this.severities.set(payload.metadataOptions.severities || []);
          this.scopes.set(payload.metadataOptions.scopes || []);
          this.triggers.set(payload.metadataOptions.triggers || []);
          this.logicTypes.set(payload.metadataOptions.logicTypes || []);
          this.availableFields.set(payload.metadataOptions.availableFields || []);
          this.availableModels.set(payload.metadataOptions.availableModels || []);
        }

        this.targetModel.set(payload.targetModel || 'Unknown Model');
        this.theme.set(
          payload?.theme || (document.body.classList.contains('dark-theme') ? 'dark' : 'light'),
        );

        if (payload.defaults) {
          this.basicsForm.patchValue(payload.defaults, { emitEvent: false });
        }

        if (payload.targetModel) {
          this.basicsForm.get('model')?.setValue(payload.targetModel, { emitEvent: false });
        }

        this.activeStep.set(0);
        this.isOpen.set(true);
      }

      // --- TRANSACTIONAL CONFIRMATION LOGIC ---
      // Listen for the specific confirmation from the ConfirmationModalComponent
      if (event === 'confirmation_save_confirmed' && payload?.confirmed) {
        this.finalizeNormalizationRule();
      }

      // --- CLOSE LOGIC ---
      if (
        event === 'close_new_normalization_rule_modal' ||
        payload?.action === 'close_new_normalization_rule_modal'
      ) {
        this.handleInternalClose();
      }
    });
  }

  private finalizeNormalizationRule() {
    const snapshot = this.reviewSnapshot();
    if (!snapshot) return;

    const finalPayload = {
      basics: snapshot.basics,
      scope: snapshot.scope,
      // Including the arrays specifically for the backend parser
      details: {
        mappings: snapshot.mappings,
        aliases: snapshot.aliases,
        conversions: snapshot.conversions,
        formulas: snapshot.formulas,
        defaults: snapshot.defaults,
        ignoreList: snapshot.ignoreList,
      },
      targetModel: snapshot.basics.model,
      summary: {
        identity: snapshot.basics,
        application: snapshot.scope,
        transformation: this.getLogicSummary(),
      },
      timestamp: new Date().toISOString(),
    };

    // Final event to the system/store
    this.eventService.publish('nf', 'normalization_rule_creation_complete', {
      action: 'normalization_rule_creation_complete',
      payload: finalPayload,
    });

    this.handleInternalClose();
  }

  // 2. Getter for the nullify array
  get nullifyRows() {
    return this.logicForm.get('nullify') as FormArray;
  }

  // 3. Method to add a field to the null/ignore list
  addNullifyEntry() {
    const source = this.logicForm.get('sourceField')?.value;

    if (source) {
      // Check if already exists to prevent duplicates
      const exists = this.nullifyRows.getRawValue().some(r => r.sourceField === source);
      if (!exists) {
        const row = this._fb.group({
          sourceField: [source, Validators.required],
        });
        this.nullifyRows.push(row);
      }
      // Clear input for next selection
      this.logicForm.patchValue({ sourceField: '' });
    }
  }

  removeNullifyRow(index: number) {
    this.nullifyRows.removeAt(index);
  }

  // 2. Getter for the formulas array
  get formulaRows() {
    return this.logicForm.get('formulas') as FormArray;
  }

  // 3. Method to add a formula entry to the list
  addFormulaEntry() {
    const name = this.logicForm.get('newName')?.value; // Using newName as the Result Field name
    const formula = this.logicForm.get('formula')?.value;
    const type = this.logicForm.get('resultType')?.value;

    if (name && formula && type) {
      const row = this._fb.group({
        targetField: [name, Validators.required],
        formula: [formula, Validators.required],
        resultType: [type, Validators.required],
      });
      this.formulaRows.push(row);

      // Clear inputs for next entry
      this.logicForm.patchValue({ newName: '', formula: '' });
    }
  }

  removeFormulaRow(index: number) {
    this.formulaRows.removeAt(index);
  }

  get mappingRows() {
    return this.logicForm.get('mappings') as FormArray;
  }

  // 2. Getter for the defaults array
  get defaultRows() {
    return this.logicForm.get('defaults') as FormArray;
  }

  // 3. Method to add a default entry
  addDefaultEntry() {
    const source = this.logicForm.get('sourceField')?.value;
    const value = this.logicForm.get('defaultValue')?.value;

    if (source && value) {
      const row = this._fb.group({
        sourceField: [source, Validators.required],
        defaultValue: [value, Validators.required],
      });
      this.defaultRows.push(row);

      // Clear inputs for next entry
      this.logicForm.patchValue({ sourceField: '', defaultValue: '' });
    }
  }

  removeDefaultRow(index: number) {
    this.defaultRows.removeAt(index);
  }

  // 2. Helper Getters
  get aliasRows() {
    return this.logicForm.get('aliases') as FormArray;
  }

  // 3. Methods to handle logic
  createAliasRow(source = '', alias = ''): FormGroup {
    return this._fb.group({
      sourceField: [source, Validators.required],
      aliasName: [alias, Validators.required],
    });
  }

  // This method captures the current dropdown + input and adds it to the table
  addAliasEntry() {
    const source = this.logicForm.get('sourceField')?.value;
    const alias = this.logicForm.get('newName')?.value;

    if (source && alias) {
      // Check if alias already exists for this field to prevent duplicates
      const exists = this.aliasRows.controls.some(
        control =>
          control.get('sourceField')?.value === source && control.get('aliasName')?.value === alias,
      );

      if (!exists) {
        this.aliasRows.push(this.createAliasRow(source, alias));
        // Optionally clear the input after adding
        this.logicForm.get('newName')?.setValue('');
      }
    }
  }

  removeAliasRow(index: number) {
    this.aliasRows.removeAt(index);
  }

  // 2. Getter for the conversions array
  get conversionRows() {
    return this.logicForm.get('conversions') as FormArray;
  }

  // 3. Method to add a conversion entry
  addConversionEntry() {
    const source = this.logicForm.get('sourceField')?.value;
    const from = this.logicForm.get('fromUnit')?.value;
    const to = this.logicForm.get('toUnit')?.value;

    if (source && from && to) {
      const row = this._fb.group({
        sourceField: [source, Validators.required],
        fromUnit: [from, Validators.required],
        toUnit: [to, Validators.required],
      });
      this.conversionRows.push(row);
    }
  }

  removeConversionRow(index: number) {
    this.conversionRows.removeAt(index);
  }

  createMappingRow(): FormGroup {
    return this._fb.group({
      sourceValue: ['', Validators.required],
      targetValue: ['', Validators.required],
    });
  }

  addRow() {
    this.mappingRows.push(this.createMappingRow());
  }

  removeRow(index: number) {
    if (this.mappingRows.length > 0) {
      this.mappingRows.removeAt(index);
    }
  }

  onLogicTypeChange() {
    const logicType = this.logicForm.get('logicType')?.value;

    // 1. Clear all validators from the "scratchpad" fields.
    // This ensures that an empty "Source Field" box doesn't make the form invalid.
    this.clearLogicValidators();

    // 2. Specialized handling for Value Mapping only (if you want an initial row)
    if (logicType === 'Value Mapping' && this.mappingRows.length === 0) {
      this.addRow();
    }

    // 3. Finalize the state
    this.logicForm.updateValueAndValidity();
  }

  private setFieldsRequired(fields: string[]) {
    fields.forEach(f => this.logicForm.get(f)?.setValidators(Validators.required));
  }

  selectLogicType(type: string) {
    const currentType = this.logicForm.get('logicType')?.value;
    if (currentType) {
      this.saveCurrentTransformationConfig(currentType);
    }

    this.logicForm.get('logicType')?.setValue(type);
    this.onLogicTypeChange(); // This now clears validators

    this.restoreTransformationConfig(type);
  }

  private saveCurrentTransformationConfig(logicType: string) {
    // Save all field values for the current transformation type
    const config: any = {
      logicType: logicType,
    };

    // Save all standalone fields regardless of type
    config.sourceField = this.logicForm.get('sourceField')?.value || '';
    config.fromUnit = this.logicForm.get('fromUnit')?.value || '';
    config.toUnit = this.logicForm.get('toUnit')?.value || '';
    config.newName = this.logicForm.get('newName')?.value || '';
    config.formula = this.logicForm.get('formula')?.value || '';
    config.resultType = this.logicForm.get('resultType')?.value || '';
    config.defaultValue = this.logicForm.get('defaultValue')?.value || '';

    // Save specific FormArray data based on the logic type
    if (logicType === 'Value Mapping') {
      config.mappings = this.mappingRows.getRawValue();
    }

    // NEW: Save the table of aliases for Rename / Alias type
    if (logicType === 'Rename / Alias') {
      config.aliases = this.aliasRows.getRawValue();
    }

    if (logicType === 'Unit Conversion') {
      config.conversions = this.conversionRows.getRawValue(); // NEW
    }

    if (logicType === 'Derived Value') {
      config.derivedValues = this.formulaRows.getRawValue(); // NEW
    }

    if (logicType === 'Default Value') {
      config.defaultList = this.defaultRows.getRawValue(); // NEW
    }

    if (logicType === 'Null / Ignore') {
      config.ignoreList = this.nullifyRows.getRawValue(); // NEW
    }

    this.transformationConfigs.set(logicType, config);
  }

  private restoreTransformationConfig(logicType: string) {
    const savedConfig = this.transformationConfigs.get(logicType);

    // Always clear all fields first
    this.logicForm.patchValue(
      {
        sourceField: '',
        fromUnit: '',
        toUnit: '',
        newName: '',
        formula: '',
        resultType: '',
        defaultValue: '',
      },
      { emitEvent: false },
    );

    // Clear mappings
    this.mappingRows.clear();

    if (savedConfig) {
      // Restore all saved field values
      this.logicForm.patchValue(
        {
          sourceField: savedConfig.sourceField || '',
          fromUnit: savedConfig.fromUnit || '',
          toUnit: savedConfig.toUnit || '',
          newName: savedConfig.newName || '',
          formula: savedConfig.formula || '',
          resultType: savedConfig.resultType || '',
          defaultValue: savedConfig.defaultValue || '',
        },
        { emitEvent: false },
      );

      // Restore mappings if this is Value Mapping
      if (logicType === 'Value Mapping' && savedConfig.mappings) {
        savedConfig.mappings.forEach((mapping: any) => {
          const row = this.createMappingRow();
          row.patchValue(mapping);
          this.mappingRows.push(row);
        });
      } else if (logicType === 'Value Mapping' && this.mappingRows.length === 0) {
        // Add one empty row for Value Mapping if none exist
        this.addRow();
      }
    } else if (logicType === 'Value Mapping') {
      // No saved config for Value Mapping, add one empty row
      this.addRow();
    }
  }

  private clearLogicValidators() {
    // IMPORTANT: We do not use .reset() or .setValue('') here.
    // This allows the form to remember your alias even if you click 'Unit Conversion' and back.
    const fields = [
      'sourceField',
      'fromUnit',
      'toUnit',
      'newName',
      'formula',
      'resultType',
      'defaultValue',
    ];
    fields.forEach(field => {
      this.logicForm.get(field)?.clearValidators();
      this.logicForm.get(field)?.updateValueAndValidity({ emitEvent: false });
    });
  }

  getUnitOptions(fieldName: string): string[] {
    const unitsByType: Record<string, string[]> = {
      height: ['Inches (in)', 'Centimeters (cm)', 'Meters (m)', 'Feet (ft)'],
      weight: ['Pounds (lb)', 'Kilograms (kg)', 'Ounces (oz)', 'Grams (g)'],
      temperature: ['Fahrenheit (°F)', 'Celsius (°C)', 'Kelvin (K)'],
      length: [
        'Inches (in)',
        'Centimeters (cm)',
        'Meters (m)',
        'Feet (ft)',
        'Miles (mi)',
        'Kilometers (km)',
      ],
    };
    for (const [type, units] of Object.entries(unitsByType)) {
      if (fieldName?.toLowerCase().includes(type)) return units;
    }
    return ['Inches (in)', 'Centimeters (cm)'];
  }

  getResultTypes(): string[] {
    return ['Integer', 'Float', 'String', 'Boolean', 'Date'];
  }

  nextStep() {
    if (this.activeStep() < 3) {
      if (this.activeStep() === 2) {
        const currentType = this.logicForm.get('logicType')?.value;
        if (currentType) {
          this.saveCurrentTransformationConfig(currentType);
        }

        this.reviewSnapshot.set({
          basics: this.basicsForm.getRawValue(),
          scope: this.scopeForm.getRawValue(),
          // Capture everything currently in the UI
          mappings: this.mappingRows.getRawValue(),
          aliases: this.aliasRows.getRawValue(),
          conversions: this.conversionRows.getRawValue(),
          formulas: this.formulaRows.getRawValue(),
          defaults: this.defaultRows.getRawValue(),
          ignoreList: this.nullifyRows.getRawValue(),
          // Capture the "saved" states from other tabs
          allTransformations: Array.from(this.transformationConfigs.values()),
        });
      }
      this.activeStep.update(v => v + 1);
    }
  }

  prevStep() {
    if (this.activeStep() > 0) {
      this.activeStep.update(v => v - 1);
    }
  }

  public close() {
    this.eventService.publish('nf', 'close_new_normalization_rule_modal', {
      action: 'close_new_normalization_rule_modal',
    });
    this.handleInternalClose();
  }

  public confirmAction() {
    const snapshot = this.reviewSnapshot();

    // Trigger the confirmation modal instead of finishing directly
    this.eventService.publish('nf', 'open_confirmation_modal', {
      title: 'Finalize Normalization Rule',
      action: 'open_confirmation_modal',
      message: `Are you sure you want to save the rule "${snapshot.basics.name}"? This will apply the defined transformations to the ${snapshot.basics.model} model.`,
      command: 'save', // This dictates the name of the confirmation event we listen for
      itemName: snapshot.basics.name,
      theme: this.theme(),
    });
  }

  private handleInternalClose() {
    this.isOpen.set(false);
    this.activeStep.set(0);
    this.reviewSnapshot.set(null);
    this.transformationConfigs.clear(); // Clear saved configs
    this.basicsForm.reset({
      description:
        'Describe what this transformation does, any assumptions, or when it should be used.',
      severity: 'Medium',
    });
    this.scopeForm.reset();
    this.logicForm.reset();
    this.mappingRows.clear();
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 0:
        return this.basicsForm.valid;
      case 1:
        return this.scopeForm.valid;
      case 2:
        // Just ensure a type is selected.
        // The arrays are valid by default even if empty.
        return !!this.logicForm.get('logicType')?.value;
      case 3:
        return true;
      default:
        return false;
    }
  }

  getLogicSummary(): string {
    const snapshot = this.reviewSnapshot();
    if (!snapshot) return '';

    const { scope, targetField, trigger } = snapshot.scope;
    const { name, model } = snapshot.basics;
    const allTransformations = snapshot.allTransformations || [];

    if (allTransformations.length === 0) {
      return `Rule "${name}" for ${model} triggers on ${trigger} at a ${scope} level. No transformations configured.`;
    }

    const summaryParts: string[] = [];

    allTransformations.forEach((config: any) => {
      const {
        logicType,
        sourceField,
        fromUnit,
        toUnit,
        newName,
        formula,
        resultType,
        defaultValue,
        mappings,
      } = config;

      let text = `${logicType}: `;

      switch (logicType) {
        case 'Value Mapping':
          if (mappings && mappings.length > 0) {
            const maps = mappings.map((m: any) => `${m.sourceValue} → ${m.targetValue}`).join(', ');
            text += `Mapping [${maps}]`;
          } else {
            text += 'No mappings defined';
          }
          break;
        case 'Unit Conversion':
          text += `converting ${sourceField} from ${fromUnit} to ${toUnit}`;
          break;
        case 'Rename / Alias':
          text += `aliasing ${sourceField} as ${newName}`;
          break;
        case 'Derived Value':
          text += `calculating ${resultType} via formula: ${formula}`;
          break;
        case 'Default Value':
          text += `providing "${defaultValue}" when ${sourceField} is missing`;
          break;
        case 'Null / Ignore':
          text += `explicitly ignoring values for ${sourceField}`;
          break;
      }

      summaryParts.push(text);
    });

    return `Rule "${name}" for ${model} triggers on ${trigger} at a ${scope} level${scope === 'Field-level' ? ` (Target: ${targetField})` : ''}. Transformations: ${summaryParts.join(' | ')}`;
  }

  ngOnDestroy(): void {
    this.eventSubs?.unsubscribe();
  }
}
