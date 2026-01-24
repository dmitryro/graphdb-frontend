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
  rowId: string;
  field: string;
  type: string;
  description: string;
  originalValue?: any;
  newValue?: any;
}

interface ModelField {
  id?: string;
  fieldName: string;
  type: string;
  requirement: string;
  references?: number;
  constraints?: string;
  constraintDetails?: string;
  status?: string;
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

  isExiting = false;

  @HostBinding('class.slide-out-to-right')
  get exitClass() {
    return this.isExiting;
  }

  private eventSubs?: Subscription;
  private originalFieldsBackup: ModelField[] = [];
  private originalRelatedBackup: RelatedModel[] = [];
  private originalAliasesBackup: string[] = [];

  // Important: These strings MUST match the matColumnDef="fieldName" in your HTML
  fieldsDataSource = new MatTableDataSource<ModelField>([]);
  fieldsColumns = [
    'fieldName',
    'type',
    'requirement',
    'references',
    'constraints',
    'constraintDetails',
    'actions',
  ];

  relatedModelsDataSource = new MatTableDataSource<RelatedModel>([]);
  relatedModelsColumns = ['modelName', 'relationshipContext', 'impactScope', 'references'];

  upstreamDataSource = new MatTableDataSource<UpstreamDependency>([]);
  upstreamColumns = ['sourceName', 'type', 'status', 'lastUpdated'];

  downstreamDataSource = new MatTableDataSource<DownstreamDependency>([]);
  downstreamColumns = ['dependentName', 'type', 'status', 'environment'];

  fieldsSearchTerm = '';
  aliases: string[] = [];
  newAlias = '';

  dataTypeOptions = DATA_TYPE_OPTIONS;
  constraintOptions = CONSTRAINT_OPTIONS;
  impactScopeOptions = IMPACT_SCOPE_OPTIONS;
  requiredOptions = ['Required', 'Optional'];

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
      const payload = state?.items?.payload;

      if (eventName === 'breadcrumb_navigate' && payload?.target === 'VIEW_MODEL') {
        this.onCancel();
      }

      if (eventName === 'open_edit_model') {
        const fullData = payload?.fullData || payload;
        this.initializeWithData(fullData);
        this.updateBreadcrumb();
      }

      // --- NEW: Listen for confirmation response ---
      if (eventName === 'confirmation_save_confirmed') {
        this.finalizeSave();
      }

