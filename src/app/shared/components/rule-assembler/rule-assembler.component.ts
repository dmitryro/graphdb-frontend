import {
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
// Material & CDK Imports
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import Fuse from 'fuse.js';
// Lodash
import * as _ from 'lodash';
// ngrx Store and EventService
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';

// --- INTERFACES ---
export interface LogicToken {
  id: string;
  type:
    | 'if'
    | 'then'
    | 'else'
    | 'and'
    | 'or'
    | 'xor'
    | 'not'
    | 'field'
    | 'operator'
    | 'value'
    | 'with'
    | 'on'
    | 'where'
    | 'in'
    | 'any'
    | 'all'
    | 'between'
    | 'contains'
    | 'is'
    | 'is_blank'
    | 'is_etweent'
    | 'strength'
    | 'code_system'
    | 'as'
    | 'with_unit';
  value: string;
  depth: number;
  children?: LogicToken[];
  metadata?: {
    fieldType?: string;
    unit?: string;
    property?: string;
    dataPath?: string;
  };
}

export interface RibbonOperator {
  label: string;
  value: string;
  category: 'structural' | 'logic' | 'relational' | 'modifiers';
  icon?: string;
  description?: string;
  shortcut?: string;
  color?: string;
}

export interface ImpactPreview {
  status: 'idle' | 'loading' | 'success' | 'unavailable' | 'error';
  affectedMappings: number;
  affectedCodes: number;
  recordCount: number;
  conflictEvents: number;
  message?: string;
  chartData?: {
    label: string;
    value: number;
    color: string;
  }[];
}

export interface ModelTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'model' | 'field' | 'folder';
  dataType?: 'string' | 'number' | 'date' | 'boolean' | 'code';
  icon?: string;
  children?: ModelTreeNode[];
  isExpanded?: boolean;
}

export type JsonLogicRule = Record<string, any>;

@Component({
  selector: 'app-rule-assembler',
  standalone: false,
  templateUrl: './rule-assembler.component.html',
  styleUrls: ['./rule-assembler.component.scss'],
  providers: [EventService],
})
export class RuleAssemblerComponent implements OnInit, OnDestroy {
  dataSource = new MatTreeNestedDataSource<ModelTreeNode>();
  treeControl = new NestedTreeControl<ModelTreeNode>(node => node.children);
  hasChild = (_: number, node: ModelTreeNode) => !!node.children && node.children.length > 0;

  @Input() scopeId: string | null = null;
  @Input() availableFields: string[] = [];
  @Input() availableModels: string[] = [];
  @Output() logicChanged = new EventEmitter<LogicToken[]>();
  @Output() impactRequested = new EventEmitter<JsonLogicRule>();
  @Output() jsonLogicExported = new EventEmitter<JsonLogicRule>();

  @ViewChild('valueInput') valueInputElement?: ElementRef<HTMLInputElement>;

  // --- SIGNALS STATE ---
  theme = signal<'light' | 'dark'>('dark');
  public logicTokens = signal<LogicToken[]>([]);
  selectedTokenId = signal<string | null>(null);
  editingTokenId = signal<string | null>(null);
  showExpressionBuilder = signal<boolean>(true);
  showJsonContract = signal<boolean>(false);
  expressionExpanded = signal<boolean>(true);
  showExpressionPreview = signal<boolean>(true);

  impactPreview = signal<ImpactPreview>({
    status: 'idle',
    affectedMappings: 0,
    affectedCodes: 0,
    recordCount: 0,
    conflictEvents: 0,
  });

  explorerWidth = signal<number>(280);
  searchTerm = signal<string>('');

  // --- SUBSCRIPTIONS ---
  private eventSubs?: Subscription;
  private subscriptions = new Subscription();

  // --- COMPUTED SIGNALS ---
  selectedToken = computed(() => {
    const id = this.selectedTokenId();
    if (!id) return null;
    return this.findTokenById(id, this.logicTokens());
  });

  filteredTreeNodes = computed(() => {
    const term = this.searchTerm();
    if (!term) {
      this.dataSource.data = this.treeNodes;
      return this.treeNodes;
    }
    const fuse = new Fuse(this.flattenTreeNodes(this.treeNodes), {
      keys: ['name', 'path'],
      threshold: 0.3,
      includeScore: true,
    });
    const results = fuse.search(term);
    const filtered = this.rebuildTreeFromResults(results.map(r => r.item));
    this.dataSource.data = filtered;
    return filtered;
  });

  jsonLogicOutput = computed(() => {
    const tokens = this.logicTokens();
    console.log('[COMPUTED] JSON Logic updating for', tokens.length, 'tokens');
    return this.tokensToJsonLogic(tokens);
  });

  expressionString = computed(() => {
    const tokens = this.logicTokens();
    console.log('[COMPUTED] Expression updating for', tokens.length, 'tokens');
    return this.tokensToExpressionString(tokens);
  });

