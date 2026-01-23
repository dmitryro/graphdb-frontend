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
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

// Define constraint and data type options
export const DATA_TYPE_OPTIONS = ['String', 'Number', 'Boolean', 'Date', 'Object', 'Array', 'Enum'];
export const CONSTRAINT_OPTIONS = [
  'None',
  'Max Length',
  'Min Length',
  'Pattern',
  'Allowed Values',
  'Range',
];
export const IMPACT_SCOPE_OPTIONS = ['Structural', 'Behavioral', 'Informational'];

interface PendingChange {
  id: string;
  rowId: string; // Required for alignment with mapping component logic
  field: string;
  type: string;
  description: string;
  originalValue?: any;
  newValue?: any;
}

interface ModelField {
  id: string;
  fieldName: string;
  dataType: string;
  required: string;
  references: number;
  constraints: string;
  constraintDetails: string;
  status: string;
  [key: string]: any;
}

interface RelatedModel {
  id: string;
  modelName: string;
  relationshipContext: string;
  impactScope: string;
  references: number;
  [key: string]: any;
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
  selector: 'app-edit-model',
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
    MatChipsModule,
    MatTabsModule,
  ],
  templateUrl: './edit-model.component.html',
  styleUrls: ['./edit-model.component.scss'],
})
export class EditModelComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() modelData: any;
  @Output() closeEdit = new EventEmitter<void>();

  @ViewChild('fieldsPaginator') fieldsPaginator!: MatPaginator;
  @ViewChild('fieldsSort') fieldsSort!: MatSort;
  @ViewChild('relatedPaginator') relatedPaginator!: MatPaginator;
  @ViewChild('relatedSort') relatedSort!: MatSort;

  // Animation control
  isExiting = false;

  @HostBinding('class.slide-out-to-right')
  get exitClass() {
    return this.isExiting;
  }

  private eventSubs?: Subscription;
  private originalFieldsBackup: ModelField[] = [];
  private originalRelatedBackup: RelatedModel[] = [];
  private originalAliasesBackup: string[] = [];

  // Fields Table
  fieldsDataSource = new MatTableDataSource<ModelField>([]);
  fieldsColumns = [
    'fieldName',
    'dataType',
    'required',
    'references',
    'constraints',
    'constraintDetails',
    'actions',
  ];

  // Related Models Table
  relatedModelsDataSource = new MatTableDataSource<RelatedModel>([]);
  relatedModelsColumns = ['modelName', 'relationshipContext', 'impactScope', 'references'];

  // Upstream/Downstream (read-only in MVP)
  upstreamDataSource = new MatTableDataSource<UpstreamDependency>([]);
  upstreamColumns = ['sourceName', 'type', 'status', 'lastUpdated'];

  downstreamDataSource = new MatTableDataSource<DownstreamDependency>([]);
  downstreamColumns = ['dependentName', 'type', 'status', 'environment'];

  // Search
  fieldsSearchTerm = '';

  // Aliases
  aliases: string[] = [];
  newAlias = '';

  // Options
  dataTypeOptions = DATA_TYPE_OPTIONS;
  constraintOptions = CONSTRAINT_OPTIONS;
  impactScopeOptions = IMPACT_SCOPE_OPTIONS;
  requiredOptions = ['Required', 'Optional'];

  // Pending Changes
  pendingChanges: PendingChange[] = [];

  constructor(
    private eventStore: Store<{ nf: EventState }>,
    private eventService: EventService,
  ) {}

  ngOnInit(): void {
    this.setupFilterLogic();

    if (this.modelData) {
      this.loadModelData(this.modelData);
    }

    this.subscribeToEditEvents();
  }

  ngAfterViewInit() {
    this.fieldsDataSource.paginator = this.fieldsPaginator;
    this.fieldsDataSource.sort = this.fieldsSort;

    this.relatedModelsDataSource.paginator = this.relatedPaginator;
    this.relatedModelsDataSource.sort = this.relatedSort;
  }

  ngOnDestroy(): void {
    this.eventSubs?.unsubscribe();
  }

  private subscribeToEditEvents(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      const eventName = state?.items?.event;

      // NEW: Listen for the breadcrumb navigation request
      // This matches the EditMappingComponent pattern exactly
      if (eventName === 'breadcrumb_navigate' && state?.items?.payload?.target === 'VIEW_MODEL') {
        this.onCancel(); // Reuse the exact cancel logic (animation + events)
      }

      if (eventName === 'open_edit_model') {
        this.initializeWithData(state?.items?.fullData);
        this.updateBreadcrumb();
      }
    });
  }

  /**
   * Updates the breadcrumb to show the Edit Model path
   */
  private updateBreadcrumb(): void {
    const breadcrumbPath = [
      { label: 'Normalization', target: 'ROOT' },
      { label: 'Models', target: 'TAB_MODELS' },
      { label: 'View Model', target: 'VIEW_MODEL' },
      { label: 'Edit Model', active: true },
    ];
    this.eventService.publish('nf', 'update_breadcrumb', { path: breadcrumbPath });
  }

  private initializeWithData(data: any): void {
    if (!data) return;
    this.modelData = data;
    this.loadModelData(data);
  }

  private loadModelData(data?: any): void {
    // Load Fields
    let fields: ModelField[] = [];
    if (data && data.fields && Array.isArray(data.fields)) {
      fields = _.cloneDeep(data.fields);
    } else {
      fields = [
        {
          id: '1',
          fieldName: 'patient_id',
          dataType: 'String',
          required: 'Required',
          references: 12,
          constraints: 'None',
          constraintDetails: '',
          status: 'Unchanged',
        },
        {
          id: '2',
          fieldName: 'first_name',
          dataType: 'String',
          required: 'Required',
          references: 8,
          constraints: 'Max Length',
          constraintDetails: '255',
          status: 'Unchanged',
        },
        {
          id: '3',
          fieldName: 'last_name',
          dataType: 'String',
          required: 'Required',
          references: 8,
          constraints: 'Range',
          constraintDetails: 'min: 1, max: 200',
          status: 'Unchanged',
        },
        {
          id: '4',
          fieldName: 'date_of_birth',
          dataType: 'Date',
          required: 'Required',
          references: 4,
          constraints: 'Pattern',
          constraintDetails: 'YYYY-MM-DD',
          status: 'Unchanged',
        },
      ];
    }

    this.originalFieldsBackup = _.cloneDeep(fields);
    this.fieldsDataSource.data = fields;

    // Load Related Models
    let relatedModels: RelatedModel[] = [];
    if (data && data.relatedModels && Array.isArray(data.relatedModels)) {
      relatedModels = _.cloneDeep(data.relatedModels);
    } else {
      relatedModels = [
        {
          id: '1',
          modelName: 'Encounter',
          relationshipContext: 'Mappings, Rules',
          impactScope: 'Structural',
          references: 12,
        },
        {
          id: '2',
          modelName: 'Lab Result',
          relationshipContext: 'Graph, Rules',
          impactScope: 'Behavioral',
          references: 7,
        },
        {
          id: '3',
          modelName: 'Medication',
          relationshipContext: 'Mappings',
          impactScope: 'Informational',
          references: 4,
        },
      ];
    }

    this.originalRelatedBackup = _.cloneDeep(relatedModels);
    this.relatedModelsDataSource.data = relatedModels;

    // Load Aliases
    if (data && data.aliases && Array.isArray(data.aliases)) {
      this.aliases = _.cloneDeep(data.aliases);
    } else {
      this.aliases = ['PT', 'PatientRecord'];
    }
    this.originalAliasesBackup = _.cloneDeep(this.aliases);

    this.loadDependencies();
    this.applyFieldsSearch();
  }

  private loadDependencies(): void {
    const upstream: UpstreamDependency[] = [
      { sourceName: 'Patient_Raw', type: 'Dataset', status: 'Active', lastUpdated: 'Jan 10, 2026' },
      {
        sourceName: 'Demographics_v2',
        type: 'Source Schema',
        status: 'Active',
        lastUpdated: 'Dec 18, 2025',
      },
    ];
    this.upstreamDataSource.data = upstream;

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
    ];
    this.downstreamDataSource.data = downstream;
  }

  private setupFilterLogic(): void {
    this.fieldsDataSource.filterPredicate = (data: ModelField): boolean => {
      const search = _.toLower(_.trim(this.fieldsSearchTerm));
      const searchableContent = _.toLower([data.fieldName, data.dataType, data.required].join(' '));
      return !search || searchableContent.includes(search);
    };
  }

  applyFieldsSearch(): void {
    this.fieldsDataSource.filter = this.fieldsSearchTerm.trim();
    if (this.fieldsDataSource.paginator) {
      this.fieldsDataSource.paginator.firstPage();
    }
  }

  isFieldModified(row: ModelField | RelatedModel, fieldName: string): boolean {
    if ('fieldName' in row) {
      const original = this.originalFieldsBackup.find(o => o.id === row.id);
      if (!original) return false;
      return row[fieldName] !== original[fieldName];
    } else {
      const original = this.originalRelatedBackup.find(o => o.id === row.id);
      if (!original) return false;
      return row[fieldName] !== original[fieldName];
    }
  }

  onFieldValueChange(row: ModelField): void {
    const original = this.originalFieldsBackup.find(o => o.id === row.id);
    if (!original) return;

    this.pendingChanges = this.pendingChanges.filter(c => c.rowId !== row.id);

    const fieldsToTrack = ['fieldName', 'dataType', 'required', 'constraints', 'constraintDetails'];
    let rowHasAnyChange = false;

    fieldsToTrack.forEach(field => {
      if (row[field] !== original[field]) {
        rowHasAnyChange = true;

        const labels: Record<string, string> = {
          fieldName: 'Field Name',
          dataType: 'Data Type',
          required: 'Requirement',
          constraints: 'Constraint',
          constraintDetails: 'Constraint Details',
        };

        this.pendingChanges.push({
          id: `${row.id}-${field}`,
          rowId: row.id,
          field: row.fieldName,
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
  }

  onRelatedModelChange(row: RelatedModel): void {
    const original = this.originalRelatedBackup.find(o => o.id === row.id);
    if (!original) return;

    this.pendingChanges = this.pendingChanges.filter(c => c.rowId !== row.id);

    if (row.impactScope !== original.impactScope) {
      this.pendingChanges.push({
        id: `${row.id}-impactScope`,
        rowId: row.id,
        field: row.modelName,
        type: 'Impact Scope',
        description: `Changed Impact Scope`,
        originalValue: original.impactScope,
        newValue: row.impactScope,
      });
    }
  }

  onConstraintChange(row: ModelField): void {
    if (row.constraints === 'None') {
      row.constraintDetails = '';
    }
    this.onFieldValueChange(row);
  }

  addAlias(): void {
    if (this.newAlias && this.newAlias.trim() && !this.aliases.includes(this.newAlias.trim())) {
      this.aliases.push(this.newAlias.trim());

      this.pendingChanges.push({
        id: `alias-add-${Date.now()}`,
        rowId: 'alias-group',
        field: 'Aliases',
        type: 'Alias Added',
        description: `Added alias: ${this.newAlias.trim()}`,
        newValue: this.newAlias.trim(),
      });

      this.newAlias = '';
    }
  }

  removeAlias(alias: string): void {
    const index = this.aliases.indexOf(alias);
    if (index > -1) {
      this.aliases.splice(index, 1);

      this.pendingChanges.push({
        id: `alias-remove-${Date.now()}`,
        rowId: 'alias-group',
        field: 'Aliases',
        type: 'Alias Removed',
        description: `Removed alias: ${alias}`,
        originalValue: alias,
      });
    }
  }

  addNewField(): void {
    const newId = `new-${Date.now()}`;
    const newField: ModelField = {
      id: newId,
      fieldName: '',
      dataType: 'String',
      required: 'Optional',
      references: 0,
      constraints: 'None',
      constraintDetails: '',
      status: 'New',
    };

    this.fieldsDataSource.data = [...this.fieldsDataSource.data, newField];

    this.pendingChanges.push({
      id: `${newId}-add`,
      rowId: newId,
      field: '(New Field)',
      type: 'Field Added',
      description: 'New field added',
      newValue: 'New',
    });
  }

  deleteField(row: ModelField): void {
    this.fieldsDataSource.data = this.fieldsDataSource.data.filter(f => f.id !== row.id);
    this.pendingChanges = this.pendingChanges.filter(c => c.rowId !== row.id);

    this.pendingChanges.push({
      id: `${row.id}-delete`,
      rowId: row.id,
      field: row.fieldName,
      type: 'Field Deleted',
      description: `Deleted field: ${row.fieldName}`,
      originalValue: row.fieldName,
    });
  }

  resetField(row: ModelField): void {
    const original = this.originalFieldsBackup.find(o => o.id === row.id);
    if (original) {
      Object.assign(row, _.cloneDeep(original));
      this.pendingChanges = this.pendingChanges.filter(c => c.rowId !== row.id);
      this.fieldsDataSource.data = [...this.fieldsDataSource.data];
    }
  }

  resetAllChanges(): void {
    this.pendingChanges = [];
    this.loadModelData(this.modelData);
  }

  onSidebarUpdate(change: PendingChange): void {
    if (change.type === 'Impact Scope') {
      const targetRow = this.relatedModelsDataSource.data.find(row => row.id === change.rowId);
      if (targetRow) {
        targetRow.impactScope = change.newValue;
        this.onRelatedModelChange(targetRow);
        this.relatedModelsDataSource.data = [...this.relatedModelsDataSource.data];
      }
    } else {
      const targetRow = this.fieldsDataSource.data.find(row => row.id === change.rowId);
      if (targetRow) {
        const propertyMap: Record<string, string> = {
          'Field Name': 'fieldName',
          'Data Type': 'dataType',
          Requirement: 'required',
          Constraint: 'constraints',
          'Constraint Details': 'constraintDetails',
        };

        const propName = propertyMap[change.type];
        if (propName) {
          targetRow[propName] = change.newValue;
          this.onFieldValueChange(targetRow);
          this.fieldsDataSource.data = [...this.fieldsDataSource.data];
        }
      }
    }
  }

  onCancel(): void {
    this.isExiting = true;

    const breadcrumbPath = [
      { label: 'Normalization', target: 'ROOT' },
      { label: 'Models', target: 'TAB_MODELS' },
      { label: 'View Model', active: true },
    ];
    this.eventService.publish('nf', 'update_breadcrumb', { path: breadcrumbPath });

    this.eventService.publish('nf', 'close_edit_model', {
      action: 'close_edit_model',
    });

    setTimeout(() => {
      this.closeEdit.emit();
    }, 500);
  }

  onSave(): void {
    const transactionContext = {
      modelName: this.modelData?.name || 'Patient',
      modelId: this.modelData?.id,
      timestamp: new Date().toISOString(),
      action: 'EDIT_MODEL_SAVE',
      changesCount: this.pendingChanges.length,
      changes: this.pendingChanges,
    };

    console.log('Saving model with context:', transactionContext);
    this.onCancel();
  }
}
