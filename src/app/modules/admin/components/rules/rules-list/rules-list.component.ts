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
   * RECURSIVE DEEP MATCH (Logic from Normalization Component)
   * Ensures search strings match nested object properties and labels.
   */
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

  /**
   * UPDATED FILTER PREDICATE
   * Uses deepMatch to allow search by Severity, Status, and Nested Logic.
   */
  setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: IRuleRecord, filter: string) => {
      const searchTerms = JSON.parse(filter);
      const searchStr = (searchTerms.search || '').trim().toLowerCase();

      // DEEP SEARCH FIX: Verify if search term exists anywhere in the record
      const matchesDeepSearch = !searchStr || this.deepMatch(data, searchStr);

      const typeMatch = searchTerms.type === 'All' || data.type === searchTerms.type;
      const scopeMatch = searchTerms.scope === 'All' || data.definition.scope === searchTerms.scope;
      const statusMatch = searchTerms.status === 'Any' || data.status === searchTerms.status;

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
    this.totalRules = this.rules.length;
    this.enabledCount = this.rules.filter(r => r.status === 'Enabled').length;
    this.disabledCount = this.rules.filter(r => r.status === 'Disabled').length;
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

  disableRule(): void {
    if (this.selectedRule) {
      this.selectedRule.status = 'Disabled';
      this.updateSummaryCounts();
      this.applyRuleFilter();

      this.eventService.publish('RulesList', 'delete_rule', {
        action: 'delete_rule',
        theme: this.getActiveTheme(),
        ruleData: this.selectedRule,
      });
    }
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
}