  canvasDepthMap = computed(() => {
    return this.calculateDepthMap(this.logicTokens());
  });

  // --- FORM CONTROLS ---
  logicForm = new FormGroup({
    leftOperand: new FormControl(''),
    attributeKey: new FormControl(''),
    operator: new FormControl(''),
    rightOperand: new FormControl(''),
    message: new FormControl(''),
  });

  searchControl = new FormControl('');
  valueInputControl = new FormControl('');

  // --- RIBBON OPERATORS (UPDATED WITH COLORS FROM TABLE) ---
  ribbonOperators: {
    structural: RibbonOperator[];
    logic: RibbonOperator[];
    relational: RibbonOperator[];
    modifiers: RibbonOperator[];
  } = {
    structural: [
      {
        label: 'IF',
        value: 'if',
        category: 'structural',
        icon: 'filter_alt',
        shortcut: 'I',
        color: '#2196F3',
      },
      {
        label: 'THEN',
        value: 'then',
        category: 'structural',
        icon: 'call_made',
        shortcut: 'T',
        color: '#2196F3',
      },
      { label: 'ELSE', value: 'else', category: 'structural', icon: 'alt_route', color: '#2196F3' },
      {
        label: 'WHERE',
        value: 'where',
        category: 'structural',
        icon: 'filter_list',
        shortcut: 'W',
        color: '#2196F3',
      },
    ],
    logic: [
      {
        label: 'AND',
        value: 'and',
        category: 'logic',
        icon: 'add_circle',
        shortcut: 'A',
        color: '#757575',
      },
      {
        label: 'OR',
        value: 'or',
        category: 'logic',
        icon: 'change_circle',
        shortcut: 'O',
        color: '#757575',
      },
      {
        label: 'NOT',
        value: 'not',
        category: 'logic',
        icon: 'block',
        shortcut: 'N',
        color: '#757575',
      },
      { label: '( )', value: 'group', category: 'logic', icon: 'code', color: '#757575' },
    ],
    relational: [
      { label: '=', value: '==', category: 'relational', icon: 'drag_handle', color: '#7B1FA2' },
      { label: '!=', value: '!=', category: 'relational', icon: 'not_equal', color: '#7B1FA2' },
      { label: '>', value: '>', category: 'relational', icon: 'chevron_right', color: '#7B1FA2' },
      { label: '<', value: '<', category: 'relational', icon: 'chevron_left', color: '#7B1FA2' },
      {
        label: 'IN',
        value: 'in',
        category: 'relational',
        icon: 'inbox',
        shortcut: 'Shift+I',
        color: '#7B1FA2',
      },
      {
        label: 'BETWEEN',
        value: 'between',
        category: 'relational',
        icon: 'height',
        color: '#7B1FA2',
      },
      {
        label: 'CONTAINS',
        value: 'contains',
        category: 'relational',
        icon: 'search',
        color: '#7B1FA2',
      },
      { label: 'IS', value: 'is', category: 'relational', icon: 'check', color: '#7B1FA2' },
      {
        label: 'ISBLANK',
        value: 'is_blank',
        category: 'relational',
        icon: 'check_box_outline_blank',
        color: '#7B1FA2',
      },
      {
        label: 'IS_ETWEENT',
        value: 'is_etweent',
        category: 'relational',
        icon: 'check_circle',
        color: '#7B1FA2',
      },
    ],
    modifiers: [
      {
        label: 'WITH UNIT',
        value: 'with_unit',
        category: 'modifiers',
        icon: 'straighten',
        color: '#26A69A',
      },
      { label: 'AS', value: 'as', category: 'modifiers', icon: 'label', color: '#26A69A' },
      {
        label: 'CODE SYSTEM',
        value: 'code_system',
        category: 'modifiers',
        icon: 'code',
        color: '#26A69A',
      },
      {
        label: 'STRENGTH',
        value: 'strength',
        category: 'modifiers',
        icon: 'fitness_center',
        color: '#26A69A',
      },
    ],
  };