      if (eventName === 'confirmation_delete_confirmed') {
        this.executeActualDelete();
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

  private loadModelData(data: any): void {
    if (!data) return;

    // Load Fields - prioritizing Input from Parent
    this.loadFields();
    // Load Dependencies - prioritizing Input from Parent
    this.loadDependencies();
    // Load Aliases - prioritizing Input from Parent
    this.loadAliases();

    this.applyFieldsSearch();
  }

  private loadFields(): void {
    // Correctly handle the transition from numeric count to field array
    if (this.modelData && Array.isArray(this.modelData.fields)) {
      const fields = _.cloneDeep(this.modelData.fields);
      this.originalFieldsBackup = _.cloneDeep(fields);
      this.fieldsDataSource.data = fields;
    } else {
      // If parent still sends a number or null, reset to empty to avoid MatTable errors
      this.fieldsDataSource.data = [];
      this.originalFieldsBackup = [];
    }
  }

  private loadDependencies(): void {
    if (this.modelData && this.modelData.dependencyData) {
      const dependencies = this.modelData.dependencyData;

      const related = (dependencies.relatedModels || []).map((rm: any) => ({
        ...rm,
        impactScope: rm.impactScope || 'Structural',
      }));

      this.originalRelatedBackup = _.cloneDeep(related);
      this.relatedModelsDataSource.data = related;

      this.upstreamDataSource.data = dependencies.upstream || [];
      this.downstreamDataSource.data = dependencies.downstream || [];
    } else {
      this.relatedModelsDataSource.data = [];
      this.upstreamDataSource.data = [];
      this.downstreamDataSource.data = [];
    }
  }

  private loadAliases(): void {
    if (this.modelData && Array.isArray(this.modelData.aliases)) {
      this.aliases = _.cloneDeep(this.modelData.aliases);
    } else {
      this.aliases = [];
    }
    this.originalAliasesBackup = _.cloneDeep(this.aliases);
  }

  private setupFilterLogic(): void {
    this.fieldsDataSource.filterPredicate = (data: ModelField): boolean => {
      const search = _.toLower(_.trim(this.fieldsSearchTerm));
      const searchableContent = _.toLower([data.fieldName, data.type, data.requirement].join(' '));
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
      const original = this.originalFieldsBackup.find(o => o.fieldName === row.fieldName);
      if (!original) return false;
      return row[fieldName] !== original[fieldName];
    } else {
      const original = this.originalRelatedBackup.find(o => o.id === row.id);
      if (!original) return false;
      return row[fieldName] !== original[fieldName];
    }
  }

  onFieldValueChange(row: ModelField): void {
    const original = this.originalFieldsBackup.find(o => o.fieldName === row.fieldName);
    if (!original) return;

    this.pendingChanges = this.pendingChanges.filter(c => c.field !== row.fieldName);

    const fieldsToTrack = ['fieldName', 'type', 'requirement', 'constraints', 'constraintDetails'];
    let rowHasAnyChange = false;

    fieldsToTrack.forEach(field => {
      if (row[field] !== original[field]) {
        rowHasAnyChange = true;
        const labels: Record<string, string> = {
          fieldName: 'Field Name',
          type: 'Data Type',
          requirement: 'Requirement',
          constraints: 'Constraint',
          constraintDetails: 'Constraint Details',
        };

        this.pendingChanges.push({
          id: `${row.fieldName}-${field}`,
          rowId: row.fieldName,
          field: row.fieldName,
          type: labels[field] || 'Field',
          description: `Changed ${labels[field] || field}`,
          originalValue: original[field] || '(Empty)',
          newValue: row[field] || '(Empty)',
        });
      }
    });

    row.status = rowHasAnyChange ? 'Modified' : original.status || 'Existing';
  }

  onRelatedModelChange(row: RelatedModel): void {
    const original = this.originalRelatedBackup.find(o => o.id === row.id);
    if (!original) return;

    this.pendingChanges = this.pendingChanges.filter(
      c => c.rowId !== row.id || c.type !== 'Impact Scope',
    );

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
      const aliasValue = this.newAlias.trim();
      this.aliases.push(aliasValue);
      this.pendingChanges.push({
        id: `alias-add-${Date.now()}`,
        rowId: 'alias-group',
        field: 'Aliases',
        type: 'Alias Added',
        description: `Added alias: ${aliasValue}`,
        newValue: aliasValue,
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
    const newField: ModelField = {
      fieldName: '',
      type: 'String',
      requirement: 'Optional',
      references: 0,
      constraints: 'None',
      constraintDetails: '',
      status: 'New',
    };
    this.fieldsDataSource.data = [...this.fieldsDataSource.data, newField];
  }

  deleteField(row: ModelField): void {
    this.fieldsDataSource.data = this.fieldsDataSource.data.filter(
      f => f.fieldName !== row.fieldName,
    );
    this.pendingChanges = this.pendingChanges.filter(c => c.rowId !== row.fieldName);
    this.pendingChanges.push({
      id: `${row.fieldName}-delete`,
      rowId: row.fieldName,
      field: row.fieldName || '(Unnamed Field)',
      type: 'Field Deleted',
      description: `Deleted field: ${row.fieldName}`,
      originalValue: row.fieldName,
    });
  }

  resetField(row: ModelField): void {
    const original = this.originalFieldsBackup.find(o => o.fieldName === row.fieldName);
    if (original) {
      Object.assign(row, _.cloneDeep(original));
      this.pendingChanges = this.pendingChanges.filter(c => c.field !== row.fieldName);
      this.fieldsDataSource.data = [...this.fieldsDataSource.data];
    }
  }

  resetAllChanges(): void {
    const modalPayload = {
      title: 'Reset All Changes',
      message: 'Are you sure you want to discard all pending changes for this model?',
      command: 'reset',
      itemName: this.modelData?.name || 'Model Changes',
      theme: this.getActiveTheme(),
      action: 'open_confirmation_modal',
    };
    this.eventService.publish('nf', 'open_confirmation_modal', modalPayload);
  }

  private executeActualReset(): void {
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
      const targetRow = this.fieldsDataSource.data.find(row => row.fieldName === change.rowId);
      if (targetRow) {
        const propertyMap: Record<string, string> = {
          'Field Name': 'fieldName',
          'Data Type': 'type',
          Requirement: 'requirement',
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
    this.eventService.publish('nf', 'close_edit_model', { action: 'close_edit_model' });
    setTimeout(() => {
      this.closeEdit.emit();
    }, 500);
  }

  onDelete(): void {
    const modalPayload = {
      title: 'Delete Model',
      message: `Are you sure you want to delete the model "${this.modelData?.name}"? This action cannot be undone.`,
      command: 'delete',
      itemName: this.modelData?.name || 'Model',
      theme: this.getActiveTheme(),
      action: 'open_confirmation_modal',
    };
    this.eventService.publish('nf', 'open_confirmation_modal', modalPayload);
  }

  private executeActualDelete(): void {
    this.eventService.publish('nf', 'model_delete_confirmed', {
      modelId: this.modelData?.id,
      action: 'delete_model',
    });
    this.onCancel();
  }

  onSave(): void {
    // 1. Check if there are any pending changes
    if (this.pendingChanges.length === 0) {
      // No changes to save, just exit
      this.onCancel();
      return;
    }

    // 2. Prepare the confirmation payload
    const modalPayload = {
      title: 'Save Changes',
      message: `You have ${this.pendingChanges.length} pending change(s). Would you like to apply these updates to "${this.modelData?.name || 'this model'}"?`,
      command: 'save',
      itemName: this.modelData?.name || 'Model Update',
      theme: this.getActiveTheme(),
      action: 'open_confirmation_modal',
    };

    // 3. Open the confirmation modal via EventService
    this.eventService.publish('nf', 'open_confirmation_modal', modalPayload);
  }

  private finalizeSave(): void {
    // 1. Construct the final data object
    const updatedModelData = {
      ...this.modelData,
      fields: _.cloneDeep(this.fieldsDataSource.data),
      aliases: _.cloneDeep(this.aliases),
      dependencyData: {
        ...this.modelData.dependencyData,
        relatedModels: _.cloneDeep(this.relatedModelsDataSource.data),
      },
      lastModified: new Date().toISOString(),
      changeLog: this.pendingChanges, // Optional: pass the log to the backend
    };

    // 2. Publish the save event to the store/effect
    this.eventService.publish('nf', 'model_save_submitted', {
      modelId: this.modelData?.id,
      data: updatedModelData,
      action: 'save_model',
    });

    // 3. Visual feedback (Optional) and Exit
    console.log('Model data saved successfully:', updatedModelData);

    // Clear pending changes before exiting
    this.pendingChanges = [];

    // Exit edit mode
    this.onCancel();
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
