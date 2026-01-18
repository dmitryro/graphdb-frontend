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
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

// State & Services
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';

export function getIdentityPaginatorIntl() {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.itemsPerPageLabel = 'Records per page:';
  paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) return `0 of ${length}`;
    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, length);
    return `${startIndex + 1} – ${endIndex} of ${length}`;
  };
  return paginatorIntl;
}

@Component({
  selector: 'app-identity',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTabsModule,
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
  templateUrl: './identity.component.html',
  styleUrls: ['./identity.component.scss'],
  providers: [{ provide: MatPaginatorIntl, useValue: getIdentityPaginatorIntl() }, EventService],
})
export class IdentityComponent implements OnInit, AfterViewInit, OnDestroy {
  // Tab Management
  activeTabIndex = 0;
  selectedEnv = 'Production';
  theme: 'light' | 'dark' = 'dark';
  private subscriptions = new Subscription();
  public pageTitle = 'Identity & Records';
  public pageLegend = 'Resolve and govern cross-source identities and longitudinal records.';

  // Data Sources
  indexDataSource = new MatTableDataSource<any>([]);
  mergeDataSource = new MatTableDataSource<any>([]);
  confidenceDataSource = new MatTableDataSource<any>([]);

  // Selection State
  selectedRecord: any | null = null;
  selectedMergeCandidate: any | null = null;

  // ViewChildren restored for Sorting and Pagination
  @ViewChild('indexSort') indexSort!: MatSort;
  @ViewChild('indexPaginator') indexPaginator!: MatPaginator;
  @ViewChild('mergeSort') mergeSort!: MatSort;
  @ViewChild('mergePaginator') mergePaginator!: MatPaginator;
  // Add ViewChild for confidence tab
  @ViewChild('confidenceSort') confidenceSort!: MatSort;
  @ViewChild('confidencePaginator') confidencePaginator!: MatPaginator;

  // Search & Filter Properties (Index Tab)
  indexSearch = '';
  selectedSource = 'All';
  selectedStatus = 'All';
  selectedConfidence = 'All';

  // Search & Filter Properties (Merge Tab)
  mergeSearch = '';
  mergeSelectedStatus = 'All';
  mergeSelectedDelta = 'Any';

  // Confidence Tab State
  selectedConfidenceRecord: any | null = null;
  confidenceSearch = '';
  confidenceSelectedStatus = 'All';
  confidenceSelectedImpact = 'All';
  confidenceSelectedDelta = 'All';
  confidenceThreshold = 5.4;
  warningThreshold = 75;
  showBelowWarningBanner = true;

  // Filter Options
  sources = [
    'Epic Health Network',
    'QuestLab Systems',
    'ClaimsCare Solutions',
    'HealthKit Devices',
    'CSV File Import',
    'AthenaClarity EMR',
  ];
  statuses = ['Stable', 'Potential Conflict', 'Requires Review', 'Recently Changed'];
  confidences = ['High', 'Medium', 'Below Threshold'];

  // Table Columns
  indexColumns: string[] = [
    'masterName',
    'internalId',
    'externalIds',
    'sources',
    'status',
    'confidence',
    'actions',
  ];
  mergeColumns = ['candidate', 'impact', 'status', 'delta', 'conflictEvents', 'actions'];

  confidenceColumns = ['masterName', 'score', 'trend', 'lastActivity', 'source', 'actions'];

  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  historyData = [
    {
      hash: '0xabc123',
      relativeTime: '2 hours ago',
      author: 'system (auto-merge)',
      subject: 'Alice Mellinger (MPI-9901)',
    },
    {
      hash: '0xdef456',
      relativeTime: '5 hours ago',
      author: 'admin_user',
      subject: 'Victoria F. Beckert (MPI-1024)',
    },
    {
      hash: '0xghi789',
      relativeTime: 'Yesterday',
      author: 'system',
      subject: 'Jameson R. Smith (MPI-5562)',
    },
  ];

  // Avatar Assets
  private avatarLinks = [
    'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    'https://i.pravatar.cc/150?u=a04258114e29026702d',
    'https://i.pravatar.cc/150?u=a042581f4e29026708c',
    'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    'https://i.pravatar.cc/150?u=a04258a2462d826712d',
    'https://i.pravatar.cc/150?u=a042581f4e29026704e',
    'https://i.pravatar.cc/150?u=a04258114e29026302d',
    'https://i.pravatar.cc/150?u=a048581f4e29026708c',
  ];

