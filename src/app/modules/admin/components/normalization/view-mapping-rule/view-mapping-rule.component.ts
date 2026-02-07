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
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
// NgRx & Events
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

interface Transformation {
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
  action?: string;
}

interface RuleVersion {
  version: string;
  editor: string;
  timestamp: string;
  action: string;
}

@Component({
  selector: 'app-view-mapping-rule',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatSort,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './view-mapping-rule.component.html',
  styleUrl: './view-mapping-rule.component.scss',
})
export class ViewMappingRuleComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() ruleData: any;
  @Output() closeView = new EventEmitter<void>();

  // --- Animation handling ---
  isExiting = false; // Sliding out to right (closing view entirely)
  isEditing = false; // Controls Edit component lifecycle

  // "One Out" / "One In" Host Bindings
  @HostBinding('class.slide-out-to-left') isExitedToLeft = false;
  @HostBinding('class.slide-in-from-left') isReturningFromLeft = false;
  @HostBinding('class.slide-out-to-right') get exitClass() {
    return this.isExiting;
  }

  /**
   * When this component is slid to the left (behind/beside the Edit component),
   * we must disable its pointer events so the child (EditRule) is interactive.
   */
  @HostBinding('style.pointer-events') get pointerEvents() {
    return this.isExitedToLeft ? 'none' : 'auto';
  }

  // Transformation Table
  transformationDataSource = new MatTableDataSource<Transformation>([]);
  transformationColumns = ['type', 'sourceField', 'targetField', 'details', 'status'];
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Search and Filters
  searchTerm = '';
  selectedLogicType = 'All';
  selectedStatus = 'All';

  // Usage & Impact
  pipelinesExpanded = false;
  modelsExpanded = false;

  // Versions
  versions: RuleVersion[] = [];

  // Metrics
  totalTransformations = 0;
  affectedFields = 0;

  // Event subscription
  private eventSubs?: Subscription;

  constructor(
    protected eventService: EventService,
    protected eventStore: Store<{ nf: EventState }>,
  ) {}

  ngOnInit(): void {
    this.setupFilterPredicate();
    this.loadTransformations();
    this.loadVersions();
    this.subscribeToEvents();
    this.calculateMetrics();
    this.updateBreadcrumb();
  }

  ngAfterViewInit(): void {
    this.transformationDataSource.sort = this.sort;
    this.transformationDataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.eventSubs?.unsubscribe();
  }

  /**
   * Updates the breadcrumb to show the View Mapping Rule path
   */
  private updateBreadcrumb(): void {
    const breadcrumbPath = [
      { label: 'Normalization', target: 'ROOT' },
      { label: 'Rules', target: 'TAB_RULES' },
      { label: 'View Mapping Rule', active: true },
    ];
    this.eventService.publish('nf', 'update_breadcrumb', { path: breadcrumbPath });
  }

  /**
   * Subscribe to event store for cross-component navigation
   */
  private subscribeToEvents(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      const eventName = state?.items?.event;
      const payload = state?.items?.payload;
      console.log(
        `view-mapping-rule.component.ts [subscribeEvents] - payload: ${JSON.stringify(payload)}`,
      );
      // Listen for the Edit component's cancel/close event
      if (eventName === 'close_edit_mapping_rule') {
        this.onCloseEdit();
      }
      // Removed breadcrumb_navigate listener to prevent infinite loop
    });
  }

  /**
   * Custom Filter Predicate for MatTableDataSource.
   */
  private setupFilterPredicate(): void {
    this.transformationDataSource.filterPredicate = (data: Transformation, filter: string) => {
      const filters = JSON.parse(filter);
      // Check Dropdown Filters
      const matchesLogicType = filters.logicType === 'All' || data.type === filters.logicType;
      const matchesStatus = filters.status === 'All' || data.action === filters.status;
      // Check Global Search Term
      const searchStr =
        `${data.type} ${data.sourceField} ${data.targetField || ''} ${data.sourceValue || ''} ${data.targetValue || ''}`.toLowerCase();
      const matchesSearch = _.includes(searchStr, filters.searchTerm.toLowerCase());
      return matchesLogicType && matchesStatus && matchesSearch;
    };
  }

  private loadTransformations(): void {
    // Parse transformations from ruleData
    const transformations: Transformation[] = [];
    if (this.ruleData?.details) {
      const { mappings, aliases, conversions, formulas, defaults, ignoreList } =
        this.ruleData.details;
      // Value Mappings
      if (mappings && mappings.length > 0) {
        mappings.forEach((m: any) => {
          transformations.push({
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
          transformations.push({
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
          transformations.push({
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
          transformations.push({
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
          transformations.push({
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
          transformations.push({
            type: 'Null / Ignore',
            sourceField: i.sourceField,
            targetField: i.sourceField,
            action: 'Active',
          });
        });
      }
    }
    this.transformationDataSource.data = transformations;
  }

  private loadVersions(): void {
    this.versions = [
      {
        version: 'v2',
        editor: 'Dmitry',
        timestamp: '3 days ago',
        action: 'Edited',
      },
      {
        version: 'v1',
        editor: '',
        timestamp: 'Jan 20, 2024',
        action: 'Created',
      },
    ];
  }

  private calculateMetrics(): void {
    this.totalTransformations = this.transformationDataSource.data.length;
    const uniqueFields = new Set<string>();
    this.transformationDataSource.data.forEach(t => {
      if (t.sourceField) uniqueFields.add(t.sourceField);
      if (t.targetField) uniqueFields.add(t.targetField);
    });
    this.affectedFields = uniqueFields.size;
  }

  /**
   * Core filtering logic using lodash to construct the filter object.
   */
  applyFilter(): void {
    const filterState = {
      searchTerm: this.searchTerm,
      logicType: this.selectedLogicType,
      status: this.selectedStatus,
    };
    this.transformationDataSource.filter = JSON.stringify(filterState);
    if (this.transformationDataSource.paginator) {
      this.transformationDataSource.paginator.firstPage();
    }
  }

  setLogicTypeFilter(value: string): void {
    this.selectedLogicType = value;
    this.applyFilter();
  }

  setStatusFilter(value: string): void {
    this.selectedStatus = value;
    this.applyFilter();
  }

  togglePipelines(): void {
    this.pipelinesExpanded = !this.pipelinesExpanded;
  }

  toggleModels(): void {
    this.modelsExpanded = !this.modelsExpanded;
  }

  onBackToRules(): void {
    // 1. Trigger the slide-out to right (Closing the whole view)
    this.isExiting = true;
    // 2. Notify the container level
    const container = document.querySelector('.normalization-main-container');
    if (container) {
      container.classList.remove('slide-out');
      container.classList.add('slide-in');
    }
    // 3. Reset breadcrumb to just the rules tab
    const breadcrumbPath = [
      { label: 'Normalization', target: 'ROOT' },
      { label: 'Rules', active: true },
    ];
    this.eventService.publish('nf', 'update_breadcrumb', { path: breadcrumbPath });
    // 4. Signal navigation logic
    this.eventService.publish('nf', 'breadcrumb_navigate', { target: 'TAB_RULES' });
    // 5. Wait for animation to finish before destroying
    setTimeout(() => {
      this.closeView.emit();
    }, 600);
  }

  /**
   * Opening Edit: View slides out to LEFT, Edit slides in from RIGHT
   */
  onEdit(): void {
    // 1. Immediately hide the parent component AND set editing state together
    this.isExitedToLeft = true;
    this.isReturningFromLeft = false;
    this.isEditing = true;
    // 2. Publish the open event immediately (no delay needed)
    this.eventService.publish('nf', 'open_edit_mapping_rule', {
      action: 'open_edit_rule',
      ruleId: this.ruleData?.id,
      fullData: this.ruleData,
    });
  }

  /**
   * Closing Edit - REVERSE ANIMATION
   * Edit slides out to RIGHT, View slides in from LEFT
   */
  onCloseEdit(): void {
    // 1. Re-enable pointer events immediately so View becomes interactive
    this.isExitedToLeft = false;
    // 2. Trigger slide-in animation from left
    this.isReturningFromLeft = true;
    // 3. Restore breadcrumb to "View Mapping Rule" state
    this.updateBreadcrumb();
    // 4. Clean up the Edit component AFTER its slide-out animation finishes
    setTimeout(() => {
      this.isEditing = false;
      this.isReturningFromLeft = false;
    }, 500);
  }

  onChangeStatus(): void {
    console.log('Change status action triggered');
    this.eventService.publish('nf', 'execute_merge_query_with_context', {
      action: 'STATUS_CHANGE',
      ruleId: this.ruleData?.id,
      timestamp: new Date().toISOString(),
    });
  }

  viewVersionHistory(): void {
    console.log('Navigate to full version history');
  }

  viewInVersions(): void {
    console.log('View in Versions');
  }

  viewInMappings(): void {
    console.log('View in Mappings');
  }

  viewTargetModel(): void {
    console.log('View Target Model');
  }

  getTransformationDetails(element: Transformation): string {
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
