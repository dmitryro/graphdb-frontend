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
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

// NgRx & Events
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

import * as _ from 'lodash';

interface ModelField {
  fieldName: string;
  type: string;
  requirement: string;
}

interface RelatedModel {
  modelName: string;
  relationshipContext: string;
  references: number;
}

interface UpstreamDependency {
  sourceName: string;
  type: string;
  status: string;
  lastUpdated: string;
}

interface DownstreamDependency {
  dependentName: string;
  type: string;
  status: string;
  environment: string;
}

@Component({
  selector: 'app-view-model',
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
    MatTabsModule,
    MatChipsModule,
  ],
  templateUrl: './view-model.component.html',
  styleUrls: ['./view-model.component.scss'],
})
export class ViewModelComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() modelData: any;
  @Output() closeView = new EventEmitter<void>();

  // --- Animation handling ---
  isExiting = false;
  isEditing = false;

  @HostBinding('class.slide-out-to-left') isExitedToLeft = false;
  @HostBinding('class.slide-in-from-left') isReturningFromLeft = false;

  @HostBinding('class.slide-out-to-right') get exitClass() {
    return this.isExiting;
  }

  @HostBinding('style.pointer-events') get pointerEvents() {
    return this.isExitedToLeft ? 'none' : 'auto';
  }

  // Fields Table
  fieldsDataSource = new MatTableDataSource<ModelField>([]);
  fieldsColumns = ['fieldName', 'type', 'requirement'];

  @ViewChild('fieldsSort') fieldsSort!: MatSort;
  @ViewChild('fieldsPaginator') fieldsPaginator!: MatPaginator;

  // Dependencies Tables
  relatedModelsDataSource = new MatTableDataSource<RelatedModel>([]);
  relatedModelsColumns = ['modelName', 'relationshipContext', 'references'];

  upstreamDataSource = new MatTableDataSource<UpstreamDependency>([]);
  upstreamColumns = ['sourceName', 'type', 'status', 'lastUpdated'];

  downstreamDataSource = new MatTableDataSource<DownstreamDependency>([]);
  downstreamColumns = ['dependentName', 'type', 'status', 'environment'];

  @ViewChild('relatedSort') relatedSort!: MatSort;
  @ViewChild('relatedPaginator') relatedPaginator!: MatPaginator;
  @ViewChild('upstreamSort') upstreamSort!: MatSort;
  @ViewChild('upstreamPaginator') upstreamPaginator!: MatPaginator;
  @ViewChild('downstreamSort') downstreamSort!: MatSort;
  @ViewChild('downstreamPaginator') downstreamPaginator!: MatPaginator;

  // Search
  fieldsSearchTerm = '';

  // Aliases
  aliases: string[] = [];

  // Usage & Impact
  mappingsCount = 14;
  rulesCount = 5;
  usedInPipelines = 2;
  exposedViaAPI = true;
  usedInGraph = true;

  // Event subscription
  private eventSubs?: Subscription;

  constructor(
    protected eventService: EventService,
    protected eventStore: Store<{ nf: EventState }>,
  ) {}

  ngOnInit(): void {
    this.setupFieldsFilterPredicate();
    this.loadFields();
    this.loadDependencies();
    this.loadAliases();
    this.subscribeToEvents();
  }

  ngAfterViewInit(): void {
    this.fieldsDataSource.sort = this.fieldsSort;
    this.fieldsDataSource.paginator = this.fieldsPaginator;

    this.relatedModelsDataSource.sort = this.relatedSort;
    this.relatedModelsDataSource.paginator = this.relatedPaginator;

    this.upstreamDataSource.sort = this.upstreamSort;
    this.upstreamDataSource.paginator = this.upstreamPaginator;

    this.downstreamDataSource.sort = this.downstreamSort;
    this.downstreamDataSource.paginator = this.downstreamPaginator;
  }

  ngOnDestroy(): void {
    this.eventSubs?.unsubscribe();
  }

  /**
   * UPDATED: Subscribe to relevant events for animation and breadcrumb handling
   */
  private subscribeToEvents(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      const eventName = state?.items?.event;
      const payload = state?.items?.payload;

      // Listen for the Edit component's cancel/close event
      if (eventName === 'close_edit_model') {
        this.onCloseEdit();
      }

      // NEW: Handle breadcrumb clicks while in Edit Mode
      // If we are currently editing and the user clicks the "View Model" breadcrumb
      if (
        this.isEditing &&
        eventName === 'breadcrumb_navigate' &&
        payload?.target === 'VIEW_MODEL'
      ) {
        this.onCloseEdit();
      }
    });
  }

  private setupFieldsFilterPredicate(): void {
    this.fieldsDataSource.filterPredicate = (data: ModelField, filter: string) => {
      const searchStr = `${data.fieldName} ${data.type}`.toLowerCase();
      return _.includes(searchStr, filter.toLowerCase());
    };
  }

  private loadFields(): void {
    const fields: ModelField[] = [
      {
        fieldName: 'patient_id',
        type: 'String',
        requirement: 'Required',
      },
      {
        fieldName: 'first_name',
        type: 'String',
        requirement: 'Required',
      },
      {
        fieldName: 'last_name',
        type: 'String',
        requirement: 'Required',
      },
      {
        fieldName: 'birth_date',
        type: 'Date',
        requirement: 'Required',
      },
      {
        fieldName: 'gender',
        type: 'String',
        requirement: 'Optional',
      },
      {
        fieldName: 'email',
        type: 'String',
        requirement: 'Optional',
      },
      {
        fieldName: 'phone',
        type: 'String',
        requirement: 'Optional',
      },
      {
        fieldName: 'address',
        type: 'String',
        requirement: 'Optional',
      },
    ];

    this.fieldsDataSource.data = fields;
  }

  private loadDependencies(): void {
    // Related Models
    const relatedModels: RelatedModel[] = [
      {
        modelName: 'Encounter',
        relationshipContext: 'Mappings, Rules',
        references: 12,
      },
      {
        modelName: 'Lab Result',
        relationshipContext: 'Graph, Rules',
        references: 7,
      },
      {
        modelName: 'Medication',
        relationshipContext: 'Mappings',
        references: 4,
      },
    ];
    this.relatedModelsDataSource.data = relatedModels;

    // Upstream
    const upstream: UpstreamDependency[] = [
      {
        sourceName: 'Patient_Raw',
        type: 'Dataset',
        status: 'Active',
        lastUpdated: 'Jan 10, 2026',
      },
      {
        sourceName: 'Demographics_v2',
        type: 'Source Schema',
        status: 'Active',
        lastUpdated: 'Dec 18, 2025',
      },
      {
        sourceName: 'EHR_Import_Profile',
        type: 'External Model',
        status: 'Draft',
        lastUpdated: 'Nov 02, 2025',
      },
      {
        sourceName: 'Legacy_Patient_v1',
        type: 'Source Schema',
        status: 'Deprecated',
        lastUpdated: 'Aug 14, 2025',
      },
    ];
    this.upstreamDataSource.data = upstream;

    // Downstream
    const downstream: DownstreamDependency[] = [
      {
        dependentName: 'Patient_Ingest',
        type: 'Pipeline',
        status: 'Active',
        environment: 'Production',
      },
      {
        dependentName: 'Normalize_Demo',
        type: 'Mapping',
        status: 'Active',
        environment: 'Production',
      },
      {
        dependentName: 'Required_ID_Check',
        type: 'Rule',
        status: 'Inactive',
        environment: 'Stage',
      },
      {
        dependentName: 'Patient_Analytics',
        type: 'Pipeline',
        status: 'Draft',
        environment: 'Dev',
      },
      {
        dependentName: 'Legacy_Map_v1',
        type: 'Mapping',
        status: 'Deprecated',
        environment: '-',
      },
    ];
    this.downstreamDataSource.data = downstream;
  }

  private loadAliases(): void {
    this.aliases = [
      'PT',
      'PatientRecord',
      'PATIENT_MASTER_TABLE_USED_IN_UPSTREAM_OR_DOWNSTREAM_SYSTEMS',
    ];
  }

  applyFieldsFilter(): void {
    this.fieldsDataSource.filter = this.fieldsSearchTerm.trim();

    if (this.fieldsDataSource.paginator) {
      this.fieldsDataSource.paginator.firstPage();
    }
  }

  onBackToModels(): void {
    // 1. Trigger the slide-out to right (Closing the whole view)
    this.isExiting = true;

    // 2. Notify the container level
    const container = document.querySelector('.normalization-main-container');
    if (container) {
      container.classList.remove('slide-out');
      container.classList.add('slide-in');
    }

    // 3. Log transaction
    this.eventService.publish('nf', 'breadcrumb_navigate', { target: 'TAB_MODELS' });

    // 4. Wait for animation to finish before destroying
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
    this.eventService.publish('nf', 'open_edit_model', {
      action: 'open_edit_model',
      modelId: this.modelData?.id,
      fullData: this.modelData,
    });

    // Note: Breadcrumb update is handled by EditModelComponent
  }

  /**
   * UPDATED: Closing Edit - REVERSE ANIMATION
   * Edit slides out to RIGHT, View slides in from LEFT
   */
  onCloseEdit(): void {
    // 1. Re-enable pointer events immediately so View becomes interactive
    this.isExitedToLeft = false;

    // 2. Trigger slide-in animation from left
    this.isReturningFromLeft = true;

    // 3. Clean up the Edit component AFTER its slide-out animation finishes
    setTimeout(() => {
      this.isEditing = false;
      this.isReturningFromLeft = false;
    }, 500); // Match Edit component's animation duration
  }

  onChangeStatus(): void {
    console.log('Change status action triggered');
    this.eventService.publish('nf', 'execute_merge_query_with_context', {
      action: 'STATUS_CHANGE',
      modelId: this.modelData?.id,
      timestamp: new Date().toISOString(),
    });
  }

  viewMappings(): void {
    console.log('Navigate to Mappings filtered by this model');
    this.eventService.publish('nf', 'navigate_to_filtered_view', {
      target: 'MAPPINGS',
      filter: { modelId: this.modelData?.id },
    });
  }

  viewRules(): void {
    console.log('Navigate to Rules filtered by this model');
    this.eventService.publish('nf', 'navigate_to_filtered_view', {
      target: 'RULES',
      filter: { modelId: this.modelData?.id },
    });
  }

  viewPipelines(): void {
    console.log('Navigate to Pipelines filtered by this model');
  }

  viewRelatedModel(modelName: string): void {
    console.log('Navigate to related model:', modelName);
  }

  viewUpstreamSource(sourceName: string): void {
    console.log('Navigate to upstream source:', sourceName);
  }

  viewDownstreamDependency(dependentName: string): void {
    console.log('Navigate to downstream dependency:', dependentName);
  }
}
