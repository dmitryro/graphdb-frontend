import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
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
  id: string;
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
export class ViewModelComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() modelData: any;
  @Output() closeView = new EventEmitter<void>();

  // Use a ViewChild to target the scrollable container in the HTML
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  // --- Animation handling ---
  isExiting = false;
  isEditing = false;
  isRefreshing = false;

  // Host Bindings for Animation and State
  @HostBinding('class.slide-out-to-left') isExitedToLeft = false;
  @HostBinding('class.slide-in-from-left') isReturningFromLeft = false;

  @HostBinding('class.refreshing-data') get refreshClass() {
    return this.isRefreshing;
  }

  @HostBinding('class.slide-out-to-right') get exitClass() {
    return this.isExiting;
  }

  @HostBinding('style.pointer-events') get pointerEvents() {
    // Prevent interactions while the view is slid out to the left (editing mode)
    return this.isExitedToLeft || this.isEditing ? 'none' : 'auto';
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
    this.refreshAllData();
    this.subscribeToEvents();
  }

  ngAfterViewInit(): void {
    this.assignDataSources();
  }

  /**
   * Detects when the Input modelData changes to trigger scroll and refresh animations
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['modelData'] && !changes['modelData'].firstChange) {
      this.triggerModelSwapTransition();
    }
  }

  ngOnDestroy(): void {
    this.eventSubs?.unsubscribe();
  }

  /**
   * Internal logic to handle the visual transition between two different models
   */
  private triggerModelSwapTransition(): void {
    this.isRefreshing = true;
    this.refreshAllData();

    // Use a small timeout to ensure data binding is complete before scrolling
    setTimeout(() => {
      this.scrollToTop();
    }, 10);

    setTimeout(() => {
      this.isRefreshing = false;
    }, 400);
  }

  /**
   * Scrolls the designated container or window to the top smoothly
   */
  private scrollToTop(): void {
    if (this.scrollContainer && this.scrollContainer.nativeElement) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
      // Fallback: Force instant scroll if smooth scroll is blocked or delayed
      el.scrollTop = 0;
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
      document.documentElement.scrollTop = 0;
    }
  }

  private refreshAllData(): void {
    this.loadFields();
    this.loadDependencies();
    this.loadAliases();
  }

  private assignDataSources(): void {
    this.fieldsDataSource.sort = this.fieldsSort;
    this.fieldsDataSource.paginator = this.fieldsPaginator;

    this.relatedModelsDataSource.sort = this.relatedSort;
    this.relatedModelsDataSource.paginator = this.relatedPaginator;

    this.upstreamDataSource.sort = this.upstreamSort;
    this.upstreamDataSource.paginator = this.upstreamPaginator;

    this.downstreamDataSource.sort = this.downstreamSort;
    this.downstreamDataSource.paginator = this.downstreamPaginator;
  }

  private subscribeToEvents(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      const eventName = state?.items?.event;
      const payload = state?.items?.payload;

      if (eventName === 'close_edit_model') {
        this.onCloseEdit();
      }

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
      const searchString = `${data.fieldName} ${data.type}`.toLowerCase();
      return _.includes(searchString, filter.toLowerCase());
    };
  }

  private loadFields(): void {
    // FIX: Check if modelData contains real fields from normalization.component
    if (this.modelData && this.modelData.fields && this.modelData.fields.length > 0) {
      this.fieldsDataSource.data = this.modelData.fields;
    } else {
      // Fallback only if no data is provided via Input
      const fields: ModelField[] = [
        { fieldName: 'patient_id', type: 'String', requirement: 'Required' },
        { fieldName: 'first_name', type: 'String', requirement: 'Required' },
        { fieldName: 'last_name', type: 'String', requirement: 'Required' },
        { fieldName: 'birth_date', type: 'Date', requirement: 'Required' },
        { fieldName: 'gender', type: 'String', requirement: 'Optional' },
        { fieldName: 'email', type: 'String', requirement: 'Optional' },
        { fieldName: 'phone', type: 'String', requirement: 'Optional' },
        { fieldName: 'address', type: 'String', requirement: 'Optional' },
      ];
      this.fieldsDataSource.data = fields;
    }
  }

  private loadDependencies(): void {
    if (this.modelData && this.modelData.dependencyData) {
      const dependencies = this.modelData.dependencyData;
      this.relatedModelsDataSource.data = dependencies.relatedModels || [];
      this.upstreamDataSource.data = dependencies.upstream || [];
      this.downstreamDataSource.data = dependencies.downstream || [];
    } else {
      this.relatedModelsDataSource.data = [];
      this.upstreamDataSource.data = [];
      this.downstreamDataSource.data = [];
    }
  }

  private loadAliases(): void {
    if (this.modelData && this.modelData.aliases) {
      this.aliases = this.modelData.aliases;
    } else {
      this.aliases = [
        'PT',
        'PatientRecord',
        'PATIENT_MASTER_TABLE_USED_IN_UPSTREAM_OR_DOWNSTREAM_SYSTEMS',
      ];
    }
  }

  applyFieldsFilter(): void {
    this.fieldsDataSource.filter = this.fieldsSearchTerm.trim();
    if (this.fieldsDataSource.paginator) {
      this.fieldsDataSource.paginator.firstPage();
    }
  }

  onBackToModels(): void {
    this.isExiting = true;
    const container = document.querySelector('.normalization-main-container');
    if (container) {
      container.classList.remove('slide-out');
      container.classList.add('slide-in');
    }

    this.eventService.publish('nf', 'breadcrumb_navigate', { target: 'TAB_MODELS' });

    setTimeout(() => {
      this.closeView.emit();
    }, 600);
  }

  onEdit(): void {
    // Set state immediately to trigger CSS animations
    this.isEditing = true;
    this.isExitedToLeft = true;
    this.isReturningFromLeft = false;

    this.eventService.publish('nf', 'open_edit_model', {
      action: 'open_edit_model',
      modelId: this.modelData?.id,
      fullData: this.modelData,
    });
  }

  onCloseEdit(): void {
    // Trigger return animation
    this.isExitedToLeft = false;
    this.isReturningFromLeft = true;

    // Wait for animation to finish before resetting the logical editing state
    setTimeout(() => {
      this.isEditing = false;
      this.isReturningFromLeft = false;
    }, 500);
  }

  /**
   * FIX: Updated to accept the new status and update the modelData object locally
   */
  onChangeStatus(newStatus: string): void {
    if (this.modelData) {
      this.modelData.status = newStatus;
    }

    this.eventService.publish('nf', 'execute_merge_query_with_context', {
      action: 'STATUS_CHANGE',
      modelId: this.modelData?.id,
      newStatus: newStatus,
      timestamp: new Date().toISOString(),
    });
  }

  viewMappings(): void {
    this.eventService.publish('nf', 'navigate_to_filtered_view', {
      target: 'MAPPINGS',
      filter: { modelId: this.modelData?.id },
    });
  }

  viewRules(): void {
    this.eventService.publish('nf', 'navigate_to_filtered_view', {
      target: 'RULES',
      filter: { modelId: this.modelData?.id },
    });
  }

  viewPipelines(): void {
    console.log('Navigate to Pipelines');
  }

  viewUpstreamSource(sourceName: string): void {
    console.log('Navigate to upstream source:', sourceName);
  }

  viewDownstreamDependency(dependentName: string): void {
    console.log('Navigate to downstream dependency:', dependentName);
  }

  viewRelatedModel(model: any): void {
    if (!model || !model.modelName) return;

    this.eventService.publish('nf', 'view_related_model', {
      modelName: model.modelName,
      modelId: model.id,
      action: 'view_related_model',
    });
  }
}
