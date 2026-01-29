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
import dayjs from 'dayjs';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// State & Services
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';

export interface AuditEvent {
  id: string;
  eventId: string;
  timestamp: string;
  timestampDisplay: string;
  actor: string;
  actorType: 'User' | 'System' | 'Integration';
  actorAvatar: string;
  action: string;
  target: string;
  targetType: string;
  initiation: string;
  outcome: string;
  outcomeIcon: string;
  severity?: string;
  beforeData?: any;
  afterData?: any;
  references?: { type: string; id: string; label: string }[];
  intent?: string;
  artifacts?: { type: string; id: string; label: string; severity?: string }[];
  metadata?: any;
}

export function getAuditPaginatorIntl() {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Events per page:';
  paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) return `0 of ${length}`;
    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, length);
    return `${startIndex + 1} – ${endIndex} of ${length}`;
  };
  return paginatorIntl;
}

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss'],
  providers: [{ provide: MatPaginatorIntl, useValue: getAuditPaginatorIntl() }, EventService],
})
export class AuditComponent implements OnInit, AfterViewInit, OnDestroy {
  selectedEnv = 'Production';
  theme: 'light' | 'dark' = 'dark';
  private subscriptions = new Subscription();
  public pageTitle = 'Governance & Audits';
  public pageLegend = 'Record, trace, and verify platform integrity and compliance.';

  // Data Sources
  auditDataSource = new MatTableDataSource<AuditEvent>([]);
  private originalAuditData: AuditEvent[] = [];

  // Selection State
  selectedEvent: AuditEvent | null = null;
  showDetailPanel = false;

  // ViewChildren for Sorting and Pagination
  @ViewChild('auditSort') auditSort!: MatSort;
  @ViewChild('auditPaginator') auditPaginator!: MatPaginator;

  // Search & Filter Properties
  auditSearch = '';
  selectedActor = 'All';
  selectedAction = 'All';
  selectedMigrate = 'All';
  selectedTimeWindow = 'All';

  // Table Columns
  auditColumns: string[] = ['timestamp', 'actor', 'action', 'target', 'initiation', 'outcome'];

  // Date Range
  dateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  // Filter Options
  actors = ['User', 'System', 'Integration'];
  actions = [
    'Create',
    'Update',
    'Delete',
    'Rule change',
    'Snapshot',
    'Merge',
    'Conflict Resolved',
    'Data Source Ingested',
  ];
  migrates = ['Yes', 'No'];
  timeWindows = ['Last 24h', 'Last 7d', 'Last 30d', 'Custom range'];

  // User/System avatars for variety
  private userAvatars = [
    'https://ui-avatars.com/api/?name=Admin+User&background=4A90E2&color=fff&size=150&bold=true',
    'https://ui-avatars.com/api/?name=Jane+Smith&background=E74C3C&color=fff&size=150&bold=true',
    'https://ui-avatars.com/api/?name=System+Auto&background=2C3E50&color=fff&size=150&bold=true',
  ];

