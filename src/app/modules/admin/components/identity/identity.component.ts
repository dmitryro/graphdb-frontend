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
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

// State & Services
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';

// --- INTERFACES FOR RECORD VIEW LOGIC ---
export interface TimelineEvent {
  type: 'visit' | 'lab' | 'note' | 'med' | 'merge';
  time: string;
  title: string;
  location: string;
  provider: string;
  sourceSystem: string;
  status?: string;
  value?: string;
  unit?: string;
  isAbnormal?: boolean;
}

export interface TimelineGroup {
  date: string;
  summary: string;
  isExpanded: boolean;
  events: TimelineEvent[];
}

export interface SourceCoverage {
  name: string;
  count: number;
  trend: string;
  icon: string;
}

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

  // Buffers for manual filtering
  private originalIndexData: any[] = [];
  private originalMergeData: any[] = [];
  private originalConfidenceData: any[] = [];

  // Selection State
  selectedRecord: any | null = null;
  selectedMergeCandidate: any | null = null;
  selectedConfidenceRecord: any | null = null;
  selectedPatient: any = {
    photoUrl: '',
    name: '',
    mrn: '',
    upi: '',
    dob: '',
    age: '',
    gender: '',
    masterName: '',
  };

  // ViewChildren for Sorting and Pagination
  @ViewChild('indexSort') indexSort!: MatSort;
  @ViewChild('indexPaginator') indexPaginator!: MatPaginator;
  @ViewChild('mergeSort') mergeSort!: MatSort;
  @ViewChild('mergePaginator') mergePaginator!: MatPaginator;
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
  confidenceSearch = '';
  confidenceSelectedStatus = 'All';
  confidenceSelectedImpact = 'All';
  confidenceSelectedDelta = 'All';
  confidenceThreshold = 5.4;
  warningThreshold = 75;
  showBelowWarningBanner = true;

  // PROPERTIES FOR TIMELINE LOGIC
  allExpanded = true;
  timelineGroups: TimelineGroup[] = [];
  sourceCoverage: SourceCoverage[] = [];

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
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.store.select('nf').subscribe(state => {
        if (state?.items?.payload?.theme) {
          this.theme = state.items.payload.theme;
        }
      }),
    );
    this.loadInitialMpiData();
    this.initTimelineData();
    this.initSourceCoverage();
  }

  ngAfterViewInit(): void {
    this.rebindDataSources();
    this.cdr.detectChanges();
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

  // --- HYDRATION LOGIC: Ensure Record View (Tab 3) stays in sync ---
  private hydrateRecordView(record: any): void {
    if (!record) return;

    // Standardize data from different sources (Index, Merge, or Confidence)
    this.selectedPatient = {
      ...record,
      masterName: record.masterName || record.candidate || 'Unknown Identity',
      mrn: record.externalIds
        ? String(record.externalIds).split(',')[0]
        : record.internalId || 'N/A',
      upi: record.internalId || 'N/A',
      // Ensure visual assets carry over
      photoUrl: record.avatar || record.avatarA || this.selectedPatient.photoUrl,
    };

    console.log('[UI STATE] Record View hydrated with:', this.selectedPatient.upi);
  }

  onTabChange(event: any): void {
    this.activeTabIndex = event.index;

    // We removed the auto-reset to firstRecord here.
    // Tab 3 will now persist the last clicked record from any other tab.

    setTimeout(() => {
      this.rebindDataSources();
      this.cdr.detectChanges();
    }, 0);
  }

  // --- SELECTION HANDLERS ---

  onSelectRecord(record: any): void {
    // Toggle logic for the side panel in Index tab
    this.selectedRecord = this.selectedRecord?.id === record.id ? null : record;

    // Update the shared Record View state
    this.hydrateRecordView(record);
  }

  onSelectMerge(candidate: any): void {
    // Toggle logic for the side panel in Merge tab
    this.selectedMergeCandidate =
      this.selectedMergeCandidate?.id === candidate.id ? null : candidate;

    // Update the shared Record View state
    this.hydrateRecordView(candidate);
  }

  onSelectConfidenceRecord(record: any): void {
    // Toggle logic for the side panel in Confidence tab
    this.selectedConfidenceRecord = this.selectedConfidenceRecord?.id === record.id ? null : record;

    // Update the shared Record View state
    this.hydrateRecordView(record);
  }

  // --- MANUAL FILTER IMPLEMENTATIONS ---

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

  public applyIndexFilter(): void {
    let filtered = [...this.originalIndexData];
    const search = (this.indexSearch || '').toLowerCase().trim();

    if (search) {
      filtered = filtered.filter(item => this.deepMatch(item, search));
    }

    if (this.selectedSource !== 'All') {
      filtered = filtered.filter(item => item.sourceList?.includes(this.selectedSource));
    }

    if (this.selectedStatus !== 'All') {
      filtered = filtered.filter(item => item.status === this.selectedStatus);
    }

    if (this.selectedConfidence !== 'All') {
      filtered = filtered.filter(item => item.confidence === this.selectedConfidence);
    }

    this.indexDataSource.data = filtered;
    if (this.indexPaginator) this.indexPaginator.firstPage();
    this.cdr.detectChanges();
  }

  public applyMergeFilter(): void {
    let filtered = [...this.originalMergeData];
    const search = (this.mergeSearch || '').toLowerCase().trim();

    if (search) {
      filtered = filtered.filter(item => this.deepMatch(item, search));
    }

    if (this.mergeSelectedStatus !== 'All') {
      filtered = filtered.filter(item => item.status === this.mergeSelectedStatus);
    }

    if (this.mergeSelectedDelta === 'Positive') {
      filtered = filtered.filter(item => item.delta > 0);
    }

    this.mergeDataSource.data = filtered;
    if (this.mergePaginator) this.mergePaginator.firstPage();
    this.cdr.detectChanges();
  }

  public applyConfidenceFilter(): void {
    let filtered = [...this.originalConfidenceData];
    const search = (this.confidenceSearch || '').toLowerCase().trim();

    if (search) {
      filtered = filtered.filter(item => this.deepMatch(item, search));
    }

    if (this.confidenceSelectedStatus === 'Above Threshold') {
      filtered = filtered.filter(item => item.score >= 75);
    } else if (this.confidenceSelectedStatus === 'Below Threshold') {
      filtered = filtered.filter(item => item.score < this.warningThreshold);
    }

    if (this.confidenceSelectedImpact === 'High') {
      filtered = filtered.filter(item => item.impact > 3);
    }

    if (this.confidenceSelectedDelta === 'Increasing') {
      filtered = filtered.filter(item => item.trendValue > 0);
    } else if (this.confidenceSelectedDelta === 'Decreasing') {
      filtered = filtered.filter(item => item.trendValue < 0);
    }

    const { start, end } = this.range.value;
    if (start || end) {
      const startBoundary = start ? dayjs(start).subtract(1, 'day').startOf('day') : null;
      const endBoundary = end ? dayjs(end).endOf('day') : null;

      filtered = filtered.filter(item => {
        const itemDate = dayjs(item.lastUpdated || item.lastActivityTimestamp || new Date());
        if (startBoundary && !itemDate.isAfter(startBoundary)) return false;
        if (endBoundary && itemDate.isAfter(endBoundary)) return false;
        return true;
      });
    }

    this.confidenceDataSource.data = filtered;
    if (this.confidencePaginator) this.confidencePaginator.firstPage();
    this.cdr.detectChanges();
  }

  // --- UI SETTERS ---

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
  setMergeStatus(val: string): void {
    this.mergeSelectedStatus = val;
    this.applyMergeFilter();
  }
  setMergeDelta(val: string): void {
    this.mergeSelectedDelta = val;
    this.applyMergeFilter();
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
    this.cdr.detectChanges();
  }

  resolveConfidenceRecord(record: any): void {
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

  getConfidenceLevel(score: number): string {
    if (score >= 85) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  }

  private initTimelineData(): void {
    this.timelineGroups = [
      {
        date: 'April 18, 2024',
        summary: '11:15 AM - 12:30 PM • MediBridge Clinic • Patel',
        isExpanded: true,
        events: [
          {
            type: 'visit',
            time: '11:15 AM',
            title: 'Scheduled Visit',
            location: 'MediBridge Clinic',
            provider: 'Patel',
            sourceSystem: 'Epic Health Network',
          },
          {
            type: 'lab',
            time: '11:45 AM',
            title: 'QuestQuant CBC / Differential',
            location: 'Lab',
            provider: 'System',
            sourceSystem: 'QuestLab Systems',
            value: '20.9',
            unit: 'Abnormal',
            isAbnormal: true,
          },
        ],
      },
      {
        date: 'March 10, 2024',
        summary: '09:00 AM • Telehealth • Richards',
        isExpanded: true,
        events: [
          {
            type: 'note',
            time: '09:00 AM',
            title: 'Clinical Progress Note',
            location: 'Remote',
            provider: 'Richards',
            sourceSystem: 'AthenaClarity EMR',
          },
        ],
      },
    ];
  }

  private initSourceCoverage(): void {
    this.sourceCoverage = [
      { name: 'Epic Health Network', count: 18, trend: '2y', icon: 'local_hospital' },
      { name: 'MediBridge Clinic', count: 21, trend: '1y', icon: 'medical_services' },
      { name: 'CSV Import', count: 20, trend: '2m', icon: 'description' },
    ];
  }

  toggleAllGroups(): void {
    this.allExpanded = !this.allExpanded;
    this.timelineGroups.forEach(g => (g.isExpanded = this.allExpanded));
    this.cdr.detectChanges();
  }

  // CORE REQUIREMENT: Transaction Traceability [cite: 2025-12-20, 2026-01-01]
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
    this.cdr.detectChanges();
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
        photoUrl: this.avatarLinks[i % this.avatarLinks.length],
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
        conflicts: [{ type: 'Phone mismatch', details: 'Mobile vs Work' }],
      });
    }

    this.originalIndexData = [...indexRecords];
    this.originalMergeData = [...mergeRecords];
    this.indexDataSource.data = indexRecords;
    this.mergeDataSource.data = mergeRecords;

    const confidenceList = indexRecords.map((r, idx) => {
      return {
        id: `conf-${idx}`,
        masterName: r.masterName,
        avatar: r.avatar,
        internalId: r.internalId,
        score: Math.floor(Math.random() * (99 - 40 + 1)) + 40,
        trendValue: (Math.random() - 0.5) * 0.2,
        trendPercent: 70,
        lastActivityDisplay: '3 days',
        source: r.sourceList[0] || 'CSV Import',
        impact: r.impact,
        dateOfBirth: 'May 7, 1948 (93)',
        gender: r.gender,
        activities: [{ source: 'QuestLab Systems', icon: 'biotech', time: '1 hour ago' }],
        lastActivityTimestamp: dayjs().subtract(idx, 'day').toISOString(),
      };
    });

    this.originalConfidenceData = [...confidenceList];
    this.confidenceDataSource.data = confidenceList;

    // Initial default hydration
    if (indexRecords.length > 0) {
      this.hydrateRecordView(indexRecords[0]);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
