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
import { Subscription } from 'rxjs';

import * as _ from 'lodash';

interface FieldMapping {
  sourceField: string;
  targetField: string;
  type: string;
  requirement: string;
  mappingType: string;
  notes: string;
  status: string;
}

interface MappingVersion {
  version: string;
  editor: string;
  timestamp: string;
  action: string;
}

@Component({
  selector: 'app-view-mapping',
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
  templateUrl: './view-mapping.component.html',
  styleUrls: ['./view-mapping.component.scss'],
})
export class ViewMappingComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() mappingData: any;
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
   * FIX: Clickability issue.
   * When this component is slid to the left (behind/beside the Edit component),
   * we must disable its pointer events so the child (EditMapping) is interactive.
   */
  @HostBinding('style.pointer-events') get pointerEvents() {
    return this.isExitedToLeft ? 'none' : 'auto';
  }

  // Field Mapping Table
  fieldMappingDataSource = new MatTableDataSource<FieldMapping>([]);
  fieldMappingColumns = [
    'sourceField',
    'targetField',
    'type',
    'requirement',
    'mappingType',
    'notes',
    'status',
  ];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Search and Filters
  searchTerm = '';
  selectedRequirement = 'All';
  selectedStatus = 'All';
  selectedMappingType = 'All';

  // Usage & Impact
  pipelinesExpanded = false;
  rulesExpanded = false;

  // Versions
  versions: MappingVersion[] = [];

  // Coverage metrics
  requiredFieldsMapped = '20 / 20';
  optionalFieldsMapped = '2';
  unmappedRequiredFields = '0';
  structuralCompleteness = 'Complete';

  // Event subscription
  private eventSubs?: Subscription;

  constructor(
    protected eventService: EventService,
    protected eventStore: Store<{ nf: EventState }>,
  ) {
    console.log('Constructing...');
  }

  ngOnInit(): void {
    this.setupFilterPredicate();
    this.loadFieldMappings();
    this.loadVersions();
    this.subscribeToEvents();

    // FIXED: Use update_breadcrumb with path instead of breadcrumb_navigate to avoid infinite loop
    this.updateBreadcrumb('view');
  }

  ngAfterViewInit(): void {
    this.fieldMappingDataSource.sort = this.sort;
    this.fieldMappingDataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.eventSubs?.unsubscribe();
  }

  /**
   * Listens for closing signals from the Edit component or Breadcrumb returns.
   */
  private subscribeToEvents(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      const eventName = state?.items?.event;
      const payload = state?.items?.payload;

      // Listen for the Edit component's cancel/close event
      if (eventName === 'close_edit_mapping') {
        this.onCloseEdit();
      }

      // Handle return to this view via breadcrumb click
      if (eventName === 'breadcrumb_navigate' && payload?.target === 'VIEW_MODEL_MAPPING') {
        if (this.isExitedToLeft) {
          this.onCloseEdit();
        }
      }
    });
  }

  /**
   * Centralized breadcrumb management to avoid nav loops.
   */
  private updateBreadcrumb(mode: 'view' | 'edit'): void {
    const path = [
      { label: 'Normalization', target: 'ROOT' },
      { label: 'Mappings', target: 'TAB_MAPPINGS' },
      { label: 'View Model Mapping', target: 'VIEW_MODEL_MAPPING', active: mode === 'view' },
    ];

    if (mode === 'edit') {
      path.push({ label: 'Edit Mapping', target: 'EDIT_MODEL_MAPPING', active: true });
    }

    this.eventService.publish('nf', 'update_breadcrumb', {
      action: 'update_breadcrumb',
      path: path,
    });
  }

  /**
   * Custom Filter Predicate for MatTableDataSource.
   * This allows "Deep Search" across multiple columns and specific dropdown filters.
   */
  private setupFilterPredicate(): void {
    this.fieldMappingDataSource.filterPredicate = (data: FieldMapping, filter: string) => {
      const filters = JSON.parse(filter);

      // Check Dropdown Filters
      const matchesRequirement =
        filters.requirement === 'All' || data.requirement === filters.requirement;
      const matchesStatus = filters.status === 'All' || data.status === filters.status;
      const matchesMappingType =
        filters.mappingType === 'All' || data.mappingType === filters.mappingType;

      // Check Global Search Term (Deep search source, target, and notes)
      const searchStr = `${data.sourceField} ${data.targetField} ${data.notes}`.toLowerCase();
      const matchesSearch = _.includes(searchStr, filters.searchTerm.toLowerCase());

      return matchesRequirement && matchesStatus && matchesMappingType && matchesSearch;
    };
  }

  private loadFieldMappings(): void {
    const mappings: FieldMapping[] = [
      {
        sourceField: 'MRN',
        targetField: 'patient_id',
        type: 'String',
        requirement: 'Required',
        mappingType: 'Direct',
        notes: '',
        status: 'Mapped',
      },
      {
        sourceField: 'FIRST_NAME',
        targetField: 'first_name',
        type: 'String',
        requirement: 'Required',
        mappingType: 'Derived',
        notes: 'Uppercase conversion',
        status: 'Mapped',
      },
      {
        sourceField: 'LAST_NAME',
        targetField: 'last_name',
        type: 'String',
        requirement: 'Required',
        mappingType: 'Derived',
        notes: '',
        status: 'Mapped',
      },
      {
        sourceField: 'DOB',
        targetField: 'birth_date',
        type: 'Date',
        requirement: 'Required',
        mappingType: 'Constant',
        notes: 'Format: YYYY-MM-DD',
        status: 'Mapped',
      },
      {
        sourceField: 'GENDER',
        targetField: 'gender',
        type: 'String',
        requirement: 'Optional',
        mappingType: 'Derived',
        notes: '',
        status: 'Unmapped',
      },
    ];

    this.fieldMappingDataSource.data = mappings;
  }

  private loadVersions(): void {
    this.versions = [
      {
        version: 'v3',
        editor: 'Brianna Wilson',
        timestamp: '2 days ago',
        action: 'Edited',
      },
      {
        version: 'v2',
        editor: 'Dmitry Roitman',
        timestamp: '5 days ago',
        action: 'Edited',
      },
      {
        version: 'v1',
        editor: '',
        timestamp: 'Jan 15, 2024',
        action: 'Created',
      },
    ];
  }

  /**
   * Core filtering logic using lodash to construct the filter object.
   */
  applyFilter(): void {
    const filterState = {
      searchTerm: this.searchTerm,
      requirement: this.selectedRequirement,
      status: this.selectedStatus,
      mappingType: this.selectedMappingType,
    };

    // MatTableDataSource expects a string for the filter property
    this.fieldMappingDataSource.filter = JSON.stringify(filterState);

    if (this.fieldMappingDataSource.paginator) {
      this.fieldMappingDataSource.paginator.firstPage();
    }
  }

  setRequirementFilter(value: string): void {
    this.selectedRequirement = value;
    this.applyFilter();
  }

  setStatusFilter(value: string): void {
    this.selectedStatus = value;
    this.applyFilter();
  }

  setMappingTypeFilter(value: string): void {
    this.selectedMappingType = value;
    this.applyFilter();
  }

  togglePipelines(): void {
    this.pipelinesExpanded = !this.pipelinesExpanded;
  }

  toggleRules(): void {
    this.rulesExpanded = !this.rulesExpanded;
  }

  onBackToMappings(): void {
    // 1. Trigger the slide-out to right (Closing the whole view)
    this.isExiting = true;

    // 2. Notify the container level
    const container = document.querySelector('.normalization-main-container');
    if (container) {
      container.classList.remove('slide-out');
      container.classList.add('slide-in');
    }

    // 3. Log transaction
    this.eventService.publish('nf', 'breadcrumb_navigate', {
      action: 'breadcrumb_navigate',
      target: 'TAB_MAPPINGS',
    });

    // 4. Wait for animation to finish before destroying
    setTimeout(() => {
      this.closeView.emit();
    }, 600);
  }

  /**
   * Opening Edit: View slides out to LEFT, Edit slides in from RIGHT
   */
  onEdit(): void {
    this.isExitedToLeft = true;
    this.isReturningFromLeft = false;
    this.isEditing = true;

    this.eventService.publish('nf', 'open_edit_mapping', {
      action: 'open_edit_mapping',
      mappingId: this.mappingData?.id,
      fullData: this.mappingData,
    });

    // Update Breadcrumb to Edit Mode
    this.updateBreadcrumb('edit');
  }

  /**
   * Closing Edit - REVERSE ANIMATION
   * Edit slides out to RIGHT, View slides in from LEFT
   */
  onCloseEdit(): void {
    this.isExitedToLeft = false;
    this.isReturningFromLeft = true;

    // Restore View Breadcrumb when closing Edit
    this.updateBreadcrumb('view');

    setTimeout(() => {
      this.isEditing = false;
      this.isReturningFromLeft = false;
    }, 500);
  }

  onChangeStatus(): void {
    /**
     * Any status change must be logged into the graph of events.
     */
    console.log('Change status action triggered');
    this.eventService.publish('nf', 'execute_merge_query_with_context', {
      action: 'STATUS_CHANGE',
      command: 'STATUS_CHANGE',
      mappingId: this.mappingData?.id,
      timestamp: new Date().toISOString(),
    });
  }

  viewVersionHistory(): void {
    console.log('Navigate to full version history');
  }

  viewInVersions(): void {
    console.log('View in Versions');
  }

  viewInRules(): void {
    console.log('View in Rules');
  }

  viewTargetModel(): void {
    console.log('View Target Model');
  }
}
