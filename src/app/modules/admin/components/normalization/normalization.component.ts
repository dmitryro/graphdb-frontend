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
  public modelsPlaceholder = 'Search models by name, alias, or description… ';
  public rulesPlaceholder = 'Search rules ...';
  public versionsPlaceholder = 'Search versions ...';
  public mappingsPlaceholder = 'Search mappings ...';

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

  // New property for Models tab date range
  modelDateRange = new FormGroup({
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

  // Filter setters
  setStatusFilter(val: string) {
    this.selectedStatus = val;
    this.applyModelFilter();
  }
  setTypeFilter(val: string) {
    this.selectedType = val;
    this.applyModelFilter();
  }
  setUsageFilter(val: string) {
    this.selectedUsage = val;
    this.applyModelFilter();
  }

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
    private renderer: Renderer2,
    private el: ElementRef,
  ) {}

  ngOnInit(): void {
    this.loadAllData();
    this.subscribeEvents();

    this.modelDateRange.valueChanges.subscribe(() => {
      this.applyModelFilter();
      // Re-apply layout after filter/render
      setTimeout(() => this.fixModelsDateInputLayout(), 50);
    });

    this.range.valueChanges.subscribe(() => {
      this.applyVersionFilter();
    });

    setTimeout(() => this.fixModelsDateInputLayout(), 100);
  }

  ngAfterViewInit(): void {
    this.refreshTablePointers();
    this.applyModelFilter();

    // Call the fix for models date input layout
    setTimeout(() => {
      this.fixModelsDateInputLayout();
      this.setupThemeChangeListener();
      this.fixDateInputLayout();
    }, 500);

    if (this.modelPaginator) {
      this.pageSize = this.modelPaginator.pageSize;

      this.modelPaginator.page.subscribe((event: PageEvent) => {
        this.currentPage = event.pageIndex;
        this.pageSize = event.pageSize;
        this.cdr.detectChanges();
        // Re-apply fix if pagination triggers re-render
        setTimeout(() => this.fixModelsDateInputLayout(), 100);
      });
    }

    this.modelDateRange.valueChanges.subscribe(() => {
      // Use requestAnimationFrame or setTimeout to run after the DOM updates
      requestAnimationFrame(() => this.fixModelsDateInputLayout());
    });
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.activeTabIndex = event.index;
    this.activeTabLabel = this.tabOrder[this.activeTabIndex];

    // Force Angular to render the @if block first
    this.cdr.detectChanges();

    setTimeout(() => {
      this.refreshTablePointers();

      if (this.activeTabIndex === 0) {
        // For the Models tab, we must wait until the DOM is definitely stable
        this.applyModelFilter(); // This triggers the fixModelsDateInputLayout internally
        this.fixModelsDateInputLayout();
      } else if (this.activeTabIndex === 3) {
        this.fixDateInputLayout();
      }

      this.cdr.detectChanges();
    }, 100); // 100ms is usually the sweet spot for @if template switching
  }

  /**
   * Listen for theme changes and re-apply styles
   */
  private setupThemeChangeListener(): void {
    // 1. Watch for class changes on body/documentElement (Theme switchers usually toggle classes here)
    const observer = new MutationObserver(() => {
      this.fixModelsDateInputLayout();
      this.fixDateInputLayout();
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
      this.fixDateInputLayout();
      this.cdr.detectChanges();
    });
  }

  /**
   * Listen for events from the NgRx Store via EventService.
   * Now updated to handle theme_change signals to fix layout issues in real-time.
   */
  subscribeEvents(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe((state: any) => {
      const lastAction = state?.lastAction;
      const eventName = state?.items?.event;

      console.log('[NormalizationComponent] Received Event:', { lastAction, eventName });

      // 1. Handle Data Refresh Events
      if (
        lastAction === 'record_created' ||
        lastAction === 'graph_updated' ||
        eventName === 'refresh_header'
      ) {
        this.loadAllData();
      }

      // 2. Handle Theme Change Events
      // This is triggered by ThemeSwitchComponent's eventService.publish
      if (eventName === 'theme_change' || lastAction === 'theme_updated') {
        console.log('[NormalizationComponent] Theme change detected, reapplying layout fixes...');
        // We use a small timeout to ensure the .dark-theme/.light-theme classes
        // have fully propagated to the DOM before we run our manual overrides.
        setTimeout(() => {
          this.fixModelsDateInputLayout();
          this.fixDateInputLayout();

          // Force change detection to ensure the UI reflects theme-specific hex colors
          this.cdr.detectChanges();
        }, 50);
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
    const ds = this.getActiveDataSource();
    if (this.activeTabIndex === 0) ds.paginator = this.modelPaginator;
    if (this.activeTabIndex === 1) ds.paginator = this.mappingPaginator;
    if (this.activeTabIndex === 2) ds.paginator = this.rulePaginator;
    if (this.activeTabIndex === 3) ds.paginator = this.versionPaginator;
    if (this.activeTabIndex === 4) ds.paginator = this.codePaginator;

    if (this.sort) ds.sort = this.sort;
  }

  applyMappingFilter(): void {
    let filtered = [...this.originalMappingData];

    if (this.mappingSearch) {
      const search = this.mappingSearch.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.source.toLowerCase().includes(search) ||
          item.target.toLowerCase().includes(search) ||
          item.engine.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search),
      );
    }

    this.mappingDataSource.data = filtered;
    if (this.mappingPaginator) {
      this.mappingPaginator.firstPage();
    }
  }

  applyRuleFilter(): void {
    let filtered = [...this.originalRuleData];

    if (this.ruleSearch) {
      const search = this.ruleSearch.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.ruleName.toLowerCase().includes(search) ||
          item.trigger.toLowerCase().includes(search) ||
          item.priority.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search),
      );
    }

    this.ruleDataSource.data = filtered;
    if (this.rulePaginator) {
      this.rulePaginator.firstPage();
    }
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

  applyCodeFilter(): void {
    let filtered = [...this.originalCodeData];

    if (this.codeSearch) {
      const search = this.codeSearch.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.codeSystem.toLowerCase().includes(search) ||
          item.standard.toLowerCase().includes(search) ||
          item.oid.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search),
      );
    }

    this.codeDataSource.data = filtered;
    if (this.codePaginator) {
      this.codePaginator.firstPage();
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

    // Store original data for proper filtering
    this.originalModelData = Array.from({ length: 35 }, (_, i) => {
      // Determine Type: i=0 is Golden Record (Canonical), others rotate
      const gType = i === 0 ? 'Canonical' : governanceTypes[i % 3];
      // Determine Status: i=0 is Active, others rotate
      const gStatus = i === 0 ? 'Active' : governanceStatuses[i % 4];
      // Determine Usage: rotate through the 5 governance usage types
      const gUsage = usageTypes[i % 5];

      return {
        id: i === 0 ? 'GR-GOLDEN' : `m-${i}`,
        name: i === 0 ? 'Patient Golden Record' : `Clinical Model ${i + 1}`,
        type: gType,
        usage: gUsage,
        status: gStatus,
        fields: 15 + (i % 20),
        dependencies: i % 4,
        lastModified: '2026-01-10',
      };
    });

    this.originalMappingData = Array.from({ length: 35 }, (_, i) => ({
      id: `map-${i}`,
      source: i % 2 === 0 ? `PID-${i + 1}` : `OBX-${i + 1}`,
      target: i % 2 === 0 ? `Patient.identifier[${i}]` : `Observation.value[x]`,
      engine: i % 3 === 0 ? 'Jolt' : 'Liquid',
      status: 'Active',
      lastModified: `${i + 1}h ago`,
    }));

    this.originalRuleData = Array.from({ length: 35 }, (_, i) => ({
      id: `rule-${i}`,
      ruleName: `Normalization_Rule_${100 + i}`,
      trigger: i % 2 === 0 ? 'On_Ingest' : 'On_Update',
      priority: i % 5 === 0 ? 'P1' : 'P2',
      status: i % 10 === 0 ? 'Draft' : 'Active',
    }));

    this.versionHistory = Array.from({ length: 26 }, (_, i): IVersionCommit => {
      const isBrianna = i % 3 === 0;
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

    this.originalCodeData = Array.from({ length: 35 }, (_, i) => ({
      id: `code-${i}`,
      codeSystem: ['SNOMED', 'LOINC', 'ICD-10', 'OMOP', 'MEDDRA'][Math.floor(i / 7) % 5],
      standard: ['Clinical', 'Lab', 'Diagnosis', 'Research', 'Safety'][Math.floor(i / 7) % 5],
      oid: `2.16.840.1.113883.6.${100 + i}`,
      status: 'Active',
    }));

    // Initialize data sources with original data
    this.modelDataSource.data = [...this.originalModelData];
    this.mappingDataSource.data = [...this.originalMappingData];
    this.ruleDataSource.data = [...this.originalRuleData];
    this.versionDataSource.data = [...this.versionHistory];
    this.codeDataSource.data = [...this.originalCodeData];

    // Apply initial filters
    this.applyModelFilter();
    this.applyVersionFilter();
  }

  ngOnDestroy(): void {
    if (this.eventSubs) {
      this.eventSubs.unsubscribe();
    }
  }
}
