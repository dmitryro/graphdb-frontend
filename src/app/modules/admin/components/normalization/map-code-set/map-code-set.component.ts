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
import { Subscription } from 'rxjs';

interface MappingRow {
  id: string;
  sourceCode: string;
  sourceLabel: string;
  targetCode: string;
  targetLabel: string;
  mappingType: 'Direct' | 'Default' | 'Null / Ignore';
  hasWarning: boolean;
  warningMessage?: string;
  existingMapping?: {
    type: string;
    targetCode: string;
  };
}

@Component({
  selector: 'app-map-code-set',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
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
  templateUrl: './map-code-set.component.html',
  styleUrl: './map-code-set.component.scss',
})
export class MapCodeSetComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() mappingData: any = null;
  @Output() closeMapping = new EventEmitter<void>();

  @HostBinding('class.slide-out-to-right') isExiting = false;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private eventSubs?: Subscription;

  // Form controls
  nameControl = new FormControl('');
  descriptionControl = new FormControl('');
  targetCodeSetControl = new FormControl('');
  showUnmappedControl = new FormControl(false);

  // Table data
  dataSource = new MatTableDataSource<MappingRow>([]);
  selection = new SelectionModel<MappingRow>(true, []); // multi-select
  displayedColumns: string[] = [
    'select',
    'sourceCode',
    'sourceLabel',
    'targetCode',
    'targetLabel',
    'mappingType',
    'status',
  ];

  // Available options
  targetCodeSets = ['LOINC', 'SNOMED CT', 'ICD-10', 'RxNorm', 'CPT'];
  mappingTypeOptions = ['Direct', 'Default', 'Null / Ignore'];

  // Available target codes (populated based on selected code set)
  availableTargetCodes: { code: string; label: string }[] = [];

  // Status tracking
  isDraft = true;
  hasUnsavedChanges = false;

  // Progress tracking
  totalCodes = 0;
  mappedCount = 0;
  unmappedCount = 0;
  overridesCount = 0;

  // Selected row for warning display
  selectedRow: MappingRow | null = null;

  // Original data for comparison
  private originalData: MappingRow[] = [];
  private cdr: ChangeDetectorRef;

  constructor(
    private eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
    cdr: ChangeDetectorRef,
  ) {
    this.cdr = cdr;
  }

  ngOnInit(): void {
    this.subscribeToEvents();
    this.updateBreadcrumb();
    this.setupTableSort();
    this.setupFilterListener();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mappingData'] && changes['mappingData'].currentValue) {
      console.log('[MapCodeSet] ngOnChanges triggered with mappingData');
      this.initializeData();
    }
  }

  ngOnDestroy(): void {
    if (this.eventSubs) {
      this.eventSubs.unsubscribe();
    }
  }

  private initializeData(): void {
    if (!this.mappingData) {
      console.warn('[MapCodeSet] No mappingData provided');
      this.dataSource.data = [];
      this.originalData = [];
      this.updateCounts();
      return;
    }

    const sourceCodeSet = this.mappingData.sourceCodeSet || 'Lab Result Codes';
    let targetCodeSet = this.mappingData.targetCodeSet || '';

    // AUTO-DETECT TARGET CODE SET FROM SOURCE NAME
    if (!targetCodeSet) {
      targetCodeSet = this.detectTargetCodeSet(sourceCodeSet);
      if (targetCodeSet) {
        console.log(`[MapCodeSet] Auto-detected target code set: ${targetCodeSet}`);
      }
    }

    // Pre-fill name
    const autoName = targetCodeSet
      ? `${sourceCodeSet} → ${targetCodeSet}`
      : `${sourceCodeSet} → [Select Target]`;
    this.nameControl.setValue(autoName);

    // Set target code set control (triggers loadTargetCodes)
    this.targetCodeSetControl.setValue(targetCodeSet);

    // Initialize table data
    const sourceCodeRows = this.mappingData.sourceCodeRows || [];
    console.log('[MapCodeSet] Initializing with', sourceCodeRows.length, 'rows');

    const rows: MappingRow[] = sourceCodeRows.map((row: any, index: number) => ({
      id: row.id || `row-${index}`,
      sourceCode: row.sourceCode || '',
      sourceLabel: row.sourceLabel || '',
      targetCode: row.targetCode || '',
      targetLabel: row.targetLabel || '',
      mappingType: row.mappingType || 'Direct',
      hasWarning: row.hasWarning || false,
      warningMessage: row.warningMessage,
      existingMapping: row.existingMapping,
    }));

    this.dataSource.data = rows;
    this.originalData = JSON.parse(JSON.stringify(rows));

    this.updateCounts();

    // Load target codes if we have a target code set
    if (targetCodeSet) {
      this.loadTargetCodes(targetCodeSet);
    }

    // Force table refresh
    setTimeout(() => {
      if (this.sort) this.dataSource.sort = this.sort;
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
        this.paginator.firstPage();
      }
      this.cdr.detectChanges();
    }, 0);
  }

  private detectTargetCodeSet(sourceCodeSet: string): string {
    const normalized = sourceCodeSet.toLowerCase();

    if (this.targetCodeSets.includes(sourceCodeSet)) {
      return sourceCodeSet;
    }

    for (const option of this.targetCodeSets) {
      if (normalized.includes(option.toLowerCase())) {
        return option;
      }
    }

    if (normalized.includes('loinc')) return 'LOINC';
    if (normalized.includes('snomed')) return 'SNOMED CT';
    if (normalized.includes('icd-10')) return 'ICD-10';
    if (normalized.includes('rxnorm')) return 'RxNorm';
    if (normalized.includes('cpt')) return 'CPT';

    return '';
  }

  private subscribeToEvents(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      const eventName = state?.items?.event;
      const payload = state?.items?.payload;

      if (eventName === 'open_map_code_set' && payload?.fullData) {
        console.log('[MapCodeSet] Received open_map_code_set via event', {
          source: payload.fullData.sourceCodeSet,
          rows: payload.fullData.sourceCodeRows?.length ?? 0,
        });

        this.mappingData = payload.fullData;
        this.initializeData();

        this.isExiting = false;
      }

      if (eventName === 'close_map_code_set') {
        this.onCancel();
      }

      if (eventName === 'confirmation_response' && payload) {
        this.handleConfirmationResponse(payload);
      }
    });
  }

  private handleConfirmationResponse(data: any): void {
    const { confirmed, command } = data;
    if (!confirmed) return;

    switch (command) {
      case 'save_code_mapping':
        this.finalizeSave();
        break;
      case 'discard':
        this.discardChangesAndClose();
        break;
    }
  }

  private updateBreadcrumb(): void {
    const sourceCodeSet = this.mappingData?.sourceCodeSet || 'Code Set';

    const breadcrumbPath = [
      { label: 'Normalization', target: 'ROOT' },
      { label: 'Codes', target: 'TAB_CODES' },
      { label: `Map: ${sourceCodeSet}`, target: 'MAP_CODE_SET', active: true },
    ];

    this.eventService.publish('nf', 'update_breadcrumb', { path: breadcrumbPath });
  }

  private setupTableSort(): void {
    setTimeout(() => {
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
    }, 0);
  }

  private setupFilterListener(): void {
    this.showUnmappedControl.valueChanges.subscribe(showUnmapped => {
      if (showUnmapped) {
        this.dataSource.filterPredicate = (data: MappingRow) => {
          return !data.targetCode || data.targetCode === '';
        };
        this.dataSource.filter = 'unmapped';
      } else {
        this.dataSource.filterPredicate = () => true;
        this.dataSource.filter = '';
      }

      if (this.paginator) {
        this.paginator.firstPage();
      }
    });
  }

  onTargetCodeSetChange(): void {
    const targetCodeSet = this.targetCodeSetControl.value;
    if (targetCodeSet) {
      this.loadTargetCodes(targetCodeSet);
      this.updateMappingName();
      this.trackChange();
    }
  }

  private loadTargetCodes(codeSet: string): void {
    const codesBySystem: Record<string, { code: string; label: string }[]> = {
      LOINC: [
        { code: '2951-2', label: 'Sodium [Moles/volume]' },
        { code: '2345-7', label: 'Glucose [Mass/volume]' },
        { code: '718-7', label: 'Hemoglobin [Mass/volume]' },
        { code: '4548-4', label: 'C-Reactive Protein [Mass/volume]' },
        { code: '1988-5', label: 'C-Reactive Protein [Mass/volume]' },
        { code: '6598-7', label: 'Troponin I [Mass/volume]' },
        { code: '20426-5', label: 'Borrelia burgdorferi Ab' },
        { code: '50190-4', label: 'Vitamin D [Moles/volume]' },
      ],
      'SNOMED CT': [
        { code: '44054006', label: 'Diabetes mellitus type 2' },
        { code: '73211009', label: 'Diabetes mellitus' },
        { code: '271649006', label: 'Hemoglobin A1c' },
      ],
      'ICD-10': [
        { code: 'E11.9', label: 'Type 2 diabetes mellitus without complications' },
        { code: 'E11.65', label: 'Type 2 diabetes mellitus with hyperglycemia' },
        { code: 'Z79.4', label: 'Long-term (current) use of insulin' },
      ],
      RxNorm: [
        { code: '197737', label: 'Metformin 500 MG Oral Tablet' },
        { code: '860975', label: 'Insulin Glargine 100 UNT/ML Injectable Solution' },
      ],
      CPT: [
        { code: '80053', label: 'Comprehensive metabolic panel' },
        { code: '83036', label: 'Hemoglobin; glycosylated (A1c)' },
      ],
    };

    this.availableTargetCodes = codesBySystem[codeSet] || [];
  }

  private updateMappingName(): void {
    const sourceCodeSet = this.mappingData?.sourceCodeSet || 'Lab Result Codes';
    const targetCodeSet = this.targetCodeSetControl.value || '[Select Target]';
    const autoName = `${sourceCodeSet} → ${targetCodeSet}`;
    this.nameControl.setValue(autoName);
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows && numRows > 0;
  }

  isSomeSelected(): boolean {
    const numSelected = this.selection.selected.length;
    return numSelected > 0 && numSelected < this.dataSource.data.length;
  }

  masterToggle(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row));
    }
  }

  checkboxLabel(row?: MappingRow): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`;
  }

  onTargetCodeChange(row: MappingRow, event: any): void {
    const selectedCode = event.value;
    const targetInfo = this.availableTargetCodes.find(t => t.code === selectedCode);

    if (targetInfo) {
      row.targetCode = targetInfo.code;
      row.targetLabel = targetInfo.label;
    }

    this.checkForOverride(row);

    this.updateCounts();
    this.trackChange();
  }

  onMappingTypeChange(row: MappingRow, event: any): void {
    row.mappingType = event.value;

    if (row.mappingType === 'Null / Ignore') {
      row.targetCode = '';
      row.targetLabel = '';
      row.hasWarning = false;
    }

    this.updateCounts();
    this.trackChange();
  }

  private checkForOverride(row: MappingRow): void {
    const hasExisting = Math.random() > 0.8;

    if (hasExisting && row.targetCode) {
      row.hasWarning = true;
      row.warningMessage = 'Override detected';
      row.existingMapping = {
        type: 'Code Set',
        targetCode: 'LOINC:' + row.targetCode,
      };
      this.overridesCount++;
    } else {
      row.hasWarning = false;
      row.warningMessage = undefined;
      row.existingMapping = undefined;
    }
  }

  onRowClick(row: MappingRow): void {
    if (row.hasWarning) {
      this.selectedRow = row;
    }
  }

  private updateCounts(): void {
    this.totalCodes = this.dataSource.data.length;
    this.mappedCount = this.dataSource.data.filter(
      row => row.targetCode && row.targetCode !== '',
    ).length;
    this.unmappedCount = this.totalCodes - this.mappedCount;
    this.overridesCount = this.dataSource.data.filter(row => row.hasWarning).length;
  }

  get mappingProgress(): number {
    if (this.totalCodes === 0) return 0;
    return (this.mappedCount / this.totalCodes) * 100;
  }

  get progressBarColor(): string {
    if (this.mappingProgress < 30) return 'warn';
    if (this.mappingProgress < 70) return 'accent';
    return 'primary';
  }

  public trackChange(): void {
    this.hasUnsavedChanges = true;
    this.isDraft = true;
  }

  private hasChanges(): boolean {
    return JSON.stringify(this.dataSource.data) !== JSON.stringify(this.originalData);
  }

  onSave(): void {
    if (!this.targetCodeSetControl.value) {
      alert('Please select a target code set');
      return;
    }

    if (this.mappedCount === 0) {
      alert('Please map at least one code before saving');
      return;
    }

    const theme = this.getActiveTheme();
    this.eventService.publish('nf', 'open_confirmation_modal', {
      title: 'Save Mapping?',
      message: `Save mapping with ${this.mappedCount} of ${this.totalCodes} codes mapped?`,
      command: 'save_code_mapping',
      itemName: this.nameControl.value || 'Code Set Mapping',
      theme,
      action: 'save',
    });
  }

  onCancel(): void {
    if (this.hasChanges()) {
      const theme = this.getActiveTheme();
      this.eventService.publish('nf', 'open_confirmation_modal', {
        title: 'Discard Changes?',
        message: 'You have unsaved mapping changes. Are you sure you want to discard them?',
        command: 'discard',
        itemName: this.nameControl.value || 'Code Set Mapping',
        theme,
        action: 'discard',
      });
    } else {
      this.executeClose();
    }
  }

  onBulkIgnore(): void {
    const selectedRows = this.selection.selected;
    if (selectedRows.length === 0) {
      alert('Please select rows to ignore');
      return;
    }

    selectedRows.forEach(row => {
      row.mappingType = 'Null / Ignore';
      row.targetCode = '';
      row.targetLabel = '';
      row.hasWarning = false;
    });

    this.selection.clear();
    this.updateCounts();
    this.trackChange();
  }

  onBulkDefault(): void {
    const selectedRows = this.selection.selected;
    if (selectedRows.length === 0) {
      alert('Please select rows to set as default');
      return;
    }

    selectedRows.forEach(row => {
      row.mappingType = 'Default';
    });

    this.selection.clear();
    this.trackChange();
  }

  onBulkDelete(): void {
    const selectedRows = this.selection.selected;
    if (selectedRows.length === 0) {
      alert('Please select rows to delete');
      return;
    }

    if (confirm(`Delete ${selectedRows.length} selected mapping(s)?`)) {
      this.dataSource.data = this.dataSource.data.filter(row => !this.selection.isSelected(row));
      this.selection.clear();
      this.updateCounts();
      this.trackChange();
    }
  }

  onViewExistingMapping(row: MappingRow): void {
    console.log('[MapCodeSet] View existing mapping:', row.existingMapping);
  }

  private finalizeSave(): void {
    console.log('[MapCodeSet] Saving mapping:', {
      name: this.nameControl.value,
      sourceCodeSet: this.mappingData?.sourceCodeSet,
      targetCodeSet: this.targetCodeSetControl.value,
      mappings: this.dataSource.data,
      stats: {
        total: this.totalCodes,
        mapped: this.mappedCount,
        unmapped: this.unmappedCount,
        overrides: this.overridesCount,
      },
    });

    this.eventService.publish('nf', 'code_mapping_saved', {
      action: 'code_mapping_saved',
      mappingId: this.mappingData?.id || `mapping-${Date.now()}`,
      sourceCodeSet: this.mappingData?.sourceCodeSet,
      targetCodeSet: this.targetCodeSetControl.value,
      mappedCount: this.mappedCount,
    });

    this.hasUnsavedChanges = false;
    this.executeClose();
  }

  private discardChangesAndClose(): void {
    this.dataSource.data = JSON.parse(JSON.stringify(this.originalData));
    this.hasUnsavedChanges = false;
    this.isDraft = true;
    this.updateCounts();

    this.executeClose();
  }

  private executeClose(): void {
    this.isExiting = true;
    setTimeout(() => {
      this.closeMapping.emit();
    }, 500);
  }

  private getActiveTheme(): 'light' | 'dark' {
    const isDark =
      document.body.classList.contains('dark-theme') ||
      document.body.classList.contains('dark-mode') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    return isDark ? 'dark' : 'light';
  }

  get canSave(): boolean {
    return !!this.targetCodeSetControl.value && this.mappedCount > 0;
  }

  get statusBadgeClass(): string {
    return this.isDraft ? 'draft' : 'active';
  }

  get statusBadgeText(): string {
    return this.isDraft ? 'Draft' : 'Active';
  }

  get unsavedBadgeText(): string {
    return this.hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved';
  }
}