  // --- MODEL TREE DATA ---
  treeNodes: ModelTreeNode[] = [
    {
      id: 'patient',
      name: 'Patient',
      path: 'Patient',
      type: 'model',
      icon: 'person',
      isExpanded: true,
      children: [
        {
          id: 'patient_age',
          name: 'Age',
          path: 'Patient.Age',
          type: 'field',
          dataType: 'number',
          icon: 'calendar_today',
        },
        {
          id: 'patient_gender',
          name: 'Gender',
          path: 'Patient.Gender',
          type: 'field',
          dataType: 'string',
          icon: 'person',
        },
        {
          id: 'patient_dob',
          name: 'DateOfBirth',
          path: 'Patient.DateOfBirth',
          type: 'field',
          dataType: 'date',
          icon: 'event',
        },
      ],
    },
    {
      id: 'encounter',
      name: 'Encounter',
      path: 'Encounter',
      type: 'model',
      icon: 'local_hospital',
      children: [
        {
          id: 'enc_type',
          name: 'Type',
          path: 'Encounter.Type',
          type: 'field',
          dataType: 'code',
          icon: 'category',
        },
        {
          id: 'enc_date',
          name: 'Date',
          path: 'Encounter.Date',
          type: 'field',
          dataType: 'date',
          icon: 'event',
        },
        {
          id: 'enc_diag',
          name: 'Diagnosis',
          path: 'Encounter.Diagnosis',
          type: 'folder',
          icon: 'folder',
          children: [
            {
              id: 'enc_diag_code',
              name: 'Code',
              path: 'Encounter.Diagnosis.Code',
              type: 'field',
              dataType: 'code',
              icon: 'code',
            },
            {
              id: 'enc_diag_status',
              name: 'Status',
              path: 'Encounter.Diagnosis.Status',
              type: 'field',
              dataType: 'string',
              icon: 'info',
            },
          ],
        },
      ],
    },
    {
      id: 'lab',
      name: 'LabResult',
      path: 'LabResult',
      type: 'model',
      icon: 'biotech',
      children: [
        {
          id: 'lab_value',
          name: 'Value',
          path: 'LabResult.Value',
          type: 'field',
          dataType: 'number',
          icon: 'functions',
        },
        {
          id: 'lab_unit',
          name: 'Unit',
          path: 'LabResult.Unit',
          type: 'field',
          dataType: 'string',
          icon: 'straighten',
        },
        {
          id: 'lab_status',
          name: 'Status',
          path: 'LabResult.Status',
          type: 'field',
          dataType: 'string',
          icon: 'check_circle',
        },
      ],
    },
  ];

  constructor(
    protected eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
    private cdr: ChangeDetectorRef,
  ) {
    // 1. Effect to react to logicTokens changes (most important)
    effect(
      onCleanup => {
        const tokens = this.logicTokens();
        console.log(
          '[EFFECT] Tokens changed → count:',
          tokens.length,
          'first token:',
          tokens[0]?.value ?? 'none',
        );

        // Emit tokens
        this.logicChanged.emit(tokens);

        // CRITICAL FIX: Emit JSON logic to parent
        const jsonLogic = this.jsonLogicOutput();
        this.jsonLogicExported.emit(jsonLogic);

        this.cdr.detectChanges();

        onCleanup(() => {
          console.log('[EFFECT cleanup] Tokens watcher cleaned up');
        });
      },
      { allowSignalWrites: true },
    );

    // 2. Effect for theme changes (debug only or real side-effect)
    effect(() => {
      const currentTheme = this.theme();
      console.log('[Rule Assembler] Theme changed to:', currentTheme);

      // If you have theme-dependent side effects (e.g. apply class to document)
      // do them here, but avoid heavy work
    });
  }

