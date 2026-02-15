import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldDefaultOptions,
} from '@angular/material/form-field';
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

// --- IMPORTS (Add to top of file) ---
import {
  ImpactPreview,
  JsonLogicRule,
  LogicToken,
} from '@shared/components/rule-assembler/rule-assembler.component';

type RuleCategory = 'code' | 'model' | 'mapping';

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
  public ruleCategory = signal<RuleCategory | null>(null);

  // Snapshot signal to hold data specifically for Step 5 review
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

  // NEW: Signal for dynamically updated model fields
  public currentModelFields = signal<string[]>([]);

  // NEW: Signal for selected code systems (replaces FormArray approach)
  public selectedCodeSystems = signal<string[]>([]);

  // Step 1 Governance Fields
  public ruleIntents = signal<string[]>([]);
  public owningTeamsRoles = signal<string[]>([]);
  public intendedAudiences = signal<string[]>([]);
  public lifecycleIntents = signal<string[]>([]);

  // Code Rule specific signals
  public codeRuleOperands = signal<string[]>([]);
  public codeRuleOperators = signal<string[]>([]);
  public codeRuleVariables = signal<string[]>([]);

  // Mapping Rule specific signals
  public mappingRuleOperands = signal<string[]>([]);
  public mappingRuleVariables = signal<string[]>([]);
  public codeSystemsAvailable = signal<string[]>([]);
  public modelFieldsMap = signal<Record<string, string[]>>({});
  public modelKeys = computed(() => Object.keys(this.modelFieldsMap()));

  // Rule Assembler State
  public useAdvancedLogicBuilder = signal<boolean>(false);
  public assemblerLogicTokens = signal<LogicToken[]>([]);
  public assemblerJsonLogic = signal<JsonLogicRule>({});
  public ruleImpactPreview = signal<ImpactPreview>({
    status: 'unavailable',
    affectedMappings: 0,
    affectedCodes: 0,
    recordCount: 0,
    conflictEvents: 0,
  });

  // Pretty-printed version for display + fallback
  public displayJsonLogic = computed(() => {
    const json = this.assemblerJsonLogic();
    if (!json || Object.keys(json).length === 0) {
      return '// No logic defined yet';
    }
    try {
      return JSON.stringify(json, null, 2);
    } catch (e) {
      console.log(`Error: ${e}`);
      return '// Invalid JSON Logic structure';
    }
  });

  // Severity descriptions for Step 2
  public severityDescriptions: Record<string, string> = {
    Critical: 'Breaks canonical integrity if incorrect',
    High: 'Significant downstream impact',
    Medium: 'Moderate normalization impact',
    Low: 'Informational or minor adjustment',
  };

  // Code Rule severity descriptions
  public codeRuleSeverityDescriptions: Record<string, string> = {
    Error: 'Breaks canonical integrity if incorrect',
    Warn: 'Significant downstream impact',
    Info: 'Informational or minor adjustment',
  };

  public mappingRuleSeverityDescriptions: Record<string, string> = {
    Critical: 'Breaks canonical integrity if incorrect',
    High: 'Significant downstream impact',
    Medium: 'Moderate normalization impact',
    Low: 'Informational or minor adjustment',
  };

  private eventSubs?: Subscription;
  private impactRequest$ = new Subject<JsonLogicRule>();

  categoryForm!: FormGroup;
  basicsForm!: FormGroup;
  scopeForm!: FormGroup;
  logicForm!: FormGroup;

  constructor(
    private _fb: FormBuilder,
    protected eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
  ) {
    // Debounce impact requests to prevent excessive calls
    this.impactRequest$
      .pipe(debounceTime(600))
      .subscribe(jsonLogic => this._performImpactCalculation(jsonLogic));
  }

  ngOnInit(): void {
    this.initForms();
    this.subscribeToEvents();

    // When model rule is active, drive currentModelFields from Basics.model
    this.basicsForm.get('model')?.valueChanges.subscribe(modelName => {
      if (this.ruleCategory() === 'model' && modelName) {
        this.onTargetModelChange(modelName);
      }
      if (this.ruleCategory() === 'model' && !modelName) {
        this.currentModelFields.set([]);
        this.scopeForm.get('targetField')?.reset('');
      }
    });

    // When mapping rule is active, drive currentModelFields from Scope.targetModel
    this.scopeForm.get('targetModel')?.valueChanges.subscribe(modelName => {
      if (this.ruleCategory() === 'mapping' && modelName) {
        this.onTargetModelChange(modelName);
      }
      if (this.ruleCategory() === 'mapping' && !modelName) {
        this.currentModelFields.set([]);
      }
    });
  }

  private initForms() {
    // Step 0 - Category Selection
    this.categoryForm = this._fb.group({
      category: ['', Validators.required],
      ruleIntent: ['', Validators.required],
      owningTeamRole: ['', Validators.required],
      intendedAudience: this._fb.array([], Validators.required),
      lifecycleIntent: ['', Validators.required],
    });

    // Step 1 - Basics
    this.basicsForm = this._fb.group({
      model: ['', Validators.required],
      name: ['', Validators.required],
      description: [
        'Describe what this transformation does, any assumptions, or when it should be used.',
      ],
      severity: ['Medium', Validators.required],
    });

    // Step 2 - Scope
    this.scopeForm = this._fb.group({
      scope: ['', Validators.required],
      targetField: [''],
      trigger: ['', Validators.required],
      // Code Rule specific
      appliesTo: [''],
      runTiming: [''],
      // Mapping Rule specific
      targetModel: [''],
      // REMOVED: sourceCodeSystems FormArray - now using signal
      targetCodeSystem: [''],
      mappingId: [''],
      filters: this._fb.array([]),
    });

    // Step 3 - Logic
    this.logicForm = this._fb.group({
      // Model Rule fields
      logicType: [''],
      sourceField: [''],
      fromUnit: [''],
      toUnit: [''],
      newName: [''],
      formula: [''],
      resultType: ['Integer'],
      defaultValue: [''],
      mappings: this._fb.array([]),
      aliases: this._fb.array([]),
      conversions: this._fb.array([]),
      formulas: this._fb.array([]),
      defaults: this._fb.array([]),
      nullify: this._fb.array([]),

      // Code Rule specific fields
      leftOperand: [''],
      operator: [''],
      rightOperand: [''],
      attributeKey: [''],
      message: [''],

      // Mapping Rule specific fields
      mappingLeftOperand: [''],
      mappingOperator: [''],
      mappingRightOperand: [''],
      mappingAttributeKey: [''],
      mappingMessage: [''],

      // Rule Assembler fields
      assemblerTokens: [''],
      assemblerJsonLogic: [''],
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

    // Watch for category changes
    this.categoryForm.get('category')?.valueChanges.subscribe(category => {
      this.ruleCategory.set(category as RuleCategory);
      this.resetFormsForCategory(category);
    });
  }

  private resetFormsForCategory(category: RuleCategory) {
    const defaultDesc =
      category === 'model'
        ? 'Describe what this transformation does, any assumptions, or when it should be used.'
        : 'Describe why this rule exists and when it should be used.';

    this.basicsForm.reset({
      description: defaultDesc,
      severity: category === 'code' ? 'Error' : 'Medium',
    });
    this.scopeForm.reset();
    this.logicForm.reset({ resultType: 'Integer' });
    this.transformationConfigs.clear();

    // Reset assembler state
    this.useAdvancedLogicBuilder.set(false);
    this.assemblerLogicTokens.set([]);
    this.assemblerJsonLogic.set({});
    this.ruleImpactPreview.set({
      status: 'unavailable',
      affectedMappings: 0,
      affectedCodes: 0,
      recordCount: 0,
      conflictEvents: 0,
    });

    // Clear arrays
    this.mappingRows.clear();
    this.aliasRows.clear();
    this.conversionRows.clear();
    this.formulaRows.clear();
    this.defaultRows.clear();
    this.nullifyRows.clear();
    this.filterRows.clear();

    // Clear signals
    this.selectedCodeSystems.set([]);
    this.currentModelFields.set([]);
  }

  /**
   * Toggle between simple and advanced logic builders
   */
  toggleLogicBuilder(useAdvanced: boolean): void {
    this.useAdvancedLogicBuilder.set(useAdvanced);

    if (useAdvanced) {
      // Transitioning TO advanced: try to convert simple logic to tokens
      this.convertSimpleLogicToTokens();
    } else {
      // Transitioning TO simple: try to convert tokens back to simple logic
      this.convertTokensToSimpleLogic();
    }

    console.log('[Logic Builder] Mode:', useAdvanced ? 'Advanced' : 'Simple');
  }

  /**
   * Convert simple logic form to initial tokens for assembler
   */
  private convertSimpleLogicToTokens(): void {
    const leftOperand = this.logicForm.get('mappingLeftOperand')?.value;
    const operator = this.logicForm.get('mappingOperator')?.value;
    const rightOperand = this.logicForm.get('mappingRightOperand')?.value;
    const attributeKey = this.logicForm.get('mappingAttributeKey')?.value;

    if (!leftOperand || !operator) {
      console.log('[Conversion] Insufficient simple logic to convert');
      return;
    }

    // Publish to rule assembler via EventService
    this.eventService.publish('nf', 'rule_assembler_update', {
      action: 'rule_assembler_update',
      theme: this.theme(),
      tokens: [
        {
          id: `token_${Date.now()}`,
          type: 'if' as const,
          value: 'IF',
          depth: 0,
          children: [
            {
              id: `token_${Date.now()}_1`,
              type: 'field' as const,
              value: attributeKey || leftOperand,
              depth: 1,
              metadata: {
                dataPath: attributeKey || leftOperand,
                fieldType: 'string',
              },
            },
            {
              id: `token_${Date.now()}_2`,
              type: 'operator' as const,
              value: operator,
              depth: 1,
            },
            ...(rightOperand
              ? [
                  {
                    id: `token_${Date.now()}_3`,
                    type: 'value' as const,
                    value: rightOperand,
                    depth: 1,
                  },
                ]
              : []),
          ],
        },
      ],
    });

    console.log('[Conversion] Simple logic converted to tokens');
  }

  /**
   * Convert assembler tokens back to simple logic form
   */
  private convertTokensToSimpleLogic(): void {
    const tokens = this.assemblerLogicTokens();

    if (!tokens || tokens.length === 0) {
      console.log('[Conversion] No tokens to convert');
      return;
    }

    // Try to extract simple IF condition
    const ifToken = tokens.find(t => t.type === 'if');
    if (!ifToken || !ifToken.children || ifToken.children.length < 2) {
      console.log('[Conversion] Complex logic cannot be simplified');
      return;
    }

    const field = ifToken.children.find(c => c.type === 'field');
    const operator = ifToken.children.find(c => c.type === 'operator');
    const value = ifToken.children.find(c => c.type === 'value');

    this.logicForm.patchValue({
      mappingLeftOperand: field?.metadata?.dataPath || field?.value || '',
      mappingOperator: operator?.value || '',
      mappingRightOperand: value?.value || '',
      mappingAttributeKey: field?.metadata?.dataPath || '',
    });

    console.log('[Conversion] Tokens converted back to simple logic');
  }

  /**
   * Handle logic tokens changed from assembler
   */
  onLogicTokensChanged(tokens: LogicToken[]): void {
    this.assemblerLogicTokens.set(tokens);
    console.log('[Rule Assembler] Logic tokens updated:', tokens);

    // Store in a hidden form field for persistence
    this.logicForm.patchValue(
      {
        assemblerTokens: JSON.stringify(tokens),
      },
      { emitEvent: false },
    );
  }

  /**
   * Handle JSON Logic export from assembler
   */
  onJsonLogicExported(jsonLogic: JsonLogicRule): void {
    this.assemblerJsonLogic.set(jsonLogic);
    console.log('[Rule Assembler] JSON Logic exported in parent:', JSON.stringify(jsonLogic));

    // Store for later use
    this.logicForm.patchValue(
      {
        assemblerJsonLogic: JSON.stringify(jsonLogic),
      },
      { emitEvent: false },
    );

    // Automatically trigger impact calculation (debounced)
    this.calculateRuleImpact(jsonLogic);
  }

  /**
   * Calculate rule impact based on JSON Logic (debounced via Subject)
   */
  calculateRuleImpact(jsonLogic: JsonLogicRule): void {
    this.impactRequest$.next(jsonLogic);
  }

  private _performImpactCalculation(jsonLogic: JsonLogicRule): void {
    // Set loading state
    this.ruleImpactPreview.update(prev => ({
      ...prev,
      status: 'loading',
    }));

    const scopeId = this.scopeForm.get('mappingId')?.value;
    const targetModel = this.scopeForm.get('targetModel')?.value;

    console.log('[Impact] Calculating for:', { jsonLogic, scopeId, targetModel });

    // Publish to backend service via EventService
    this.eventService.publish('nf', 'calculate_rule_impact', {
      action: 'calculate_rule_impact',
      context: 'mapping_rule_impact_calculation',
      theme: this.theme(),
      payload: {
        jsonLogic: jsonLogic,
        scopeId: scopeId,
        targetModel: targetModel,
        ruleCategory: 'mapping',
      },
      timestamp: new Date().toISOString(),
    });

    // Simulate API call (replace with actual API call in production)
    setTimeout(() => {
      this.ruleImpactPreview.set({
        status: 'success',
        affectedMappings: 6,
        affectedCodes: 2,
        recordCount: 240,
        conflictEvents: 0,
        message: 'Rule impact calculated successfully',
      });
    }, 1200);
  }

  /**
   * Get available fields for rule assembler based on selected target model
   */
  getAvailableFieldsForAssembler(): string[] {
    const targetModel = this.scopeForm.get('targetModel')?.value;

    if (!targetModel) {
      return this.availableFields();
    }

    // Get fields specific to the selected model
    const modelFields = this.modelFieldsMap()[targetModel];

    if (modelFields && modelFields.length > 0) {
      return modelFields;
    }

    // Fallback to general available fields
    return this.availableFields();
  }

  /**
   * Get available models for rule assembler
   */
  getAvailableModelsForAssembler(): string[] {
    // Return all models that have field mappings
    const modelsWithFields = Object.keys(this.modelFieldsMap());

    if (modelsWithFields.length > 0) {
      return modelsWithFields;
    }

    // Fallback to general available models
    return this.availableModels();
  }

  /**
   * Copy assembler JSON Logic to clipboard
   */
  copyAssemblerLogic(): void {
    const jsonLogic = this.assemblerJsonLogic();
    const jsonString = JSON.stringify(jsonLogic, null, 2);

    navigator.clipboard
      .writeText(jsonString)
      .then(() => {
        console.log('[Clipboard] JSON Logic copied');

        // Optionally show a toast notification
        this.eventService.publish('nf', 'show_toast', {
          action: 'show_toast',
          message: 'JSON Logic copied to clipboard',
          type: 'success',
          theme: this.theme(),
        });
      })
      .catch(err => {
        console.error('[Clipboard] Failed to copy:', err);
      });
  }

  /**
   * Clear simple logic builder
   */
  clearSimpleLogic(): void {
    this.logicForm.patchValue({
      mappingLeftOperand: '',
      mappingOperator: '',
      mappingRightOperand: '',
      mappingAttributeKey: '',
    });

    console.log('[Simple Logic] Cleared');
  }

  private subscribeToEvents() {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      if (!state?.items) return;

      // These variables must be in scope for the checks below to work
      const { event, payload } = state.items;

      // 1. OPEN MODAL & INITIALIZE METADATA
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

          this.ruleIntents.set(
            payload.metadataOptions.ruleIntents || [
              'Validate',
              'Normalize',
              'Detect',
              'Enrich',
              'Protect',
            ],
          );
          this.owningTeamsRoles.set(payload.metadataOptions.owningTeamsRoles || []);
          this.intendedAudiences.set(
            payload.metadataOptions.intendedAudiences || [
              'Engineering',
              'Clinical',
              'Compliance / Audit',
              'System (Internal)',
            ],
          );
          this.lifecycleIntents.set(
            payload.metadataOptions.lifecycleIntents || [
              'Transient',
              'Long-lived',
              'Infrastructure-critical',
            ],
          );

          this.codeRuleOperands.set(payload.metadataOptions.codeRuleOperands || []);
          this.codeRuleOperators.set(payload.metadataOptions.codeRuleOperators || []);
          this.codeRuleVariables.set(payload.metadataOptions.codeRuleVariables || []);
          this.mappingRuleOperands.set(payload.metadataOptions.mappingRuleOperands || []);
          this.mappingRuleVariables.set(payload.metadataOptions.mappingRuleVariables || []);
          this.codeSystemsAvailable.set(payload.metadataOptions.codeSystemsAvailable || []);
          this.modelFieldsMap.set(payload.metadataOptions.modelFieldsMap || {});

          console.log(
            `==========> modelFieldsMap SO FAR ${JSON.stringify(payload.metadataOptions.modelFieldsMap)}`,
          );
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
          this.onTargetModelChange(payload.targetModel);
        }

        if (payload.ruleCategory) {
          this.categoryForm.get('category')?.setValue(payload.ruleCategory, { emitEvent: false });
          this.ruleCategory.set(payload.ruleCategory);
        }

        this.activeStep.set(0);
        this.isOpen.set(true);
      }

      // 2. RULE IMPACT CALCULATION (SUCCESS)
      if (event === 'rule_impact_calculated' || payload?.action === 'rule_impact_calculated') {
        const result = payload?.result;
        if (result) {
          this.ruleImpactPreview.set({
            status: 'success',
            affectedMappings: result.affectedMappings || 0,
            affectedCodes: result.affectedCodes || 0,
            recordCount: result.recordCount || 0,
            conflictEvents: result.conflictEvents || 0,
            message: result.message || 'Impact calculated',
          });
        }
      }

      // 3. RULE IMPACT CALCULATION (ERROR)
      if (event === 'rule_impact_error' || payload?.action === 'rule_impact_error') {
        this.ruleImpactPreview.set({
          status: 'error',
          affectedMappings: 0,
          affectedCodes: 0,
          recordCount: 0,
          conflictEvents: 0,
          message: payload?.error || 'Failed to calculate impact',
        });
      }

      // 4. CONFIRM SAVE
      if (event === 'confirmation_save_confirmed' && payload?.confirmed) {
        this.finalizeRule();
      }

      // 5. CLOSE MODAL
      if (
        event === 'close_new_normalization_rule_modal' ||
        payload?.action === 'close_new_normalization_rule_modal'
      ) {
        this.handleInternalClose();
      }
    });
  }

  // ============================================================================
  // NEW: DYNAMIC FIELD UPDATES WHEN MODEL CHANGES
  // ============================================================================

  onTargetModelChange(modelName: string): void {
    if (!modelName) {
      this.currentModelFields.set([]);
      this.scopeForm.patchValue({ targetModel: '' }, { emitEvent: false });
      return;
    }

    const fieldsMap = this.modelFieldsMap();
    const fields: string[] = fieldsMap[modelName] ?? this.availableFields();

    this.currentModelFields.set(fields);
    this.scopeForm.patchValue({ targetModel: modelName }, { emitEvent: false });

    // Strong debug logging — keep this until the issue is resolved
    console.group('onTargetModelChange');
    console.log('Selected model          :', modelName);
    console.log('Available model keys    :', Object.keys(fieldsMap));
    console.log('Exact key match?        :', modelName in fieldsMap);
    console.log('Fields found for model  :', fields);
    console.log('Fields now in signal    :', this.currentModelFields());
    console.log('Full modelFieldsMap     :', fieldsMap);
    console.groupEnd();
  }

  // ============================================================================
  // NEW: CODE SYSTEMS SELECTION (NO DUPLICATE CHECKBOXES)
  // ============================================================================

  onCodeSystemsChange(selectedSystems: string[]): void {
    this.selectedCodeSystems.set(selectedSystems);
    console.log('Code systems selected:', selectedSystems);
  }

  removeCodeSystem(system: string): void {
    const current = this.selectedCodeSystems();
    this.selectedCodeSystems.set(current.filter(s => s !== system));
  }

  // ============================================================================
  // EXISTING METHODS (PRESERVED)
  // ============================================================================

  private finalizeRule() {
    const snapshot = this.reviewSnapshot();
    if (!snapshot) return;

    const category = this.ruleCategory();

    const finalPayload = {
      ruleCategory: category,
      categoryDetails: snapshot.categoryDetails,
      basics: snapshot.basics,
      scope: {
        ...snapshot.scope,
        sourceCodeSystems: this.selectedCodeSystems(), // Include selected code systems
      },
      logic: snapshot.logic,
      targetModel: snapshot.basics.model,
      timestamp: new Date().toISOString(),
    };

    if (category === 'model') {
      finalPayload['details'] = {
        mappings: snapshot.mappings,
        aliases: snapshot.aliases,
        conversions: snapshot.conversions,
        formulas: snapshot.formulas,
        defaults: snapshot.defaults,
        ignoreList: snapshot.ignoreList,
      };
    }

    this.eventService.publish('nf', 'normalization_rule_creation_complete', {
      action: 'normalization_rule_creation_complete',
      payload: finalPayload,
    });

    this.handleInternalClose();
  }

  get intendedAudienceArray() {
    return this.categoryForm.get('intendedAudience') as FormArray;
  }

  toggleAudience(audience: string) {
    const arr = this.intendedAudienceArray;
    const index = arr.value.indexOf(audience);
    if (index >= 0) {
      arr.removeAt(index);
    } else {
      arr.push(this._fb.control(audience));
    }
  }

  isAudienceSelected(audience: string): boolean {
    return this.intendedAudienceArray.value.includes(audience);
  }

  get filterRows() {
    return this.scopeForm.get('filters') as FormArray;
  }

  // REMOVED: sourceCodeSystemsArray getter (now using signal)
  // REMOVED: toggleCodeSystem, isCodeSystemSelected, removeCodeSystemChip (replaced with signal methods)

  get nullifyRows() {
    return this.logicForm.get('nullify') as FormArray;
  }

  addNullifyEntry() {
    const source = this.logicForm.get('sourceField')?.value;
    if (source) {
      const exists = this.nullifyRows.getRawValue().some(r => r.sourceField === source);
      if (!exists) {
        const row = this._fb.group({
          sourceField: [source, Validators.required],
        });
        this.nullifyRows.push(row);
      }
      this.logicForm.patchValue({ sourceField: '' });
    }
  }

  removeNullifyRow(index: number) {
    this.nullifyRows.removeAt(index);
  }

  get formulaRows() {
    return this.logicForm.get('formulas') as FormArray;
  }

  addFormulaEntry() {
    const name = this.logicForm.get('newName')?.value;
    const formula = this.logicForm.get('formula')?.value;
    const type = this.logicForm.get('resultType')?.value;

    if (name && formula && type) {
      const row = this._fb.group({
        targetField: [name, Validators.required],
        formula: [formula, Validators.required],
        resultType: [type, Validators.required],
      });
      this.formulaRows.push(row);
      this.logicForm.patchValue({ newName: '', formula: '' });
    }
  }

  removeFormulaRow(index: number) {
    this.formulaRows.removeAt(index);
  }

  get mappingRows() {
    return this.logicForm.get('mappings') as FormArray;
  }

  get defaultRows() {
    return this.logicForm.get('defaults') as FormArray;
  }

  addDefaultEntry() {
    const source = this.logicForm.get('sourceField')?.value;
    const value = this.logicForm.get('defaultValue')?.value;

    if (source && value) {
      const row = this._fb.group({
        sourceField: [source, Validators.required],
        defaultValue: [value, Validators.required],
      });
      this.defaultRows.push(row);
      this.logicForm.patchValue({ sourceField: '', defaultValue: '' });
    }
  }

  removeDefaultRow(index: number) {
    this.defaultRows.removeAt(index);
  }

  get aliasRows() {
    return this.logicForm.get('aliases') as FormArray;
  }

  createAliasRow(source = '', alias = ''): FormGroup {
    return this._fb.group({
      sourceField: [source, Validators.required],
      aliasName: [alias, Validators.required],
    });
  }

  addAliasEntry() {
    const source = this.logicForm.get('sourceField')?.value;
    const alias = this.logicForm.get('newName')?.value;

    if (source && alias) {
      const exists = this.aliasRows.controls.some(
        control =>
          control.get('sourceField')?.value === source && control.get('aliasName')?.value === alias,
      );

      if (!exists) {
        this.aliasRows.push(this.createAliasRow(source, alias));
        this.logicForm.get('newName')?.setValue('');
      }
    }
  }

  removeAliasRow(index: number) {
    this.aliasRows.removeAt(index);
  }

  get conversionRows() {
    return this.logicForm.get('conversions') as FormArray;
  }

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
    this.clearLogicValidators();

    if (logicType === 'Value Mapping' && this.mappingRows.length === 0) {
      this.addRow();
    }

    this.logicForm.updateValueAndValidity();
  }

  selectLogicType(type: string) {
    const currentType = this.logicForm.get('logicType')?.value;
    if (currentType) {
      this.saveCurrentTransformationConfig(currentType);
    }

    this.logicForm.get('logicType')?.setValue(type);
    this.onLogicTypeChange();
    this.restoreTransformationConfig(type);
  }

  private saveCurrentTransformationConfig(logicType: string) {
    const config: any = { logicType: logicType };

    config.sourceField = this.logicForm.get('sourceField')?.value || '';
    config.fromUnit = this.logicForm.get('fromUnit')?.value || '';
    config.toUnit = this.logicForm.get('toUnit')?.value || '';
    config.newName = this.logicForm.get('newName')?.value || '';
    config.formula = this.logicForm.get('formula')?.value || '';
    config.resultType = this.logicForm.get('resultType')?.value || '';
    config.defaultValue = this.logicForm.get('defaultValue')?.value || '';

    if (logicType === 'Value Mapping') {
      config.mappings = this.mappingRows.getRawValue();
    }
    if (logicType === 'Rename / Alias') {
      config.aliases = this.aliasRows.getRawValue();
    }
    if (logicType === 'Unit Conversion') {
      config.conversions = this.conversionRows.getRawValue();
    }
    if (logicType === 'Derived Value') {
      config.derivedValues = this.formulaRows.getRawValue();
    }
    if (logicType === 'Default Value') {
      config.defaultList = this.defaultRows.getRawValue();
    }
    if (logicType === 'Null / Ignore') {
      config.ignoreList = this.nullifyRows.getRawValue();
    }

    this.transformationConfigs.set(logicType, config);
  }

  private restoreTransformationConfig(logicType: string) {
    const savedConfig = this.transformationConfigs.get(logicType);

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

    this.mappingRows.clear();

    if (savedConfig) {
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

      if (logicType === 'Value Mapping' && savedConfig.mappings) {
        savedConfig.mappings.forEach((mapping: any) => {
          const row = this.createMappingRow();
          row.patchValue(mapping);
          this.mappingRows.push(row);
        });
      } else if (logicType === 'Value Mapping' && this.mappingRows.length === 0) {
        this.addRow();
      }
    } else if (logicType === 'Value Mapping') {
      this.addRow();
    }
  }

  private clearLogicValidators() {
    const fields = [
      'sourceField',
      'fromUnit',
      'toUnit',
      'newName',
      'formula',
      'resultType',
      'defaultValue',
      'leftOperand',
      'operator',
      'rightOperand',
      'message',
      'mappingLeftOperand',
      'mappingOperator',
      'mappingRightOperand',
      'mappingMessage',
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

  getAvailableOperators(): string[] {
    const leftOperand = this.logicForm.get('leftOperand')?.value;
    if (!leftOperand) return [];

    if (['Unmapped code count', 'Coverage %'].includes(leftOperand)) {
      return ['=', '≠', '>', '≥', '<', '≤'];
    }

    if (
      ['Has multiple target codes', 'Has conflicting code system', 'Crosswalk missing'].includes(
        leftOperand,
      )
    ) {
      return ['=', '≠'];
    }

    if (leftOperand === 'Attribute is empty') {
      return ['missing', 'present'];
    }

    return this.codeRuleOperators();
  }

  needsRightOperand(): boolean {
    const operator = this.logicForm.get('operator')?.value;
    return operator && !['missing', 'present'].includes(operator);
  }

  needsAttributeSelector(): boolean {
    const leftOperand = this.logicForm.get('leftOperand')?.value;
    return leftOperand === 'Attribute is empty';
  }

  insertVariable(variable: string) {
    const messageControl = this.logicForm.get('message');
    const currentValue = messageControl?.value || '';
    const newValue = currentValue + variable;
    messageControl?.setValue(newValue);
  }

  getMappingAvailableOperators(): string[] {
    const leftOperand = this.logicForm.get('mappingLeftOperand')?.value;
    if (!leftOperand) return [];

    if (['Coverage %', 'Unmapped source code count'].includes(leftOperand)) {
      return ['=', '≠', '>', '≥', '<', '≤'];
    }

    if (
      [
        'Unmapped mapping',
        'Has multiple target codes',
        'Has conflicting target code system',
        'Mapping overridden',
        'Crosswalk missing',
      ].includes(leftOperand)
    ) {
      return ['=', '≠'];
    }

    if (['Model field', 'Target model field missing'].includes(leftOperand)) {
      return ['missing', 'present', '=', '≠'];
    }

    return ['=', '≠', '>', '≥', '<', '≤'];
  }

  mappingNeedsRightOperand(): boolean {
    const operator = this.logicForm.get('mappingOperator')?.value;
    return operator && !['missing', 'present'].includes(operator);
  }

  mappingNeedsAttributeSelector(): boolean {
    const leftOperand = this.logicForm.get('mappingLeftOperand')?.value;
    return ['Model field', 'Target model field missing', 'Code / code system'].includes(
      leftOperand,
    );
  }

  insertMappingVariable(variable: string) {
    const messageControl = this.logicForm.get('mappingMessage');
    const currentValue = messageControl?.value || '';
    const newValue = currentValue + variable;
    messageControl?.setValue(newValue);
  }

  nextStep() {
    const currentStep = this.activeStep();
    const category = this.ruleCategory();

    if (currentStep === 0 && !category) {
      return;
    }

    const maxSteps = 5;

    if (currentStep < maxSteps - 1) {
      if (currentStep === 3 && category === 'model') {
        const currentType = this.logicForm.get('logicType')?.value;
        if (currentType) {
          this.saveCurrentTransformationConfig(currentType);
        }

        this.reviewSnapshot.set({
          categoryDetails: this.categoryForm.getRawValue(),
          basics: this.basicsForm.getRawValue(),
          scope: this.scopeForm.getRawValue(),
          logic: this.getLogicSnapshotForCategory(),
          mappings: this.mappingRows.getRawValue(),
          aliases: this.aliasRows.getRawValue(),
          conversions: this.conversionRows.getRawValue(),
          formulas: this.formulaRows.getRawValue(),
          defaults: this.defaultRows.getRawValue(),
          ignoreList: this.nullifyRows.getRawValue(),
          allTransformations: Array.from(this.transformationConfigs.values()),
        });
      } else if (currentStep === 3) {
        this.reviewSnapshot.set({
          categoryDetails: this.categoryForm.getRawValue(),
          basics: this.basicsForm.getRawValue(),
          scope: {
            ...this.scopeForm.getRawValue(),
            sourceCodeSystems: this.selectedCodeSystems(),
          },
          logic: this.getLogicSnapshotForCategory(),
        });
      }

      this.activeStep.update(v => v + 1);
    }
  }

  private getLogicSnapshotForCategory(): any {
    const category = this.ruleCategory();

    if (category === 'code') {
      return {
        leftOperand: this.logicForm.get('leftOperand')?.value,
        operator: this.logicForm.get('operator')?.value,
        rightOperand: this.logicForm.get('rightOperand')?.value,
        attributeKey: this.logicForm.get('attributeKey')?.value,
        message: this.logicForm.get('message')?.value,
      };
    } else if (category === 'mapping') {
      if (this.useAdvancedLogicBuilder()) {
        // For advanced builder: return assembler data
        return {
          mode: 'advanced',
          tokens: this.assemblerLogicTokens(),
          jsonLogic: this.assemblerJsonLogic(),
          message: this.logicForm.get('mappingMessage')?.value,
        };
      } else {
        // For simple builder: return form data
        return {
          mode: 'simple',
          leftOperand: this.logicForm.get('mappingLeftOperand')?.value,
          operator: this.logicForm.get('mappingOperator')?.value,
          rightOperand: this.logicForm.get('mappingRightOperand')?.value,
          attributeKey: this.logicForm.get('mappingAttributeKey')?.value,
          message: this.logicForm.get('mappingMessage')?.value,
        };
      }
    } else {
      return {
        logicType: this.logicForm.get('logicType')?.value,
      };
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
    const category = this.ruleCategory();

    let categoryLabel = 'Rule';
    if (category === 'code') categoryLabel = 'Code Rule';
    else if (category === 'model') categoryLabel = 'Model Rule';
    else if (category === 'mapping') categoryLabel = 'Mapping Rule';

    this.eventService.publish('nf', 'open_confirmation_modal', {
      title: `Finalize ${categoryLabel}`,
      action: 'open_confirmation_modal',
      message: `Are you sure you want to save the ${categoryLabel.toLowerCase()} "${snapshot.basics.name}"?`,
      command: 'save',
      itemName: snapshot.basics.name,
      theme: this.theme(),
    });
  }

  private handleInternalClose() {
    this.isOpen.set(false);
    this.activeStep.set(0);
    this.ruleCategory.set(null);
    this.reviewSnapshot.set(null);
    this.transformationConfigs.clear();
    this.categoryForm.reset();
    this.basicsForm.reset({
      description:
        'Describe what this transformation does, any assumptions, or when it should be used.',
      severity: 'Medium',
    });
    this.scopeForm.reset();
    this.logicForm.reset();
    this.mappingRows.clear();
    this.aliasRows.clear();
    this.conversionRows.clear();
    this.formulaRows.clear();
    this.defaultRows.clear();
    this.nullifyRows.clear();
    this.filterRows.clear();
    this.intendedAudienceArray.clear();

    // Clear signals
    this.selectedCodeSystems.set([]);
    this.currentModelFields.set([]);

    // Clear assembler state
    this.useAdvancedLogicBuilder.set(false);
    this.assemblerLogicTokens.set([]);
    this.assemblerJsonLogic.set({});
    this.ruleImpactPreview.set({
      status: 'unavailable',
      affectedMappings: 0,
      affectedCodes: 0,
      recordCount: 0,
      conflictEvents: 0,
    });

    // Publish clear event to rule assembler
    this.eventService.publish('nf', 'rule_assembler_clear', {
      action: 'rule_assembler_clear',
      theme: this.theme(),
    });
  }

  isStepValid(step: number): boolean {
    const category = this.ruleCategory();

    switch (step) {
      case 0: {
        const audiences = this.categoryForm.get('intendedAudience') as FormArray;
        return this.categoryForm.valid && audiences?.length > 0;
      }

      case 1:
        return this.basicsForm.valid;

      case 2: {
        if (category === 'code') {
          return !!(
            this.scopeForm.get('appliesTo')?.value && this.scopeForm.get('runTiming')?.value
          );
        }

        if (category === 'model') {
          const hasBase = !!(
            this.scopeForm.get('scope')?.value && this.scopeForm.get('trigger')?.value
          );

          if (this.scopeForm.get('scope')?.value === 'Field-level') {
            return hasBase && !!this.scopeForm.get('targetField')?.value;
          }
          return hasBase;
        }

        if (category === 'mapping') {
          return !!(
            this.scopeForm.get('appliesTo')?.value &&
            this.scopeForm.get('targetModel')?.value &&
            this.scopeForm.get('runTiming')?.value
          );
        }

        return false;
      }

      case 3: {
        if (category === 'code') {
          const leftOperand = this.logicForm.get('leftOperand')?.value;
          const operator = this.logicForm.get('operator')?.value;
          const message = this.logicForm.get('message')?.value;
          const needsRight = this.needsRightOperand();
          const rightOperand = this.logicForm.get('rightOperand')?.value;
          const needsAttr = this.needsAttributeSelector();
          const attributeKey = this.logicForm.get('attributeKey')?.value;

          return !!(
            leftOperand &&
            operator &&
            message &&
            (!needsRight || rightOperand) &&
            (!needsAttr || attributeKey)
          );
        }

        if (category === 'mapping') {
          if (this.useAdvancedLogicBuilder()) {
            const hasTokens = this.assemblerLogicTokens().length > 0;
            const message = this.logicForm.get('mappingMessage')?.value;
            return !!(hasTokens && message);
          }

          // simple builder
          const leftOperand = this.logicForm.get('mappingLeftOperand')?.value;
          const operator = this.logicForm.get('mappingOperator')?.value;
          const message = this.logicForm.get('mappingMessage')?.value;
          const needsRight = this.mappingNeedsRightOperand();
          const rightOperand = this.logicForm.get('mappingRightOperand')?.value;
          const needsAttr = this.mappingNeedsAttributeSelector();
          const attributeKey = this.logicForm.get('mappingAttributeKey')?.value;

          return !!(
            leftOperand &&
            operator &&
            message &&
            (!needsRight || rightOperand) &&
            (!needsAttr || attributeKey)
          );
        }

        // fallback (model, others)
        return !!this.logicForm.get('logicType')?.value;
      }

      case 4:
        return true;

      default:
        return false;
    }
  }

  getLogicSummary(): string {
    const snapshot = this.reviewSnapshot();
    const category = this.ruleCategory();

    if (!snapshot) return '';

    if (category === 'code') {
      const { leftOperand, operator, rightOperand, attributeKey } = snapshot.logic;
      let summary = `IF ${leftOperand}`;
      if (attributeKey) summary += ` (${attributeKey})`;
      summary += ` ${operator}`;
      if (rightOperand) summary += ` ${rightOperand}`;
      return summary;
    } else if (category === 'mapping') {
      if (snapshot.logic.mode === 'advanced') {
        // For advanced logic: show JSON Logic summary
        const tokens = snapshot.logic.tokens || [];
        const tokenCount = tokens.length;
        return `Advanced logic with ${tokenCount} tokens. JSON Logic: ${JSON.stringify(snapshot.logic.jsonLogic).substring(0, 100)}...`;
      } else {
        // For simple logic: existing summary
        const { leftOperand, operator, rightOperand, attributeKey } = snapshot.logic;
        let summary = `IF ${leftOperand}`;
        if (attributeKey) summary += ` (${attributeKey})`;
        summary += ` ${operator}`;
        if (rightOperand) summary += ` ${rightOperand}`;
        return summary;
      }
    } else {
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
              const maps = mappings
                .map((m: any) => `${m.sourceValue} → ${m.targetValue}`)
                .join(', ');
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
  }

  clearDefaultDescription() {
    const control = this.basicsForm.get('description');
    if (!control) return;

    const category = this.ruleCategory();
    let defaultText = '';
    if (category === 'model') {
      defaultText =
        'Describe what this transformation does, any assumptions, or when it should be used.';
    } else {
      defaultText = 'Describe why this rule exists and when it should be used.';
    }

    if (control.value === defaultText) {
      control.setValue('');
    }
  }

  // DEPRECATED: Replaced with dynamic signal
  getModelFields(modelName: string | null): string[] {
    if (!modelName) return [];
    return this.modelFieldsMap()[modelName] || this.availableFields();
  }

  get subsetFilters() {
    return this.scopeForm.get('filters') as FormArray;
  }

  addSubsetFilter() {
    if (this.subsetFilters.length >= 3) return;

    const filter = this._fb.group({
      key: ['', Validators.required],
      operator: ['=', Validators.required],
      value: ['', Validators.required],
    });

    this.subsetFilters.push(filter);
  }

  removeSubsetFilter(index: number) {
    this.subsetFilters.removeAt(index);
  }

  ngOnDestroy(): void {
    this.eventSubs?.unsubscribe();
    this.impactRequest$.complete();
  }
}
