import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import 'dayjs/locale/es';
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
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
// Import the Module for the NgModule, and the Class for the Component types
import { MatMenu, MatMenuModule } from '@angular/material/menu';

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
import { BreadcrumbComponent } from '@modules/admin/components/breadcrumb/breadcrumb.component';
import { ViewMappingComponent } from './view-mapping/view-mapping.component';
// Child Component
import { EditMappingComponent } from './edit-mapping/edit-mapping.component';
import { UsageImpactDrawerComponent } from './usage-impact-drawer/usage-impact-drawer.component';
// Add these imports at the top with the other component imports:
import { EditCodeComponent } from './edit-code/edit-code.component';
import { EditModelComponent } from './edit-model/edit-model.component';
import { ViewModelComponent } from './view-model/view-model.component';
// Core Date Imports
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
    MatDividerModule,
    MatChipsModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatMenuModule,
    MatTabsModule,
    MatTooltipModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    UsersModule,
    EditCodeComponent,
    ViewMappingComponent,
    EditMappingComponent,
    ViewModelComponent,
    EditModelComponent,
    UsageImpactDrawerComponent,
    BreadcrumbComponent,
  ],
  providers: [
    { provide: MatPaginatorIntl, useClass: MatPaginatorIntl },
    EventService,
    { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
    { provide: DateAdapter, useClass: NativeDateAdapter },
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: { dateInput: 'MM/DD/YYYY' },
        display: {
          dateInput: 'MM/DD/YYYY',
          monthYearLabel: 'MMMM YYYY',
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

  // Define these as class properties or constants
  private readonly CODE_SYSTEMS = [
    'ICD-10',
    'SNOMED CT',
    'LOINC',
    'ICD-9',
    'RxNorm',
    'CPT',
    'Custom',
  ];
  private readonly CODE_STATUSES = ['Active', 'Superseded', 'Deprecated', 'Invalid'];
  // UI State
  activeTabIndex = 0;
  activeTabLabel = 'Models';
  selectedEnv = 'Production';
  tempAvatar = 'assets/images/avatar.png';
  // --- Animation handling ---
  isExiting = false; // Sliding out to right (closing view entirely)
  isEditingMapping = false; // Controls Edit component lifecycle
  // Mapping Detail View State
  showMappingDetail = false;
  showModelDetail = false; // Add this missing declaration
  selectedMappingData: any = null;

  // Model Detail View State
  isEditingModel = false;
  selectedModelData: any = null;

  // Date Range Picker
  startView: 'month' | 'year' | 'multi-year' = 'month';

  // Pagination State for Versions
  public currentPage = 0;
  public pageSize = 5;

  public filteredVersionHistory: IVersionCommit[] = [];
  public modelsPlaceholder = 'Search models by name, alias, or description… ';
  public rulesPlaceholder = 'Search rules ...';
  public versionsPlaceholder = 'Search versions ...';
  public mappingsPlaceholder = 'Search mappings ...';
  public normalizationSubTitle =
    'Define how raw inputs are transformed into canonical, structured records.';
  // Search Bindings
  modelSearch = '';
  mappingSearch = '';
  ruleSearch = '';
  versionSearch = '';
  public codeSearch = '';

  // Date Range Picker Form
  range = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  // New property for Models tab date range
  modelDateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  // New property for Mappings tab date range
  mappingDateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  // Column Definitions
  modelColumns: string[] = [
    'name',
    'type',
    'status',
    'usage',
    'fields',
    'dependencies',
    'lastModified',
    'actions',
  ];
  public mappingColumns: string[] = [
    'name',
    'source',
    'target',
    'fields',
    'coverage',
    'status',
    'lastModified',
    'actions',
  ];
  public ruleColumns: string[] = [
    'ruleName',
    'severity',
    'scope',
    'trigger',
    'sourcesAffected',
    'status',
    'lastModified',
    'actions',
  ];

  // NEW: Code detail panel state
  showCodeDetail = false;
  selectedCodeData: any = null;

  // Edit Code state
  showEditCode = false;
  isEditingCode = false;

  public versionColumns: string[] = ['versionTag', 'releasedBy', 'status', 'timestamp', 'actions'];
  // UPDATED: Column structure
  public codeColumns: string[] = [
    'codeSetName',
    'system',
    'meaning',
    'version',
    'status',
    'mappedTo',
    'actions',
  ];
  // DataSources
  modelDataSource = new MatTableDataSource<any>([]);
  mappingDataSource = new MatTableDataSource<any>([]);
  ruleDataSource = new MatTableDataSource<any>([]);
  versionDataSource = new MatTableDataSource<any>([]);
  codeDataSource = new MatTableDataSource<any>([]);

  // Original data sources (for proper filtering)
  private originalModelData: any[] = [];
  private originalMappingData: any[] = [];
  private originalRuleData: any[] = [];
  private originalCodeData: any[] = [];

  // State variables
  // Governance Filter Defaults
  selectedStatus = 'All Statuses';
  selectedType = 'All Types';
  selectedUsage = 'Any Usage';
  public selectedCategory = 'All Categories';
  public selectedSource = 'All Sources';
  public selectedItem: any = null;

  // Mapping Governance Filter Defaults
  selectedMappingStatus = 'All Statuses';
  selectedMappingSource = 'All Sources';
  selectedMappingTarget = 'All Targets';
  selectedMappingCoverage = 'All Coverage';

  // Rule Governance Filter Defaults
  selectedRuleStatus = 'All Statuses';
  selectedRuleSeverity = 'All Severities';
  selectedRuleScope = 'All Scopes';
  selectedRuleTrigger = 'All Triggers';

  // Specific governance state for the Codes tab
  public selectedCodeCategory = 'All';
  public selectedCodeStatus = 'All';
  public selectedCodeSource = 'All';
  public selectedCodeUsage = 'All';

  // Search and Date Range states for Rules
  ruleDateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  // Date Range Group
  public codeDateRange = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  // Filter setters
  setStatusFilter(val: string) {
    this.selectedStatus = val;
    this.applyModelFilter();
  }

  setMappingSourceFilter(val: string) {
    this.selectedMappingSource = val;
    this.applyMappingFilter();
  }

  setMappingTargetFilter(val: string) {
    this.selectedMappingTarget = val;
    this.applyMappingFilter();
  }

  setMappingCoverageFilter(val: string) {
    this.selectedMappingCoverage = val;
    this.applyMappingFilter();
  }
  /**
   * Sets the Status filter for Mappings and refreshes the data source.
   * Supports: 'All', 'Active', 'Deprecated', 'Draft'
   */
  setMappingStatusFilter(val: string): void {
    this.selectedMappingStatus = val;
    this.applyMappingFilter();
  }

  // Filter Setters
  setRuleStatusFilter(val: string) {
    this.selectedRuleStatus = val;
    this.applyRuleFilter();
  }

  setRuleSeverityFilter(val: string) {
    this.selectedRuleSeverity = val;
    this.applyRuleFilter();
  }

  setRuleScopeFilter(val: string) {
    this.selectedRuleScope = val;
    this.applyRuleFilter();
  }

  setRuleTriggerFilter(val: string) {
    this.selectedRuleTrigger = val;
    this.applyRuleFilter();
  }

  setTypeFilter(val: string) {
    this.selectedType = val;
    this.applyModelFilter();
  }
  setUsageFilter(val: string) {
    this.selectedUsage = val;
    this.applyModelFilter();
  }

  public setCodeCategory(val: string): void {
    this.selectedCodeCategory = val;
    this.applyCodeFilter();
  }

  public setCodeStatus(val: string): void {
    this.selectedCodeStatus = val;
    this.applyCodeFilter();
  }

  public setCodeSource(val: string): void {
    this.selectedCodeSource = val;
    this.applyCodeFilter();
  }

  public setCodeUsage(val: string): void {
    this.selectedCodeUsage = val;
    this.applyCodeFilter();
  }

  /**
   * Sets the Category filter for Codes and refreshes the data source.
   * Supports: 'Category', 'Diagnosis', 'Lab Test', 'Demographics', etc.
   */
  setCodeCategoryFilter(val: string): void {
    this.selectedCategory = val;
    this.applyCodeFilter();
  }

  /**
   * Sets the Status filter for Codes and refreshes the data source.
   * Supports: 'Status', 'Active', 'Draft'
   */
  setCodeStatusFilter(val: string): void {
    this.selectedStatus = val;
    this.applyCodeFilter();
  }

  /**
   * Sets the Source filter for Codes and refreshes the data source.
   * Supports: 'Source', or specific system names
   */
  setCodeSourceFilter(val: string): void {
    this.selectedSource = val;
    this.applyCodeFilter();
  }

  /**
   * Sets the Usage filter for Codes and refreshes the data source.
   * Supports: 'Usage' or specific usage contexts
   */
  setCodeUsageFilter(val: string): void {
    this.selectedUsage = val;
    this.applyCodeFilter();
  }

  // Versions timeline data
  versionHistory: IVersionCommit[] = [];

  private tabOrder: string[] = ['Models', 'Mappings', 'Rules', 'Versions', 'Codes'];

  @ViewChild('modelPaginator') modelPaginator!: MatPaginator;
  @ViewChild('modelSort') modelSort!: MatSort;
  @ViewChild('mappingPaginator') mappingPaginator!: MatPaginator;
  @ViewChild('mappingSort') mappingSort!: MatSort;
  @ViewChild('rulePaginator') rulePaginator!: MatPaginator;
  @ViewChild('ruleSort') ruleSort!: MatSort;
  @ViewChild('versionPaginator') versionPaginator!: MatPaginator;
  @ViewChild('codePaginator') codePaginator!: MatPaginator;
  @ViewChild('codeSort') codeSort!: MatSort;
  @ViewChild(MatSort) sort!: MatSort;

  // Existing ViewChilds
  @ViewChild('modelMenu') modelMenu!: MatMenu;
  @ViewChild('ruleMenu') ruleMenu!: MatMenu;
  @ViewChild('mappingMenu') mappingMenu!: MatMenu;
  @ViewChild('codesMenu') codesMenu!: MatMenu;
  @ViewChild('versionsMenu') versionsMenu!: MatMenu;

  // Governance Menus for Codes Tab
  @ViewChild('codeCategoryMenu') public codeCategoryMenu!: MatMenu;
  @ViewChild('codeStatusMenu') public codeStatusMenu!: MatMenu;
  @ViewChild('codeSourceMenu') public codeSourceMenu!: MatMenu;
  @ViewChild('codeUsageMenu') public codeUsageMenu!: MatMenu;
  @ViewChild('codesGlobalMenu') public codesGlobalMenu!: MatMenu;

  constructor(
    protected eventService: EventService,
    protected eventStore: Store<{ nf: EventState }>,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private el: ElementRef,
  ) {}

  ngOnInit(): void {
    this.loadAllData();
    this.subscribeToEvents();

    this.modelDateRange.valueChanges.subscribe(() => {
      this.applyModelFilter();
      setTimeout(() => this.fixModelsDateInputLayout(), 50);
    });

    this.range.valueChanges.subscribe(() => {
      this.applyVersionFilter();
    });

    this.mappingDateRange.valueChanges.subscribe(() => {
      this.applyMappingFilter();
      setTimeout(() => this.fixMappingsDateInputLayout(), 50);
    });

    this.ruleDateRange.valueChanges.subscribe(() => {
      this.applyRuleFilter();
      setTimeout(() => this.fixRulesDateInputLayout(), 50);
    });

    this.codeDateRange.valueChanges.subscribe(() => {
      this.applyCodeFilter();
      setTimeout(() => this.fixCodesDateInputLayout(), 50);
    });

    // Initial layout fixes
    setTimeout(() => {
      this.fixModelsDateInputLayout();
      this.fixMappingsDateInputLayout();
      this.fixRulesDateInputLayout();
      this.fixCodesDateInputLayout();
    }, 100);
  }

  ngAfterViewInit(): void {
    this.refreshTablePointers();

    // Initial filter application
    this.applyModelFilter();
    this.applyMappingFilter();
    this.applyRuleFilter();
    this.applyCodeFilter();

    setTimeout(() => {
      this.fixModelsDateInputLayout();
      this.fixMappingsDateInputLayout();
      this.fixRulesDateInputLayout();
      this.fixCodesDateInputLayout();
      this.setupThemeChangeListener();
      this.fixDateInputLayout();
    }, 500);

    // Unified Paginator handling
    const paginators = [
      { p: this.modelPaginator, fix: () => this.fixModelsDateInputLayout() },
      { p: this.mappingPaginator, fix: () => this.fixMappingsDateInputLayout() },
      { p: this.rulePaginator, fix: () => this.fixRulesDateInputLayout() },
      { p: this.codePaginator, fix: () => this.fixCodesDateInputLayout() },
    ];

    paginators.forEach(item => {
      if (item.p) {
        item.p.page.subscribe((event: PageEvent) => {
          this.currentPage = event.pageIndex;
          this.pageSize = event.pageSize;
          this.cdr.detectChanges();
          setTimeout(() => item.fix(), 100);
        });
      }
    });
  }

  /**
   * Processes navigation signals from the breadcrumb.
   * Ensures clickable segments for: Normalization > [Tab] > View > Edit
   */
  private handleBreadcrumbNavigation(target: string): void {
    // 1. Handle "Edit" views - stay in current state but update path
    if (target === 'EDIT_MAPPING' || target === 'EDIT_MODEL') {
      this.updateBreadcrumbPath();
      this.cdr.detectChanges();
      return;
    }

    // ADD THIS BLOCK:
    if (target === 'VIEW_CODE') {
      this.showCodeDetail = true;
      this.eventService.publish('nf', 'close_edit_code', {
        codeId: this.selectedCodeData?.id,
      });
      this.updateBreadcrumbPath('View Code');
      this.cdr.detectChanges();
      return;
    }

    // 2. Handle "View" views (Back navigation from Edit)
    if (target === 'VIEW_MAPPING') {
      this.showMappingDetail = true;
      this.eventService.publish('nf', 'close_edit_mapping', {
        mappingId: this.selectedMappingData?.id,
      });
      this.updateBreadcrumbPath('View Mapping');
      this.cdr.detectChanges();
      return;
    }

    if (target === 'VIEW_MODEL') {
      this.showModelDetail = true;
      this.eventService.publish('nf', 'close_edit_model', { modelId: this.selectedModelData?.id });
      this.updateBreadcrumbPath('View Model');
      this.cdr.detectChanges();
      return;
    }

    // 3. Handle Root or Tab Navigation (Reset detail views)
    if (target === 'ROOT' || target.startsWith('TAB_')) {
      // Clear detail/edit states
      this.showMappingDetail = false;
      this.showModelDetail = false;
      this.selectedMappingData = null;
      this.selectedModelData = null;
      this.showCodeDetail = false; // NEW: Reset code detail
      this.selectedCodeData = null; // NEW: Reset selected code
      this.showEditCode = false;
      this.isEditingCode = false;
      let targetIndex = this.activeTabIndex;

      // FIX: Ensure these indices match your template [Models(0), Mappings(1), etc.]
      switch (target) {
        case 'ROOT':
          targetIndex = 0;
          break;
        case 'TAB_MODELS':
          targetIndex = 0;
          break;
        case 'TAB_MAPPINGS':
          targetIndex = 1;
          break;
        case 'TAB_RULES':
          targetIndex = 2;
          break;
        case 'TAB_VERSIONS':
          targetIndex = 3;
          break;
        case 'TAB_CODES':
          targetIndex = 4;
          break;
      }

      // THE FIX: Use setTimeout to ensure mat-tab-group registers the index change
      setTimeout(() => {
        this.activeTabIndex = targetIndex;
        if (this.tabOrder && this.tabOrder[this.activeTabIndex]) {
          this.activeTabLabel = this.tabOrder[this.activeTabIndex];
        }

        // Finalize UI
        this.updateBreadcrumbPath();
        this.onCloseMappingDetail(); // Ensure slide-in animations trigger
        this.onCloseModelDetail();
        this.cdr.detectChanges();
      }, 0);
    }
  }

  /**
   * Updates the breadcrumb path by publishing a signal to the EventStore.
   * Ensures all items follow the expected type structure.
   */
  private updateBreadcrumbPath(childLabel?: string): void {
    const path: { label: string; target: string }[] = [{ label: 'Normalization', target: 'ROOT' }];

    // Use current activeTabLabel if available
    if (this.activeTabLabel) {
      path.push({
        label: this.activeTabLabel,
        target: `TAB_${this.activeTabLabel.toUpperCase()}`,
      });
    }

    // Append child if we are in "View" or "Edit" mode
    if (childLabel) {
      // If childLabel is 'View Mapping', target should be 'VIEW_MAPPING'
      const target = childLabel.toUpperCase().replace(' ', '_');
      path.push({ label: childLabel, target: target });
    }

    this.eventService.publish('nf', 'update_breadcrumb', { path });
  }
  // Define a central path update method to reduce boilerplate

  /**
   * Updates the selected item reference and opens the menu
   * Useful if you need to track the item outside the menu context
   */
  public onActionClick(item: any): void {
    this.selectedItem = item;
  }

  public onTabChange(event: MatTabChangeEvent): void {
    this.activeTabIndex = event.index;
    this.activeTabLabel = this.tabOrder[this.activeTabIndex];

    this.cdr.detectChanges();

    // Update path: Normalization > [Active Tab]
    this.updateBreadcrumbPath();

    setTimeout(() => {
      this.refreshTablePointers();

      switch (this.activeTabIndex) {
        case 0:
          this.modelDataSource.paginator = this.modelPaginator;
          this.modelDataSource.sort = this.modelSort;
          this.applyModelFilter();
          this.fixModelsDateInputLayout();
          break;
        case 1:
          this.mappingDataSource.paginator = this.mappingPaginator;
          this.mappingDataSource.sort = this.mappingSort;
          this.applyMappingFilter();
          this.cdr.detectChanges();
          setTimeout(() => this.fixMappingsDateInputLayout(), 0);
          break;
        case 2:
          this.ruleDataSource.paginator = this.rulePaginator;
          this.ruleDataSource.sort = this.ruleSort;
          this.applyRuleFilter();
          this.cdr.detectChanges();
          setTimeout(() => this.fixRulesDateInputLayout(), 0);
          break;
        case 3:
          this.fixDateInputLayout();
          break;
        case 4:
          this.codeDataSource.paginator = this.codePaginator;
          this.codeDataSource.sort = this.codeSort;
          this.applyCodeFilter();
          this.cdr.detectChanges();
          setTimeout(() => this.fixCodesDateInputLayout(), 0);
          break;
      }
      this.cdr.detectChanges();
    }, 100);
  }

  // Add this method to handle row clicks in the mapping table:
  // Add this method to handle row clicks in the mapping table:
  onMappingRowClick(mapping: any): void {
    // Ensure 'mapping' object contains the current status from the table row
    this.selectedMappingData = { ...mapping };
    this.showMappingDetail = true;

    // Update path: Normalization > Mappings > View Mapping
    this.updateBreadcrumbPath('View Mapping');

    setTimeout(() => {
      const container = document.querySelector('.normalization-main-container');
      if (container) {
        container.classList.add('slide-out');
      }
    }, 0);
  }

  onModelRowClick(model: any): void {
    this.selectedModelData = { ...model };
    this.showModelDetail = true;

    // Update path: Normalization > Models > View Model
    this.updateBreadcrumbPath('View Model');

    setTimeout(() => {
      const container = document.querySelector('.normalization-main-container');
      if (container) {
        container.classList.add('slide-out');
      }
    }, 0);
  }

  // NEW: Handle code row click
  onCodeRowClick(code: any): void {
    this.selectedCodeData = { ...code };
    this.showCodeDetail = true;
  }

  // NEW: Close code detail panel
  // Simple close - NO animation classes
  onCloseCodeDetail(): void {
    this.showCodeDetail = false;
    this.selectedCodeData = null;
  }

  /**
   * Opens Edit Code component with proper animation and state management
   */
  onEditCodeClick(codeRow: any): void {
    this.isEditingCode = true;
    this.showEditCode = true;
    this.selectedCodeData = { ...codeRow };

    // Breadcrumb: Normalization > Codes > Edit Code: {name}
    const breadcrumbPath = [
      { label: 'Normalization', target: 'ROOT' },
      { label: 'Codes', target: 'TAB_CODES' },
      { label: `Edit Code: ${this.selectedCodeData?.codeSetName}`, active: true },
    ];
    this.eventService.publish('nf', 'update_breadcrumb', { path: breadcrumbPath });

    this.eventService.publish('nf', 'open_edit_code', {
      action: 'open_edit_code',
      codeId: this.selectedCodeData?.id,
      fullData: this.selectedCodeData,
    });
  }

  onCloseEditCode(): void {
    this.isEditingCode = false;
    this.showEditCode = false;
    // showCodeDetail stays true - panel remains visible

    // Breadcrumb: back to just Codes
    const breadcrumbPath = [
      { label: 'Normalization', target: 'ROOT' },
      { label: 'Codes', active: true },
    ];
    this.eventService.publish('nf', 'update_breadcrumb', { path: breadcrumbPath });

    this.cdr.detectChanges();
  }

  // Add this method to handle closing the mapping detail view:
  onCloseMappingDetail(): void {
    const container = document.querySelector('.normalization-main-container');
    if (container) {
      container.classList.remove('slide-out');
      container.classList.add('slide-in');
    }

    setTimeout(() => {
      this.showMappingDetail = false;
      this.selectedMappingData = null;

      if (container) {
        container.classList.remove('slide-in');
      }
    }, 400);
  }

  onCloseModelDetail(): void {
    const container = document.querySelector('.normalization-main-container');
    if (container) {
      container.classList.remove('slide-out');
      container.classList.add('slide-in');
    }

    setTimeout(() => {
      this.showModelDetail = false;
      this.selectedModelData = null;

      if (container) {
        container.classList.remove('slide-in');
      }
    }, 400);
  }

  /**
   * Listen for theme changes and re-apply styles
   */
  private setupThemeChangeListener(): void {
    // 1. Watch for class changes on body/documentElement (Theme switchers usually toggle classes here)
    const observer = new MutationObserver(() => {
      this.fixModelsDateInputLayout();
      this.fixRulesDateInputLayout();
      this.fixMappingsDateInputLayout();
      this.fixDateInputLayout();
      this.fixCodesDateInputLayout();
      this.cdr.detectChanges();
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    // 2. Also listen for OS/Browser system-level prefers-color-scheme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      this.fixModelsDateInputLayout();
      this.fixRulesDateInputLayout();
      this.fixMappingsDateInputLayout();
      this.fixDateInputLayout();
      this.cdr.detectChanges();
    });
  }

  /**
   * Listen for events from the NgRx Store via EventService.
   * Updated to correctly extract payload data from the EventService's nested structure.
   */
  subscribeToEvents(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      const lastAction = state?.lastAction;
      const eventName = state?.items?.event;

      /**
       * FIX: EventService.publish wraps your data in a 'payload' property.
       * Your previous code looked in 'data', which returned undefined for breadcrumb signals.
       */
      const eventData = state?.items?.payload;

      console.log('[NormalizationComponent] Received Event:', {
        lastAction,
        eventName,
        eventData,
      });

      // 1. Handle Data Refresh Events
      if (
        lastAction === 'record_created' ||
        lastAction === 'graph_updated' ||
        eventName === 'refresh_header'
      ) {
        this.loadAllData();
      }

      // Handle navigation to a related model
      // Inside subscribeToEvents() in normalization.component.ts
      if (eventName === 'view_related_model' && eventData) {
        // Pass the whole payload { modelName, modelId }
        this.handleRelatedModelNavigation({
          id: eventData.modelId,
          name: eventData.modelName,
        });
      }

      if (eventName === 'open_edit_mapping') {
        // Initialize with the received data
        this.isEditingMapping = true;
        this.isExiting = false;
      }

      if (eventName === 'close_edit_mapping') {
        // Initialize with the received data
        this.isEditingMapping = false;
        this.isExiting = true;
      }

      // Handle model edit events
      if (eventName === 'open_edit_model') {
        this.isEditingModel = true;
        this.isExiting = false;
      }

      if (eventName === 'close_edit_model') {
        this.isEditingModel = false;
        this.isExiting = true;
      }

      // Handle code edit events
      if (eventName === 'open_edit_code') {
        this.isEditingCode = true;
        this.showEditCode = true;
        this.isExiting = false;
      }

      if (eventName === 'close_edit_code') {
        this.isEditingCode = false;
        this.showEditCode = false;
        this.isExiting = true;
      }

      // 2. Handle Theme Change Events
      if (eventName === 'theme_change' || lastAction === 'theme_updated') {
        console.log('[NormalizationComponent] Theme change detected, reapplying layout fixes...');
        setTimeout(() => {
          this.fixModelsDateInputLayout();
          this.fixMappingsDateInputLayout();
          this.fixRulesDateInputLayout();
          this.fixDateInputLayout();

          // Force change detection to ensure the UI reflects theme-specific hex colors
          this.cdr.detectChanges();
        }, 50);
      }

      // 3. Handle Breadcrumb Navigation Signals
      // This allows the breadcrumb click to trigger handleNavigation()
      // Inside subscribeToEvents() around line 721
      if (eventName === 'breadcrumb_navigate' && eventData) {
        // FIX: Change handleNavigation to handleBreadcrumbNavigation
        this.handleBreadcrumbNavigation(eventData.target);
      }
    });
  }

  /**
   * Manual DOM manipulation to override Material internal styling
   * Targeted Fix: version-controls-row flex + search-box-version expansion
   */
  private fixDateInputLayout(): void {
    const root = this.el.nativeElement;

    // 1. Force the parent container to flex
    const controlsRow = root.querySelector('.version-controls-row');
    if (controlsRow) {
      this.renderer.setStyle(controlsRow, 'display', 'flex', 1);
      this.renderer.setStyle(controlsRow, 'align-items', 'center', 1);
      this.renderer.setStyle(controlsRow, 'gap', '0', 1); // Remove the ugly gap
    }

    // 2. Make the search box span until the start date
    const searchBox = root.querySelector('.search-box-version');
    if (searchBox) {
      this.renderer.setStyle(searchBox, 'flex', '1 1 auto', 1);
      this.renderer.setStyle(searchBox, 'width', 'auto', 1); // Override the fixed 30em
      this.renderer.setStyle(searchBox, 'overflow', 'visible', 1);
    }

    // 3. Fix the internal Material Date Container (The 12em fix and overflow)
    const container = root.querySelector('.version-controls-row .mat-date-range-input-container');
    if (container) {
      this.renderer.setStyle(container, 'overflow', 'visible', 1);
      this.renderer.setStyle(container, 'padding-left', '12em', 1); // This stays 12em ONLY for versions

      const internalWrappers = root.querySelectorAll(
        '.version-controls-row .mat-date-range-input-wrapper',
      );
      internalWrappers.forEach((w: HTMLElement) => {
        this.renderer.setStyle(w, 'overflow', 'visible', 1);
        this.renderer.setStyle(w, 'max-width', 'none', 1);
        this.renderer.setStyle(w, 'flex', '0 0 auto', 1);
      });
    }

    // 4. Ensure the actual input text (like the '0') is never clipped
    const dateInputs = root.querySelectorAll('.mat-date-range-input-inner');
    dateInputs.forEach((i: HTMLElement) => {
      this.renderer.setStyle(i, 'overflow', 'visible', 1);
      this.renderer.setStyle(i, 'width', '100%', 1);
    });
  }

  private applyForcedInputStyles(input: HTMLInputElement, textColor: string): void {
    input.style.color = textColor;
    input.style.caretColor = textColor;
    input.style.setProperty('-webkit-text-fill-color', textColor, 'important');
    input.style.opacity = '1';
  }

  /**
   * Manual DOM manipulation for Models tab date range picker
   * Targeted Fix: Remove ugly borders and outlines while preserving layout
   * Now includes theme-aware styling that responds to theme_change events
   */
  private fixModelsDateInputLayout(): void {
    const root = this.el.nativeElement;

    // Detect current theme
    const isDarkMode =
      document.body.classList.contains('dark-theme') ||
      document.documentElement.classList.contains('dark-theme') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    console.log('[fixModelsDateInputLayout] Dark mode:', isDarkMode);

    // Theme-specific colors
    const bgColor = isDarkMode ? '#1E1E1E' : '#FFFFFF';
    const hoverColor = isDarkMode ? '#2E2E2E' : '#F5F5F5';
    const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : '#E0E0E0';
    const textColor = isDarkMode ? '#FFFFFF' : 'rgba(0, 0, 0, 0.87)';

    // 1. CRITICAL: Remove ALL MDC outline elements
    const outlineElements = root.querySelectorAll(
      '.models-tab-wrapper .mdc-notched-outline, ' +
        '.models-tab-wrapper .mdc-notched-outline__leading, ' +
        '.models-tab-wrapper .mdc-notched-outline__notch, ' +
        '.models-tab-wrapper .mdc-notched-outline__trailing',
    );
    outlineElements.forEach((el: HTMLElement) => {
      this.renderer.setStyle(el, 'display', 'none', 1);
      this.renderer.setStyle(el, 'border', 'none', 1);
      this.renderer.setStyle(el, 'outline', 'none', 1);
    });

    // 2. Remove MDC wrapper borders and backgrounds
    const textFieldWrappers = root.querySelectorAll(
      '.models-tab-wrapper .mat-mdc-text-field-wrapper',
    );
    textFieldWrappers.forEach((wrapper: HTMLElement) => {
      if (wrapper.classList.contains('mat-date-range-input-wrapper')) {
        return;
      }
      this.renderer.setStyle(wrapper, 'background', 'transparent', 1);
      this.renderer.setStyle(wrapper, 'padding', '0', 1);
      this.renderer.setStyle(wrapper, 'border', 'none', 1);
      this.renderer.setStyle(wrapper, 'outline', 'none', 1);
      this.renderer.setStyle(wrapper, 'box-shadow', 'none', 1);
    });

    // 3. Remove form field underlines
    const formFields = root.querySelectorAll('.models-tab-wrapper .mat-mdc-form-field');
    formFields.forEach((field: HTMLElement) => {
      this.renderer.setStyle(field, 'border', 'none', 1);
      this.renderer.setStyle(field, 'outline', 'none', 1);
    });

    // 4. Remove subscript wrapper
    const subscriptWrappers = root.querySelectorAll(
      '.models-tab-wrapper .mat-mdc-form-field-subscript-wrapper',
    );
    subscriptWrappers.forEach((sub: HTMLElement) => {
      this.renderer.setStyle(sub, 'display', 'none', 1);
    });

    // 5. Fix the main container positioning
    const filterDateRange = root.querySelector('.models-tab-wrapper .filter-date-range');
    if (filterDateRange) {
      this.renderer.setStyle(filterDateRange, 'margin-top', '0.0em', 1);
      this.renderer.setStyle(filterDateRange, 'display', 'flex', 1);
      this.renderer.setStyle(filterDateRange, 'align-items', 'center', 1);
      this.renderer.setStyle(filterDateRange, 'gap', '8px', 1);
    }

    // 6. Style the date range input container
    const dateRangeInput = root.querySelector('.models-tab-wrapper .custom-pill-date');
    if (dateRangeInput) {
      this.renderer.setStyle(dateRangeInput, 'border', 'none', 1);
      this.renderer.setStyle(dateRangeInput, 'outline', 'none', 1);
      this.renderer.setStyle(dateRangeInput, 'box-shadow', 'none', 1);
    }

    // 7. Ensure the container has proper styling
    const container = root.querySelector(
      '.models-tab-wrapper .custom-pill-date .mat-date-range-input-container',
    );
    if (container) {
      this.renderer.setStyle(container, 'padding', '0', 1);
      this.renderer.setStyle(container, 'overflow', 'visible', 1);
      this.renderer.setStyle(container, 'display', 'flex', 1);
      this.renderer.setStyle(container, 'align-items', 'center', 1);
      this.renderer.setStyle(container, 'gap', '0', 1);
      this.renderer.setStyle(container, 'border', 'none', 1);
      this.renderer.setStyle(container, 'outline', 'none', 1);
    }

    // 8. CRITICAL: Apply theme-aware colors AND handle dynamic sync for selection
    const wrappers = root.querySelectorAll('.models-tab-wrapper .mat-date-range-input-wrapper');
    wrappers.forEach((wrapper: HTMLElement) => {
      this.renderer.setStyle(wrapper, 'background', bgColor, 1);
      this.renderer.setStyle(wrapper, 'border', `1px solid ${borderColor}`, 1);
      this.renderer.setStyle(wrapper, 'border-radius', '6px', 1);
      this.renderer.setStyle(wrapper, 'height', '32px', 1);
      this.renderer.setStyle(wrapper, 'min-width', '80px', 1);
      this.renderer.setStyle(wrapper, 'padding', '0 10px', 1);
      this.renderer.setStyle(wrapper, 'display', 'flex', 1);
      this.renderer.setStyle(wrapper, 'align-items', 'center', 1);
      this.renderer.setStyle(wrapper, 'cursor', 'pointer', 1);
      this.renderer.setStyle(wrapper, 'box-sizing', 'border-box', 1);
      this.renderer.setStyle(wrapper, 'overflow', 'visible', 1);
      this.renderer.setStyle(wrapper, 'transition', 'background 0.2s ease', 1);

      // Dynamic Sync Logic: Use local helper for style application
      const syncStyles = (input: HTMLInputElement) => {
        this.renderer.setStyle(input, 'color', textColor, 1);
        this.renderer.setStyle(input, 'caret-color', textColor, 1);
        this.renderer.setStyle(input, '-webkit-text-fill-color', textColor, 1);
        this.renderer.setStyle(input, 'opacity', '1', 1);
        this.renderer.setStyle(input, 'visibility', 'visible', 1);
      };

      const innerInputs = wrapper.querySelectorAll('input');
      innerInputs.forEach((input: HTMLInputElement) => {
        // Initial style force
        syncStyles(input);

        // Listen for selection changes. We use existing elements, no cloning!
        input.addEventListener('input', () => syncStyles(input));
        input.addEventListener('change', () => syncStyles(input));
      });

      // Instead of cloning, we add listeners directly to the existing element
      wrapper.addEventListener('mouseenter', () => {
        this.renderer.setStyle(wrapper, 'background', hoverColor, 1);
      });
      wrapper.addEventListener('mouseleave', () => {
        this.renderer.setStyle(wrapper, 'background', bgColor, 1);
      });
    });

    // 9. Fix separator spacing and color
    const separator = root.querySelector('.models-tab-wrapper .mat-date-range-input-separator');
    if (separator) {
      this.renderer.setStyle(separator, 'margin', '0 4px', 1);
      this.renderer.setStyle(separator, 'color', textColor, 1);
      this.renderer.setStyle(separator, 'opacity', '1', 1);
    }

    // 10. Style the calendar toggle button
    const toggleBtn = root.querySelector(
      '.models-tab-wrapper .custom-pill-date .mat-datepicker-toggle button',
    );
    if (toggleBtn) {
      this.renderer.setStyle(toggleBtn, 'width', '32px', 1);
      this.renderer.setStyle(toggleBtn, 'height', '32px', 1);
      this.renderer.setStyle(toggleBtn, 'padding', '0', 1);
      this.renderer.setStyle(toggleBtn, 'margin-left', '4px', 1);
      this.renderer.setStyle(toggleBtn, 'min-width', '32px', 1);
      this.renderer.setStyle(toggleBtn, 'background', 'transparent', 1);
      this.renderer.setStyle(toggleBtn, 'border', 'none', 1);
      this.renderer.setStyle(toggleBtn, 'outline', 'none', 1);

      const svg = toggleBtn.querySelector('svg');
      if (svg) {
        this.renderer.setStyle(svg, 'width', '19px', 1);
        this.renderer.setStyle(svg, 'height', '19px', 1);
        this.renderer.setStyle(svg, 'fill', '#818588', 1);
        this.renderer.setStyle(svg, 'opacity', '0.7', 1);
      }
    }

    // 11. Style the clear button
    const clearBtn = root.querySelector('.models-tab-wrapper .clear-date-btn');
    if (clearBtn) {
      this.renderer.setStyle(clearBtn, 'width', '28px', 1);
      this.renderer.setStyle(clearBtn, 'height', '28px', 1);
      this.renderer.setStyle(clearBtn, 'padding', '0', 1);
      this.renderer.setStyle(clearBtn, 'min-width', '28px', 1);
      this.renderer.setStyle(clearBtn, 'border-radius', '50%', 1);
      this.renderer.setStyle(clearBtn, 'display', 'flex', 1);
      this.renderer.setStyle(clearBtn, 'align-items', 'center', 1);
      this.renderer.setStyle(clearBtn, 'justify-content', 'center', 1);

      const icon = clearBtn.querySelector('mat-icon');
      if (icon) {
        this.renderer.setStyle(icon, 'width', '16px', 1);
        this.renderer.setStyle(icon, 'height', '16px', 1);
        this.renderer.setStyle(icon, 'font-size', '16px', 1);
        this.renderer.setStyle(icon, 'fill', '#818588', 1);
        this.renderer.setStyle(icon, 'opacity', '0.7', 1);
      }
    }

    console.log('[fixModelsDateInputLayout] Completed with non-destructive listeners.');
  }

  /**
   * Manual DOM manipulation for Mappings tab date range picker
   * Targeted Fix: Remove ugly borders and outlines while preserving layout
   * Includes theme-aware styling that responds to theme_change events
   */
  private fixMappingsDateInputLayout(): void {
    const root = this.el.nativeElement;

    // Detect current theme
    const isDarkMode =
      document.body.classList.contains('dark-theme') ||
      document.documentElement.classList.contains('dark-theme') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    console.log('[fixMappingsDateInputLayout] Dark mode:', isDarkMode);

    // Theme-specific colors
    const bgColor = isDarkMode ? '#1E1E1E' : '#FFFFFF';
    const hoverColor = isDarkMode ? '#2E2E2E' : '#F5F5F5';
    const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : '#E0E0E0';
    const textColor = isDarkMode ? '#FFFFFF' : 'rgba(0, 0, 0, 0.87)';

    // 1. CRITICAL: Remove ALL MDC outline elements
    const outlineElements = root.querySelectorAll(
      '.mapping-tab-wrapper .mdc-notched-outline, ' +
        '.mapping-tab-wrapper .mdc-notched-outline__leading, ' +
        '.mapping-tab-wrapper .mdc-notched-outline__notch, ' +
        '.mapping-tab-wrapper .mdc-notched-outline__trailing',
    );
    outlineElements.forEach((el: HTMLElement) => {
      this.renderer.setStyle(el, 'display', 'none', 1);
      this.renderer.setStyle(el, 'border', 'none', 1);
      this.renderer.setStyle(el, 'outline', 'none', 1);
    });

    // 2. Remove MDC wrapper borders and backgrounds
    const textFieldWrappers = root.querySelectorAll(
      '.mapping-tab-wrapper .mat-mdc-text-field-wrapper',
    );
    textFieldWrappers.forEach((wrapper: HTMLElement) => {
      if (wrapper.classList.contains('mat-date-range-input-wrapper')) {
        return;
      }
      this.renderer.setStyle(wrapper, 'background', 'transparent', 1);
      this.renderer.setStyle(wrapper, 'padding', '0', 1);
      this.renderer.setStyle(wrapper, 'border', 'none', 1);
      this.renderer.setStyle(wrapper, 'outline', 'none', 1);
      this.renderer.setStyle(wrapper, 'box-shadow', 'none', 1);
    });

    // 3. Remove form field underlines
    const formFields = root.querySelectorAll('.mapping-tab-wrapper .mat-mdc-form-field');
    formFields.forEach((field: HTMLElement) => {
      this.renderer.setStyle(field, 'border', 'none', 1);
      this.renderer.setStyle(field, 'outline', 'none', 1);
    });

    // 4. Remove subscript wrapper
    const subscriptWrappers = root.querySelectorAll(
      '.mapping-tab-wrapper .mat-mdc-form-field-subscript-wrapper',
    );
    subscriptWrappers.forEach((sub: HTMLElement) => {
      this.renderer.setStyle(sub, 'display', 'none', 1);
    });

    // 5. Fix the main container positioning
    const filterDateRange = root.querySelector('.mapping-tab-wrapper .filter-date-range');
    if (filterDateRange) {
      this.renderer.setStyle(filterDateRange, 'margin-top', '0.0em', 1);
      this.renderer.setStyle(filterDateRange, 'display', 'flex', 1);
      this.renderer.setStyle(filterDateRange, 'align-items', 'center', 1);
      this.renderer.setStyle(filterDateRange, 'gap', '8px', 1);
    }

    // 6. Style the date range input container
    const dateRangeInput = root.querySelector('.mapping-tab-wrapper .custom-pill-date');
    if (dateRangeInput) {
      this.renderer.setStyle(dateRangeInput, 'border', 'none', 1);
      this.renderer.setStyle(dateRangeInput, 'outline', 'none', 1);
      this.renderer.setStyle(dateRangeInput, 'box-shadow', 'none', 1);
    }

    // 7. Ensure the container has proper styling
    const container = root.querySelector(
      '.mapping-tab-wrapper .custom-pill-date .mat-date-range-input-container',
    );
    if (container) {
      this.renderer.setStyle(container, 'padding', '0', 1);
      this.renderer.setStyle(container, 'overflow', 'visible', 1);
      this.renderer.setStyle(container, 'display', 'flex', 1);
      this.renderer.setStyle(container, 'align-items', 'center', 1);
      this.renderer.setStyle(container, 'gap', '0', 1);
      this.renderer.setStyle(container, 'border', 'none', 1);
      this.renderer.setStyle(container, 'outline', 'none', 1);
    }

    // 8. CRITICAL: Apply theme-aware colors AND handle dynamic sync for selection
    const wrappers = root.querySelectorAll('.mapping-tab-wrapper .mat-date-range-input-wrapper');
    wrappers.forEach((wrapper: HTMLElement) => {
      this.renderer.setStyle(wrapper, 'background', bgColor, 1);
      this.renderer.setStyle(wrapper, 'border', `1px solid ${borderColor}`, 1);
      this.renderer.setStyle(wrapper, 'border-radius', '6px', 1);
      this.renderer.setStyle(wrapper, 'height', '32px', 1);
      this.renderer.setStyle(wrapper, 'min-width', '80px', 1);
      this.renderer.setStyle(wrapper, 'padding', '0 10px', 1);
      this.renderer.setStyle(wrapper, 'display', 'flex', 1);
      this.renderer.setStyle(wrapper, 'align-items', 'center', 1);
      this.renderer.setStyle(wrapper, 'cursor', 'pointer', 1);
      this.renderer.setStyle(wrapper, 'box-sizing', 'border-box', 1);
      this.renderer.setStyle(wrapper, 'overflow', 'visible', 1);
      this.renderer.setStyle(wrapper, 'transition', 'background 0.2s ease', 1);

      // Dynamic Sync Logic: Use local helper for style application
      const syncStyles = (input: HTMLInputElement) => {
        this.renderer.setStyle(input, 'color', textColor, 1);
        this.renderer.setStyle(input, 'caret-color', textColor, 1);
        this.renderer.setStyle(input, '-webkit-text-fill-color', textColor, 1);
        this.renderer.setStyle(input, 'opacity', '1', 1);
        this.renderer.setStyle(input, 'visibility', 'visible', 1);
      };

      const innerInputs = wrapper.querySelectorAll('input');
      innerInputs.forEach((input: HTMLInputElement) => {
        // Initial style force
        syncStyles(input);

        // Listen for selection changes. We use existing elements, no cloning!
        input.addEventListener('input', () => syncStyles(input));
        input.addEventListener('change', () => syncStyles(input));
      });

      // Instead of cloning, we add listeners directly to the existing element
      wrapper.addEventListener('mouseenter', () => {
        this.renderer.setStyle(wrapper, 'background', hoverColor, 1);
      });
      wrapper.addEventListener('mouseleave', () => {
        this.renderer.setStyle(wrapper, 'background', bgColor, 1);
      });
    });

    // 9. Fix separator spacing and color
    const separator = root.querySelector('.mapping-tab-wrapper .mat-date-range-input-separator');
    if (separator) {
      this.renderer.setStyle(separator, 'margin', '0 4px', 1);
      this.renderer.setStyle(separator, 'color', textColor, 1);
      this.renderer.setStyle(separator, 'opacity', '1', 1);
    }

    // 10. Style the calendar toggle button
    const toggleBtn = root.querySelector(
      '.mapping-tab-wrapper .custom-pill-date .mat-datepicker-toggle button',
    );
    if (toggleBtn) {
      this.renderer.setStyle(toggleBtn, 'width', '32px', 1);
      this.renderer.setStyle(toggleBtn, 'height', '32px', 1);
      this.renderer.setStyle(toggleBtn, 'padding', '0', 1);
      this.renderer.setStyle(toggleBtn, 'margin-left', '4px', 1);
      this.renderer.setStyle(toggleBtn, 'min-width', '32px', 1);
      this.renderer.setStyle(toggleBtn, 'background', 'transparent', 1);
      this.renderer.setStyle(toggleBtn, 'border', 'none', 1);
      this.renderer.setStyle(toggleBtn, 'outline', 'none', 1);

      const svg = toggleBtn.querySelector('svg');
      if (svg) {
        this.renderer.setStyle(svg, 'width', '19px', 1);
        this.renderer.setStyle(svg, 'height', '19px', 1);
        this.renderer.setStyle(svg, 'fill', '#818588', 1);
        this.renderer.setStyle(svg, 'opacity', '0.7', 1);
      }
    }

    // 11. Style the clear button
    const clearBtn = root.querySelector('.mapping-tab-wrapper .clear-date-btn');
    if (clearBtn) {
      this.renderer.setStyle(clearBtn, 'width', '28px', 1);
      this.renderer.setStyle(clearBtn, 'height', '28px', 1);
      this.renderer.setStyle(clearBtn, 'padding', '0', 1);
      this.renderer.setStyle(clearBtn, 'min-width', '28px', 1);
      this.renderer.setStyle(clearBtn, 'border-radius', '50%', 1);
      this.renderer.setStyle(clearBtn, 'display', 'flex', 1);
      this.renderer.setStyle(clearBtn, 'align-items', 'center', 1);
      this.renderer.setStyle(clearBtn, 'justify-content', 'center', 1);

      const icon = clearBtn.querySelector('mat-icon');
      if (icon) {
        this.renderer.setStyle(icon, 'width', '16px', 1);
        this.renderer.setStyle(icon, 'height', '16px', 1);
        this.renderer.setStyle(icon, 'font-size', '16px', 1);
        this.renderer.setStyle(icon, 'fill', '#818588', 1);
        this.renderer.setStyle(icon, 'opacity', '0.7', 1);
      }
    }

    console.log('[fixMappingsDateInputLayout] Completed with non-destructive listeners.');
  }

  private fixRulesDateInputLayout(): void {
    const root = this.el.nativeElement;

    // Detect current theme
    const isDarkMode =
      document.body.classList.contains('dark-theme') ||
      document.documentElement.classList.contains('dark-theme') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    console.log('[fixRulesDateInputLayout] Dark mode:', isDarkMode);

    // Theme-specific colors
    const bgColor = isDarkMode ? '#1E1E1E' : '#FFFFFF';
    const hoverColor = isDarkMode ? '#2E2E2E' : '#F5F5F5';
    const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : '#E0E0E0';
    const textColor = isDarkMode ? '#FFFFFF' : 'rgba(0, 0, 0, 0.87)';

    // 1. CRITICAL: Remove ALL MDC outline elements
    const outlineElements = root.querySelectorAll(
      '.rules-tab-wrapper .mdc-notched-outline, ' +
        '.rules-tab-wrapper .mdc-notched-outline__leading, ' +
        '.rules-tab-wrapper .mdc-notched-outline__notch, ' +
        '.rules-tab-wrapper .mdc-notched-outline__trailing',
    );
    outlineElements.forEach((el: HTMLElement) => {
      this.renderer.setStyle(el, 'display', 'none', 1);
      this.renderer.setStyle(el, 'border', 'none', 1);
      this.renderer.setStyle(el, 'outline', 'none', 1);
    });

    // 2. Remove MDC wrapper borders and backgrounds
    const textFieldWrappers = root.querySelectorAll(
      '.rules-tab-wrapper .mat-mdc-text-field-wrapper',
    );
    textFieldWrappers.forEach((wrapper: HTMLElement) => {
      if (wrapper.classList.contains('mat-date-range-input-wrapper')) {
        return;
      }
      this.renderer.setStyle(wrapper, 'background', 'transparent', 1);
      this.renderer.setStyle(wrapper, 'padding', '0', 1);
      this.renderer.setStyle(wrapper, 'border', 'none', 1);
      this.renderer.setStyle(wrapper, 'outline', 'none', 1);
      this.renderer.setStyle(wrapper, 'box-shadow', 'none', 1);
    });

    // 3. Remove form field underlines
    const formFields = root.querySelectorAll('.rules-tab-wrapper .mat-mdc-form-field');
    formFields.forEach((field: HTMLElement) => {
      this.renderer.setStyle(field, 'border', 'none', 1);
      this.renderer.setStyle(field, 'outline', 'none', 1);
    });

    // 4. Remove subscript wrapper
    const subscriptWrappers = root.querySelectorAll(
      '.rules-tab-wrapper .mat-mdc-form-field-subscript-wrapper',
    );
    subscriptWrappers.forEach((sub: HTMLElement) => {
      this.renderer.setStyle(sub, 'display', 'none', 1);
    });

    // 5. Fix the main container positioning
    const filterDateRange = root.querySelector('.rules-tab-wrapper .filter-date-range');
    if (filterDateRange) {
      this.renderer.setStyle(filterDateRange, 'margin-top', '0.0em', 1);
      this.renderer.setStyle(filterDateRange, 'display', 'flex', 1);
      this.renderer.setStyle(filterDateRange, 'align-items', 'center', 1);
      this.renderer.setStyle(filterDateRange, 'gap', '8px', 1);
    }

    // 6. Style the date range input container
    const dateRangeInput = root.querySelector('.rules-tab-wrapper .custom-pill-date');
    if (dateRangeInput) {
      this.renderer.setStyle(dateRangeInput, 'border', 'none', 1);
      this.renderer.setStyle(dateRangeInput, 'outline', 'none', 1);
      this.renderer.setStyle(dateRangeInput, 'box-shadow', 'none', 1);
    }

    // 7. Ensure the container has proper styling
    const container = root.querySelector(
      '.rules-tab-wrapper .custom-pill-date .mat-date-range-input-container',
    );
    if (container) {
      this.renderer.setStyle(container, 'padding', '0', 1);
      this.renderer.setStyle(container, 'overflow', 'visible', 1);
      this.renderer.setStyle(container, 'display', 'flex', 1);
      this.renderer.setStyle(container, 'align-items', 'center', 1);
      this.renderer.setStyle(container, 'gap', '0', 1);
      this.renderer.setStyle(container, 'border', 'none', 1);
      this.renderer.setStyle(container, 'outline', 'none', 1);
    }

    // 8. CRITICAL: Apply theme-aware colors AND handle dynamic sync for selection
    const wrappers = root.querySelectorAll('.rules-tab-wrapper .mat-date-range-input-wrapper');
    wrappers.forEach((wrapper: HTMLElement) => {
      this.renderer.setStyle(wrapper, 'background', bgColor, 1);
      this.renderer.setStyle(wrapper, 'border', `1px solid ${borderColor}`, 1);
      this.renderer.setStyle(wrapper, 'border-radius', '6px', 1);
      this.renderer.setStyle(wrapper, 'height', '32px', 1);
      this.renderer.setStyle(wrapper, 'min-width', '80px', 1);
      this.renderer.setStyle(wrapper, 'padding', '0 10px', 1);
      this.renderer.setStyle(wrapper, 'display', 'flex', 1);
      this.renderer.setStyle(wrapper, 'align-items', 'center', 1);
      this.renderer.setStyle(wrapper, 'cursor', 'pointer', 1);
      this.renderer.setStyle(wrapper, 'box-sizing', 'border-box', 1);
      this.renderer.setStyle(wrapper, 'overflow', 'visible', 1);
      this.renderer.setStyle(wrapper, 'transition', 'background 0.2s ease', 1);

      const syncStyles = (input: HTMLInputElement) => {
        this.renderer.setStyle(input, 'color', textColor, 1);
        this.renderer.setStyle(input, 'caret-color', textColor, 1);
        this.renderer.setStyle(input, '-webkit-text-fill-color', textColor, 1);
        this.renderer.setStyle(input, 'opacity', '1', 1);
        this.renderer.setStyle(input, 'visibility', 'visible', 1);
      };

      const innerInputs = wrapper.querySelectorAll('input');
      innerInputs.forEach((input: HTMLInputElement) => {
        syncStyles(input);
        input.addEventListener('input', () => syncStyles(input));
        input.addEventListener('change', () => syncStyles(input));
      });

      wrapper.addEventListener('mouseenter', () => {
        this.renderer.setStyle(wrapper, 'background', hoverColor, 1);
      });
      wrapper.addEventListener('mouseleave', () => {
        this.renderer.setStyle(wrapper, 'background', bgColor, 1);
      });
    });

    // 9. Fix separator spacing and color
    const separator = root.querySelector('.rules-tab-wrapper .mat-date-range-input-separator');
    if (separator) {
      this.renderer.setStyle(separator, 'margin', '0 4px', 1);
      this.renderer.setStyle(separator, 'color', textColor, 1);
      this.renderer.setStyle(separator, 'opacity', '1', 1);
    }

    // 10. Style the calendar toggle button
    const toggleBtn = root.querySelector(
      '.rules-tab-wrapper .custom-pill-date .mat-datepicker-toggle button',
    );
    if (toggleBtn) {
      this.renderer.setStyle(toggleBtn, 'width', '32px', 1);
      this.renderer.setStyle(toggleBtn, 'height', '32px', 1);
      this.renderer.setStyle(toggleBtn, 'padding', '0', 1);
      this.renderer.setStyle(toggleBtn, 'margin-left', '4px', 1);
      this.renderer.setStyle(toggleBtn, 'min-width', '32px', 1);
      this.renderer.setStyle(toggleBtn, 'background', 'transparent', 1);
      this.renderer.setStyle(toggleBtn, 'border', 'none', 1);
      this.renderer.setStyle(toggleBtn, 'outline', 'none', 1);

      const svg = toggleBtn.querySelector('svg');
      if (svg) {
        this.renderer.setStyle(svg, 'width', '19px', 1);
        this.renderer.setStyle(svg, 'height', '19px', 1);
        this.renderer.setStyle(svg, 'fill', '#818588', 1);
        this.renderer.setStyle(svg, 'opacity', '0.7', 1);
      }
    }

    // 11. Style the clear button
    const clearBtn = root.querySelector('.rules-tab-wrapper .clear-date-btn');
    if (clearBtn) {
      this.renderer.setStyle(clearBtn, 'width', '28px', 1);
      this.renderer.setStyle(clearBtn, 'height', '28px', 1);
      this.renderer.setStyle(clearBtn, 'padding', '0', 1);
      this.renderer.setStyle(clearBtn, 'min-width', '28px', 1);
      this.renderer.setStyle(clearBtn, 'border-radius', '50%', 1);
      this.renderer.setStyle(clearBtn, 'display', 'flex', 1);
      this.renderer.setStyle(clearBtn, 'align-items', 'center', 1);
      this.renderer.setStyle(clearBtn, 'justify-content', 'center', 1);

      const icon = clearBtn.querySelector('mat-icon');
      if (icon) {
        this.renderer.setStyle(icon, 'width', '16px', 1);
        this.renderer.setStyle(icon, 'height', '16px', 1);
        this.renderer.setStyle(icon, 'font-size', '16px', 1);
        this.renderer.setStyle(icon, 'fill', '#818588', 1);
        this.renderer.setStyle(icon, 'opacity', '0.7', 1);
      }
    }

    console.log('[fixRulesDateInputLayout] Completed with exact Mapping styles.');
  }

  /**
   * Fully synchronizes the Material Date Range input layout with the Codes tab pill style.
   * This method removes standard Material Design components (MDC) decorations and
   * enforces the custom pill container appearance for both light and dark themes.
   */
  private fixCodesDateInputLayout(): void {
    const root = this.el.nativeElement;

    // Detect current theme to apply appropriate hex codes for high-specificity injection
    const isDarkMode =
      document.body.classList.contains('dark-theme') ||
      document.documentElement.classList.contains('dark-theme') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    console.log('[fixCodesDateInputLayout] Dark mode:', isDarkMode);

    // Theme-specific colors matching your SCSS definitions
    const bgColor = isDarkMode ? '#1E1E1E' : '#FFFFFF';
    const hoverColor = isDarkMode ? '#2E2E2E' : '#F5F5F5';
    const borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : '#E0E0E0';
    const textColor = isDarkMode ? '#FFFFFF' : 'rgba(0, 0, 0, 0.87)';

    // 1. CRITICAL: Remove ALL MDC outline elements that create double borders
    const outlineElements = root.querySelectorAll(
      '.codes-tab-wrapper .mdc-notched-outline, ' +
        '.codes-tab-wrapper .mdc-notched-outline__leading, ' +
        '.codes-tab-wrapper .mdc-notched-outline__notch, ' +
        '.codes-tab-wrapper .mdc-notched-outline__trailing',
    );
    outlineElements.forEach((el: HTMLElement) => {
      this.renderer.setStyle(el, 'display', 'none', 1);
      this.renderer.setStyle(el, 'border', 'none', 1);
      this.renderer.setStyle(el, 'outline', 'none', 1);
    });

    // 2. Remove MDC wrapper borders, backgrounds, and vertical padding
    const textFieldWrappers = root.querySelectorAll(
      '.codes-tab-wrapper .mat-mdc-text-field-wrapper',
    );
    textFieldWrappers.forEach((wrapper: HTMLElement) => {
      // We skip the custom wrapper we intend to style manually in step 8
      if (wrapper.classList.contains('mat-date-range-input-wrapper')) {
        return;
      }
      this.renderer.setStyle(wrapper, 'background', 'transparent', 1);
      this.renderer.setStyle(wrapper, 'padding', '0', 1);
      this.renderer.setStyle(wrapper, 'border', 'none', 1);
      this.renderer.setStyle(wrapper, 'outline', 'none', 1);
      this.renderer.setStyle(wrapper, 'box-shadow', 'none', 1);
    });

    // 3. Remove default form field underlines and alignment restrictions
    const formFields = root.querySelectorAll('.codes-tab-wrapper .mat-mdc-form-field');
    formFields.forEach((field: HTMLElement) => {
      this.renderer.setStyle(field, 'border', 'none', 1);
      this.renderer.setStyle(field, 'outline', 'none', 1);
    });

    // 4. Remove subscript wrapper (errors/hints) to collapse height
    const subscriptWrappers = root.querySelectorAll(
      '.codes-tab-wrapper .mat-mdc-form-field-subscript-wrapper',
    );
    subscriptWrappers.forEach((sub: HTMLElement) => {
      this.renderer.setStyle(sub, 'display', 'none', 1);
    });

    // 5. Fix the main container positioning and gap consistency
    const filterDateRange = root.querySelector('.codes-tab-wrapper .filter-date-range');
    if (filterDateRange) {
      this.renderer.setStyle(filterDateRange, 'margin-top', '0.0em', 1);
      this.renderer.setStyle(filterDateRange, 'display', 'flex', 1);
      this.renderer.setStyle(filterDateRange, 'align-items', 'center', 1);
      this.renderer.setStyle(filterDateRange, 'gap', '8px', 1);
    }

    // 6. Style the date range input container to be borderless
    const dateRangeInput = root.querySelector('.codes-tab-wrapper .custom-pill-date');
    if (dateRangeInput) {
      this.renderer.setStyle(dateRangeInput, 'border', 'none', 1);
      this.renderer.setStyle(dateRangeInput, 'outline', 'none', 1);
      this.renderer.setStyle(dateRangeInput, 'box-shadow', 'none', 1);
    }

    // 7. Remove infix padding which often shifts the text vertically
    const infixWrappers = root.querySelectorAll('.codes-tab-wrapper .mat-mdc-form-field-infix');
    infixWrappers.forEach((infix: HTMLElement) => {
      this.renderer.setStyle(infix, 'padding', '0', 1);
      this.renderer.setStyle(infix, 'min-height', 'auto', 1);
      this.renderer.setStyle(infix, 'border-top', 'none', 1);
    });

    // 8. CRITICAL: Apply theme-aware colors and style the Pill Wrapper
    const wrappers = root.querySelectorAll('.codes-tab-wrapper .mat-date-range-input-wrapper');
    wrappers.forEach((wrapper: HTMLElement) => {
      this.renderer.setStyle(wrapper, 'background', bgColor, 1);
      this.renderer.setStyle(wrapper, 'border', `1px solid ${borderColor}`, 1);
      this.renderer.setStyle(wrapper, 'border-radius', '6px', 1);
      this.renderer.setStyle(wrapper, 'height', '32px', 1);
      this.renderer.setStyle(wrapper, 'min-width', '80px', 1);
      this.renderer.setStyle(wrapper, 'padding', '0 10px', 1);
      this.renderer.setStyle(wrapper, 'display', 'flex', 1);
      this.renderer.setStyle(wrapper, 'align-items', 'center', 1);
      this.renderer.setStyle(wrapper, 'cursor', 'pointer', 1);
      this.renderer.setStyle(wrapper, 'box-sizing', 'border-box', 1);
      this.renderer.setStyle(wrapper, 'overflow', 'visible', 1);
      this.renderer.setStyle(wrapper, 'transition', 'background 0.2s ease', 1);

      const syncStyles = (input: HTMLInputElement) => {
        this.renderer.setStyle(input, 'color', textColor, 1);
        this.renderer.setStyle(input, 'caret-color', textColor, 1);
        this.renderer.setStyle(input, '-webkit-text-fill-color', textColor, 1);
        this.renderer.setStyle(input, 'background', 'transparent', 1);
        this.renderer.setStyle(input, 'opacity', '1', 1);
        this.renderer.setStyle(input, 'visibility', 'visible', 1);
      };

      const innerInputs = wrapper.querySelectorAll('input');
      innerInputs.forEach((input: HTMLInputElement) => {
        syncStyles(input);
        // Ensure color stays correct on interaction
        input.addEventListener('input', () => syncStyles(input));
        input.addEventListener('change', () => syncStyles(input));
        input.addEventListener('focus', () => syncStyles(input));
      });

      wrapper.addEventListener('mouseenter', () => {
        this.renderer.setStyle(wrapper, 'background', hoverColor, 1);
      });
      wrapper.addEventListener('mouseleave', () => {
        this.renderer.setStyle(wrapper, 'background', bgColor, 1);
      });
    });

    // 9. Fix separator spacing and color to match the text
    const separator = root.querySelector('.codes-tab-wrapper .mat-date-range-input-separator');
    if (separator) {
      this.renderer.setStyle(separator, 'margin', '0 4px', 1);
      this.renderer.setStyle(separator, 'color', textColor, 1);
      this.renderer.setStyle(separator, 'opacity', '1', 1);
    }

    // 10. Style the calendar toggle button
    const toggleBtn = root.querySelector(
      '.codes-tab-wrapper .custom-pill-date .mat-datepicker-toggle button',
    );
    if (toggleBtn) {
      this.renderer.setStyle(toggleBtn, 'width', '32px', 1);
      this.renderer.setStyle(toggleBtn, 'height', '32px', 1);
      this.renderer.setStyle(toggleBtn, 'padding', '0', 1);
      this.renderer.setStyle(toggleBtn, 'margin-left', '4px', 1);
      this.renderer.setStyle(toggleBtn, 'min-width', '32px', 1);
      this.renderer.setStyle(toggleBtn, 'background', 'transparent', 1);
      this.renderer.setStyle(toggleBtn, 'border', 'none', 1);
      this.renderer.setStyle(toggleBtn, 'outline', 'none', 1);

      const svg = toggleBtn.querySelector('svg');
      if (svg) {
        this.renderer.setStyle(svg, 'width', '19px', 1);
        this.renderer.setStyle(svg, 'height', '19px', 1);
        this.renderer.setStyle(svg, 'fill', '#818588', 1);
        this.renderer.setStyle(svg, 'opacity', '0.7', 1);
      }
    }

    // 11. Style the clear (X) button for the date range
    const clearBtn = root.querySelector('.codes-tab-wrapper .clear-date-btn');
    if (clearBtn) {
      this.renderer.setStyle(clearBtn, 'width', '28px', 1);
      this.renderer.setStyle(clearBtn, 'height', '28px', 1);
      this.renderer.setStyle(clearBtn, 'padding', '0', 1);
      this.renderer.setStyle(clearBtn, 'min-width', '28px', 1);
      this.renderer.setStyle(clearBtn, 'border-radius', '50%', 1);
      this.renderer.setStyle(clearBtn, 'display', 'flex', 1);
      this.renderer.setStyle(clearBtn, 'align-items', 'center', 1);
      this.renderer.setStyle(clearBtn, 'justify-content', 'center', 1);

      const icon = clearBtn.querySelector('mat-icon');
      if (icon) {
        this.renderer.setStyle(icon, 'width', '16px', 1);
        this.renderer.setStyle(icon, 'height', '16px', 1);
        this.renderer.setStyle(icon, 'font-size', '16px', 1);
        this.renderer.setStyle(icon, 'fill', '#818588', 1);
        this.renderer.setStyle(icon, 'opacity', '0.7', 1);
      }
    }

    console.log('[fixCodesDateInputLayout] Completed with exact Mapping styles.');
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

  private refreshTablePointers(): void {
    // 1. Identify the active data source based on the current tab
    const ds = this.getActiveDataSource();
    if (!ds) return;

    // 2. Map the specific Paginator and Sort for the active view
    // Material tables inside @if blocks lose these references when switching
    switch (this.activeTabIndex) {
      case 0: // Models
        ds.paginator = this.modelPaginator;
        ds.sort = this.modelSort; // Ensure you have @ViewChild('modelSort')
        break;
      case 1: // Mappings
        ds.paginator = this.mappingPaginator;
        ds.sort = this.mappingSort; // Ensure you have @ViewChild('mappingSort')
        break;
      case 2: // Rules
        ds.paginator = this.rulePaginator;
        ds.sort = this.ruleSort; // Ensure you have @ViewChild('ruleSort')
        break;
      case 3: // Versions (Graph of Events)
        ds.paginator = this.versionPaginator;
        // Versions usually use the global sort or a specific versionSort
        ds.sort = this.sort;
        break;
      case 4: // Codes (MPI Value Sets)
        ds.paginator = this.codePaginator;
        ds.sort = this.codeSort; // Ensure you have @ViewChild('codeSort')
        break;
    }

    // 3. Force the data source to recognize the newly attached pointers
    if (ds.paginator) {
      ds.paginator._changePageSize(ds.paginator.pageSize);
    }

    this.cdr.detectChanges();
  }

  applyMappingFilter(): void {
    // 1. Start with full original mapping data
    let filtered = [...this.originalMappingData];

    // 2. DEEP SEARCH BOX FILTER
    // Matches Name, Source, Target, Status, and even Field counts/Coverage
    if (this.mappingSearch?.trim()) {
      const search = this.mappingSearch.toLowerCase().trim();
      filtered = filtered.filter(item => {
        return (
          item.name?.toLowerCase().includes(search) ||
          item.source?.toLowerCase().includes(search) ||
          item.target?.toLowerCase().includes(search) ||
          item.status?.toLowerCase().includes(search) ||
          item.fields?.toString().includes(search) ||
          item.coverage?.toLowerCase().includes(search)
        );
      });
    }

    // 3. Status Filter
    const statusKey = (this.selectedMappingStatus || '').toLowerCase();
    if (
      statusKey !== '' &&
      statusKey !== 'all' &&
      statusKey !== 'any' &&
      statusKey !== 'all statuses'
    ) {
      filtered = filtered.filter(item => item.status.toLowerCase() === statusKey);
    }

    // 4. Source Filter
    const sourceKey = (this.selectedMappingSource || '').toLowerCase();
    if (
      sourceKey !== '' &&
      sourceKey !== 'all' &&
      sourceKey !== 'any' &&
      sourceKey !== 'all sources'
    ) {
      filtered = filtered.filter(item => item.source.toLowerCase() === sourceKey);
    }

    // 5. Target Model Filter
    const targetKey = (this.selectedMappingTarget || '').toLowerCase();
    if (
      targetKey !== '' &&
      targetKey !== 'all' &&
      targetKey !== 'any' &&
      targetKey !== 'all targets'
    ) {
      filtered = filtered.filter(item => item.target.toLowerCase() === targetKey);
    }

    // 6. Coverage Filter
    const coverageKey = (this.selectedMappingCoverage || '').toLowerCase();
    if (
      coverageKey !== '' &&
      coverageKey !== 'all' &&
      coverageKey !== 'any' &&
      coverageKey !== 'all coverage'
    ) {
      filtered = filtered.filter(item => item.coverage.toLowerCase().includes(coverageKey));
    }

    // 7. Date Range Filter
    const { start, end } = this.mappingDateRange.value;
    if (start || end) {
      filtered = filtered.filter(item => {
        const mappingDate = new Date(item.lastModified);
        mappingDate.setHours(0, 0, 0, 0);

        if (start) {
          const startDate = new Date(start);
          startDate.setHours(0, 0, 0, 0);
          if (mappingDate < startDate) return false;
        }
        if (end) {
          const endDate = new Date(end);
          endDate.setHours(23, 59, 59, 999);
          if (mappingDate > endDate) return false;
        }
        return true;
      });
    }

    // 8. Assign data and reset pagination
    this.mappingDataSource.data = filtered;
    if (this.mappingPaginator) {
      this.mappingPaginator.firstPage();
    }

    // 9. FIX STYLE DEATH & TAB VISIBILITY
    // Force Change Detection then run Renderer2 styles in next tick
    this.cdr.detectChanges();
    setTimeout(() => {
      this.fixMappingsDateInputLayout();
    }, 0);
  }

  public applyRuleFilter(): void {
    // Import dayjs for reliable date manipulation
    import('dayjs').then(({ default: dayjs }) => {
      // 1. Start with full original rule data
      let filtered = [...this.originalRuleData];

      // 2. DEEP SEARCH BOX FILTER
      if (this.ruleSearch?.trim()) {
        const search = this.ruleSearch.toLowerCase().trim();
        filtered = filtered.filter(
          item =>
            item.ruleName?.toLowerCase().includes(search) ||
            item.trigger?.toLowerCase().includes(search) ||
            item.severity?.toLowerCase().includes(search) ||
            item.scope?.toLowerCase().includes(search) ||
            item.status?.toLowerCase().includes(search),
        );
      }

      // 3. Governance Logic (Status, Severity, Scope, Trigger)
      const statusKey = (this.selectedRuleStatus || '').toLowerCase();
      if (statusKey !== '' && !['all', 'any', 'all statuses'].includes(statusKey)) {
        filtered = filtered.filter(item => item.status?.toLowerCase() === statusKey);
      }

      const severityKey = (this.selectedRuleSeverity || '').toLowerCase();
      if (severityKey !== '' && !['all', 'any', 'all severities'].includes(severityKey)) {
        filtered = filtered.filter(item => item.severity?.toLowerCase() === severityKey);
      }

      const scopeKey = (this.selectedRuleScope || '').toLowerCase();
      if (scopeKey !== '' && !['all', 'any', 'all scopes'].includes(scopeKey)) {
        filtered = filtered.filter(item => item.scope?.toLowerCase() === scopeKey);
      }

      const triggerKey = (this.selectedRuleTrigger || '').toLowerCase();
      if (triggerKey !== '' && !['all', 'any', 'all triggers'].includes(triggerKey)) {
        filtered = filtered.filter(item => item.trigger?.toLowerCase() === triggerKey);
      }

      // 4. DATE RANGE FILTER - USING DAYJS WITH -1 DAY DELTA
      const { start, end } = this.ruleDateRange.value;
      if (start || end) {
        // const now = dayjs();

        // CRITICAL: Use dayjs to subtract 1 day from start for inclusive filtering
        // User selects Jan 13 → startBoundary becomes Jan 12 start of day
        const startBoundary = start ? dayjs(start).subtract(1, 'day').startOf('day') : null;

        // End boundary: end of the selected day
        const endBoundary = end ? dayjs(end).endOf('day') : null;

        console.log('[DATE FILTER WITH DAYJS]', {
          userSelectedStart: start ? dayjs(start).format('YYYY-MM-DD') : null,
          userSelectedEnd: end ? dayjs(end).format('YYYY-MM-DD') : null,
          startBoundary: startBoundary ? startBoundary.format('YYYY-MM-DD HH:mm:ss') : null,
          endBoundary: endBoundary ? endBoundary.format('YYYY-MM-DD HH:mm:ss') : null,
        });

        filtered = filtered.filter(item => {
          const rawDate = item.lastModified;
          let itemDate: any;

          // Resolve "X days ago" vs ISO/timestamp using dayjs
          if (typeof rawDate === 'string' && rawDate.toLowerCase().includes('days ago')) {
            const daysAgo = parseInt(rawDate.split(' ')[0], 10);
            itemDate = dayjs().subtract(daysAgo, 'day').startOf('day');
          } else {
            itemDate = dayjs(rawDate).startOf('day');
          }

          console.log('[CHECKING ITEM]', {
            rawDate,
            itemDate: itemDate.format('YYYY-MM-DD'),
            passesStart: startBoundary === null || itemDate.isAfter(startBoundary),
            passesEnd:
              endBoundary === null ||
              itemDate.isBefore(endBoundary) ||
              itemDate.isSame(endBoundary),
          });

          // INCLUSIVE RANGE CHECK using dayjs comparisons
          // With -1 day delta: if user selects Jan 13, startBoundary is Jan 12
          // Jan 13 data will be AFTER Jan 12, so it's included
          if (startBoundary !== null && !itemDate.isAfter(startBoundary)) {
            return false; // At or before the boundary (Jan 12)
          }

          if (endBoundary !== null && itemDate.isAfter(endBoundary)) {
            return false; // After end date
          }

          return true;
        });

        console.log('[FILTERED RESULT]', `${filtered.length} items after date filter`);
      }

      // 5. Update UI and reset pagination
      this.ruleDataSource.data = filtered;
      if (this.rulePaginator) {
        this.rulePaginator.firstPage();
      }
      this.cdr.detectChanges();

      setTimeout(() => {
        this.fixRulesDateInputLayout();
      }, 0);
    });
  }

  applyVersionFilter(): void {
    const { start, end } = this.range.value;
    const search = this.versionSearch?.trim()?.toLowerCase();

    this.filteredVersionHistory = this.versionHistory.filter(commit => {
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

  /**
   * Clear the date range for Models tab
   */
  clearMappingDateRange(): void {
    this.mappingDateRange.patchValue({ start: null, end: null });
    this.mappingDateRange.markAsPristine();
    this.mappingDateRange.markAsUntouched();

    // Force a style refresh so placeholders show up correctly
    setTimeout(() => {
      this.fixModelsDateInputLayout();
      this.cdr.detectChanges();
    }, 0);
  }

  /**
   * Clear the date range for Codes tab
   */
  clearCodeDateRange(): void {
    this.codeDateRange.patchValue({ start: null, end: null });
    this.codeDateRange.markAsPristine();
    this.codeDateRange.markAsUntouched();

    // Force a style refresh so placeholders show up correctly in the pill
    setTimeout(() => {
      this.fixCodesDateInputLayout();
      this.applyCodeFilter();
      this.cdr.detectChanges();
    }, 0);
  }

  /**
   * Resets the Rule Date Range and forces a UI style refresh.
   */
  clearRuleDateRange(): void {
    this.ruleDateRange.reset();
    this.cdr.detectChanges();
    this.applyRuleFilter();
    setTimeout(() => {
      this.fixRulesDateInputLayout();
      this.cdr.detectChanges();
    }, 0);
  }

  /**
   * Clear the date range for Models tab
   */
  clearModelDateRange(): void {
    this.modelDateRange.patchValue({ start: null, end: null });
    this.modelDateRange.markAsPristine();
    this.modelDateRange.markAsUntouched();

    // Force a style refresh so placeholders show up correctly
    setTimeout(() => {
      this.fixModelsDateInputLayout();
      this.cdr.detectChanges();
    }, 0);
  }

  clearDateRange(): void {
    this.range.reset();
  }

  /**
   * Executes comprehensive filtering for the Codes/Value Sets table.
   * Includes search across Value Set Name, Category, Status, Source, Usage, and References.
   */
  public applyCodeFilter(): void {
    // Start with full original code data
    let filtered = [...this.originalCodeData];

    // 1. DEEP SEARCH BOX FILTER
    // Searches all visible columns in the layout: Name, Category, Status, Source, Usage, and References.
    if (this.codeSearch?.trim()) {
      const search = this.codeSearch.toLowerCase().trim();
      filtered = filtered.filter(
        item =>
          item.valueSetName?.toLowerCase().includes(search) ||
          item.category?.toLowerCase().includes(search) ||
          item.status?.toLowerCase().includes(search) ||
          item.source?.toLowerCase().includes(search) ||
          item.usage?.toLowerCase().includes(search) ||
          item.lastModified?.toLowerCase().includes(search) ||
          item.references?.toString().includes(search),
      );
    }

    // 2. GOVERNANCE LOGIC (Category, Status, Source, Usage)
    // Ensures filters are only applied if a specific selection is made.
    const categoryKey = (this.selectedCodeCategory || '').toLowerCase();
    if (categoryKey !== '' && !['all', 'any', 'all categories'].includes(categoryKey)) {
      filtered = filtered.filter(item => item.category?.toLowerCase() === categoryKey);
    }

    const statusKey = (this.selectedCodeStatus || '').toLowerCase();
    if (statusKey !== '' && !['all', 'any', 'all statuses'].includes(statusKey)) {
      filtered = filtered.filter(item => item.status?.toLowerCase() === statusKey);
    }

    const sourceKey = (this.selectedCodeSource || '').toLowerCase();
    if (sourceKey !== '' && !['all', 'any', 'all sources'].includes(sourceKey)) {
      filtered = filtered.filter(item => item.source?.toLowerCase() === sourceKey);
    }

    const usageKey = (this.selectedCodeUsage || '').toLowerCase();
    if (usageKey !== '' && !['all', 'any', 'all usage'].includes(usageKey)) {
      filtered = filtered.filter(item => item.usage?.toLowerCase() === usageKey);
    }

    // 3. DATE RANGE FILTER
    // Uses dayjs to handle both absolute ISO strings and relative "3 days ago" formats.
    const { start, end } = this.codeDateRange.value;
    if (start || end) {
      import('dayjs').then(({ default: dayjs }) => {
        const startBoundary = start ? dayjs(start).subtract(1, 'day').startOf('day') : null;

        const endBoundary = end ? dayjs(end).endOf('day') : null;

        filtered = filtered.filter(item => {
          const rawDate = item.lastModified;
          let itemDate: any;

          // Support for "X days ago" string format found in normalization history
          if (typeof rawDate === 'string' && rawDate.toLowerCase().includes('days ago')) {
            const daysAgo = parseInt(rawDate.split(' ')[0], 10);
            itemDate = dayjs().subtract(daysAgo, 'day').startOf('day');
          } else {
            itemDate = dayjs(rawDate).startOf('day');
          }

          if (startBoundary !== null && !itemDate.isAfter(startBoundary)) return false;
          if (endBoundary !== null && itemDate.isAfter(endBoundary)) return false;
          return true;
        });

        this.finalizeCodeFilter(filtered);
      });
    } else {
      this.finalizeCodeFilter(filtered);
    }
  }

  /**
   * Updates the MatTableDataSource and refreshes paginator/sort for the Codes tab.
   */
  private finalizeCodeFilter(data: any[]): void {
    this.codeDataSource.data = data;
    if (this.codePaginator) {
      this.codeDataSource.paginator = this.codePaginator;
    }
    if (this.codeSort) {
      this.codeDataSource.sort = this.codeSort;
    }
  }

  private filterDS(ds: MatTableDataSource<any>, val: string): void {
    ds.filter = val.trim().toLowerCase();
    if (ds.paginator) ds.paginator.firstPage();
  }

  /**
   * Updated Filter Logic:
   * 1. Treats 'All' or 'Any' as a wildcard (returns everything for that category).
   * 2. Matches specific selections like 'Canonical' exactly.
   * 3. Fixes the 'logic that kills styles' by re-running Renderer2 overrides.
   */
  applyModelFilter(): void {
    // 1. Start with full original data
    let filtered = [...this.originalModelData];

    // 2. Search Box Filter
    if (this.modelSearch?.trim()) {
      const search = this.modelSearch.toLowerCase().trim();
      filtered = filtered.filter(
        model =>
          model.name.toLowerCase().includes(search) || model.type.toLowerCase().includes(search),
      );
    }

    // 3. Status Filter (Bypass if "All", "Any", or empty)
    const statusKey = (this.selectedStatus || '').toLowerCase();
    if (
      statusKey !== '' &&
      statusKey !== 'all' &&
      statusKey !== 'any' &&
      statusKey !== 'all statuses'
    ) {
      filtered = filtered.filter(model => model.status.toLowerCase() === statusKey);
    }

    // 4. Type Filter (Bypass if "All", "Any", or empty)
    const typeKey = (this.selectedType || '').toLowerCase();
    if (typeKey !== '' && typeKey !== 'all' && typeKey !== 'any' && typeKey !== 'all types') {
      filtered = filtered.filter(model => model.type.toLowerCase() === typeKey);
    }

    // 5. Usage Filter (Bypass if "All", "Any", or empty)
    const usageKey = (this.selectedUsage || '').toLowerCase();
    if (usageKey !== '' && usageKey !== 'all' && usageKey !== 'any' && usageKey !== 'any usage') {
      filtered = filtered.filter(model => model.usage?.toLowerCase() === usageKey);
    }

    // 6. Date Range Filter
    const { start, end } = this.modelDateRange.value;
    if (start || end) {
      filtered = filtered.filter(model => {
        const modelDate = new Date(model.lastModified);
        modelDate.setHours(0, 0, 0, 0);

        if (start) {
          const startDate = new Date(start);
          startDate.setHours(0, 0, 0, 0);
          if (modelDate < startDate) return false;
        }
        if (end) {
          const endDate = new Date(end);
          endDate.setHours(23, 59, 59, 999);
          if (modelDate > endDate) return false;
        }
        return true;
      });
    }

    // Assign data and reset pagination
    this.modelDataSource.data = filtered;
    if (this.modelPaginator) {
      this.modelPaginator.firstPage();
    }

    // FIX STYLE DEATH:
    // Force Change Detection then run Renderer2 styles in next tick
    this.cdr.detectChanges();
    setTimeout(() => {
      this.fixModelsDateInputLayout();
    }, 0);
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

  // --- Actions ---
  addNewModel(): void {
    // Signal the view component to toggle isOpen = true
    this.eventService.publish('nf', 'open_new_model_modal', {
      action: 'open_new_model_modal',
      theme: this.getActiveTheme(),
      mode: 'create',
    });
  }

  addNewMapping(): void {
    // Signal the view component to toggle isOpen = true
    this.eventService.publish('nf', 'open_new_mapping_modal', {
      action: 'open_new_mapping_modal',
      theme: this.getActiveTheme(),
      mode: 'create',
    });
  }

  addNewRule(): void {
    // Define the dynamic options based on your application state or constants
    const metadataOptions = {
      severities: ['Low', 'Medium', 'High', 'Critical'],
      scopes: ['Field-level', 'Model-level', 'Source-level', 'System-level'],
      triggers: ['On Ingestion', 'On Update', 'Manual', 'Immediate', 'Aggregate', 'Scheduled'],
      logicTypes: [
        'Value Mapping',
        'Unit Conversion',
        'Rename / Alias',
        'Derived Value',
        'Default Value',
        'Null / Ignore',
      ],
      availableFields: [
        'patient_id',
        'first_name',
        'last_name',
        'dob',
        'gender',
        'postal_code',
        'insurance_provider',
        'height_in',
        'weight_lb',
        'temperature_f',
        'blood_pressure',
        'heart_rate',
      ],
      availableModels: [
        'Clinical Observation v2',
        'Patient Demographics v3',
        'Lab Results v1',
        'Vital Signs v2',
        'Insurance Claims v1',
      ],
    };

    this.eventService.publish('nf', 'open_new_normalization_rule_modal', {
      action: 'open_new_normalization_rule_modal',
      theme: this.getActiveTheme(), // 'dark' or 'light'
      mode: 'create',
      targetModel: 'Clinical Observation v2', // The context for the modal
      metadataOptions: metadataOptions,
      defaults: {
        name: '',
        severity: 'Medium',
        description:
          'Describe what this transformation does, any assumptions, or when it should be used.',
      },
    });
  }

  createNewVersion(): void {
    this.eventService.publish('nf', 'add_normalization_version', {
      theme: this.getActiveTheme(),
      mode: 'create',
    });
  }

  /**
   * Triggers the creation of a new Value Set.
   * Per MPI requirements, this must eventually invoke execute_merge_query_with_context
   * to log the transaction into the graph of events.
   */
  public addNewValueSet(): void {
    console.log('[Normalization] Opening dialog to add new Value Set');

    // Package all metadata options and defaults into the payload
    this.eventService.publish('nf', 'open_new_value_set_modal', {
      theme: this.getActiveTheme(),
      mode: 'create',
      action: 'open_new_value_set_modal',

      // Dynamic lists sent to the modal
      metadataOptions: {
        systems: this.CODE_SYSTEMS,
        statuses: this.CODE_STATUSES,
      },

      // Default values to pre-populate Step 1
      defaults: {
        system: 'ICD-10',
        status: 'Active',
        version: new Date().getFullYear().toString(),
      },
    });
  }

  /**
   * Opens the editor for a specific Value Set.
   * Transactions are logged to the graph of events per MPI requirements.
   */
  public editValueSet(item: any): void {
    console.log('[Normalization] Editing Code:', item);
    this.onEditCodeClick(item);
  }

  /**
   * Navigates to or opens a view showing where this Value Set is referenced.
   */
  public viewReferences(item: any): void {
    console.log('[Normalization] Viewing references for:', item.valueSetName);
  }

  /**
   * Triggers an export of the specific Value Set data.
   */
  public exportValueSet(item: any): void {
    console.log('[Normalization] Exporting Value Set:', item.valueSetName);
  }

  /**
   * Removes a Value Set and logs the deletion transaction.
   * All transactions must be related to a specific patient golden record.
   */
  public deleteValueSet(item: any): void {
    //  `MATCH (v:ValueSet {id: $id}) DETACH DELETE v`,
    if (confirm(`Are you sure you want to delete ${item.valueSetName}?`)) {
      console.log('[Normalization] Deleting Value Set:', item.valueSetName);
      // Use execute_merge_query_with_context for the deletion log
    }
  }

  /**
   * Logic for adding a brand new Value Set to the MPI environment.
   */
  addNewCodeSystem(): void {
    this.eventService.publish('nf', 'add_normalization_code', {
      theme: this.getActiveTheme(),
      mode: 'create',
    });
  }

  /**
   * Opens the editor for a specific Value Set / Code System.
   */
  public editCodeSystem(element: any): void {
    console.log('[Codes Tab] Editing Value Set:', element.id, element.valueSetName);
    // Implementation for opening a dialog or drawer would go here
  }

  /**
   * Navigates to a detailed view of the individual codes within a Value Set.
   */
  public viewCodeDetails(element: any): void {
    console.log('[Codes Tab] Viewing details for:', element.valueSetName);
    // Implementation for drill-down view
  }

  /**
   * Deletes a code system after confirmation.
   * Logs the transaction into the graph of events for traceability.
   */
  public deleteCodeSystem(element: any): void {
    const confirmation = confirm(`Are you sure you want to delete ${element.valueSetName}?`);
    if (confirmation) {
      this.originalCodeData = this.originalCodeData.filter(item => item.id !== element.id);
      this.applyCodeFilter();

      console.log('[MPI Governance] Transaction logged: Value Set Deleted', {
        id: element.id,
        timestamp: new Date().toISOString(),
      });
    }
  }

  onEdit(row: any): void {
    const signals = [
      'add_normalization_model',
      'add_normalization_mapping',
      'add_normalization_rule',
      'add_normalization_version',
      'add_normalization_code',
    ];
    const signalName =
      signals[this.activeTabIndex] ||
      `open_${this.activeTabLabel.toLowerCase().slice(0, -1)}_modal`;

    this.eventService.publish('nf', signalName, {
      theme: this.getActiveTheme(),
      mode: 'edit',
      data: row,
    });
  }

  /**
   * Specifically handles editing a Normalization Rule (Tab 2)
   */
  onEditRule(row: any): void {
    // Force set index if called from a menu where the tab might not be active,
    // though usually, the menu is only visible on the active tab.
    this.activeTabIndex = 2;
    this.onEdit(row);
  }

  /**
   * Specifically handles editing a Normalization Model (Tab 0)
   */
  onEditModel(row: any): void {
    this.activeTabIndex = 0;
    this.onEdit(row);
  }

  /**
   * Specifically handles editing a Normalization Mapping (Tab 1)
   */
  onEditMapping(row: any): void {
    this.activeTabIndex = 1;
    this.onEdit(row);
  }

  /**
   * Specifically handles editing a Normalization Code (Tab 4)
   */
  onEditCode(row: any): void {
    this.activeTabIndex = 4;
    this.onEdit(row);
  }

  /**
   * Specifically handles editing a Normalization Version (Tab 3)
   */
  onEditVersion(row: any): void {
    this.activeTabIndex = 3;
    this.onEdit(row);
  }

  onDeleteModel(item: any) {
    const confirmed = confirm(`Are you sure you want to delete model: ${item.name}?`);
    if (confirmed) {
      // Perform actual deletion logic here (e.g., service call)
      console.log('Model deleted and transaction logged to graph.');
    }
  }

  onDeleteMapping(item: any) {
    const confirmed = confirm(`Are you sure you want to delete mapping: ${item.name}?`);
    if (confirmed) {
      // Perform actual deletion logic here (e.g., service call)
      console.log('Mapping deleted and transaction logged to graph.');
    }
  }

  onDeleteCode(item: any) {
    const confirmed = confirm(`Are you sure you want to delete code: ${item.name}?`);
    if (confirmed) {
      // Perform actual deletion logic here (e.g., service call)
      console.log('Code deleted and transaction logged to graph.');
    }
  }

  onDeleteVersion(item: any) {
    const confirmed = confirm(`Are you sure you want to delete version: ${item.name}?`);
    if (confirmed) {
      // Perform actual deletion logic here (e.g., service call)
      console.log('Version deleted and transaction logged to graph.');
    }
  }

  onDeleteRule(item: any) {
    const confirmed = confirm(`Are you sure you want to delete rule: ${item.name}?`);
    if (confirmed) {
      // Perform actual deletion logic here (e.g., service call)
      console.log('Rule deleted and transaction logged to graph.');
    }
  }

  onTestMapping(item: any) {
    console.log('Testing mapping transformation:', item);

    // Logic to trigger the mapping test engine
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

  /**
   * Version History Tab Actions
   */
  onViewVersionDetails(item: any) {
    console.log('Viewing version payload:', item);
  }

  onCompareVersions(item: any) {
    console.log('Comparing versions for:', item);
  }

  onRestoreVersion(item: any) {
    const confirmed = confirm(
      `Rollback to version ${item.hash}? This will be logged as a new event.`,
    );
    if (confirmed) {
      // Logic to update the current state to this version
    }
  }

  onViewRuleLogs(item: any) {
    console.log('Viewing rule logs:', item);
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

  private setupRuleFilterPredicate(): void {
    this.ruleDataSource.filterPredicate = (data: any, filter: string) => {
      // 1. Text Search Logic
      const searchTerms = JSON.parse(filter);
      const nameMatch = data.ruleName.toLowerCase().includes(searchTerms.name.toLowerCase());
      const statusMatch = searchTerms.status ? data.status === searchTerms.status : true;

      // 2. Date Range Logic
      const recordDate = this.parseDynamicDate(data.lastModified).getTime();
      const start = searchTerms.dateRange.start
        ? new Date(searchTerms.dateRange.start).getTime()
        : null;
      const end = searchTerms.dateRange.end ? new Date(searchTerms.dateRange.end).getTime() : null;

      let dateMatch = true;
      if (start && end) {
        dateMatch = recordDate >= start && recordDate <= end;
      } else if (start) {
        dateMatch = recordDate >= start;
      } else if (end) {
        dateMatch = recordDate <= end;
      }

      return nameMatch && statusMatch && dateMatch;
    };
  }

  /**
   * Converts '2026-01-10' OR '5 days ago' into a comparable Date object
   */
  private parseDynamicDate(dateInput: string): Date {
    const now = new Date();

    // Handle "X days ago" notation
    if (dateInput.includes('days ago')) {
      const days = parseInt(dateInput.split(' ')[0], 10);
      const calculatedDate = new Date();
      calculatedDate.setDate(now.getDate() - days);
      calculatedDate.setHours(0, 0, 0, 0);
      return calculatedDate;
    }

    // Handle standard ISO / Date strings
    const parsed = new Date(dateInput);
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  public loadAllData(): void {
    // Usage types for structural governance
    const usageTypes = [
      'Used in Rules',
      'Used in Pipelines',
      'Exposed via API',
      'Used in Graph',
      'Unused / Orphaned',
    ];

    // Governance Status and Type categories
    const governanceStatuses = ['Active', 'Deprecated', 'Draft', 'Archived'];
    const governanceTypes = ['Canonical', 'Derived', 'External / Imported'];

    // Rule-specific categories
    const ruleSeverities = ['Critical', 'High', 'Medium', 'Source'];
    const ruleScopes = ['Model-level', 'System', 'Source'];
    const ruleTriggers = ['Immediate', 'Aggregate', 'Scheduled'];

    // Field mapping data types
    const fieldTypes = ['String', 'Number', 'Date', 'Boolean', 'Enum', 'Object'];
    const requirements = ['Required', 'Optional'];
    console.log(`Requirements options ${JSON.stringify(requirements)}`);
    // 1. Models Data (Updated to include Field Objects)
    this.originalModelData = Array.from({ length: 35 }, (_, index) => {
      const governanceType = index === 0 ? 'Canonical' : governanceTypes[index % 3];
      const governanceStatus = index === 0 ? 'Active' : governanceStatuses[index % 4];
      const governanceUsage = usageTypes[index % 5];
      const day = Math.max(1, 15 - (index % 14))
        .toString()
        .padStart(2, '0');
      const dateString = `2026-01-${day}`;

      // Generate actual Field Objects for each model
      const fieldCount = 15 + (index % 20);
      const modelFields = Array.from({ length: fieldCount }, (_, fIndex) => {
        const isPatientId = index === 0 && fIndex === 0;
        return {
          id: `f-${index}-${fIndex}`,
          fieldName: isPatientId ? 'patient_id' : `field_${fIndex + 1}`,
          type: isPatientId ? 'String' : fieldTypes[fIndex % fieldTypes.length],
          requirement: fIndex < 3 ? 'Required' : 'Optional',
          references: Math.floor(Math.random() * 5),
          constraints: fIndex % 5 === 0 ? 'Max Length' : 'None',
          constraintDetails: fIndex % 5 === 0 ? '255' : '',
          status: 'Existing',
        };
      });

      return {
        id: index === 0 ? 'GR-GOLDEN' : `model-${index}`,
        name: index === 0 ? 'Patient Golden Record' : `Clinical Model ${index + 1}`,
        type: governanceType,
        usage: governanceUsage,
        status: governanceStatus,
        fields: modelFields, // Now an Array, not a Number
        fieldCount: fieldCount, // Keep the count for the summary table
        dependencies: index % 4,
        lastModified: dateString,
        description:
          index === 0
            ? 'The core representation of a patient entity for unified medical data normalization.'
            : `Automated structural definition for ${governanceType} data processing.`,
      };
    });

    // Post-processing: Inject consistent Dependency Data into Models
    this.originalModelData = this.originalModelData.map((model, index) => {
      const relatedModel1 = this.originalModelData[(index + 1) % 35];
      const relatedModel2 = this.originalModelData[(index + 5) % 35];

      return {
        ...model,
        dependencyData: {
          relatedModels: [
            {
              id: relatedModel1.id,
              modelName: relatedModel1.name,
              relationshipContext: 'Mappings, Rules',
              impactScope: 'Structural',
              references: 12 + (index % 5),
            },
            {
              id: relatedModel2.id,
              modelName: relatedModel2.name,
              relationshipContext: 'Graph, Rules',
              impactScope: 'Behavioral',
              references: 7 + (index % 3),
            },
          ],
          upstream: [
            {
              sourceName: index % 2 === 0 ? 'Epic_Raw_ADT' : 'Quest_LIMS_v2',
              type: 'Source Schema',
              status: 'Active',
              lastUpdated: 'Jan 10, 2026',
            },
            {
              sourceName: 'Enterprise_Master_Index',
              type: 'External Model',
              status: 'Active',
              lastUpdated: 'Dec 18, 2025',
            },
          ],
          downstream: [
            {
              dependentName: `${model.name}_Export_v1`,
              type: 'Pipeline',
              status: 'Active',
              environment: 'Production',
            },
            {
              dependentName: 'Analytics_Data_Warehouse',
              type: 'Database',
              status: 'Active',
              environment: 'Production',
            },
          ],
        },
        aliases: ['PT', 'PatientRecord', `Alias_${index}`],
      };
    });

    // 2. Enhanced Mapping Data
    this.originalMappingData = Array.from({ length: 35 }, (_, index) => {
      const sourceSystem = index % 2 === 0 ? 'Epic' : 'QuestLab';
      const targetModelObject = this.originalModelData[index % 35];
      const day = Math.max(1, 15 - (index % 14))
        .toString()
        .padStart(2, '0');
      const dateString = `2026-01-${day}`;
      const fieldCount = 10 + (index % 15);

      // Assuming generateFieldMappings exists in your component
      const fields = this.generateFieldMappings(
        sourceSystem,
        targetModelObject.name,
        fieldCount,
        index,
      );
      const pipelines = this.generatePipelineUsage(sourceSystem, targetModelObject.name, index);
      const rules = this.generateRuleReferences(sourceSystem, targetModelObject.name, index);

      return {
        id: `mapping-${index}`,
        name: `${sourceSystem} → ${targetModelObject.name}`,
        source: index % 2 === 0 ? 'Epic Health Network' : 'QuestLab Systems',
        target: targetModelObject.name,
        targetId: targetModelObject.id,
        fields: fields,
        fieldCount: fieldCount,
        coverage: `${15 + (index % 5)} / 20`,
        status: governanceStatuses[index % 4],
        lastModified: dateString,
        version: `v${Math.floor(index / 5) + 1}.${index % 5}`,
        lastSavedBy: index % 3 === 0 ? 'admin' : index % 3 === 1 ? 'brianna.wilson' : 'mason.adams',
        lastSavedRelative: `${Math.floor(index / 2) + 1} hours ago`,
        usageData: {
          pipelines: pipelines,
          pipelineCount: pipelines.length,
          rules: rules,
          ruleCount: rules.length,
          targetModel: targetModelObject.name,
          normalizationActive: index % 4 !== 3,
        },
      };
    });

    // 3. Rules Data
    this.originalRuleData = Array.from({ length: 35 }, (_, index) => {
      const severity = ruleSeverities[index % 4];
      const scope = ruleScopes[index % 3];
      const trigger = ruleTriggers[index % 3];
      const status = index % 10 === 0 ? 'Draft' : index % 12 === 0 ? 'Archived' : 'Active';
      const day = Math.max(1, 15 - (index % 14))
        .toString()
        .padStart(2, '0');
      const dateString = `2026-01-${day}`;

      return {
        id: `rule-${index}`,
        ruleName:
          index % 5 === 0
            ? `Required Field Missing (patient_id)`
            : `Normalization_Rule_${100 + index}`,
        severity: severity,
        scope: scope,
        trigger: trigger,
        status: status,
        sourcesAffected: (index % 6) + 1,
        lastModified: dateString,
      };
    });

    // 4. Version History Data
    this.versionHistory = Array.from({ length: 26 }, (_, index) => {
      const isBrianna = index % 3 === 0;
      let testSubject =
        index % 3 === 0 ? 'Epic Integration Mapping' : 'Missing Required Field (v4)';
      if (index % 4 === 1) testSubject = 'Epic - Patient (v3) Model';
      if (index % 5 === 2) testSubject = 'Age Under 18 Rule';

      return {
        id: `commit-${index}`,
        hash: Math.random().toString(16).substring(2, 9).toUpperCase(),
        author: {
          name: isBrianna ? 'Brianna Wilson' : 'Mason Adams',
          avatar: `https://i.pravatar.cc/150?u=${index + 10}`,
        },
        relativeTime: `${index + 1} days ago`,
        absoluteTime: `2026-01-${Math.max(1, 12 - index)
          .toString()
          .padStart(2, '0')}T10:30:00`,
        events: [
          {
            action: 'Added',
            subject: testSubject,
            version: `v2.${index}.0`,
            type: 'Model',
            timestamp: '10:30 AM',
            scopeChange: 'Field-level → System',
            statusIcon: 'check_circle',
            nested: {
              title: 'System Validation Check',
              tag: index % 5 === 2 ? 'Age-Tag' : 'Normalization',
              time: '10:31 AM',
            },
          },
        ],
      };
    });

    // 5. Code Systems Data
    this.originalCodeData = Array.from({ length: 35 }, (_, index) => {
      const systems = ['ICD-10', 'SNOMED CT', 'LOINC', 'ICD-9', 'RxNorm', 'CPT'];
      const meanings = [
        'Type 2 diabetes mellitus without complications',
        'Diabetes mellitus type 2',
        'Hemoglobin A1c / Mmol per Molar in Blood',
        'Hemoglobin A1c % in Blood',
        '32 code criteria',
        'Long-term (current) use of insulin',
      ];
      const statusOptions = ['Active', 'Superseded', 'Deprecated', 'Invalid'];

      // ADD THIS: Generate dateString like in other data generation
      const day = Math.max(1, 15 - (index % 14))
        .toString()
        .padStart(2, '0');
      const dateString = `2026-01-${day}`;

      return {
        id: `code-${index}`,
        codeSetName:
          index % 6 === 0
            ? 'E11.9'
            : index % 6 === 1
              ? 'SNOMED: 44054006'
              : index % 6 === 2
                ? '1975-2'
                : index % 6 === 3
                  ? '718-7'
                  : index % 6 === 4
                    ? 'Custom Risk Stratification'
                    : `VS8.67`,
        system: systems[index % 6],
        meaning: meanings[index % 6],
        version: index % 3 === 0 ? '4' : index % 3 === 1 ? '2' : '1.7',
        status: statusOptions[index % 4],
        mappedTo: index % 2 === 0 ? `ICD-10  E11.9` : index % 3 === 0 ? 'ICD-9  VS8.67' : '---',
        lastModified: dateString,

        // Additional fields for detail view
        canonicalId: index % 6 === 0 ? 'E11.9' : `CODE-${index}`,
        codeType: 'Standard',
        createdBy: 'System Mapping',
        mappings: [
          { name: 'Dx to Billing Map', target: 'A18.3' },
          { name: 'Encounter Mapping', target: 'E11.65' },
          { name: 'Lab Results Mapping', target: '250.00' },
        ],
        crosswalks: [
          { from: 'ICD-9', to: 'ICD-10', code: '250.00', target: 'E11.9' },
          { from: 'SNOMED', to: 'ICD-10', code: '44054006', target: 'E11.9' },
        ],
        validatedStatus: 'Validated',
        validatedMessage: 'No issues found',
      };
    });

    // Initialize all data sources
    this.modelDataSource.data = [...this.originalModelData];
    this.mappingDataSource.data = [...this.originalMappingData];
    this.ruleDataSource.data = [...this.originalRuleData];
    this.versionDataSource.data = [...this.versionHistory];
    this.codeDataSource.data = [...this.originalCodeData];

    // Apply initial governance filters
    this.applyMappingFilter();
    this.applyModelFilter();
    this.applyRuleFilter();
    this.applyVersionFilter();
    this.applyCodeFilter();
  }

  // 1. Add a method to generate mock dependencies based on a model
  private getModelDependencies(model: any, index: number) {
    return {
      // Related Models: Use actual names from your local model list for consistency
      relatedModels: [
        {
          id: this.originalModelData[(index + 1) % 10]?.id || 'm-1',
          name: this.originalModelData[(index + 1) % 10]?.name || 'Encounter',
          relationshipContext: 'Mappings, Rules',
          references: 12 + (index % 5),
        },
        {
          id: this.originalModelData[(index + 2) % 10]?.id || 'm-2',
          name: this.originalModelData[(index + 2) % 10]?.name || 'Lab Result',
          relationshipContext: 'Graph, Rules',
          references: 7 + (index % 3),
        },
      ],
      // Upstream (Source systems/schemas)
      upstream: [
        {
          sourceName: index % 2 === 0 ? 'Epic_Raw_ADT' : 'Quest_LIMS_v2',
          type: 'Source Schema',
          status: 'Active',
          lastUpdated: 'Jan 10, 2026',
        },
        {
          sourceName: 'Enterprise_Master_Index',
          type: 'External Model',
          status: 'Active',
          lastUpdated: 'Dec 18, 2025',
        },
      ],
      // Downstream (Where this data goes)
      downstream: [
        {
          dependentName: `${model.name}_Export_v1`,
          type: 'Pipeline',
          status: 'Active',
          environment: 'Production',
        },
        {
          dependentName: 'Analytics_Data_Warehouse',
          type: 'Database',
          status: 'Active',
          environment: 'Production',
        },
      ],
    };
  }

  // Helper method to generate field mappings for each source-target pair
  private generateFieldMappings(
    sourceSystem: string,
    targetModel: string,
    count: number,
    seedIndex: number,
  ): any[] {
    const fieldTypes = ['String', 'Number', 'Date', 'Boolean', 'Enum', 'Object'];
    const mappingTypes = ['Direct', 'Derived', 'Constant'];
    const requirements = ['Required', 'Optional'];
    const statuses = ['Mapped', 'Unmapped', 'Modified'];
    console.log(`Added new values for fieldTypes: ${JSON.stringify(fieldTypes)}`);
    console.log(`Added new values for mappingTypes: ${JSON.stringify(mappingTypes)}`);
    console.log(`Added new values for requirements: ${JSON.stringify(requirements)}`);
    console.log(`Added new values for statuses: ${JSON.stringify(statuses)}`);

    const epicFields = [
      'MRN',
      'FIRST_NAME',
      'LAST_NAME',
      'MIDDLE_NAME',
      'DOB',
      'GENDER',
      'SSN',
      'PHONE',
      'EMAIL',
      'STREET',
      'CITY',
      'STATE',
      'ZIP',
      'INSURANCE',
      'PRIMARY_CARE',
      'ALLERGIES',
      'MEDICATIONS',
      'DIAGNOSES',
      'HEIGHT',
      'WEIGHT',
      'BLOOD_TYPE',
      'MARITAL_STATUS',
      'LANGUAGE',
      'RACE',
      'ETHNICITY',
      'EMERGENCY_CONTACT',
    ];

    const questLabFields = [
      'SAMPLE_ID',
      'TEST_CODE',
      'RESULT_VALUE',
      'RESULT_UNIT',
      'REFERENCE_RANGE',
      'ABNORMAL_FLAG',
      'COLLECTION_DATE',
      'RESULT_DATE',
      'ORDERING_PROVIDER',
      'PERFORMING_LAB',
      'SPECIMEN_TYPE',
      'TEST_STATUS',
      'PATIENT_ID',
      'ORDER_ID',
    ];

    const patientTargetFields = [
      'patient_id',
      'first_name',
      'last_name',
      'middle_name',
      'birth_date',
      'gender',
      'ssn',
      'phone_home',
      'phone_mobile',
      'email',
      'addr_street',
      'addr_city',
      'addr_state',
      'addr_zip',
      'insurance_primary',
      'primary_physician',
      'allergies',
      'current_medications',
      'active_diagnoses',
      'height_cm',
      'weight_kg',
      'blood_type',
      'marital_status',
      'preferred_language',
      'race',
      'ethnicity',
      'emergency_contact_name',
      'emergency_contact_phone',
    ];

    const labResultTargetFields = [
      'sample_id',
      'test_code',
      'result_value',
      'result_unit',
      'reference_range_low',
      'reference_range_high',
      'abnormal_indicator',
      'collection_timestamp',
      'result_timestamp',
      'ordering_provider_id',
      'performing_lab_code',
      'specimen_type',
      'result_status',
      'patient_reference',
      'order_reference',
    ];

    const sourceFields = sourceSystem === 'Epic' ? epicFields : questLabFields;
    const targetFields = targetModel === 'Patient' ? patientTargetFields : labResultTargetFields;

    return Array.from({ length: Math.min(count, sourceFields.length) }, (_, i) => {
      const idx = (i + seedIndex) % sourceFields.length;
      const isRequired = i < 8; // First 8 fields are required
      const isMapped = i < count - 2; // Most are mapped, last 2 might be unmapped

      return {
        id: `field-${seedIndex}-${i}`,
        sourceField: sourceFields[idx],
        targetField: isMapped ? targetFields[Math.min(idx, targetFields.length - 1)] : '',
        type: fieldTypes[idx % fieldTypes.length],
        requirement: isRequired ? 'Required' : 'Optional',
        mappingType: mappingTypes[idx % mappingTypes.length],
        status: isMapped ? 'Mapped' : 'Unmapped',
        notes: i % 5 === 0 ? 'Normalized value' : '',
      };
    });
  }

  // Helper method to generate pipeline usage data
  private generatePipelineUsage(
    sourceSystem: string,
    targetModel: string,
    seedIndex: number,
  ): any[] {
    const pipelines = [
      { id: 'pipe-1', name: 'Patient Normalization Pipeline', active: true },
      { id: 'pipe-2', name: 'Nightly Epic Sync', active: true },
      { id: 'pipe-3', name: 'Real-time Lab Integration', active: true },
      { id: 'pipe-4', name: 'Historical Data Migration', active: false },
      { id: 'pipe-5', name: 'Quality Metrics Aggregation', active: true },
    ];

    // Return 2-3 pipelines per mapping
    const pipelineCount = 2 + (seedIndex % 2);
    return pipelines.slice(0, pipelineCount).map(p => ({
      ...p,
      usedBy: `${sourceSystem} → ${targetModel}`,
    }));
  }

  // Helper method to generate rule references
  private generateRuleReferences(
    sourceSystem: string,
    targetModel: string,
    seedIndex: number,
  ): any[] {
    const rules = [
      { id: 'rule-1', name: 'Diagnoses Normalization Rule', type: 'Normalization' },
      { id: 'rule-2', name: 'Nationality Mapping Rule', type: 'Mapping' },
      { id: 'rule-3', name: 'Insurance Validation Rule', type: 'Validation' },
      { id: 'rule-4', name: 'Epic Encounter Transformation Rule', type: 'Transformation' },
      { id: 'rule-5', name: 'Required Field Validation', type: 'Validation' },
      { id: 'rule-6', name: 'Date Format Standardization', type: 'Normalization' },
      { id: 'rule-7', name: 'Phone Number Formatting', type: 'Transformation' },
    ];

    // Return 3-5 rules per mapping
    const ruleCount = 3 + (seedIndex % 3);
    return rules.slice(0, ruleCount).map(r => ({
      ...r,
      appliedTo: `${sourceSystem} → ${targetModel}`,
    }));
  }

  /**
   * * Receives a model name, finds the data, and triggers the same transition logic as a manual row click.
   * and re-initializes the View Model component with new data.
   */
  private handleRelatedModelNavigation(modelRef: any): void {
    let targetModel = null;
    // 1. If we have an ID (Best Practice)
    if (modelRef.id) {
      targetModel = this.originalModelData.find(m => m.id === modelRef.id);
    }

    // 2. Fallback to flexible name matching if no ID or no match found
    if (!targetModel && modelRef.name) {
      const searchName = modelRef.name.trim().toLowerCase();
      targetModel = this.originalModelData.find(m => m.name.trim().toLowerCase() === searchName);
    }

    if (targetModel) {
      this.selectedModelData = { ...targetModel };
      this.showModelDetail = true;
      this.isEditingModel = false;

      this.updateBreadcrumbPath('View Model');

      // Trigger transition animation
      setTimeout(() => {
        const container = document.querySelector('.normalization-main-container');
        if (container) {
          container.classList.add('slide-out');
        }
      }, 0);

      this.cdr.detectChanges();
    } else {
      console.error(`[Normalization] Target model not found for:`, modelRef);
    }
  }

  onCloseEditMapping(): void {
    // 1. "One In" - Reverse the animation: Slide back from the left

    // 2. Breadcrumb sync
    this.eventService.publish('nf', 'breadcrumb_navigate', { target: 'VIEW_MAPPING' });

    // 3. Clean up the Edit component AFTER its slide-out animation finishes.
    setTimeout(() => {
      this.isEditingMapping = false;
    }, 600);
  }

  onCloseEditModel(): void {
    // 1. Reverse the animation: Slide back from the left
    this.eventService.publish('nf', 'breadcrumb_navigate', { target: 'VIEW_MODEL' });

    // 2. Clean up the Edit component AFTER its slide-out animation finishes
    setTimeout(() => {
      this.isEditingModel = false;
    }, 600);
  }

  ngOnDestroy(): void {
    if (this.eventSubs) {
      this.eventSubs.unsubscribe();
    }
  }
}
