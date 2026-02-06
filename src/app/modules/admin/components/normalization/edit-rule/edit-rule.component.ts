import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

// Dropdown options
export const LOGIC_TYPE_OPTIONS = [
  'Value Mapping',
  'Unit Conversion',
  'Rename / Alias',
  'Derived Value',
  'Default Value',
  'Null / Ignore',
];

export const SEVERITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];

export const SCOPE_OPTIONS = ['Model-level', 'Field-level'];

export const TRIGGER_OPTIONS = ['Pre-Write', 'Post-Write', 'Pre-Read', 'Post-Read'];

interface PendingChange {
  id: string;
  rowId: string;
  field: string;
  type: string;
  description: string;
  originalValue?: any;
  newValue?: any;
}

interface TransformationRow {
  id: string;
  type: string;
  sourceField: string;
  targetField?: string;
  sourceValue?: string;
  targetValue?: string;
  fromUnit?: string;
  toUnit?: string;
  formula?: string;
  resultType?: string;
  defaultValue?: string;
  aliasName?: string;
  action: string;
  [key: string]: any;
}

@Component({
  selector: 'app-edit-rule',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatRadioModule,
    MatDividerModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  templateUrl: './edit-rule.component.html',
  styleUrls: ['./edit-rule.component.scss'],
})
export class EditRuleComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() ruleData: any;
  @Output() closeEdit = new EventEmitter<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Animation control - slides out to the RIGHT when closing
  isExiting = false;

  // Expose lists to the HTML template
  logicTypeOptions = LOGIC_TYPE_OPTIONS;
  severityOptions = SEVERITY_OPTIONS;
  scopeOptions = SCOPE_OPTIONS;
  triggerOptions = TRIGGER_OPTIONS;

  // Counter for pending changes
  pendingCount = 0;

  @HostBinding('class.slide-out-to-right')
  get exitClass() {
    return this.isExiting;
  }

  showUsagePanel = false;
  private eventSubs?: Subscription;
  private originalDataBackup: TransformationRow[] = [];

  dataSource = new MatTableDataSource<TransformationRow>([]);
  displayedColumns: string[] = [
    'type',
    'sourceField',
    'targetField',
    'details',
    'action',
    'actions',
  ];

  searchTerm = '';

  filters = {
    logicType: 'All',
    action: 'All',
  };

  pendingChanges: PendingChange[] = [];

  // Available fields for dropdown selection
  availableFields: string[] = [];

  // Unit options for conversions
  unitOptions: string[] = [
    'Inches (in)',
    'Centimeters (cm)',
    'Meters (m)',
    'Feet (ft)',
    'Pounds (lb)',
    'Kilograms (kg)',
    'Fahrenheit (°F)',
    'Celsius (°C)',
  ];

  // Result type options
  resultTypeOptions: string[] = ['Integer', 'Float', 'String', 'Boolean', 'Date'];

  constructor(
    private eventStore: Store<{ nf: EventState }>,
    private eventService: EventService,
  ) {}

  ngOnInit(): void {
    this.setupFilterLogic();

    // Check if we already have rule data from @Input
    if (this.ruleData) {
      this.loadRuleData(this.ruleData);
      this.initializeAvailableFields();
      this.updateBreadcrumb(); // Ensure breadcrumb is correct on direct input
    }

    // Subscribe to events for dynamic updates
    this.subscribeToEditEvents();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.eventSubs?.unsubscribe();
  }

  toggleUsageAndImpact(): void {
    this.showUsagePanel = !this.showUsagePanel;

    if (this.showUsagePanel) {
      this.eventService.publish('nf', 'open_usage_impact_drawer', {
        action: 'open_usage_impact_drawer',
        fullData: this.ruleData,
      });
    } else {
      this.eventService.publish('nf', 'close_usage_impact_drawer', {
        action: 'close_usage_impact_drawer',
      });
    }
  }

  private subscribeToEditEvents(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      const eventName = state?.items?.event;
      const payload = state?.items?.payload;

      // Sync state for usage drawer
      if (eventName === 'usage_impact_drawer_closed' || eventName === 'close_usage_impact_drawer') {
        this.showUsagePanel = false;
      }

      // Handle Modal Confirmations
      if (eventName === 'confirmation_save_confirmed') {
        this.executeActualSave();
      }

      if (eventName === 'confirmation_delete_confirmed') {
        this.executeActualDelete();
      }

      if (eventName === 'confirmation_reset_confirmed') {
        this.executeActualReset();
      }

      // Navigation & Loading
      // Fix: Specifically listen for navigation targeting the previous VIEW_RULE step
      if (eventName === 'breadcrumb_navigate' && payload?.target === 'VIEW_RULE') {
        this.onCancel();
      }

      if (eventName === 'open_edit_rule') {
        this.initializeWithData(payload?.fullData);
        this.updateBreadcrumb();
      }
    });
  }

  private getActiveTheme(): 'light' | 'dark' {
    const isDark =
      document.body.classList.contains('dark-theme') ||
      document.body.classList.contains('dark-mode') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    return isDark ? 'dark' : 'light';
  }

  /**
   * Updates the breadcrumb to show the Edit Rule path
   */
  private updateBreadcrumb(): void {
    const breadcrumbPath = [
      { label: 'Normalization', target: 'ROOT' },
      { label: 'Rules', target: 'TAB_RULES' },
      { label: 'View Rule', target: 'VIEW_RULE' },
      { label: 'Edit Rule', active: true },
    ];
    this.eventService.publish('nf', 'update_breadcrumb', { path: breadcrumbPath });
  }

  private initializeWithData(data: any): void {
    if (!data) return;

    this.ruleData = data;
    this.loadRuleData(data);
    this.initializeAvailableFields();
  }

  private initializeAvailableFields(): void {
    // Extract fields based on target model
    if (this.ruleData?.model === 'Patient') {
      this.availableFields = [
        'patient_id',
        'first_name',
        'last_name',
        'birth_date',
        'gender',
        'height',
        'weight',
        'blood_pressure',
        'temperature',
        'phone',
        'email',
        'address',
        'ssn',
      ];
    } else if (this.ruleData?.model === 'Lab Result') {
      this.availableFields = [
        'test_code',
        'result_value',
        'result_unit',
        'reference_range',
        'specimen_type',
        'collection_date',
        'result_status',
      ];
    } else {
      this.availableFields = ['field_1', 'field_2', 'field_3', 'field_4', 'field_5'];
    }
  }

  private loadRuleData(data?: any): void {
    let rows: TransformationRow[] = [];

    if (data && data.details) {
      // Parse transformations from rule details
      const { mappings, aliases, conversions, formulas, defaults, ignoreList } = data.details;

      // Value Mappings
      if (mappings && mappings.length > 0) {
        mappings.forEach((m: any) => {
          rows.push({
            id: `mapping_${_.uniqueId()}`,
            type: 'Value Mapping',
            sourceField: 'N/A',
            targetField: 'N/A',
            sourceValue: m.sourceValue,
            targetValue: m.targetValue,
            action: 'Active',
          });
        });
      }

      // Aliases
      if (aliases && aliases.length > 0) {
        aliases.forEach((a: any) => {
          rows.push({
            id: `alias_${_.uniqueId()}`,
            type: 'Rename / Alias',
            sourceField: a.sourceField,
            targetField: a.sourceField,
            aliasName: a.aliasName,
            action: 'Active',
          });
        });
      }

      // Conversions
      if (conversions && conversions.length > 0) {
        conversions.forEach((c: any) => {
          rows.push({
            id: `conversion_${_.uniqueId()}`,
            type: 'Unit Conversion',
            sourceField: c.sourceField,
            targetField: c.sourceField,
            fromUnit: c.fromUnit,
            toUnit: c.toUnit,
            action: 'Active',
          });
        });
      }

      // Formulas
      if (formulas && formulas.length > 0) {
        formulas.forEach((f: any) => {
          rows.push({
            id: `formula_${_.uniqueId()}`,
            type: 'Derived Value',
            sourceField: 'Formula',
            targetField: f.targetField,
            formula: f.formula,
            resultType: f.resultType,
            action: 'Active',
          });
        });
      }

      // Defaults
      if (defaults && defaults.length > 0) {
        defaults.forEach((d: any) => {
          rows.push({
            id: `default_${_.uniqueId()}`,
            type: 'Default Value',
            sourceField: d.sourceField,
            targetField: d.sourceField,
            defaultValue: d.defaultValue,
            action: 'Active',
          });
        });
      }

      // Null/Ignore
      if (ignoreList && ignoreList.length > 0) {
        ignoreList.forEach((i: any) => {
          rows.push({
            id: `ignore_${_.uniqueId()}`,
            type: 'Null / Ignore',
            sourceField: i.sourceField,
            targetField: i.sourceField,
            action: 'Active',
          });
        });
      }
    } else {
      // Fallback to default mock data
      rows = [
        {
          id: '1',
          type: 'Unit Conversion',
          sourceField: 'height',
          targetField: 'height',
          fromUnit: 'Inches (in)',
          toUnit: 'Centimeters (cm)',
          action: 'Active',
        },
        {
          id: '2',
          type: 'Value Mapping',
          sourceField: 'N/A',
          targetField: 'N/A',
          sourceValue: 'Male',
          targetValue: 'M',
          action: 'Active',
        },
        {
          id: '3',
          type: 'Default Value',
          sourceField: 'blood_type',
          targetField: 'blood_type',
          defaultValue: 'Unknown',
          action: 'Active',
        },
      ];
    }

    this.originalDataBackup = _.cloneDeep(rows);
    this.dataSource.data = rows;

    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }

    this.applySearch();
  }

  private setupFilterLogic(): void {
    this.dataSource.filterPredicate = (data: TransformationRow): boolean => {
      // Text Search
      const search = _.toLower(_.trim(this.searchTerm));
      const searchableContent = _.toLower(
        [
          data.type,
          data.sourceField,
          data.targetField || '',
          data.sourceValue || '',
          data.targetValue || '',
          data.action,
        ].join(' '),
      );
      const matchesSearch = !search || searchableContent.includes(search);

      // Filter dropdowns
      const matchesLogicType =
        this.filters.logicType === 'All' || data.type === this.filters.logicType;
      const matchesAction = this.filters.action === 'All' || data.action === this.filters.action;

      return matchesSearch && matchesLogicType && matchesAction;
    };
  }

  applySearch(): void {
    this.dataSource.filter = `${this.searchTerm}_${JSON.stringify(this.filters)}`;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  applyFilters(): void {
    this.applySearch();
  }

  getActiveFilterLabel(): string {
    const activeFilters: string[] = [];
    if (this.filters.logicType !== 'All') activeFilters.push(this.filters.logicType);
    if (this.filters.action !== 'All') activeFilters.push(this.filters.action);

    return activeFilters.length > 0 ? activeFilters.join(', ') : 'All';
  }

  clearFilters(): void {
    this.filters = {
      logicType: 'All',
      action: 'All',
    };
    this.applySearch();
  }

  /**
   * Helper to determine if a specific field on a row has changed from the original backup.
   */
  isFieldModified(row: TransformationRow, fieldName: string): boolean {
    const original = this.originalDataBackup.find(o => o.id === row.id);
    if (!original) return false;
    return row[fieldName] !== original[fieldName];
  }

  /**
   * Unified change tracking logic.
   */
  onValueChange(row: TransformationRow): void {
    const original = this.originalDataBackup.find(o => o.id === row.id);
    if (!original) return;

    // Remove existing changes for this row
    this.pendingChanges = this.pendingChanges.filter(c => c.rowId !== row.id);

    const fieldsToTrack = ['type', 'sourceField', 'targetField', 'fromUnit', 'toUnit', 'action'];
    let rowHasAnyChange = false;

    fieldsToTrack.forEach(field => {
      if (row[field] !== original[field]) {
        rowHasAnyChange = true;

        const labels: Record<string, string> = {
          type: 'Logic Type',
          sourceField: 'Source Field',
          targetField: 'Target Field',
          fromUnit: 'From Unit',
          toUnit: 'To Unit',
          action: 'Status',
        };

        this.pendingChanges.push({
          id: `${row.id}-${field}`,
          rowId: row.id,
          field: row.type || 'Transformation',
          type: labels[field] || 'Field',
          description: `Changed ${labels[field] || field}`,
          originalValue: original[field] || '(Empty)',
          newValue: row[field] || '(Empty)',
        });
      }
    });

    if (rowHasAnyChange) {
      row.action = 'Modified';
    } else {
      row.action = original.action;
    }

    this.pendingCount = this.pendingChanges.length;
  }

  onLogicTypeChange(row: TransformationRow, newValue: string): void {
    row.type = newValue;
    this.onValueChange(row);
  }

  onSourceFieldChange(row: TransformationRow, newValue: string): void {
    row.sourceField = newValue;
    this.onValueChange(row);
  }

  onTargetFieldChange(row: TransformationRow, newValue: string): void {
    row.targetField = newValue;
    this.onValueChange(row);
  }

  resetRow(row: TransformationRow): void {
    const original = this.originalDataBackup.find(o => o.id === row.id);
    if (original) {
      Object.assign(row, _.cloneDeep(original));
      this.pendingChanges = this.pendingChanges.filter(c => !c.id.startsWith(row.id));
      this.pendingCount = this.pendingChanges.length;
    }
  }

  private executeActualReset(): void {
    this.pendingChanges = [];
    this.pendingCount = 0;
    this.loadRuleData(this.ruleData);
  }

  updatePendingList(change: PendingChange): void {
    const existingIndex = _.findIndex(this.pendingChanges, { id: change.id });
    if (existingIndex > -1) {
      this.pendingChanges[existingIndex] = change;
    } else {
      this.pendingChanges.push(change);
    }
    this.pendingCount = this.pendingChanges.length;
  }

  onSidebarUpdate(change: PendingChange): void {
    const targetRow = this.dataSource.data.find(row => row.id === change.rowId);

    if (targetRow) {
      const propertyMap: Record<string, string> = {
        'Logic Type': 'type',
        'Source Field': 'sourceField',
        'Target Field': 'targetField',
        'From Unit': 'fromUnit',
        'To Unit': 'toUnit',
        Status: 'action',
      };

      const propName = propertyMap[change.type];

      if (propName) {
        targetRow[propName] = change.newValue;
        this.onValueChange(targetRow);
        this.dataSource.data = [...this.dataSource.data];
      }
    }
  }

  resetAllChanges(): void {
    this.eventService.publish('nf', 'open_confirmation_modal', {
      title: 'Reset All Changes',
      theme: this.getActiveTheme(),
      message:
        'Are you sure you want to discard all pending changes and revert to the original rule state?',
      command: 'reset',
      action: 'open_confirmation_modal',
      itemName: 'All Pending Changes',
    });
  }

  /**
   * Cancel method - triggers reverse animation back to View
   */
  onCancel(): void {
    // 1. Trigger the slide-out animation for Edit component (to the right)
    this.isExiting = true;

    // 2. Ensure separate drawer is also closed
    this.eventService.publish('nf', 'close_usage_impact_drawer', {
      action: 'close_usage_impact_drawer',
    });

    // 3. Update breadcrumb back to View Rule (Fixed logic)
    const breadcrumbPath = [
      { label: 'Normalization', target: 'ROOT' },
      { label: 'Rules', target: 'TAB_RULES' },
      { label: 'View Rule', active: true },
    ];
    this.eventService.publish('nf', 'update_breadcrumb', { path: breadcrumbPath });

    // 4. Notify parent (ViewRuleComponent) to trigger its slide-in animation
    this.eventService.publish('nf', 'close_edit_rule', {
      action: 'close_edit_rule',
    });

    // 5. Wait for animation to complete before destroying component
    setTimeout(() => {
      this.closeEdit.emit();
    }, 500);
  }

  onSave(): void {
    // Close auxiliary drawers
    this.eventService.publish('nf', 'close_usage_impact_drawer', {
      action: 'close_usage_impact_drawer',
    });

    // Open confirmation modal
    this.eventService.publish('nf', 'open_confirmation_modal', {
      title: 'Confirm Rule Changes',
      theme: this.getActiveTheme(),
      message: `You have ${this.pendingChanges.length} pending changes. Are you sure you want to save these updates?`,
      command: 'save',
      action: 'open_confirmation_modal',
      itemName: `${this.ruleData?.name || 'Rule'}`,
    });
  }

  onDelete(): void {
    this.eventService.publish('nf', 'open_confirmation_modal', {
      title: 'Delete Rule',
      theme: this.getActiveTheme(),
      message:
        'Are you sure you want to permanently delete this normalization rule? This action cannot be undone.',
      command: 'delete',
      action: 'open_confirmation_modal',
      itemName: `${this.ruleData?.name || 'Rule'}`,
    });
  }

  private executeActualDelete(): void {
    console.log('Rule deleted successfully');
    this.onCancel();
  }

  private executeActualSave(): void {
    const transactionContext = {
      ruleName: this.ruleData?.name || 'Normalization Rule',
      targetModel: this.ruleData?.model || 'Patient',
      ruleId: this.ruleData?.id,
      timestamp: new Date().toISOString(),
      action: 'EDIT_RULE_SAVE',
      changesCount: this.pendingChanges.length,
      changes: this.pendingChanges,
    };

    console.log('Transaction Confirmed. Saving rule with context:', transactionContext);

    // Logical cleanup
    this.eventService.publish('nf', 'close_usage_impact_drawer', {
      action: 'close_usage_impact_drawer',
    });

    // Proceed with exit animation and cleanup
    this.onCancel();
  }

  onTableValueChange(element: any) {
    this.onValueChange(element);
  }

  addNewTransformation(): void {
    this.eventService.publish('nf', 'open_new_normalization_rule_modal', {
      action: 'open_new_normalization_rule_modal',
      theme: this.getActiveTheme(),
      mode: 'create',
    });
  }

  getTransformationDetails(element: TransformationRow): string {
    switch (element.type) {
      case 'Value Mapping':
        return `${element.sourceValue} → ${element.targetValue}`;
      case 'Unit Conversion':
        return `${element.fromUnit} → ${element.toUnit}`;
      case 'Rename / Alias':
        return `as ${element.aliasName}`;
      case 'Derived Value':
        return `${element.formula} (${element.resultType})`;
      case 'Default Value':
        return `Default: "${element.defaultValue}"`;
      case 'Null / Ignore':
        return 'NULLIFY';
      default:
        return '';
    }
  }
}