  ngOnInit(): void {
    this.subscribeToEvents();
    this.initializeLogicCanvas();
    this.setupFormSubscriptions();
    this.dataSource.data = this.treeNodes;

    // Expand only top-level models (Patient, Encounter, LabResult)
    this.treeNodes.forEach(node => {
      if (node.isExpanded) {
        this.treeControl.expand(node);
      }
    });
  }
  /**
   * Subscribe to ngrx store events
   */
  private subscribeToEvents(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      if (state?.items) {
        const itemEvent = state.items.event;
        const payload = state.items.payload;

        if (payload?.theme) {
          this.theme.set(payload.theme);
        }

        if (itemEvent === 'rule_assembler_update' || payload?.action === 'rule_assembler_update') {
          if (payload?.tokens) {
            this.logicTokens.set(payload.tokens);
          }
        }

        if (itemEvent === 'rule_assembler_clear' || payload?.action === 'rule_assembler_clear') {
          this.clearLogic();
        }

        if (
          itemEvent === 'rule_assembler_calculate_impact' ||
          payload?.action === 'rule_assembler_calculate_impact'
        ) {
          this.requestImpactPreview();
        }
      }
    });
  }

  /**
   * Setup form change subscriptions
   */
  private setupFormSubscriptions(): void {
    this.subscriptions.add(
      this.searchControl.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe(value => {
          this.searchTerm.set(value || '');
        }),
    );

    this.subscriptions.add(
      this.logicForm.valueChanges.pipe(debounceTime(500)).subscribe(() => {
        this.requestImpactPreview();
      }),
    );
  }

  ngOnDestroy(): void {
    if (this.eventSubs) {
      this.eventSubs.unsubscribe();
    }
    this.subscriptions.unsubscribe();
  }

  // --- INITIALIZATION ---
  private initializeLogicCanvas(): void {
    const ifToken: LogicToken = {
      id: this.generateTokenId(),
      type: 'if',
      value: 'IF',
      depth: 0,
      children: [],
    };

    this.logicTokens.set([ifToken]);

    // ADD THIS LINE:
    this.selectedTokenId.set(ifToken.id);

    console.log('[INIT] IF token created and selected');
  }

  /**
   * Parse string value to appropriate type
   */
  public parseValue(value: string): any {
    const trimmed = value.trim();

    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;

    const num = Number(trimmed);
    if (!isNaN(num)) return num;

    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }

    return trimmed;
  }

  // --- IMPACT PREVIEW ---
  public requestImpactPreview(): void {
    this.impactPreview.update(prev => ({ ...prev, status: 'loading' }));

    const jsonLogic = this.jsonLogicOutput();
    this.impactRequested.emit(jsonLogic);
    this.publishImpactRequest(jsonLogic);

    setTimeout(() => {
      this.impactPreview.set({
        status: 'success',
        affectedMappings: 240,
        affectedCodes: 1,
        recordCount: 240,
        conflictEvents: 0,
        message: 'Matched: 240 records',
        chartData: [
          { label: 'Matched', value: 240, color: '#2ecc71' },
          { label: 'Not Matched', value: 1, color: '#e74c3c' },
          { label: 'Errors', value: 0, color: '#f39c12' },
        ],
      });
    }, 800);
  }

  private generateTokenId(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // --- VIEW TOGGLES ---
  toggleExpressionBuilder(): void {
    this.showExpressionBuilder.set(true);
    this.showJsonContract.set(false);
  }

  toggleJsonContract(): void {
    this.showJsonContract.set(true);
    this.showExpressionBuilder.set(false);
  }

  // -----------------------------------------------------------------------------
  // Adds a new token from ribbon button click or drag operation
  // -----------------------------------------------------------------------------
  // Adds a new token from ribbon button click or drag operation
  // --- ADD TOKEN FROM RIBBON ---
  addToken(operator: RibbonOperator, parentId?: string): void {
    const newToken: LogicToken = {
      id: this.generateTokenId(),
      type: operator.category === 'relational' ? 'operator' : (operator.value as any),
      value: operator.label,
      depth: 0,
      children: [],
    };

    this.logicTokens.update(current => {
      const tokensCopy = _.cloneDeep(current);
      const targetId = parentId || this.selectedTokenId();

      if (!targetId) {
        tokensCopy.push(newToken);
        return tokensCopy;
      }

      const selectedToken = this.findTokenById(targetId, tokensCopy);
      if (!selectedToken) return tokensCopy;

      const isRelationalAdd = operator.category === 'relational';
      const isGroupingAdd = operator.category === 'logic' || operator.category === 'structural';

      let shouldWrap = false;

      if (isRelationalAdd && selectedToken.type === 'field') {
        shouldWrap = true;
      } else if (isGroupingAdd && ['field', 'operator', 'value'].includes(selectedToken.type)) {
        shouldWrap = true;
      }

      if (shouldWrap) {
        const parentInfo = this.findParent(tokensCopy, targetId);
        newToken.depth = selectedToken.depth;
        newToken.children = [selectedToken];
        selectedToken.depth += 1;
        this.incrementDepths(selectedToken, 1); // Increment subtree depths

        if (parentInfo) {
          const { parent, index } = parentInfo;
          parent.children![index] = newToken;
        } else {
          // Root level
          const rootIndex = tokensCopy.findIndex(t => t.id === targetId);
          if (rootIndex !== -1) {
            tokensCopy[rootIndex] = newToken;
          }
        }
      } else {
        selectedToken.children = selectedToken.children || [];
        newToken.depth = selectedToken.depth + 1;
        selectedToken.children.push(newToken);
      }

      return tokensCopy;
    });

    this.selectedTokenId.set(newToken.id);
    this.updateJsonLogic();
  }

  onFieldSelected(node: ModelTreeNode): void {
    if (node.type !== 'field') return;

    const newToken: LogicToken = {
      id: this.generateTokenId(),
      type: 'field',
      value: node.path,
      depth: this.getCurrentDepth(),
      metadata: {
        fieldType: node.dataType || 'string',
        dataPath: node.path,
      },
      children: [],
    };

    this.logicTokens.update(current => {
      const tokensCopy = _.cloneDeep(current);
      const targetId = this.selectedTokenId();

      if (targetId) {
        const parent = this.findTokenById(targetId, tokensCopy);
        if (parent) {
          newToken.depth = parent.depth + 1;
          parent.children = parent.children || [];
          parent.children.push(newToken);
          return tokensCopy;
        }
      }
      tokensCopy.push(newToken);
      return tokensCopy;
    });

    this.selectedTokenId.set(newToken.id);
    this.updateJsonLogic();
  }

  // Lodash-powered deep find
  private findTokenById(id: string, tokens: LogicToken[]): LogicToken | null {
    // Lodash-based deep search
    let found = _.find(tokens, { id });
    if (found) return found;

    for (const token of tokens) {
      if (token.children) {
        found = this.findTokenById(id, token.children);
        if (found) return found;
      }
    }
    return null;
  }

  private findParent(
    tokens: LogicToken[],
    id: string,
  ): { parent: LogicToken; index: number } | null {
    for (const parent of tokens) {
      const childIndex = parent.children?.findIndex(c => c.id === id) ?? -1;

      if (childIndex !== -1) {
        return { parent, index: childIndex };
      }

      if (parent.children) {
        const found = this.findParent(parent.children, id);
        if (found) return found;
      }
    }

    return null;
  }

  private incrementDepths(token: LogicToken, increment: number): void {
    token.depth += increment;
    if (token.children) {
      token.children.forEach(child => this.incrementDepths(child, increment));
    }
  }

  // --- TOKEN MANAGEMENT ---
  selectToken(tokenId: string): void {
    console.log('[SELECT TOKEN]', tokenId);
    const currentId = this.selectedTokenId();
    this.selectedTokenId.set(currentId === tokenId ? null : tokenId);
  }

  deleteToken(tokenId: string): void {
    this.logicTokens.update(current => {
      const removeRecursive = (list: LogicToken[]): LogicToken[] => {
        return list
          .filter(t => t.id !== tokenId)
          .map(t => ({
            ...t,
            children: t.children ? removeRecursive(t.children) : undefined,
          }));
      };
      return removeRecursive(current);
    });

    if (this.selectedTokenId() === tokenId) {
      this.selectedTokenId.set(null);
    }
    this.updateJsonLogic();
  }

  clearLogic(): void {
    this.initializeLogicCanvas();
    this.selectedTokenId.set(null);
  }

  // --- DRAG & DROP ---
  // --- DRAG & DROP ---
  onTokenDrop(event: CdkDragDrop<LogicToken[]>): void {
    // Get flattened array
    const flattened = this.flattenLogicTokens(this.logicTokens());

    // Reorder in flattened array
    moveItemInArray(flattened, event.previousIndex, event.currentIndex);

    // Rebuild hierarchical structure from flattened order
    const rebuilt = this.rebuildHierarchyFromFlattened(flattened);

    this.logicTokens.set(rebuilt);
    this.updateJsonLogic();
  }

  /**
   * Rebuild hierarchical token structure from flattened array
   * Preserves parent-child relationships while allowing reordering
   */
  private rebuildHierarchyFromFlattened(flattened: LogicToken[]): LogicToken[] {
    if (!flattened.length) return [];

    const tokenMap = new Map<string, LogicToken>();
    const roots: LogicToken[] = [];
    const stack: LogicToken[] = [];

    // Clone all
    for (const t of flattened) {
      const clone: LogicToken = { ...t, children: t.children ? [...t.children] : undefined };
      tokenMap.set(t.id, clone);
    }

    // Build tree
    for (const original of flattened) {
      const node = tokenMap.get(original.id)!;

      // Pop until we find correct parent level
      while (stack.length > 0 && stack.at(-1)!.depth >= node.depth) {
        stack.pop();
      }

      if (stack.length > 0) {
        const parent = stack.at(-1)!;
        parent.children ??= [];
        if (!parent.children.some(c => c.id === node.id)) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }

      stack.push(node);
    }

    return roots;
  }

  // -----------------------------------------------------------------------------
  // Converts the token tree into valid JsonLogic format
  // Returns {} for empty/invalid input, filters out nulls, handles incomplete nodes
  // --- JSON LOGIC CONVERSION ---
  private tokensToJsonLogic(tokens: LogicToken[]): JsonLogicRule {
    if (!tokens || tokens.length === 0) {
      return {};
    }

    // Fixed: Specific return type instead of 'any'
    const buildLogic = (token: LogicToken): JsonLogicRule | string | number | boolean | null => {
      if (!token) {
        return null;
      }

      // Build children recursively and filter out invalid/null results
      const childrenLogic = (token.children || [])
        .map(child => buildLogic(child))
        .filter(
          (child): child is NonNullable<ReturnType<typeof buildLogic>> =>
            child !== null && child !== undefined,
        );

      switch (token.type) {
        case 'if':
          // JSON Logic 'if' expects [condition, then, else?]
          // Assume children order: condition → then → (optional) else
          if (childrenLogic.length === 0) {
            return { if: [] };
          }
          if (childrenLogic.length === 1) {
            return { if: [childrenLogic[0]] };
          }
          if (childrenLogic.length === 2) {
            return { if: [childrenLogic[0], childrenLogic[1]] };
          }
          // 3+ children: chained if/else-if/else
          return { if: childrenLogic };

        case 'then':
          return childrenLogic.length === 1 ? childrenLogic[0] : { then: childrenLogic };

        case 'and':
          return childrenLogic.length > 0 ? { and: childrenLogic } : null;

        case 'or':
          return childrenLogic.length > 0 ? { or: childrenLogic } : null;

        case 'xor':
          if (childrenLogic.length !== 2) {
            return null;
          }
          return {
            and: [
              { or: [childrenLogic[0], childrenLogic[1]] },
              { '!': { and: [childrenLogic[0], childrenLogic[1]] } },
            ],
          };

        case 'not':
          return childrenLogic.length > 0 ? { '!': childrenLogic[0] } : null;

        case 'operator': {
          // FIXED: Wrapped case block in braces to scope lexical declarations
          let op = token.value;
          if (op === '=') {
            op = '==';
          }

          const binaryOps = ['==', '!=', '>', '<', '>=', '<=', 'in', 'contains'];
          const ternaryOps = ['between'];

          if (binaryOps.includes(op)) {
            if (childrenLogic.length < 2) {
              return null;
            }
            return { [op]: childrenLogic.slice(0, 2) };
          }

          if (ternaryOps.includes(op) && op === 'between') {
            if (childrenLogic.length < 3) {
              return null;
            }
            return {
              and: [
                { '>=': [childrenLogic[0], childrenLogic[1]] },
                { '<=': [childrenLogic[0], childrenLogic[2]] },
              ],
            };
          }

          return null;
        } // End of scoped 'operator' case block

        case 'field':
          return { var: token.value || '' };

        case 'value':
          return this.parseValue(token.value);

        case 'any':
          return childrenLogic.length > 0 ? { some: childrenLogic } : null;

        case 'all':
          return childrenLogic.length > 0 ? { all: childrenLogic } : null;

        default:
          return null;
      }
    };

    const rootRules = tokens
      .map(buildLogic)
      .filter(
        (rule): rule is NonNullable<ReturnType<typeof buildLogic>> =>
          rule !== null && rule !== undefined,
      );

    if (rootRules.length === 0) {
      return {};
    }

    if (rootRules.length === 1) {
      // Ensure top-level is always an object (JsonLogicRule)
      return typeof rootRules[0] === 'object' && rootRules[0] !== null
        ? (rootRules[0] as JsonLogicRule)
        : { var: String(rootRules[0]) };
    }

    return { and: rootRules };
  }

  /**
   * Convert tokens to human-readable expression string
   */
  private tokensToExpressionString(tokens: LogicToken[]): string {
    if (tokens.length === 0) return 'Empty logic';

    const buildExpression = (token: LogicToken, indent = 0): string => {
      const indentStr = '  '.repeat(indent);
      const children = token.children || [];

      switch (token.type) {
        case 'if':
          return children.length > 0
            ? `${indentStr}IF (\n${children.map(c => buildExpression(c, indent + 1)).join('\n')}\n${indentStr})`
            : `${indentStr}IF ()`;

        case 'and':
          return children.length > 0
            ? `${indentStr}AND (\n${children.map(c => buildExpression(c, indent + 1)).join(',\n')}\n${indentStr})`
            : `${indentStr}AND`;

        case 'or':
          return children.length > 0
            ? `${indentStr}OR (\n${children.map(c => buildExpression(c, indent + 1)).join(',\n')}\n${indentStr})`
            : `${indentStr}OR`;

        case 'operator':
          if (children.length >= 2) {
            return `${indentStr}${buildExpression(children[0], 0)} ${token.value} ${buildExpression(children[1], 0)}`;
          }
          return `${indentStr}${token.value || '?'}`;

        case 'field':
          return `${indentStr}${token.value}`;

        case 'value':
          return `${indentStr}${token.value}`;

        default:
          return `${indentStr}${token.type.toUpperCase()}${children.length ? ' (...)' : ''}`;
      }
    };

    return tokens.map(t => buildExpression(t)).join('\n\n');
  }

  /**
   * Publish impact calculation request to EventService
   */
  private publishImpactRequest(jsonLogic: JsonLogicRule): void {
    this.eventService.publish('nf', 'rule_assembler_impact_requested', {
      action: 'rule_assembler_impact_requested',
      context: 'calculate_rule_impact',
      theme: this.theme(),
      jsonLogic: jsonLogic,
      scopeId: this.scopeId,
      timestamp: new Date().toISOString(),
    });
  }

  // --- HELPERS ---
  private getCurrentDepth(parentId?: string): number {
    if (!parentId && !this.selectedTokenId()) return 0;
    const token = this.findTokenById(parentId || this.selectedTokenId()!, this.logicTokens());
    return token ? token.depth + 1 : 0;
  }

  getTokenClass(token: LogicToken): string {
    const baseClass = `logic-token logic-token-${token.type}`;
    const selectedClass = this.selectedTokenId() === token.id ? 'selected' : '';
    return `${baseClass} ${selectedClass}`;
  }

  getIndentStyle(depth: number): Record<string, string> {
    return {
      'padding-left': `${depth * 24}px`,
    };
  }

  private rebuildTreeFromResults(results: ModelTreeNode[]): ModelTreeNode[] {
    return results;
  }

  private calculateDepthMap(tokens: LogicToken[]): Map<string, number> {
    const map = new Map<string, number>();
    const traverse = (t: LogicToken[]) => {
      t.forEach(token => {
        map.set(token.id, token.depth);
        if (token.children) traverse(token.children);
      });
    };
    traverse(tokens);
    return map;
  }

  public flattenLogicTokens(tokens: LogicToken[]): LogicToken[] {
    const flat: LogicToken[] = [];
    const traverse = (t: LogicToken[]) => {
      t.forEach(token => {
        flat.push(token);
        if (token.children) traverse(token.children);
      });
    };
    traverse(tokens);
    return flat;
  }

  // --- KEYBOARD SHORTCUTS ---
  handleKeyboardShortcut(event: KeyboardEvent): void {
    const allOps = [
      ...this.ribbonOperators.structural,
      ...this.ribbonOperators.logic,
      ...this.ribbonOperators.relational,
      ...this.ribbonOperators.modifiers,
    ];
    const op = allOps.find(
      o => o.shortcut && (o.shortcut === event.key || o.shortcut === event.key.toUpperCase()),
    );
    if (op) {
      event.preventDefault();
      this.addToken(op);
    }
  }

  // CRITICAL FIX: Handle adding values to selected tokens
  // -----------------------------------------------------------------------------
  // Handles "Add Value" button click — adds literal value token
  // --- HANDLE ADD VALUE BUTTON ---
  handleAddValue(): void {
    const val = this.valueInputControl.value;
    if (!val || !val.trim()) {
      console.warn('[ADD VALUE] No value provided');
      return;
    }

    const trimmedValue = val.trim();
    console.log('[ADD VALUE] Adding value:', trimmedValue);

    const newToken: LogicToken = {
      id: this.generateTokenId(),
      type: 'value',
      value: trimmedValue,
      depth: 0,
      children: [],
    };

    this.logicTokens.update(current => {
      const copy = _.cloneDeep(current);
      const targetId = this.selectedTokenId();
      let added = false;

      if (targetId) {
        const selected = this.findTokenById(targetId, copy);
        if (selected) {
          if (selected.type === 'operator') {
            selected.children = selected.children || [];
            newToken.depth = selected.depth + 1;
            selected.children.push(newToken);
            added = true;
          } else if (selected.type === 'field') {
            const parentInfo = this.findParent(copy, targetId);
            if (
              parentInfo &&
              parentInfo.parent.type === 'operator' &&
              parentInfo.parent.children!.length === 1
            ) {
              newToken.depth = selected.depth;
              parentInfo.parent.children!.push(newToken);
              added = true;
            } else {
              // Insert implicit '=' operator
              const opToken: LogicToken = {
                id: this.generateTokenId(),
                type: 'operator',
                value: '=',
                depth: selected.depth,
                children: [selected],
              };
              selected.depth += 1;
              this.incrementDepths(selected, 1);

              if (parentInfo) {
                parentInfo.parent.children![parentInfo.index] = opToken;
              } else {
                const rootIdx = copy.findIndex(t => t.id === targetId);
                if (rootIdx !== -1) {
                  copy[rootIdx] = opToken;
                }
              }

              newToken.depth = selected.depth;
              opToken.children.push(newToken);
              added = true;
            }
          }
        }
      }

      if (!added) {
        if (targetId && this.findTokenById(targetId, copy)) {
          const selected = this.findTokenById(targetId, copy)!;
          selected.children = selected.children || [];
          newToken.depth = selected.depth + 1;
          selected.children.push(newToken);
        } else {
          copy.push(newToken);
        }
      }

      return copy;
    });

    this.valueInputControl.setValue('');

    setTimeout(() => {
      if (this.valueInputElement) {
        this.valueInputElement.nativeElement.focus();
      }
    }, 0);

    this.updateJsonLogic();
  }

  // --- VARIABLE INSERTION ---
  insertVariable(variable: string): void {
    const currentMessage = this.logicForm.get('message')?.value || '';
    const newMessage = currentMessage + `{${variable}}`;
    this.logicForm.patchValue({ message: newMessage });
  }

  // --- SPLIT PANE RESIZE ---
  onExplorerResize(size: number): void {
    this.explorerWidth.set(size);
  }

  // --- EDITING ---
  startEditing(tokenId: string): void {
    console.log('[START EDITING]', tokenId);
    this.editingTokenId.set(tokenId);
  }

  saveEdit(tokenId: string, newValue: string): void {
    if (!newValue?.trim()) {
      this.editingTokenId.set(null);
      return;
    }

    this.logicTokens.update(tokens => {
      const token = this.findTokenById(tokenId, tokens);
      if (token) {
        token.value = newValue.trim();
      }
      return _.cloneDeep(tokens);
    });

    this.editingTokenId.set(null);
    this.updateJsonLogic();
  }

  // CRITICAL FIX: Add value token to the currently selected token
  addValueToken(value: string): void {
    const trimmedValue = value?.trim();
    if (!trimmedValue) {
      return;
    }

    const newToken: LogicToken = {
      id: this.generateTokenId(),
      type: 'value',
      value: trimmedValue,
      depth: this.getCurrentDepth(),
      children: [],
      metadata: {
        fieldType: this.guessValueType(trimmedValue),
      },
    };

    this.logicTokens.update(currentTokens => {
      const tokensCopy = _.cloneDeep(currentTokens);
      const targetId = this.selectedTokenId();

      if (targetId) {
        const parent = this.findTokenById(targetId, tokensCopy);
        if (parent) {
          parent.children = parent.children || [];
          newToken.depth = parent.depth + 1;
          parent.children.push(newToken);
          return tokensCopy;
        }
      }
      tokensCopy.push(newToken);
      return tokensCopy;
    });

    this.selectedTokenId.set(newToken.id);
    this.updateJsonLogic();
  }

  private guessValueType(value: string): 'string' | 'number' | 'boolean' | 'null' {
    const trimmed = value.trim();
    if (trimmed === 'true' || trimmed === 'false') return 'boolean';
    if (trimmed === 'null') return 'null';
    if (!isNaN(Number(trimmed)) && trimmed !== '') return 'number';
    return 'string';
  }

  /**
   * Get icon color based on node type and data type
   */
  getNodeIconColor(node: ModelTreeNode): string {
    switch (node.type) {
      case 'model':
        return '#436d9d';
      case 'folder':
        return '#e67e22';
      case 'field':
        switch (node.dataType) {
          case 'number':
            return '#2ecc71';
          case 'string':
            return '#3498db';
          case 'date':
            return '#9c27b0';
          case 'boolean':
            return '#f1c40f';
          case 'code':
            return '#e74c3c';
          default:
            return '#95a5a6';
        }
      default:
        return '#95a5a6';
    }
  }

  /**
   * Handles clicks on tree nodes
   */
  public selectField(node: any): void {
    if (!node.children || node.children.length === 0) {
      console.log('[SELECT FIELD]', node.path);

      const newToken: LogicToken = {
        id: this.generateTokenId(),
        type: 'field',
        value: node.path,
        metadata: {
          fieldType: node.dataType || 'string',
          dataPath: node.path || '',
        },
        depth: this.getCurrentDepth(),
        children: [],
      };

      this.logicTokens.update(current => {
        const tokensCopy = _.cloneDeep(current);
        const targetId = this.selectedTokenId();

        if (targetId) {
          const parent = this.findTokenById(targetId, tokensCopy);
          if (parent) {
            newToken.depth = parent.depth + 1;
            parent.children = parent.children || [];
            parent.children.push(newToken);
            return tokensCopy;
          }
        }
        tokensCopy.push(newToken);
        return tokensCopy;
      });

      this.selectedTokenId.set(newToken.id);
    }
  }

  /**
   * Flattens hierarchical structure
   */
  public flattenTreeNodes<T extends { children?: T[] }>(nodes: T[] | undefined | null): T[] {
    if (!nodes) return [];

    const flat: T[] = [];
    const traverse = (item: T) => {
      flat.push(item);
      if (item.children && item.children.length > 0) {
        item.children.forEach(traverse);
      }
    };

    nodes.forEach(traverse);
    return flat;
  }

  /**
   * Copy JSON Logic to clipboard
   */
  copyJsonLogic(): void {
    const json = JSON.stringify(this.jsonLogicOutput(), null, 2);
    navigator.clipboard.writeText(json).then(() => {
      console.log('[Copied to Clipboard]', json);

      this.eventService.publish('nf', 'json_logic_copied', {
        action: 'json_logic_copied',
        context: 'clipboard_copy',
        theme: this.theme(),
        jsonLogic: json,
        timestamp: new Date().toISOString(),
      });
    });
  }

  toggleExpressionPreview(): void {
    this.showExpressionPreview.update(v => !v);
  }

  testRule(): void {
    console.log('[TEST RULE] Testing with current logic');
    this.requestImpactPreview();
  }

  private updateJsonLogic(): void {
    const json = this.jsonLogicOutput();
    console.log('[JSON Logic Updated]', json);
    this.showExpressionPreview.set(true); // force visible
    this.cdr.detectChanges();
    this.updateExpressionPreview();
  }

  // Make sure this runs after tokens change (debounced if needed)
  private updateExpressionPreview(): void {
    // Force signal update if needed
    this.showExpressionPreview.set(true); // or toggle if you want
    this.cdr.detectChanges(); // if preview not refreshing
  }

  /**
   * Toggle expression preview expanded/collapsed state
   */
  toggleExpressionExpanded(): void {
    this.expressionExpanded.update(v => !v);
  }
}