  constructor(
    private store: Store<{ nf: EventState }>,
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.store.select('nf').subscribe(state => {
        if (state?.items?.payload?.theme) {
          this.theme = state.items.payload.theme;
        }
      }),
    );
    this.loadAuditData();
  }

  ngAfterViewInit(): void {
    this.auditDataSource.sort = this.auditSort;
    this.auditDataSource.paginator = this.auditPaginator;
    this.applyAuditFilter();
    this.cdr.detectChanges();
  }

  private deepMatch(obj: any, term: string): boolean {
    if (_.isNil(obj)) return false;
    if (!_.isObject(obj)) {
      return String(obj).toLowerCase().includes(term);
    }
    if (_.isArray(obj)) {
      return _.some(obj, item => this.deepMatch(item, term));
    }
    return _.some(_.entries(obj), ([key, value]) => {
      return key.toLowerCase().includes(term) || this.deepMatch(value, term);
    });
  }

  public applyAuditFilter(): void {
    let filtered = [...this.originalAuditData];
    const search = (this.auditSearch || '').toLowerCase().trim();

    // Search filter
    if (search) {
      filtered = filtered.filter(item => this.deepMatch(item, search));
    }

    // Actor filter
    if (this.selectedActor !== 'All') {
      filtered = filtered.filter(item => item.actorType === this.selectedActor);
    }

    // Action filter
    if (this.selectedAction !== 'All') {
      filtered = filtered.filter(item => item.action.includes(this.selectedAction));
    }

    // Time window filter
    if (this.selectedTimeWindow !== 'All' && this.selectedTimeWindow !== 'Custom range') {
      const now = dayjs();
      let startBoundary: dayjs.Dayjs | null = null;

      switch (this.selectedTimeWindow) {
        case 'Last 24h':
          startBoundary = now.subtract(1, 'day');
          break;
        case 'Last 7d':
          startBoundary = now.subtract(7, 'day');
          break;
        case 'Last 30d':
          startBoundary = now.subtract(30, 'day');
          break;
      }

      if (startBoundary) {
        filtered = filtered.filter(item => {
          const itemDate = dayjs(item.timestamp);
          return itemDate.isAfter(startBoundary);
        });
      }
    }

    // Date range filter
    const { start, end } = this.dateRange.value;
    if (start || end) {
      const startBoundary = start ? dayjs(start).subtract(1, 'day').startOf('day') : null;
      const endBoundary = end ? dayjs(end).endOf('day') : null;

      filtered = filtered.filter(item => {
        const itemDate = dayjs(item.timestamp);
        if (startBoundary && !itemDate.isAfter(startBoundary)) return false;
        if (endBoundary && itemDate.isAfter(endBoundary)) return false;
        return true;
      });
    }

    this.auditDataSource.data = filtered;
    if (this.auditPaginator) this.auditPaginator.firstPage();
    this.cdr.detectChanges();
  }

  setActorFilter(val: string): void {
    this.selectedActor = val;
    this.applyAuditFilter();
  }

  setActionFilter(val: string): void {
    this.selectedAction = val;
    this.applyAuditFilter();
  }

  setMigrateFilter(val: string): void {
    this.selectedMigrate = val;
    this.applyAuditFilter();
  }

  setTimeWindowFilter(val: string): void {
    this.selectedTimeWindow = val;
    if (val !== 'Custom range') {
      this.dateRange.reset();
    }
    this.applyAuditFilter();
  }

  clearDateRange(): void {
    this.dateRange.reset();
    this.selectedTimeWindow = 'All';
    this.applyAuditFilter();
  }

  onSelectEvent(event: AuditEvent): void {
    if (this.selectedEvent?.id === event.id) {
      this.selectedEvent = null;
      this.showDetailPanel = false;
    } else {
      this.selectedEvent = event;
      this.showDetailPanel = true;
    }
    this.cdr.detectChanges();
  }

  onCloseDetailPanel(): void {
    this.selectedEvent = null;
    this.showDetailPanel = false;
    this.cdr.detectChanges();
  }

  createSnapshot(): void {
    const context = {
      action: 'CREATE_SNAPSHOT',
      environment: this.selectedEnv,
      timestamp: new Date().toISOString(),
      actor: 'admin_user',
    };

    this.eventService.publish('AuditModule', 'snapshot_created', context);
    console.log('[AUDIT LOG] Snapshot created:', context);

    // Refresh audit data
    setTimeout(() => this.loadAuditData(), 500);
  }

  private loadAuditData(): void {
    const events: AuditEvent[] = [];
    const actorTypes: ('User' | 'System' | 'Integration')[] = ['User', 'System', 'Integration'];
    const actions = [
      'Rule enabled',
      'Brally created',
      'Daily backup created',
      'Patients merged',
      'Rule conflict resolved',
      'Data source ingested',
      'Entity updated',
      'Snapshot created',
      'Configuration changed',
      'Access granted',
    ];
    const targets = [
      'Conflict ID 225484',
      'Snapshot SN-2024043',
      'Patient MRN uniqueness rule',
      'Entity-merged',
      'Bada Source',
      'User: john.doe',
      'Model: Patient',
      'Mapping: Epic → Patient',
    ];
    const initiations = ['User-initiated', 'System-initiated', 'Scheduled'];
    const outcomes = ['Success', 'Failure', 'Warning', 'Partial'];

    for (let i = 0; i < 50; i++) {
      const actorType = actorTypes[i % actorTypes.length];
      const timestamp = dayjs()
        .subtract(Math.floor(Math.random() * 30), 'day')
        .subtract(Math.floor(Math.random() * 24), 'hour')
        .toISOString();
      const outcome = i % 10 === 0 ? 'Failure' : outcomes[i % outcomes.length];

      events.push({
        id: `audit-${i + 1}`,
        eventId: `AE-${3126845 + i}`,
        timestamp: timestamp,
        timestampDisplay: dayjs(timestamp).format('MMM DD, YYYY - HH:mm UTC'),
        actor: actorType === 'User' ? 'Admin' : 'System',
        actorType: actorType,
        actorAvatar: this.userAvatars[i % this.userAvatars.length],
        action: actions[i % actions.length],
        target: targets[i % targets.length],
        targetType: i % 3 === 0 ? 'Rule' : i % 3 === 1 ? 'Snapshot' : 'Entity',
        initiation: initiations[i % initiations.length],
        outcome: outcome,
        outcomeIcon:
          outcome === 'Success' ? 'check_circle' : outcome === 'Failure' ? 'error' : 'warning',
        severity: i % 5 === 0 ? 'Critical' : i % 4 === 0 ? 'High' : 'Medium',
        beforeData: { field: 'old_value' },
        afterData: { field: 'new_value' },
        references: [
          { type: 'Conflict', id: '225484', label: 'Conflict ID 225484' },
          { type: 'Rule', id: 'mrn_unique', label: 'Patient MRN uniqueness rule' },
        ],
        intent: i % 3 === 0 ? 'Data validation and integrity enforcement' : null,
        artifacts: [
          { type: 'Conflict', id: '225484', label: 'Conflict ID 225484', severity: 'CRITICAL' },
        ],
        metadata: {
          source: 'Epic Health Network',
          duration: `${Math.floor(Math.random() * 500)}ms`,
        },
      });
    }

    this.originalAuditData = _.orderBy(events, ['timestamp'], ['desc']);
    this.auditDataSource.data = this.originalAuditData;
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