  constructor(
    private store: Store<{ nf: EventState }>,
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
  ) {
    this.setupFilterPredicates();
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.store.select('nf').subscribe(state => {
        if (state?.items?.payload?.theme) {
          this.theme = state.items.payload.theme;
        }
      }),
    );
    this.loadInitialMpiData();
  }

  ngAfterViewInit(): void {
    this.rebindDataSources();
  }

  private rebindDataSources(): void {
    if (this.activeTabIndex === 0) {
      this.indexDataSource.sort = this.indexSort;
      this.indexDataSource.paginator = this.indexPaginator;
      this.applyIndexFilter();
    } else if (this.activeTabIndex === 1) {
      this.mergeDataSource.sort = this.mergeSort;
      this.mergeDataSource.paginator = this.mergePaginator;
      this.applyMergeFilter();
    } else if (this.activeTabIndex === 2) {
      this.confidenceDataSource.sort = this.confidenceSort;
      this.confidenceDataSource.paginator = this.confidencePaginator;
      this.applyConfidenceFilter();
    }
    this.cdr.detectChanges();
  }

  getConfidenceLevel(score: number): string {
    if (score >= 85) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  onTabChange(event: any): void {
    this.activeTabIndex = event.index;
    this.selectedRecord = null;
    this.selectedMergeCandidate = null;
    this.selectedConfidenceRecord = null;
    setTimeout(() => this.rebindDataSources(), 0);
  }

  private setupFilterPredicates(): void {
    // Index Tab Predicate
    this.indexDataSource.filterPredicate = (data, filter) => {
      const searchTerms = JSON.parse(filter);
      const matchesSearch =
        !searchTerms.search ||
        data.masterName.toLowerCase().includes(searchTerms.search) ||
        data.internalId.toLowerCase().includes(searchTerms.search) ||
        data.externalIds.toLowerCase().includes(searchTerms.search);
      const matchesSource =
        searchTerms.source === 'All' || data.sourceList.includes(searchTerms.source);
      const matchesStatus = searchTerms.status === 'All' || data.status === searchTerms.status;
      const matchesConfidence =
        searchTerms.confidence === 'All' || data.confidence === searchTerms.confidence;
      return matchesSearch && matchesSource && matchesStatus && matchesConfidence;
    };

    // Merge Tab Predicate
    this.mergeDataSource.filterPredicate = (data, filter) => {
      const searchTerms = JSON.parse(filter);
      const matchesSearch =
        !searchTerms.search || data.candidate.toLowerCase().includes(searchTerms.search);
      const matchesStatus = searchTerms.status === 'All' || data.status === searchTerms.status;
      const matchesDelta =
        searchTerms.delta === 'Any' || (searchTerms.delta === 'Positive' ? data.delta > 0 : true);
      return matchesSearch && matchesStatus && matchesDelta;
    };

    // Add to setupFilterPredicates() method:
    this.confidenceDataSource.filterPredicate = (data, filter) => {
      const searchTerms = JSON.parse(filter);
      const matchesSearch =
        !searchTerms.search || data.masterName.toLowerCase().includes(searchTerms.search);
      const matchesStatus =
        searchTerms.status === 'All' ||
        (searchTerms.status === 'Above Threshold'
          ? data.score >= 75
          : data.score < this.warningThreshold);
      const matchesImpact =
        searchTerms.impact === 'All' ||
        (searchTerms.impact === 'High' ? data.impact > 3 : data.impact <= 3);
      const matchesDelta =
        searchTerms.delta === 'All' ||
        (searchTerms.delta === 'Increasing' ? data.trendValue > 0 : data.trendValue < 0);
      return matchesSearch && matchesStatus && matchesImpact && matchesDelta;
    };
  }

  // INDEX FILTERS
  applyIndexFilter(): void {
    const filterPayload = {
      search: this.indexSearch.trim().toLowerCase(),
      source: this.selectedSource,
      status: this.selectedStatus,
      confidence: this.selectedConfidence,
    };
    this.indexDataSource.filter = JSON.stringify(filterPayload);
  }

  setSourceFilter(val: string): void {
    this.selectedSource = val;
    this.applyIndexFilter();
  }
  setStatusFilter(val: string): void {
    this.selectedStatus = val;
    this.applyIndexFilter();
  }
  setConfidenceFilter(val: string): void {
    this.selectedConfidence = val;
    this.applyIndexFilter();
  }

  // MERGE FILTERS
  applyMergeFilter(): void {
    const filterPayload = {
      search: this.mergeSearch.trim().toLowerCase(),
      status: this.mergeSelectedStatus,
      delta: this.mergeSelectedDelta,
    };
    this.mergeDataSource.filter = JSON.stringify(filterPayload);
  }

  setMergeStatus(val: string): void {
    this.mergeSelectedStatus = val;
    this.applyMergeFilter();
  }
  setMergeDelta(val: string): void {
    this.mergeSelectedDelta = val;
    this.applyMergeFilter();
  }

  onSelectRecord(record: any): void {
    this.selectedRecord = this.selectedRecord?.id === record.id ? null : record;
  }

  onSelectMerge(candidate: any): void {
    this.selectedMergeCandidate =
      this.selectedMergeCandidate?.id === candidate.id ? null : candidate;
  }

  // Add filter methods:
  applyConfidenceFilter(): void {
    const filterPayload = {
      search: this.confidenceSearch.trim().toLowerCase(),
      status: this.confidenceSelectedStatus,
      impact: this.confidenceSelectedImpact,
      delta: this.confidenceSelectedDelta,
    };
    this.confidenceDataSource.filter = JSON.stringify(filterPayload);
  }

  setConfidenceStatusFilter(val: string): void {
    this.confidenceSelectedStatus = val;
    this.applyConfidenceFilter();
  }

  setConfidenceImpactFilter(val: string): void {
    this.confidenceSelectedImpact = val;
    this.applyConfidenceFilter();
  }

  setConfidenceDeltaFilter(val: string): void {
    this.confidenceSelectedDelta = val;
    this.applyConfidenceFilter();
  }

  adjustThreshold(direction: 'add' | 'subtract'): void {
    if (direction === 'add' && this.confidenceThreshold < 10) {
      this.confidenceThreshold = Math.round((this.confidenceThreshold + 0.1) * 10) / 10;
    } else if (direction === 'subtract' && this.confidenceThreshold > 0.1) {
      this.confidenceThreshold = Math.round((this.confidenceThreshold - 0.1) * 10) / 10;
    }
  }

  onSelectConfidenceRecord(record: any): void {
    this.selectedConfidenceRecord = this.selectedConfidenceRecord?.id === record.id ? null : record;
  }

  resolveConfidenceRecord(record: any): void {
    console.log('Resolving confidence record:', record);
    this.execute_merge_query_with_context(
      'CONFIDENCE_RESOLVE',
      record.internalId,
      record.masterName,
    );
  }

  getScoreClass(score: number): string {
    if (score >= 85) return 'score-high';
    if (score >= 60) return 'score-medium';
    return 'score-low';
  }

  execute_merge_query_with_context(
    pattern: string,
    patientId: string,
    goldenRecordName: string,
  ): void {
    const context = {
      action: 'EXECUTE_MERGE',
      pattern: pattern,
      logic: 'execute_merge_query_with_context',
      environment: this.selectedEnv,
      timestamp: new Date().toISOString(),
      patientId: patientId,
      goldenRecord: goldenRecordName,
    };

    this.eventService.publish('IdentityModule', 'merge_executed', context);
    console.log('[GRAPH LOG] Transaction verified in Graph of Events:', context);

    this.historyData.unshift({
      hash: '0x' + Math.random().toString(16).slice(2, 8),
      relativeTime: 'Just now',
      author: 'admin_user',
      subject: `${goldenRecordName} (${patientId})`,
    });
  }

  executeMerge(): void {
    if (this.selectedRecord) {
      this.execute_merge_query_with_context(
        'MERGE_RESIDENT_PATTERN',
        this.selectedRecord.internalId,
        this.selectedRecord.masterName,
      );
    } else if (this.selectedMergeCandidate) {
      this.execute_merge_query_with_context(
        'SUGGESTED_MERGE_PATTERN',
        'MPI-VAR',
        this.selectedMergeCandidate.candidate,
      );
    }
  }

  private loadInitialMpiData(): void {
    const indexRecords = [];
    const mergeRecords = [];
    const firstNames = [
      'James',
      'Mary',
      'Robert',
      'Patricia',
      'John',
      'Jennifer',
      'Michael',
      'Linda',
      'William',
      'Elizabeth',
    ];
    const lastNames = [
      'Smith',
      'Johnson',
      'Williams',
      'Brown',
      'Jones',
      'Garcia',
      'Miller',
      'Davis',
      'Rodriguez',
      'Martinez',
    ];

    for (let i = 1; i <= 40; i++) {
      const fIdx = i % firstNames.length;
      const lIdx = (i + 3) % lastNames.length;
      const shuffledSources = [...this.sources].sort(() => 0.5 - Math.random());
      const selectedSources = shuffledSources.slice(0, (i % 4) + 1);

      indexRecords.push({
        id: `rec-${i}`,
        masterName: `${firstNames[fIdx]} ${lastNames[lIdx]}`,
        avatar: this.avatarLinks[i % this.avatarLinks.length],
        internalId: `MPI-${1000 + i}`,
        externalIds: `MRN${5000 + i}, EHR-${i * 2}`,
        sourceList: selectedSources,
        impact: selectedSources.length,
        status: this.statuses[i % this.statuses.length],
        confidence: this.confidences[i % this.confidences.length],
        lastUpdated: '2026-01-10',
        dob: 'Sep 25, 1956',
        age: 69,
        gender: i % 2 === 0 ? 'Male' : 'Female',
      });
    }

    const mergeStatuses = ['Pending', 'Suggested', 'Requires Review'];
    for (let j = 1; j <= 35; j++) {
      const nameA = `${firstNames[j % 10]} ${lastNames[j % 10]}`;
      const nameB = `${firstNames[(j + 2) % 10]} ${lastNames[j % 10]}`;
      mergeRecords.push({
        id: `mrg-${j}`,
        candidate: `${nameA} + ${nameB}`,
        avatarA: this.avatarLinks[j % this.avatarLinks.length],
        avatarB: this.avatarLinks[(j + 2) % this.avatarLinks.length],
        impact: (j % 5) + 2,
        status: mergeStatuses[j % 3],
        delta: Math.floor(Math.random() * 15) + 1,
        ruleTrigger: 'Threshold Match',
        conflicts: [
          { type: 'Phone mismatch', details: 'Mobile vs Work' },
          { type: 'Address delta', details: 'St. vs Ave' },
        ],
      });
    }

    this.indexDataSource.data = indexRecords;
    this.mergeDataSource.data = mergeRecords;

    // Replace the existing confidenceDataSource data population in loadInitialMpiData():
    this.confidenceDataSource.data = indexRecords.map((r, idx) => {
      const score = Math.floor(Math.random() * (99 - 40 + 1)) + 40;
      const trendValue = (Math.random() - 0.5) * 0.2;
      const activities = [
        {
          source: 'QuestLab Systems',
          icon: 'biotech',
          iconClass: 'quest',
          status: '-- --',
          time: '1 hour ago',
        },
        {
          source: 'Epic Health Network',
          icon: 'local_hospital',
          iconClass: 'epic',
          status: '',
          time: '3 months ago',
        },
        {
          source: 'CSV Import',
          icon: 'description',
          iconClass: 'csv',
          status: '',
          time: '3 months ago',
        },
      ];

      return {
        id: `conf-${idx}`,
        masterName: r.masterName,
        avatar: r.avatar,
        internalId: r.internalId,
        score: score,
        trendValue: trendValue,
        trendPercent: Math.round(score - 10),
        lastActivityDisplay: idx % 5 === 0 ? '3 days' : idx % 3 === 0 ? '2 weeks' : '4 days',
        source: r.sourceList[0] || 'CSV Import',
        impact: r.impact,
        dateOfBirth: 'May 7, 1948 (93)',
        gender: r.gender,
        activities: activities,
      };
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
