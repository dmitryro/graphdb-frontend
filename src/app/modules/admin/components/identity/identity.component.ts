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
  mergeSelectedImpact = 'All';
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

  // Gender-Separated Avatar Assets - Using UI Avatars with proper gender indicators
  private maleAvatars = [
    'https://ui-avatars.com/api/?name=James+Smith&background=4A90E2&color=fff&size=150&bold=true',
    'https://ui-avatars.com/api/?name=Robert+Johnson&background=2C3E50&color=fff&size=150&bold=true',
    'https://ui-avatars.com/api/?name=John+Williams&background=34495E&color=fff&size=150&bold=true',
    'https://ui-avatars.com/api/?name=Michael+Brown&background=16A085&color=fff&size=150&bold=true',
    'https://ui-avatars.com/api/?name=William+Jones&background=27AE60&color=fff&size=150&bold=true',
    'https://ui-avatars.com/api/?name=David+Garcia&background=2980B9&color=fff&size=150&bold=true',
    'https://ui-avatars.com/api/?name=Richard+Miller&background=8E44AD&color=fff&size=150&bold=true',
    'https://ui-avatars.com/api/?name=Joseph+Davis&background=C0392B&color=fff&size=150&bold=true',
  ];

  private femaleAvatars = [
    'https://ui-avatars.com/api/?name=Mary+Smith&background=E74C3C&color=fff&size=150&bold=true',
    'https://ui-avatars.com/api/?name=Patricia+Johnson&background=9B59B6&color=fff&size=150&bold=true',
    'https://ui-avatars.com/api/?name=Jennifer+Williams&background=E91E63&color=fff&size=150&bold=true',
    'https://ui-avatars.com/api/?name=Linda+Brown&background=F39C12&color=fff&size=150&bold=true',
    'https://ui-avatars.com/api/?name=Elizabeth+Jones&background=1ABC9C&color=fff&size=150&bold=true',
    'https://ui-avatars.com/api/?name=Barbara+Garcia&background=3498DB&color=fff&size=150&bold=true',
    'https://ui-avatars.com/api/?name=Susan+Miller&background=9C27B0&color=fff&size=150&bold=true',
    'https://ui-avatars.com/api/?name=Jessica+Davis&background=FF5722&color=fff&size=150&bold=true',
  ];

  // Name pools separated by gender
  private maleFirstNames = [
    'James',
    'Robert',
    'John',
    'Michael',
    'William',
    'David',
    'Richard',
    'Joseph',
    'Thomas',
    'Charles',
  ];
  private femaleFirstNames = [
    'Mary',
    'Patricia',
    'Jennifer',
    'Linda',
    'Elizabeth',
    'Barbara',
    'Susan',
    'Jessica',
    'Sarah',
    'Karen',
  ];
  private lastNames = [
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

  // --- GENDER-AWARE AVATAR HELPER ---
  private getGenderAppropriateAvatar(gender: string, firstName: string, lastName: string): string {
    // Generate avatar based on actual name for consistency
    const name = `${firstName}+${lastName}`;
    const backgrounds =
      gender === 'Female'
        ? ['E74C3C', '9B59B6', 'E91E63', 'F39C12', '1ABC9C', '3498DB', '9C27B0', 'FF5722']
        : ['4A90E2', '2C3E50', '34495E', '16A085', '27AE60', '2980B9', '8E44AD', 'C0392B'];

    const bgColor =
      backgrounds[Math.abs(firstName.charCodeAt(0) + lastName.charCodeAt(0)) % backgrounds.length];

    return `https://ui-avatars.com/api/?name=${name}&background=${bgColor}&color=fff&size=150&bold=true`;
  }

  // --- HYDRATION LOGIC: Ensure Record View (Tab 3) stays in sync ---
  private hydrateRecordView(record: any): void {
    if (!record) return;

    this.selectedPatient = {
      ...record,
      masterName: record.masterName || record.candidate || 'Unknown Identity',
      mrn: record.externalIds
        ? String(record.externalIds).split(',')[0]
        : record.internalId || 'N/A',
      upi: record.internalId || 'N/A',
      photoUrl: record.avatar || record.avatarA || this.selectedPatient.photoUrl,
    };

    console.log('[UI STATE] Record View hydrated with:', this.selectedPatient.upi);
  }

  onTabChange(event: any): void {
    this.activeTabIndex = event.index;

    setTimeout(() => {
      this.rebindDataSources();
      this.cdr.detectChanges();
    }, 0);
  }

  // --- SELECTION HANDLERS ---

  onSelectRecord(record: any): void {
    this.selectedRecord = this.selectedRecord?.id === record.id ? null : record;
    this.hydrateRecordView(record);
  }

  onSelectMerge(candidate: any): void {
    this.selectedMergeCandidate =
      this.selectedMergeCandidate?.id === candidate.id ? null : candidate;
    this.hydrateRecordView(candidate);
  }

  onSelectConfidenceRecord(record: any): void {
    this.selectedConfidenceRecord = this.selectedConfidenceRecord?.id === record.id ? null : record;
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

    // 1. Search Filter
    if (search) {
      filtered = filtered.filter(item => this.deepMatch(item, search));
    }

    // 2. Status Filter
    if (this.mergeSelectedStatus !== 'All') {
      filtered = filtered.filter(item => item.status === this.mergeSelectedStatus);
    }

    // 3. Impact Filter (Matches the new menu)
    if (this.mergeSelectedImpact !== 'All') {
      filtered = filtered.filter(item => {
        // Define thresholds based on the 'impact' number in your data
        if (this.mergeSelectedImpact === 'High') return item.impact >= 50;
        if (this.mergeSelectedImpact === 'Medium') return item.impact >= 10 && item.impact < 50;
        if (this.mergeSelectedImpact === 'Low') return item.impact < 10;
        return true;
      });
    }

    // 4. Delta Filter
    if (this.mergeSelectedDelta !== 'Any') {
      if (this.mergeSelectedDelta === 'Positive') {
        filtered = filtered.filter(item => item.delta > 0);
      } else if (this.mergeSelectedDelta === 'Negative') {
        filtered = filtered.filter(item => item.delta < 0);
      } else if (this.mergeSelectedDelta === 'Above Threshold') {
        filtered = filtered.filter(item => item.delta >= 80); // Example threshold
      } else if (this.mergeSelectedDelta === 'Below Threshold') {
        filtered = filtered.filter(item => item.delta < 80);
      }
    }

    // 5. Update DataSource and Reset Paging
    this.mergeDataSource.data = filtered;

    if (this.mergePaginator) {
      this.mergePaginator.firstPage();
    }

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
    } else if (this.confidenceSelectedStatus === 'Below Warning') {
      filtered = filtered.filter(item => item.score < this.warningThreshold);
    }

    if (this.confidenceSelectedImpact === 'High') {
      filtered = filtered.filter(item => item.impact > 3);
    } else if (this.confidenceSelectedImpact === 'Medium') {
      filtered = filtered.filter(item => item.impact <= 3);
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
  setMergeImpact(val: string): void {
    this.mergeSelectedImpact = val;
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

    // Create 40 records with proper gender matching
    for (let i = 0; i < 40; i++) {
      // Alternate genders
      const isFemale = i % 2 === 0;
      const gender = isFemale ? 'Female' : 'Male';

      // Select appropriate name pool
      const firstNames = isFemale ? this.femaleFirstNames : this.maleFirstNames;
      const firstName = firstNames[i % firstNames.length];
      const lastName = this.lastNames[(i + 3) % this.lastNames.length];

      // Get gender-appropriate avatar
      const avatar = this.getGenderAppropriateAvatar(gender, firstName, lastName);

      const shuffledSources = [...this.sources].sort(() => 0.5 - Math.random());
      const selectedSources = shuffledSources.slice(0, (i % 4) + 1);

      indexRecords.push({
        id: `rec-${i + 1}`,
        masterName: `${firstName} ${lastName}`,
        avatar: avatar,
        internalId: `MPI-${1001 + i}`,
        externalIds: `MRN${5001 + i}, EHR-${(i + 1) * 2}`,
        sourceList: selectedSources,
        impact: selectedSources.length,
        status: this.statuses[i % this.statuses.length],
        confidence: this.confidences[i % this.confidences.length],
        lastUpdated: '2026-01-10',
        dob: 'Sep 25, 1956',
        age: 69,
        gender: gender,
        photoUrl: avatar,
      });
    }

    const mergeStatuses = ['Stable', 'Potential Conflict', 'Recently Changed', 'Requires Review'];
    for (let j = 0; j < 35; j++) {
      const isFemaleA = j % 2 === 0;
      const isFemaleB = (j + 1) % 2 === 0;

      const firstNamesA = isFemaleA ? this.femaleFirstNames : this.maleFirstNames;
      const firstNamesB = isFemaleB ? this.femaleFirstNames : this.maleFirstNames;

      const firstNameA = firstNamesA[j % firstNamesA.length];
      const lastNameA = this.lastNames[j % this.lastNames.length];
      const firstNameB = firstNamesB[(j + 2) % firstNamesB.length];
      const lastNameB = this.lastNames[j % this.lastNames.length];

      const nameA = `${firstNameA} ${lastNameA}`;
      const nameB = `${firstNameB} ${lastNameB}`;

      const avatarA = this.getGenderAppropriateAvatar(
        isFemaleA ? 'Female' : 'Male',
        firstNameA,
        lastNameA,
      );
      const avatarB = this.getGenderAppropriateAvatar(
        isFemaleB ? 'Female' : 'Male',
        firstNameB,
        lastNameB,
      );

      mergeRecords.push({
        id: `mrg-${j + 1}`,
        candidate: `${nameA} + ${nameB}`,
        avatarA: avatarA,
        avatarB: avatarB,
        impact: (j % 5) + 2,
        status: mergeStatuses[j % 3],
        delta: Math.floor(Math.random() * 15) + 1,
        conflictEvents: Math.floor(Math.random() * 5),
        ruleTrigger: 'Threshold Match',
        conflicts: [{ type: 'Phone mismatch', details: 'Mobile vs Work' }],
        genderA: isFemaleA ? 'Female' : 'Male',
        genderB: isFemaleB ? 'Female' : 'Male',
      });
    }

    this.originalIndexData = [...indexRecords];
    this.originalMergeData = [...mergeRecords];
    this.indexDataSource.data = indexRecords;
    this.mergeDataSource.data = mergeRecords;

    // Create confidence records with proper gender matching
    const confidenceList = indexRecords.map((r, idx) => {
      const score = Math.floor(Math.random() * (99 - 40 + 1)) + 40;
      const trendValue = (Math.random() - 0.5) * 0.2;

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
        activities: [
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
        ],
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
