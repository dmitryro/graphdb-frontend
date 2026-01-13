import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

// NgRx & Events
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import {
  MatPaginator,
  MatPaginatorIntl,
  MatPaginatorModule,
  PageEvent,
} from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
// Add these specific imports at the top
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
  MatNativeDateModule,
  NativeDateAdapter,
} from '@angular/material/core';

// User & Version Models
import { IVersionCommit } from '@modules/admin/models/version.model';
import { UsersModule } from '@modules/users/users-module';

@Component({
  selector: 'app-normalization',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatTabsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    UsersModule,
  ],
  // ADD THIS SECTION BELOW
  // Add MAT_DATE_LOCALE to your existing providers in the @Component decorator
  providers: [
    { provide: MatPaginatorIntl, useClass: MatPaginatorIntl },
    EventService,
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' }, // This is the missing piece for "January" vs "1/13"
    { provide: DateAdapter, useClass: NativeDateAdapter },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: { dateInput: 'MM/DD/YYYY' },
        display: {
          dateInput: 'MM/DD/YYYY',
          monthYearLabel: 'MMMM YYYY', // Replaces the single date with "January 2026"
          dateA11yLabel: 'LL',
          monthYearA11yLabel: 'MMMM YYYY',
        },
      },
    },
  ],
  templateUrl: './normalization.component.html',
  styleUrl: './normalization.component.scss',
})
export class NormalizationComponent implements OnInit, AfterViewInit, OnDestroy {
  eventSubs?: Subscription;

  // UI State
  activeTabIndex = 0;
  activeTabLabel = 'Models';
  selectedEnv = 'Production';
  tempAvatar = 'assets/images/avatar.png';

  // Date Range Picker
  startView: 'month' | 'year' | 'multi-year' = 'month';

  // Pagination State for Versions
  public currentPage = 0;
  public pageSize = 5;

  public filteredVersionHistory: IVersionCommit[] = [];

  // Search Bindings
  modelSearch = '';
  mappingSearch = '';
  ruleSearch = '';
  versionSearch = '';
  codeSearch = '';

  // Date Range Picker Form
  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  // Column Definitions
  modelColumns: string[] = [
    'name',
    'type',
    'status',
    'fields',
    'dependencies',
    'lastModified',
    'actions',
  ];
  mappingColumns: string[] = ['source', 'target', 'engine', 'status', 'lastModified', 'actions'];
  ruleColumns: string[] = ['ruleName', 'trigger', 'priority', 'status', 'actions'];
  versionColumns: string[] = ['versionTag', 'releasedBy', 'status', 'timestamp', 'actions'];
  codeColumns: string[] = ['codeSystem', 'standard', 'oid', 'status', 'actions'];

  // DataSources
  modelDataSource = new MatTableDataSource<any>([]);
  mappingDataSource = new MatTableDataSource<any>([]);
  ruleDataSource = new MatTableDataSource<any>([]);
  versionDataSource = new MatTableDataSource<any>([]);
  codeDataSource = new MatTableDataSource<any>([]);

  // Versions timeline data
  versionHistory: IVersionCommit[] = [];

  private tabOrder: string[] = ['Models', 'Mappings', 'Rules', 'Versions', 'Codes'];

  @ViewChild('modelPaginator') modelPaginator!: MatPaginator;
  @ViewChild('mappingPaginator') mappingPaginator!: MatPaginator;
  @ViewChild('rulePaginator') rulePaginator!: MatPaginator;
  @ViewChild('versionPaginator') versionPaginator!: MatPaginator;
  @ViewChild('codePaginator') codePaginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    protected eventService: EventService,
    protected eventStore: Store<{ nf: EventState }>,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadAllData();
    this.subscribeEvents();

