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

// Define these at the top or within your class
export const REQUIREMENT_OPTIONS = ['Required', 'Optional'];
export const TYPE_OPTIONS = [
  'Boolean',
  'Number',
  'Enum',
  'Date',
  'String',
  'Object',
  'Float',
  'Integer',
];

// 1. Update the Interface to include rowId
interface PendingChange {
  id: string;
  rowId: string; // Ensure this is present
  field: string;
  type: string;
  description: string;
  originalValue?: any;
  newValue?: any;
}

interface MappingRow {
  id: string;
  sourceField: string;
  targetField: string;
  type: string;
  requirement: string;
  mappingType: string;
  status: string;
  notes?: string;
  [key: string]: any; // Allow indexing for the comparison logic
}

@Component({
  selector: 'app-edit-mapping',
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
  templateUrl: './edit-mapping.component.html',
  styleUrls: ['./edit-mapping.component.scss'],
})
export class EditMappingComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() mappingData: any;
  @Output() closeEdit = new EventEmitter<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Animation control - slides out to the RIGHT when closing
  isExiting = false;
  // Expose lists to the HTML template
  requirementOptions = REQUIREMENT_OPTIONS;
  typeOptions = TYPE_OPTIONS;
  // Counter for pending changes
  pendingCount = 0;

  @HostBinding('class.slide-out-to-right')
  get exitClass() {
    return this.isExiting;
  }

  showUsagePanel = false;
  private eventSubs?: Subscription;
  private originalDataBackup: MappingRow[] = [];

  dataSource = new MatTableDataSource<MappingRow>([]);
  displayedColumns: string[] = [
    'sourceField',
    'targetField',
    'type',
    'requirement',
    'mappingType',
    'status',
    'actions',
  ];

  searchTerm = '';

  filters = {
    requirement: 'All',
    status: 'All',
    mappingType: 'All',
    type: 'All',
  };

  pendingChanges: PendingChange[] = [];

  // Available target fields for dropdown selection
  availableTargetFields: string[] = [];

  constructor(
    private eventStore: Store<{ nf: EventState }>,
    private eventService: EventService,
  ) {}

  ngOnInit(): void {
    this.setupFilterLogic();

    // Check if we already have mapping data from @Input
    if (this.mappingData) {
      this.loadMappingData(this.mappingData);
      this.initializeAvailableFields();
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
    // Flip local state
    this.showUsagePanel = !this.showUsagePanel;

    if (this.showUsagePanel) {
      this.eventService.publish('nf', 'open_usage_impact_drawer', {
        fullData: this.mappingData,
      });
    } else {
      this.eventService.publish('nf', 'close_usage_impact_drawer', {});
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
      if (eventName === 'breadcrumb_navigate' && payload?.target === 'VIEW_MAPPING') {
        this.onCancel();
      }

      if (eventName === 'open_edit_mapping') {
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
   * Updates the breadcrumb to show the Edit Mapping path
   */
  private updateBreadcrumb(): void {
    const breadcrumbPath = [
      { label: 'Normalization', target: 'ROOT' },
      { label: 'Mappings', target: 'TAB_MAPPINGS' },
      { label: 'View Mapping', target: 'VIEW_MAPPING' }, // Added target here
      { label: 'Edit Mapping', active: true },
    ];
    this.eventService.publish('nf', 'update_breadcrumb', { path: breadcrumbPath });
  }

  private initializeWithData(data: any): void {
    if (!data) return;

    this.mappingData = data;
    this.loadMappingData(data);
    this.initializeAvailableFields();
  }

  private initializeAvailableFields(): void {
    // Extract unique target fields from all mappings or use predefined list based on target model
    if (this.mappingData?.target === 'Patient') {
      this.availableTargetFields = [
        'patient_id',
        'first_name',
        'last_name',
        'middle_name',
        'birth_date',
        'gender',
        'ssn',
        'phone_home',
        'phone_mobile',
        'email',
        'addr_street',
        'addr_city',
        'addr_state',
        'addr_zip',
        'insurance_primary',
        'primary_physician',
        'allergies',
        'current_medications',
        'active_diagnoses',
        'height_cm',
        'weight_kg',
        'blood_type',
        'marital_status',
        'preferred_language',
        'race',
        'ethnicity',
        'emergency_contact_name',
        'emergency_contact_phone',
      ];
    } else if (this.mappingData?.target === 'Lab Result') {
      this.availableTargetFields = [
        'sample_id',
        'test_code',
        'result_value',
        'result_unit',
        'reference_range_low',
        'reference_range_high',
        'abnormal_indicator',
        'collection_timestamp',
        'result_timestamp',
        'ordering_provider_id',
        'performing_lab_code',
        'specimen_type',
        'result_status',
        'patient_reference',
        'order_reference',
      ];
    } else {
      // Default fallback - extract from existing data or use generic fields
      const existingTargets =
        this.mappingData?.fields?.map((f: any) => f.targetField).filter(Boolean) || [];
      this.availableTargetFields =
        existingTargets.length > 0
          ? ([...new Set(existingTargets)] as string[])
          : ['field_1', 'field_2', 'field_3', 'field_4', 'field_5'];
    }
  }

  private loadMappingData(data?: any): void {
    let rows: MappingRow[] = [];

    if (data && data.fields && Array.isArray(data.fields)) {
      // Use the rich field data from the mapping object
      rows = _.cloneDeep(data.fields);
    } else {
      // Fallback to default mock data
      rows = [
        {
          id: '1',
          sourceField: 'MRN',
          targetField: 'patient_id',
          type: 'String',
          requirement: 'Required',
          mappingType: 'Direct',
          status: 'Mapped',
        },
        {
          id: '2',
          sourceField: 'FIRST_NAME',
          targetField: 'first_name',
          type: 'String',
          requirement: 'Required',
          mappingType: 'Direct',
          status: 'Mapped',
        },
        {
          id: '3',
          sourceField: 'LAST_NAME',
          targetField: 'last_name',
          type: 'String',
          requirement: 'Required',
          mappingType: 'Direct',
          status: 'Mapped',
        },
        {
          id: '4',
          sourceField: 'DOB',
          targetField: 'birth_date',
          type: 'Date',
          requirement: 'Required',
          mappingType: 'Direct',
          status: 'Mapped',
        },
        {
          id: '5',
          sourceField: 'GENDER',
          targetField: 'gender',
          type: 'Enum',
          requirement: 'Required',
          mappingType: 'Constant',
          status: 'Mapped',
        },
        {
          id: '6',
          sourceField: 'PHONE',
          targetField: 'phone_home',
          type: 'String',
          requirement: 'Optional',
          mappingType: 'Direct',
          status: 'Mapped',
        },
        {
          id: '7',
          sourceField: 'STREET',
          targetField: 'addr_street',
          type: 'String',
          requirement: 'Optional',
          mappingType: 'Direct',
          status: 'Mapped',
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
    this.dataSource.filterPredicate = (data: MappingRow): boolean => {
      // 1. Text Search: Convert everything to lower case using lodash
      const search = _.toLower(_.trim(this.searchTerm));

      // Create a single searchable string from all column data
      const searchableContent = _.toLower(
        [
          data.sourceField,
          data.targetField,
          data.type,
          data.requirement,
          data.mappingType,
          data.status,
        ].join(' '),
      );

      const matchesSearch = !search || searchableContent.includes(search);

      // 2. Exact Match Radio Filters (The Dropdown)
      const matchesRequirement =
        this.filters.requirement === 'All' || data.requirement === this.filters.requirement;
      const matchesStatus = this.filters.status === 'All' || data.status === this.filters.status;
      const matchesMappingType =
        this.filters.mappingType === 'All' || data.mappingType === this.filters.mappingType;
      const matchesType = this.filters.type === 'All' || data.type === this.filters.type;

      return (
        matchesSearch && matchesRequirement && matchesStatus && matchesMappingType && matchesType
      );
    };
  }

  applySearch(): void {
    // We trigger the re-filtering cycle by updating the filter string
    this.dataSource.filter = `${this.searchTerm}_${JSON.stringify(this.filters)}`;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  applyFilters(): void {
    // Called from filter menu radio button changes
    this.applySearch();
  }

  getActiveFilterLabel(): string {
    const activeFilters: string[] = [];
    if (this.filters.requirement !== 'All') activeFilters.push(this.filters.requirement);
    if (this.filters.status !== 'All') activeFilters.push(this.filters.status);
    if (this.filters.mappingType !== 'All') activeFilters.push(this.filters.mappingType);
    if (this.filters.type !== 'All') activeFilters.push(this.filters.type);

    return activeFilters.length > 0 ? activeFilters.join(', ') : 'All';
  }

  clearFilters(): void {
    this.filters = {
      requirement: 'All',
      status: 'All',
      mappingType: 'All',
      type: 'All',
    };
    this.applySearch();
  }

  /**
   * Helper to determine if a specific field on a row has changed from the original backup.
   * This is used by the HTML template to apply the .modified-field class specifically.
   */
  isFieldModified(row: MappingRow, fieldName: string): boolean {
    const original = this.originalDataBackup.find(o => o.id === row.id);
    if (!original) return false;
    return row[fieldName] !== original[fieldName];
  }

  /**
   * UPDATED: Unified change tracking logic.
   * Compares the row against the original backup and generates specific pending change entries.
   */
  onValueChange(row: MappingRow): void {
    const original = this.originalDataBackup.find(o => o.id === row.id);
    if (!original) return;

    // Remove existing specific changes for this row before recalculating
    // We use rowId to ensure we target the correct entries accurately
    this.pendingChanges = this.pendingChanges.filter(c => c.rowId !== row.id);

    const fieldsToTrack = ['requirement', 'type', 'targetField', 'mappingType'];
    let rowHasAnyChange = false;

    fieldsToTrack.forEach(field => {
      if (row[field] !== original[field]) {
        rowHasAnyChange = true;

        // Map field keys to human readable labels
        const labels: Record<string, string> = {
          requirement: 'Requirement',
          type: 'Data Type',
          targetField: 'Target Mapping',
          mappingType: 'Mapping Logic',
        };

        this.pendingChanges.push({
          id: `${row.id}-${field}`,
          rowId: row.id, // CRITICAL: This was missing and is required for onSidebarUpdate
          field: row.sourceField,
          type: labels[field] || 'Field',
          description: `Changed ${labels[field] || field}`,
          originalValue: original[field] || '(Empty)',
          newValue: row[field] || '(Empty)',
        });
      }
    });

    if (rowHasAnyChange) {
      row.status = 'Modified';
    } else {
      row.status = original.status;
    }

    this.pendingCount = this.pendingChanges.length;
  }

  /**
   * Selection change for Mapping Type dropdown
   */
  onMappingTypeChange(row: MappingRow, newValue: string): void {
    row.mappingType = newValue;
    this.onValueChange(row);
  }

  /**
   * Selection change for Target Field dropdown
   */
  onTargetFieldChange(row: MappingRow, newValue: string): void {
    row.targetField = newValue;
    this.onValueChange(row);
  }

  resetRow(row: MappingRow): void {
    const original = this.originalDataBackup.find(o => o.id === row.id);
    if (original) {
      row.mappingType = original.mappingType;
      row.targetField = original.targetField;
      row.type = original.type;
      row.requirement = original.requirement;
      row.status = original.status;

      // Remove all pending changes for this row
      this.pendingChanges = this.pendingChanges.filter(c => !c.id.startsWith(row.id));
      this.pendingCount = this.pendingChanges.length;
    }
  }

  private executeActualReset(): void {
    this.pendingChanges = [];
    this.pendingCount = 0;
    this.loadMappingData(this.mappingData);
  }

  /**
   * Legacy wrapper kept for template compatibility
   */
  updatePendingList(change: PendingChange): void {
    const existingIndex = _.findIndex(this.pendingChanges, { id: change.id });
    if (existingIndex > -1) {
      this.pendingChanges[existingIndex] = change;
    } else {
      this.pendingChanges.push(change);
    }
    this.pendingCount = this.pendingChanges.length;
  }

  /**
   * Updates the source data when a selection is changed within the pending sidebar.
   * @param change The change object from the pendingChanges array
   */
  onSidebarUpdate(change: PendingChange): void {
    // 1. Find the specific row in the data source using the rowId stored in the change object
    const targetRow = this.dataSource.data.find(row => row.id === change.rowId);

    if (targetRow) {
      // 2. Map the human-readable sidebar "type" back to the actual MappingRow property keys
      const propertyMap: Record<string, string> = {
        Requirement: 'requirement',
        'Data Type': 'type',
        'Target Mapping': 'targetField',
        'Mapping Logic': 'mappingType',
      };

      const propName = propertyMap[change.type];

      if (propName) {
        // 3. Update the value in the object reference
        targetRow[propName] = change.newValue;

        // 4. Run the standard change logic to recalculate the "Modified" status badge
        this.onValueChange(targetRow);

        // 5. CRITICAL: Re-assign the data array reference using spread.
        // This notifies the MatTable that the data has changed so the HTML
        // template refreshes the specific cell and applies the .modified-field CSS.
        this.dataSource.data = [...this.dataSource.data];
      }
    }
  }

  /**
   * Triggers global reset with confirmation
   */
  resetAllChanges(): void {
    this.eventService.publish('nf', 'open_confirmation_modal', {
      title: 'Reset All Changes',
      theme: this.getActiveTheme(),
      message:
        'Are you sure you want to discard all pending changes and revert to the original mapping state?',
      command: 'reset',
      action: 'open_confirmation_modal',
      itemName: 'All Pending Changes',
    });
  }

  /**
   * UPDATED: Cancel method - triggers reverse animation back to View
   * Edit slides out RIGHT, View slides in FROM LEFT
   */
  onCancel(): void {
    // 1. Trigger the slide-out animation for Edit component (to the right)
    this.isExiting = true;

    // 2. Ensure separate drawer is also closed
    this.eventService.publish('nf', 'close_usage_impact_drawer', {
      action: 'close_usage_impact_drawer',
    });

    // 3. Update breadcrumb back to View Mapping
    const breadcrumbPath = [
      { label: 'Normalization', target: 'ROOT' },
      { label: 'Mappings', target: 'TAB_MAPPINGS' },
      { label: 'View Mapping', active: true },
    ];
    this.eventService.publish('nf', 'update_breadcrumb', { path: breadcrumbPath });

    // 4. Notify parent (ViewMappingComponent) to trigger its slide-in animation
    this.eventService.publish('nf', 'close_edit_mapping', {
      action: 'close_edit_mapping',
    });

    // 5. Wait for animation to complete before destroying component
    setTimeout(() => {
      this.closeEdit.emit();
    }, 500); // Match animation duration
  }

  // 1. Trigger the Modal (WITHOUT calling onCancel)
  onSave(): void {
    // 1. Close auxiliary drawers
    this.eventService.publish('nf', 'close_usage_impact_drawer', {
      action: 'close_usage_impact_drawer',
    });

    // 2. Open confirmation modal
    // DO NOT call this.onCancel() here, or the screen will slide away!
    this.eventService.publish('nf', 'open_confirmation_modal', {
      title: 'Confirm Mapping Changes',
      theme: this.getActiveTheme(),
      message: `You have ${this.pendingChanges.length} pending changes. Are you sure you want to save these updates?`,
      command: 'save',
      action: 'open_confirmation_modal',
      itemName: `${this.mappingData?.source || 'Source'} → ${this.mappingData?.target || 'Target'}`,
    });
  }

  onDelete(): void {
    this.eventService.publish('nf', 'open_confirmation_modal', {
      title: 'Delete Mapping',
      theme: this.getActiveTheme(),
      message:
        'Are you sure you want to permanently delete this mapping configuration? This action cannot be undone.',
      command: 'delete',
      action: 'open_confirmation_modal',
      itemName: `${this.mappingData?.source || 'Source'}`,
    });
  }

  private executeActualDelete(): void {
    console.log('Mapping deleted successfully');
    this.onCancel();
  }

  private executeActualSave(): void {
    const transactionContext = {
      sourceSystem: this.mappingData?.source || 'Epic Health Network',
      targetModel: this.mappingData?.target || 'Patient',
      mappingId: this.mappingData?.id,
      timestamp: new Date().toISOString(),
      action: 'EDIT_MAPPING_SAVE',
      changesCount: this.pendingChanges.length,
      changes: this.pendingChanges,
    };

    console.log('Transaction Confirmed. Saving mapping with context:', transactionContext);

    // Logical cleanup
    this.eventService.publish('nf', 'close_usage_impact_drawer', {
      action: 'close_usage_impact_drawer',
    });

    // Proceed with exit animation and cleanup
    this.onCancel();
  }

  /**
   * Generic handler used by template
   */
  onTableValueChange(element: any) {
    this.onValueChange(element);
  }

  addNewMapping(): void {
    // Signal the view component to toggle isOpen = true
    this.eventService.publish('nf', 'open_new_mapping_modal', {
      action: 'open_new_mapping_modal',
      theme: this.getActiveTheme(),
      mode: 'create',
    });
  }
}
