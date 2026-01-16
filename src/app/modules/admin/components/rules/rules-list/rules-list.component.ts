import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { IRuleRecord } from '@modules/admin/models/rule.model';
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import * as _ from 'lodash';

export function getCustomPaginatorIntl() {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Items per page:';
  paginatorIntl.nextPageLabel = 'Next page';
  paginatorIntl.previousPageLabel = 'Previous page';
  paginatorIntl.firstPageLabel = 'First page';
  paginatorIntl.lastPageLabel = 'Last page';

  paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) return `0 of ${length}`;
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex =
      startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return `${startIndex + 1} – ${endIndex} of ${length}`;
  };
  return paginatorIntl;
}

@Component({
  selector: 'app-rules-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  providers: [{ provide: MatPaginatorIntl, useValue: getCustomPaginatorIntl() }, EventService],
  templateUrl: './rules-list.component.html',
  styleUrls: ['./rules-list.component.scss'],
})
export class RulesListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  public theme: 'light' | 'dark' = 'dark';
  displayedColumns: string[] = [
    'name',
    'type',
    'scope',
    'severity',
    'threshold',
    'status',
    'owner',
  ];

  dataSource: MatTableDataSource<IRuleRecord>;
  selectedRule: IRuleRecord | null = null;

  // Persistence dictionary for status states
  private ruleStatusMap: Record<string, 'Enabled' | 'Disabled'> = {};

  selectedEnv = 'Production';
  selectedFilter = 'All';
  selectedScope = 'All';
  selectedStatus = 'Any';
  ruleSearch = '';

  totalRules = 0;
  enabledCount = 0;
  disabledCount = 0;
  conflictCount = 6;

  rules: IRuleRecord[] = [
    {
      id: '1',
      name: 'Patient must have unique MRN',
      type: 'Structural',
      severity: 'lo' as any,
      status: 'Enabled',
      ownerName: 'admin',
      definition: {
        scope: 'Patient',
        threshold: '> 0',
        logic: "COUNT[,] WHERE Type = 'Patient' AND (MRN != '' AND NOT DISTINCT(MRN) > 0)",
        description: 'Each Patient entity must have a unique medical record number (MRN).',
      },
      provenance: {
        author: { name: 'admin' },
        createdAt: 'Mar 29, 2024',
        updatedAt: 'Mar 29, 2024',
        effectiveDate: 'Mar 31, 2024',
        lastExecuted: 'Apr 9, 2024',
      },
      created: 'Mar 29, 2024',
      effectiveDate: 'Mar 31, 2024',
      lastTested: 'Apr 9, 2024',
    },
    {
      id: '2',
      name: 'Encounter gaps must not overlap',
      type: 'Structural',
      severity: 'Info',
      status: 'Enabled',
      ownerName: 'admin',
      definition: {
        scope: 'Encounter',
        threshold: '% overlap',
        logic: 'CHECK_OVERLAP(Encounter.start_date, Encounter.end_date)',
        description: 'Prevents overlapping encounter dates for a single patient record.',
      },
      provenance: {
        author: { name: 'admin' },
        createdAt: 'Apr 01, 2024',
        updatedAt: 'Apr 01, 2024',
      },
    },
    {
      id: '3',
      name: 'Two records should not conflict',
      type: 'Structural',
      severity: 'Warning',
      status: 'Enabled',
      ownerName: 'admin',
      definition: {
        scope: 'Patient',
        threshold: '≤ 0%',
        logic: 'CONFLICT_CHECK(Patient.*)',
        description: 'Flag records where identity attributes contradict existing golden records.',
      },
      provenance: {
        author: { name: 'admin' },
        createdAt: 'Apr 02, 2024',
        updatedAt: 'Apr 02, 2024',
      },
    },
    {
      id: '4',
      name: 'Two records;had exotic and;conflict',
      type: 'Identity',
      severity: 'Warning',
      status: 'Enabled',
      ownerName: 'admin',
      definition: {
        scope: 'Encounter',
        threshold: '> 5',
        logic: 'IDENTITY_VALIDATION(Encounter.patient_id)',
        description: 'Validation of patient IDs within encounter workflows.',
      },
      provenance: {
        author: { name: 'admin' },
        createdAt: 'Apr 03, 2024',
        updatedAt: 'Apr 03, 2024',
      },
    },
    {
      id: '5',
      name: 'Test records for next unique-wiRN-suale',
      type: 'Identity',
      severity: 'failing' as any,
      status: 'Enabled',
      ownerName: '1 days ago',
      definition: {
        scope: 'Graph-wide',
        threshold: '> 7%',
        logic: 'GRAPH_VALIDATION(*.unique_id)',
        description: 'Graph-wide integrity check for unique identifier strings.',
      },
      provenance: {
        author: { name: 'System' },
        createdAt: 'Apr 08, 2024',
        updatedAt: 'Apr 08, 2024',
      },
    },
    {
      id: '6',
      name: 'Two records should not alternate',
      type: 'Structural',
      severity: 'failing' as any,
      status: 'Enabled',
      ownerName: '2 days ago',
      definition: {
        scope: 'Patient',
        threshold: '0',
        logic: 'ALTERNATE_CHECK(Patient.status)',
        description: 'Identifies status flip-flopping in patient records.',
      },
      provenance: {
        author: { name: 'admin' },
        createdAt: 'Apr 07, 2024',
        updatedAt: 'Apr 07, 2024',
      },
    },
    {
      id: '7',
      name: 'Unifying flatal therapesits',
      type: 'Structural',
      severity: 'Info',
      status: 'Enabled',
      ownerName: '2 weeks ago',
      definition: {
        scope: 'Patient',
        threshold: 'Visual',
        logic: 'VISUAL_VALIDATION(Patient.*)',
        description: 'UI-driven manual validation requirement for specific patient flags.',
      },
      provenance: {
        author: { name: 'admin' },
        createdAt: 'Mar 25, 2024',
        updatedAt: 'Mar 25, 2024',
      },
    },
  ];

  constructor(
    private eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
  ) {
    this.dataSource = new MatTableDataSource(this.rules);
    this.setupFilterPredicate();
    this.initializeStatusMap();
  }

  ngOnInit(): void {
    this.eventStore.select('nf').subscribe(state => {
      if (state?.items?.payload?.theme) {
        this.theme = state.items.payload.theme;
      }
    });

    this.updateSummaryCounts();
    if (this.rules.length > 0) {
      this.selectedRule = this.rules[0];
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  /**
   * Initializes the internal state dictionary from the raw rules array.
   */
  private initializeStatusMap(): void {
    this.rules.forEach(rule => {
      this.ruleStatusMap[rule.id] = rule.status as 'Enabled' | 'Disabled';
    });
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

  setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: IRuleRecord, filter: string) => {
      const searchTerms = JSON.parse(filter);
      const searchStr = (searchTerms.search || '').trim().toLowerCase();

      // Dictionary lookup ensures the filter matches the current toggled state
      const currentStatus = this.ruleStatusMap[data.id] || data.status;

      const matchesDeepSearch = !searchStr || this.deepMatch(data, searchStr);
      const typeMatch = searchTerms.type === 'All' || data.type === searchTerms.type;
      const scopeMatch = searchTerms.scope === 'All' || data.definition.scope === searchTerms.scope;
      const statusMatch = searchTerms.status === 'Any' || currentStatus === searchTerms.status;

      return matchesDeepSearch && typeMatch && scopeMatch && statusMatch;
    };
  }

  applyRuleFilter(): void {
    const filterPayload = {
      search: this.ruleSearch.trim(),
      type: this.selectedFilter,
      scope: this.selectedScope,
      status: this.selectedStatus,
    };
    this.dataSource.filter = JSON.stringify(filterPayload);
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  private getActiveTheme(): 'light' | 'dark' {
    const isDark =
      document.body.classList.contains('dark-theme') ||
      document.body.classList.contains('dark-mode') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    return isDark ? 'dark' : 'light';
  }

  updateSummaryCounts() {
    const statuses = Object.values(this.ruleStatusMap);
    this.totalRules = this.rules.length;
    this.enabledCount = statuses.filter(s => s === 'Enabled').length;
    this.disabledCount = statuses.filter(s => s === 'Disabled').length;
  }

  onSelectRule(rule: IRuleRecord): void {
    this.selectedRule = rule;
  }

  addNewRule(): void {
    this.eventService.publish('RulesList', 'add_rule', {
      action: 'add_rule',
      theme: this.getActiveTheme(),
    });
  }

  editRule(): void {
    if (!this.selectedRule) return;
    this.eventService.publish('RulesList', 'edit_rule', {
      action: 'edit_rule',
      theme: this.getActiveTheme(),
      ruleData: this.selectedRule,
    });
  }

  viewHistory(): void {
    console.log('View history:', this.selectedRule);
  }

  runConflictTest(): void {
    console.log('Run conflict test:', this.selectedRule);
  }

  getSeverityClass(severity: string): string {
    const sev = severity.toLowerCase();
    if (sev === 'lo' || sev === 'low') return 'lo';
    if (sev === 'info') return 'info';
    if (sev === 'warning') return 'warning';
    if (sev === 'failing' || sev === 'critical' || sev === 'high') return 'failing';
    return 'info';
  }

  getSeverityIcon(severity: string): string {
    const sev = severity.toLowerCase();
    if (sev === 'lo' || sev === 'low') return 'check_circle';
    if (sev === 'info') return 'info';
    if (sev === 'warning') return 'warning';
    if (sev === 'failing' || sev === 'critical' || sev === 'high') return 'error';
    return 'info';
  }

  getSeverityColor(severity: string): string {
    const sev = severity.toLowerCase();
    if (sev === 'lo' || sev === 'low') return '#4caf50';
    if (sev === 'info') return '#2196f3';
    if (sev === 'warning') return '#ff9800';
    if (sev === 'failing' || sev === 'critical' || sev === 'high') return '#f44336';
    return '#2196f3';
  }

  /**
   * PERSISTENT TOGGLE LOGIC
   * Uses ruleStatusMap to ensure state is remembered.
   */
  toggleRuleStatus(): void {
    if (!this.selectedRule) return;

    // 1. Get current state from dictionary, fallback to record
    const currentStatus = this.ruleStatusMap[this.selectedRule.id] || this.selectedRule.status;
    const nextStatus = currentStatus === 'Enabled' ? 'Disabled' : 'Enabled';

    // 2. Update the Dictionary (The Source of Truth)
    this.ruleStatusMap[this.selectedRule.id] = nextStatus;

    // 3. Update the Record Object (For Binding)
    this.selectedRule.status = nextStatus;

    // 4. Update UI Components
    this.updateSummaryCounts();
    this.applyRuleFilter();

    // 5. Log transaction into the graph of events (MPI Context)
    const action = nextStatus === 'Enabled' ? 'enable_rule' : 'disable_rule';
    this.eventService.publish('RulesList', action, {
      action: action,
      ruleId: this.selectedRule.id,
      ruleName: this.selectedRule.name,
      theme: this.getActiveTheme(),
      timestamp: new Date().toISOString(),
      context: 'execute_merge_query_with_context', // Explicitly logging for golden record traceability
    });
  }

  disableRule(): void {
    // Consolidated to use toggle logic to ensure dictionary state is updated
    if (
      this.selectedRule &&
      (this.ruleStatusMap[this.selectedRule.id] || this.selectedRule.status) === 'Enabled'
    ) {
      this.toggleRuleStatus();
    }
  }
}