    this.range.valueChanges.subscribe(() => {
      this.applyVersionFilter();
    });
  }

  subscribeEvents(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      const lastAction = state?.lastAction;
      if (
        lastAction === 'record_created' ||
        lastAction === 'graph_updated' ||
        state?.items?.event === 'refresh_header'
      ) {
        this.loadAllData();
      }
    });
  }

  ngAfterViewInit(): void {
    this.refreshTablePointers();

    if (this.versionPaginator) {
      this.pageSize = this.versionPaginator.pageSize;

      this.versionPaginator.page.subscribe((event: PageEvent) => {
        this.currentPage = event.pageIndex;
        this.pageSize = event.pageSize;
        this.cdr.detectChanges();
      });
    }

    this.applyVersionFilter();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredVersionHistory.length / this.pageSize);
  }

  get pagedVersionHistory(): IVersionCommit[] {
    const page = this.versionPaginator?.pageIndex ?? this.currentPage;
    const size = this.versionPaginator?.pageSize ?? this.pageSize;
    const startIndex = page * size;
    return this.filteredVersionHistory.slice(startIndex, startIndex + size);
  }

  private getActiveTheme(): 'light' | 'dark' {
    const isDark =
      document.body.classList.contains('dark-theme') ||
      document.body.classList.contains('dark-mode') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    return isDark ? 'dark' : 'light';
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.activeTabIndex = event.index;
    this.activeTabLabel = this.tabOrder[this.activeTabIndex];
    setTimeout(() => {
      this.refreshTablePointers();
      this.cdr.detectChanges();
    });
  }

  private refreshTablePointers(): void {
    const ds = this.getActiveDataSource();
    if (this.activeTabIndex === 0) ds.paginator = this.modelPaginator;
    if (this.activeTabIndex === 1) ds.paginator = this.mappingPaginator;
    if (this.activeTabIndex === 2) ds.paginator = this.rulePaginator;
    if (this.activeTabIndex === 3) ds.paginator = this.versionPaginator;
    if (this.activeTabIndex === 4) ds.paginator = this.codePaginator;

    if (this.sort) ds.sort = this.sort;
  }

  applyModelFilter(): void {
    this.filterDS(this.modelDataSource, this.modelSearch);
  }

  applyMappingFilter(): void {
    this.filterDS(this.mappingDataSource, this.mappingSearch);
  }

  applyRuleFilter(): void {
    this.filterDS(this.ruleDataSource, this.ruleSearch);
  }

  applyVersionFilter(): void {
    const { start, end } = this.range.value;
    const search = this.versionSearch?.trim()?.toLowerCase();

    this.filteredVersionHistory = this.versionHistory.filter(commit => {
      // Date range filter
      if (start || end) {
        const commitDate = new Date(commit.absoluteTime);
        if (start) {
          const startDate = new Date(start);
          startDate.setHours(0, 0, 0, 0);
          if (commitDate < startDate) return false;
        }
        if (end) {
          const endDate = new Date(end);
          endDate.setHours(23, 59, 59, 999);
          if (commitDate > endDate) return false;
        }
      }

      // Text search
      if (!search) return true;

      return this.deepMatch(commit, search);
    });

    this.versionDataSource.data = [...this.filteredVersionHistory];
    this.currentPage = 0;
    if (this.versionPaginator) {
      this.versionPaginator.firstPage();
    }

    this.cdr.detectChanges();
  }

  clearDateRange(): void {
    this.range.reset();
  }

  applyCodeFilter(): void {
    this.filterDS(this.codeDataSource, this.codeSearch);
  }

  private filterDS(ds: MatTableDataSource<any>, val: string): void {
    ds.filter = val.trim().toLowerCase();
    if (ds.paginator) ds.paginator.firstPage();
  }

  private deepMatch(obj: any, term: string): boolean {
    if (_.isNil(obj)) return false;

    // Primitive values
    if (!_.isObject(obj)) {
      return String(obj).toLowerCase().includes(term);
    }

    // Arrays
    if (_.isArray(obj)) {
      return _.some(obj, item => this.deepMatch(item, term));
    }

    // Objects - check both keys and values
    return _.some(_.entries(obj), ([key, value]) => {
      return key.toLowerCase().includes(term) || this.deepMatch(value, term);
    });
  }

  // --- Actions ---
  addNewModel(): void {
    this.eventService.publish('nf', 'add_normalization_model', {
      theme: this.getActiveTheme(),
      mode: 'create',
    });
  }

  addNewMapping(): void {
    this.eventService.publish('nf', 'add_normalization_mapping', {
      theme: this.getActiveTheme(),
      mode: 'create',
    });
  }

  addNewRule(): void {
    this.eventService.publish('nf', 'add_normalization_rule', {
      theme: this.getActiveTheme(),
      mode: 'create',
    });
  }

  createNewVersion(): void {
    this.eventService.publish('nf', 'add_normalization_version', {
      theme: this.getActiveTheme(),
      mode: 'create',
    });
  }

  addNewCodeSystem(): void {
    this.eventService.publish('nf', 'add_normalization_code', {
      theme: this.getActiveTheme(),
      mode: 'create',
    });
  }

  onEdit(row: any): void {
    let signalName = '';
    switch (this.activeTabIndex) {
      case 0:
        signalName = 'add_normalization_model';
        break;
      case 1:
        signalName = 'add_normalization_mapping';
        break;
      case 2:
        signalName = 'add_normalization_rule';
        break;
      case 3:
        signalName = 'add_normalization_version';
        break;
      case 4:
        signalName = 'add_normalization_code';
        break;
      default:
        signalName = `open_${this.activeTabLabel.toLowerCase().slice(0, -1)}_modal`;
    }
    this.eventService.publish('nf', signalName, {
      theme: this.getActiveTheme(),
      mode: 'edit',
      data: row,
    });
  }

  onActivate(row: any): void {
    row.status = 'Active';
  }
  onDeprecate(row: any): void {
    row.status = 'Deprecated';
  }

  onViewLogs(row: any): void {
    this.eventService.publish('nf', 'view_event_logs', {
      theme: this.getActiveTheme(),
      goldenRecordId: row.id || row.name,
      context: 'normalization_audit',
    });
  }

  onDelete(row: any): void {
    console.log('Delete requested for:', row);
  }

  private getActiveDataSource(): MatTableDataSource<any> {
    const map: any = {
      Models: this.modelDataSource,
      Mappings: this.mappingDataSource,
      Rules: this.ruleDataSource,
      Versions: this.versionDataSource,
      Codes: this.codeDataSource,
    };
    return map[this.activeTabLabel] || this.modelDataSource;
  }

  public loadAllData(): void {
    this.modelDataSource.data = Array.from({ length: 35 }, (_, i) => ({
      id: `m-${i}`,
      name: i === 0 ? 'Patient Golden Record' : `Clinical Model ${i + 1}`,
      type: i % 2 === 0 ? 'FHIR R4' : 'HL7 v2',
      status: i % 7 === 0 ? 'Draft' : 'Active',
      fields: 15 + (i % 20),
      dependencies: i % 4,
      lastModified: '2026-01-10',
    }));

    this.mappingDataSource.data = Array.from({ length: 35 }, (_, i) => ({
      id: `map-${i}`,
      source: i % 2 === 0 ? `PID-${i + 1}` : `OBX-${i + 1}`,
      target: i % 2 === 0 ? `Patient.identifier[${i}]` : `Observation.value[x]`,
      engine: i % 3 === 0 ? 'Jolt' : 'Liquid',
      status: 'Active',
      lastModified: `${i + 1}h ago`,
    }));

    this.ruleDataSource.data = Array.from({ length: 35 }, (_, i) => ({
      id: `rule-${i}`,
      ruleName: `Normalization_Rule_${100 + i}`,
      trigger: i % 2 === 0 ? 'On_Ingest' : 'On_Update',
      priority: i % 5 === 0 ? 'P1' : 'P2',
      status: i % 10 === 0 ? 'Draft' : 'Active',
    }));

    this.versionHistory = Array.from({ length: 26 }, (_, i): IVersionCommit => {
      const isBrianna = i % 3 === 0;

      // Generate dynamic subjects with multiple Epic mentions to match screenshot
      let testSubject = i % 3 === 0 ? 'Epic Integration Mapping' : 'Missing Required Field (v4)';
      if (i % 4 === 1) testSubject = 'Epic - Patient (v3) Model';
      if (i % 5 === 2) testSubject = 'Age Under 18 Rule';

      return {
        id: `commit-${i}`,
        hash: Math.random().toString(16).substring(2, 9).toUpperCase(),
        author: {
          name: isBrianna ? 'Brianna Wilson' : 'Mason Adams',
          avatar: `https://i.pravatar.cc/150?u=${i + 10}`,
        },
        relativeTime: `${i + 1} days ago`,
        absoluteTime: `2026-01-${Math.max(1, 12 - i)
          .toString()
          .padStart(2, '0')}T10:30:00`,
        events: [
          {
            action: 'Added',
            subject: testSubject,
            version: `v2.${i}.0`,
            type: 'Model',
            timestamp: '10:30 AM',
            scopeChange: 'Field-level → System',
            statusIcon: 'check_circle',
            nested: {
              title: 'System Validation Check',
              tag: i % 5 === 2 ? 'Age-Tag' : 'Normalization',
              time: '10:31 AM',
            },
          },
        ],
      };
    });

    this.versionDataSource.data = this.versionHistory;

    const systems = ['SNOMED', 'LOINC', 'ICD-10', 'OMOP', 'MEDDRA'];
    const standardTypes = ['Clinical', 'Lab', 'Diagnosis', 'Research', 'Safety'];
    this.codeDataSource.data = Array.from({ length: 35 }, (_, i) => {
      const sysIdx = Math.floor(i / 7);
      return {
        id: `code-${i}`,
        codeSystem: systems[sysIdx % systems.length],
        standard: standardTypes[sysIdx % standardTypes.length],
        oid: `2.16.840.1.113883.6.${100 + i}`,
        status: 'Active',
      };
    });

    this.applyVersionFilter();
  }

  ngOnDestroy(): void {
    if (this.eventSubs) {
      this.eventSubs.unsubscribe();
    }
  }
}
