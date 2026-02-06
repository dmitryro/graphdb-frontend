import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  effect,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  signal,
  SimpleChanges,
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

interface CodeMapping {
  sourceCode: string;
  sourceLabel: string;
  targetCode: string;
  targetLabel: string;
  system: string;
  status: string;
}

@Component({
  selector: 'app-view-code-set-mapping',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './view-code-set-mapping.component.html',
  styleUrls: ['./view-code-set-mapping.component.scss'],
})
export class ViewCodeSetMappingComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  // --- Inputs & Signals ---

  /** * Unified Setter:
   * We handle both mappingData and codesetData inputs to populate the same signal.
   * This prevents the "setter calling setter" loop.
   */
  @Input() set mappingData(value: any) {
    this.handleDataInput(value);
  }
  get mappingData() {
    return this._codesetData();
  }

  @Input() set codesetData(value: any) {
    this.handleDataInput(value);
  }
  get codesetData() {
    return this._codesetData();
  }

  @Input() set isEditing(value: boolean) {
    console.log('[ViewCodeSetMapping] isEditing input changed to:', value);
    this._isEditing.set(value);
  }
  get isEditing() {
    return this._isEditing();
  }

  @Output() closeView = new EventEmitter<void>();

  private _codesetData = signal<any>(null);
  private _isEditing = signal<boolean>(false);
  versions = signal<any[]>([]);

  isExiting = signal(false);
  isExitedToLeft = signal(false);
  isReturningFromLeft = signal(false);

  searchTerm = signal('');
  selectedStatus = signal('All');

  pipelinesExpanded = false;
  rulesExpanded = false;

  @HostBinding('class.slide-out-to-left') get exitLeft() {
    return this.isExitedToLeft();
  }
  @HostBinding('class.slide-in-from-left') get enterLeft() {
    return this.isReturningFromLeft();
  }
  @HostBinding('class.slide-out-to-right') get exitRight() {
    return this.isExiting();
  }

  @HostBinding('style.pointer-events') get pointerEvents() {
    return this.isExitedToLeft() ? 'none' : 'auto';
  }

  dataSource = new MatTableDataSource<CodeMapping>([]);
  previewDataSource = new MatTableDataSource<CodeMapping>([]);

  displayedColumns = ['sourceCode', 'sourceLabel', 'targetCode', 'targetLabel', 'system', 'status'];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  private eventSubs?: Subscription;

  constructor(
    protected eventService: EventService,
    protected eventStore: Store<{ nf: EventState }>,
    private cdr: ChangeDetectorRef,
  ) {
    effect(() => {
      console.log('[ViewCodeSetMapping] Effect triggered - applying filters');
      this.applyFilters();
    });
  }

  ngOnInit(): void {
    console.log('[ViewCodeSetMapping] ngOnInit started');
    this.setupFilterPredicate();
    this.subscribeToEvents();

    // Set initial breadcrumb for this view
    this.updateBreadcrumb('view');

    // If data is already present at init, process it
    if (this.codesetData) {
      this.processCodesetData(this.codesetData);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mappingData'] || changes['codesetData']) {
      const newData = changes['codesetData']?.currentValue || changes['mappingData']?.currentValue;
      if (newData) {
        this.processCodesetData(newData);
      }
    }
  }

  private handleDataInput(value: any): void {
    console.log('[ViewCodeSetMapping] Data input received:', value);
    this._codesetData.set(value);
    this.processCodesetData(value);
  }

  private processCodesetData(data: any): void {
    if (!data) {
      this.dataSource.data = [];
      this.previewDataSource.data = [];
      return;
    }

    // Support both 'mappings' and 'fields' array naming conventions
    const rows = data.mappings || data.fields || [];

    if (Array.isArray(rows)) {
      this.dataSource.data = rows;
      this.previewDataSource.data = rows;
    }

    if (data.versions && Array.isArray(data.versions)) {
      this.versions.set(data.versions);
    }

    this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.eventSubs) {
      this.eventSubs.unsubscribe();
    }
  }

  private subscribeToEvents(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      const eventName = state?.items?.event;
      const payload = state?.items?.payload;

      if (eventName === 'close_edit_codeset') {
        const fromBreadcrumb = payload?.fromBreadcrumb === true;
        this.handleInternalCloseEdit(!fromBreadcrumb);
      }

      if (eventName === 'breadcrumb_navigate') {
        const target = payload?.target;
        if (target === 'TAB_MAPPINGS') {
          this.handleInternalExit();
        } else if (target === 'VIEW_CODE_SET_MAPPING' && this.isEditing) {
          this.handleInternalCloseEdit(false);
        }
      }
    });
  }

  private updateBreadcrumb(mode: 'view' | 'edit'): void {
    const path = [
      { label: 'Normalization', target: 'ROOT' },
      { label: 'Mappings', target: 'TAB_MAPPINGS' },
      {
        label: 'View Code Set Mapping',
        target: 'VIEW_CODE_SET_MAPPING',
        active: mode === 'view',
      },
    ];

    if (mode === 'edit') {
      path.push({
        label: 'Edit Code Set Mapping',
        target: 'EDIT_CODE_SET_MAPPING',
        active: true,
      });
    }

    this.eventService.publish('nf', 'update_breadcrumb', {
      action: 'update_breadcrumb',
      path: path,
    });
  }

  private setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (data: CodeMapping, filter: string) => {
      const filters = JSON.parse(filter);
      const matchesStatus = filters.status === 'All' || data.status === filters.status;
      const searchStr =
        `${data.sourceCode} ${data.sourceLabel} ${data.targetCode} ${data.targetLabel}`.toLowerCase();
      const matchesSearch = _.includes(searchStr, filters.searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    };
  }

  private applyFilters(): void {
    const filterState = {
      searchTerm: this.searchTerm(),
      status: this.selectedStatus(),
    };
    this.dataSource.filter = JSON.stringify(filterState);
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  updateSearch(val: string) {
    this.searchTerm.set(val);
  }
  updateStatus(val: string) {
    this.selectedStatus.set(val);
  }
  togglePipelines(): void {
    this.pipelinesExpanded = !this.pipelinesExpanded;
  }
  toggleRules(): void {
    this.rulesExpanded = !this.rulesExpanded;
  }

  onBackToMappings(): void {
    this.eventService.publish('nf', 'breadcrumb_navigate', {
      action: 'breadcrumb_navigate',
      target: 'TAB_MAPPINGS',
    });
  }

  private handleInternalExit(): void {
    this.isExiting.set(true);
    this.isExitedToLeft.set(false);
    this.isEditing = false;
    setTimeout(() => {
      this.closeView.emit();
      this.isExiting.set(false);
    }, 600);
  }

  onEdit(): void {
    this.isExiting.set(false);
    this.isExitedToLeft.set(true);
    this.isReturningFromLeft.set(false);
    this.isEditing = true;

    const editPayload = {
      ...this.codesetData,
      mappingRows: this.codesetData?.mappings || this.codesetData?.fields || [],
    };

    this.eventService.publish('nf', 'open_edit_code_set_mapping', {
      action: 'open_edit_code_set_mapping',
      codesetId: this.codesetData?.id,
      mappingData: editPayload,
    });

    this.updateBreadcrumb('edit');
  }

  onCloseEdit(): void {
    this.eventService.publish('nf', 'close_edit_codeset', {
      action: 'close_edit_codeset',
    });
  }

  private handleInternalCloseEdit(updateBreadcrumb = true): void {
    this.isExitedToLeft.set(false);
    this.isReturningFromLeft.set(true);
    this.isEditing = false;

    if (updateBreadcrumb) {
      this.updateBreadcrumb('view');
    }

    setTimeout(() => {
      this.isReturningFromLeft.set(false);
    }, 500);
  }

  onChangeStatus(): void {
    this.eventService.publish('nf', 'execute_codeset_action', {
      command: 'STATUS_CHANGE',
      action: 'execute_codeset_action',
      codesetId: this.codesetData?.id,
      timestamp: new Date().toISOString(),
    });
  }

  viewVersionHistory(): void {
    console.log('Version history');
  }
  viewInRules(): void {
    console.log('View in Rules');
  }
}
