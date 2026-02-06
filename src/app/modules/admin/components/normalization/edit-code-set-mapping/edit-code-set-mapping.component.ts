import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import { Subscription, take } from 'rxjs';

interface MappingRow {
  id: string;
  sourceCode: string;
  sourceLabel: string;
  targetCode: string;
  targetLabel: string;
  mappingType: 'Direct' | 'Constant';
  notes: string;
  status: 'Mapped' | 'Unmapped' | 'Modified';
  required: boolean;
  isModified: boolean;
  isNew: boolean;
  originalTargetCode?: string;
  originalTargetLabel?: string;
  originalMappingType?: string;
  [key: string]: any;
}

interface PendingChange {
  id: string;
  rowId: string;
  sourceCode: string;
  changeType: 'Added' | 'Modified' | 'Removed';
  description: string;
  field: string;
  type: string;
  oldValue?: string;
  newValue?: string;
}

@Component({
  selector: 'app-edit-code-set-mapping',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatTooltipModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSlideToggleModule,
  ],
  templateUrl: './edit-code-set-mapping.component.html',
  styleUrl: './edit-code-set-mapping.component.scss',
})
export class EditCodeSetMappingComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() mappingData: any = null;
  @Output() closeMapping = new EventEmitter<void>();

  isExiting = false;

  @HostBinding('class.slide-out-to-right')
  get exitClass() {
    return this.isExiting;
  }

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private eventSubs?: Subscription;

  searchControl = new FormControl('');
  mappingStatusFilter = new FormControl('all');
  mappingTypeFilter = new FormControl('all');
  requirementFilter = new FormControl('all');

  showUsageImpact = false;
  dataSource = new MatTableDataSource<MappingRow>([]);
  selection = new SelectionModel<MappingRow>(true, []);

  displayedColumns: string[] = ['sourceCode', 'targetCode', 'mappingType', 'notes', 'status'];

  availableTargetCodes: { code: string; label: string }[] = [];
  mappingTypeOptions = ['Direct', 'Constant'];

  mappingId = '';
  mappingName = '';
  sourceCodeSetName = '';
  targetCodeSetName = '';
  lastUpdated = '';
  lastUpdatedBy = '';
  usedInPipelines = 0;
  referencedByRules = 0;

  pendingChanges: PendingChange[] = [];
  hasUnsavedChanges = false;

  private originalDataBackup: MappingRow[] = [];

  constructor(
    private eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subscribeToEvents();
    this.setupFilterListeners();
    this.updateBreadcrumb();

    if (!this.mappingData) {
      this.eventStore
        .select('nf')
        .pipe(take(1))
        .subscribe(state => {
          const lastEvent = state?.items;
          if (
            lastEvent?.event === 'open_edit_code_set_mapping' &&
            lastEvent?.payload?.mappingData
          ) {
            this.mappingData = lastEvent.payload.mappingData;
            this.initializeData();
          }
        });
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mappingData'] && changes['mappingData'].currentValue) {
      this.initializeData();
    }
  }

  ngOnDestroy(): void {
    this.eventSubs?.unsubscribe();
  }

  private initializeData(): void {
    if (!this.mappingData) {
      this.dataSource.data = [];
      this.originalDataBackup = [];
      return;
    }

    this.mappingId = this.mappingData.mappingId || this.mappingData.id || '';
    this.mappingName = this.mappingData.mappingName || this.mappingData.name || '';
    this.sourceCodeSetName =
      this.mappingData.source ||
      this.mappingData.sourceCodeSet ||
      this.mappingData.sourceCodeSetName ||
      '';
    this.targetCodeSetName =
      this.mappingData.target ||
      this.mappingData.targetCodeSet ||
      this.mappingData.targetCodeSetName ||
      '';
    this.lastUpdated = this.mappingData.lastModified || this.mappingData.lastUpdated || 'Just now';
    this.lastUpdatedBy =
      this.mappingData.lastSavedBy || this.mappingData.lastUpdatedBy || 'Current User';

    if (this.mappingData.usageData) {
      this.usedInPipelines = this.mappingData.usageData.pipelineCount || 0;
      this.referencedByRules = this.mappingData.usageData.ruleCount || 0;
    } else {
      this.usedInPipelines = this.mappingData.usedInPipelines || 0;
      this.referencedByRules = this.mappingData.referencedByRules || 0;
    }

    const mappingRows =
      this.mappingData.mappingRows ||
      this.mappingData.mappings ||
      this.mappingData.sourceCodeRows ||
      this.mappingData.fields ||
      [];

    const rows: MappingRow[] = mappingRows.map((row: any, index: number) => {
      const sCode = row.sourceCode || row.sourceField || '';
      const tCode = row.targetCode || row.targetField || '';

      return {
        id: row.id || `row-${index}`,
        sourceCode: sCode,
        sourceLabel: row.sourceLabel || '',
        targetCode: tCode,
        targetLabel: row.targetLabel || '',
        mappingType: (row.mappingType || 'Direct') as 'Direct' | 'Constant',
        notes: row.notes || '',
        status: (tCode && tCode !== '' ? 'Mapped' : 'Unmapped') as 'Mapped' | 'Unmapped',
        required: row.requirement === 'Required' || row.required === true,
        isModified: false,
        isNew: false,
        originalTargetCode: tCode,
        originalTargetLabel: row.targetLabel || '',
        originalMappingType: row.mappingType || 'Direct',
      };
    });

    this.dataSource.data = rows;
    this.originalDataBackup = _.cloneDeep(rows);

    this.loadTargetCodes(this.targetCodeSetName);

    setTimeout(() => {
      if (this.sort) this.dataSource.sort = this.sort;
      if (this.paginator) this.paginator.firstPage();
      this.cdr.detectChanges();
    }, 0);
  }

  private subscribeToEvents(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      const eventName = state?.items?.event;
      const payload = state?.items?.payload;

      if (eventName === 'open_edit_code_set_mapping' && payload?.mappingData) {
        this.mappingData = payload.mappingData;
        this.initializeData();
        this.isExiting = false;
        this.updateBreadcrumb();
      }

      // MATCHED LOGIC: Navigate back via breadcrumb check
      if (eventName === 'breadcrumb_navigate' && payload?.target === 'VIEW_CODE_SET_MAPPING') {
        this.onCancel();
      }

      if (eventName === 'confirmation_save_confirmed') {
        this.executeActualSave();
      }

      if (eventName === 'confirmation_reset_confirmed') {
        this.executeActualReset();
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

  private updateBreadcrumb(): void {
    const breadcrumbPath = [
      { label: 'Normalization', target: 'ROOT' },
      { label: 'Mappings', target: 'TAB_MAPPINGS' },
      { label: 'View Code Set Mapping', target: 'VIEW_CODE_SET_MAPPING' },
      { label: 'Edit Code Set Mapping', active: true },
    ];

    this.eventService.publish('nf', 'update_breadcrumb', { path: breadcrumbPath });
  }

  onSave(): void {
    if (this.pendingChanges.length === 0) {
      this.exitAndReturnToView();
      return;
    }

    const modalPayload = {
      title: 'Save Changes',
      message: `You have ${this.pendingChanges.length} pending change(s). Would you like to apply these updates to "${this.mappingName}"?`,
      command: 'save',
      itemName: this.mappingName,
      theme: this.getActiveTheme(),
      action: 'open_confirmation_modal',
    };

    this.eventService.publish('nf', 'open_confirmation_modal', modalPayload);
  }

  private executeActualSave(): void {
    this.eventService.publish('nf', 'code_set_mapping_updated', {
      action: 'code_set_mapping_updated',
      mappingId: this.mappingId,
      updatedRows: this.dataSource.data.filter(r => r.isModified),
    });

    this.pendingChanges = [];
    this.hasUnsavedChanges = false;
    this.exitAndReturnToView();
  }

  /**
   * Reverts a specific change from the sidebar or pending list
   * Matches the behavior expected by the HTML template
   */
  revertChange(change: PendingChange): void {
    const original = this.originalDataBackup.find(o => o.id === change.rowId);
    const targetRow = this.dataSource.data.find(r => r.id === change.rowId);

    if (original && targetRow) {
      // Revert the specific field back to original
      const propertyMap: Record<string, string> = {
        'Target Mapping': 'targetCode',
        'Mapping Logic': 'mappingType',
      };

      const propName = propertyMap[change.type];
      if (propName) {
        targetRow[propName] = original[propName];

        // If it's the target code, we also need to revert the label
        if (propName === 'targetCode') {
          targetRow.targetLabel = original.targetLabel;
        }
      }

      // Recalculate status and pending changes for this row
      this.onValueChange(targetRow);

      // Trigger table refresh
      this.dataSource.data = [...this.dataSource.data];
    }
  }

  /**
   * Updates the source data when a value is edited directly in the sidebar
   */
  onSidebarUpdate(change: PendingChange): void {
    const targetRow = this.dataSource.data.find(row => row.id === change.rowId);

    if (targetRow) {
      const propertyMap: Record<string, string> = {
        'Target Mapping': 'targetCode',
        'Mapping Logic': 'mappingType',
      };

      const propName = propertyMap[change.type];

      if (propName) {
        targetRow[propName] = change.newValue;

        // Update label if the code changed via sidebar
        if (propName === 'targetCode') {
          const targetInfo = this.availableTargetCodes.find(t => t.code === change.newValue);
          targetRow.targetLabel = targetInfo ? targetInfo.label : '';
        }

        this.onValueChange(targetRow);
        this.dataSource.data = [...this.dataSource.data];
      }
    }
  }

  onCancel(): void {
    if (this.pendingChanges.length > 0) {
      this.eventService.publish('nf', 'open_confirmation_modal', {
        title: 'Discard Changes?',
        message: `You have ${this.pendingChanges.length} unsaved change(s). Discard them?`,
        command: 'discard',
        itemName: this.mappingName,
        theme: this.getActiveTheme(),
        action: 'open_confirmation_modal',
      });
    } else {
      this.exitAndReturnToView();
    }
  }

  private exitAndReturnToView(): void {
    this.isExiting = true;

    // Silent update of breadcrumb to return to View Mode
    const backToViewPath = [
      { label: 'Normalization', target: 'ROOT' },
      { label: 'Mappings', target: 'TAB_MAPPINGS' },
      { label: 'View Code Set Mapping', target: 'VIEW_CODE_SET_MAPPING', active: true },
    ];

    this.eventService.publish('nf', 'update_breadcrumb', { path: backToViewPath });

    this.eventService.publish('nf', 'close_edit_code_set_mapping', {
      action: 'close_edit_code_set_mapping',
      codesetId: this.mappingId,
    });

    setTimeout(() => {
      this.closeMapping.emit();
    }, 500);
  }

  resetAllChanges(): void {
    this.eventService.publish('nf', 'open_confirmation_modal', {
      title: 'Reset All Changes',
      message: 'Are you sure you want to discard all pending changes for this mapping?',
      command: 'reset',
      itemName: this.mappingName,
      theme: this.getActiveTheme(),
      action: 'open_confirmation_modal',
    });
  }

  private executeActualReset(): void {
    this.dataSource.data = _.cloneDeep(this.originalDataBackup);
    this.pendingChanges = [];
    this.hasUnsavedChanges = false;
    this.cdr.detectChanges();

    // If resetting from a navigation intent
    if (this.isExiting) {
      this.exitAndReturnToView();
    }
  }

  private loadTargetCodes(codeSet: string): void {
    const codesBySystem: Record<string, { code: string; label: string }[]> = {
      LOINC: [
        { code: '2951-2', label: 'Sodium [Moles/volume]' },
        { code: '2345-7', label: 'Glucose [Mass/volume]' },
        { code: '718-7', label: 'Hemoglobin [Mass/volume]' },
        { code: '4548-4', label: 'C-Reactive Protein [Mass/volume]' },
      ],
      'SNOMED CT Terminology': [
        { code: '44054006', label: 'Diabetes mellitus type 2' },
        { code: '73211009', label: 'Diabetes mellitus' },
        { code: '271649006', label: 'Hemoglobin A1c' },
        { code: 'sample_id', label: 'Sample ID' },
        { code: 'test_code', label: 'Test Code' },
      ],
      'ICD-10': [
        { code: 'E11.9', label: 'Type 2 diabetes mellitus without complications' },
        { code: 'E11.65', label: 'Type 2 diabetes mellitus with hyperglycemia' },
      ],
    };

    this.availableTargetCodes = codesBySystem[codeSet] || [];
  }

  private setupFilterListeners(): void {
    this.searchControl.valueChanges.subscribe(() => this.applyFilters());
    this.mappingStatusFilter.valueChanges.subscribe(() => this.applyFilters());
    this.mappingTypeFilter.valueChanges.subscribe(() => this.applyFilters());
    this.requirementFilter.valueChanges.subscribe(() => this.applyFilters());
  }

  private applyFilters(): void {
    let filtered = [...this.originalDataBackup];
    const searchTerm = (this.searchControl.value || '').toLowerCase();

    if (searchTerm) {
      filtered = filtered.filter(
        row =>
          row.sourceCode.toLowerCase().includes(searchTerm) ||
          row.sourceLabel.toLowerCase().includes(searchTerm) ||
          row.targetCode.toLowerCase().includes(searchTerm) ||
          row.targetLabel.toLowerCase().includes(searchTerm),
      );
    }

    const statusFilter = this.mappingStatusFilter.value;
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(row => row.status.toLowerCase() === statusFilter);
    }

    this.dataSource.data = filtered;
    if (this.paginator) this.paginator.firstPage();
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.mappingStatusFilter.setValue('all');
    this.mappingTypeFilter.setValue('all');
    this.requirementFilter.setValue('all');
  }

  onTargetCodeChange(row: MappingRow, event: any): void {
    const targetInfo = this.availableTargetCodes.find(t => t.code === event.value);
    if (targetInfo) {
      row.targetCode = targetInfo.code;
      row.targetLabel = targetInfo.label;
    } else {
      row.targetCode = '';
      row.targetLabel = '';
    }
    this.onValueChange(row);
  }

  onMappingTypeChange(row: MappingRow, event: any): void {
    row.mappingType = event.value;
    this.onValueChange(row);
  }

  // Unified Change tracking matching edit-mapping.component
  onValueChange(row: MappingRow): void {
    const original = this.originalDataBackup.find(o => o.id === row.id);
    if (!original) return;

    this.pendingChanges = this.pendingChanges.filter(c => c.rowId !== row.id);

    const fieldsToTrack = ['targetCode', 'mappingType'];
    let rowHasAnyChange = false;

    fieldsToTrack.forEach(field => {
      if (row[field] !== original[field]) {
        rowHasAnyChange = true;
        const labels: Record<string, string> = {
          targetCode: 'Target Mapping',
          mappingType: 'Mapping Logic',
        };

        this.pendingChanges.push({
          id: `${row.id}-${field}`,
          rowId: row.id,
          sourceCode: row.sourceCode,
          field: row.sourceCode,
          type: labels[field] || 'Field',
          changeType: 'Modified',
          description: `Changed ${labels[field] || field}`,
          oldValue: original[field] || '(Empty)',
          newValue: row[field] || '(Empty)',
        });
      }
    });

    row.status = rowHasAnyChange ? 'Modified' : row.targetCode ? 'Mapped' : 'Unmapped';
    this.hasUnsavedChanges = this.pendingChanges.length > 0;
  }

  openUsageImpact(): void {
    this.showUsageImpact = true;
    this.eventService.publish('nf', 'open_usage_impact_drawer', {
      action: 'open_usage_impact_drawer',
      mappingId: this.mappingId,
    });
  }

  closeUsageImpact(): void {
    this.showUsageImpact = false;
    this.eventService.publish('nf', 'close_usage_impact_drawer', {
      action: 'close_usage_impact_drawer',
    });
  }

  get canSave(): boolean {
    return this.hasUnsavedChanges;
  }

  get mappedCount(): number {
    return this.dataSource.data.filter(r => r.status === 'Mapped').length;
  }

  get unmappedCount(): number {
    return this.dataSource.data.filter(r => r.status === 'Unmapped').length;
  }

  get totalCount(): number {
    return this.dataSource.data.length;
  }
}
