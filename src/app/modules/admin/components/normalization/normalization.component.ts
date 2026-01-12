import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

// NgRx & Events
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-normalization',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: MatPaginatorIntl }, EventService],
  templateUrl: './normalization.component.html',
  styleUrl: './normalization.component.scss',
})
export class NormalizationComponent implements OnInit, AfterViewInit, OnDestroy {
  eventSubs?: Subscription;

  // UI State
  activeTabIndex = 0;
  activeTabLabel = 'Models';
  selectedEnv = 'Production';

  // Search Bindings
  modelSearch = '';
  mappingSearch = '';
  ruleSearch = '';
  versionSearch = '';
  codeSearch = '';

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
  ) {}

  ngOnInit(): void {
    this.loadAllData();
    this.subscribeEvents();
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
    setTimeout(() => this.refreshTablePointers());
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
    this.filterDS(this.versionDataSource, this.versionSearch);
  }
  applyCodeFilter(): void {
    this.filterDS(this.codeDataSource, this.codeSearch);
  }

  private filterDS(ds: MatTableDataSource<any>, val: string): void {
    ds.filter = val.trim().toLowerCase();
    if (ds.paginator) ds.paginator.firstPage();
  }

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
    const signalName =
      this.activeTabIndex === 0
        ? 'add_normalization_model'
        : `open_${this.activeTabLabel.toLowerCase().slice(0, -1)}_modal`;
    this.eventService.publish('nf', signalName, {
      theme: this.getActiveTheme(),
      mode: 'edit',
      data: row,
    });
  }

  onActivate(row: any): void {
    row.status = 'Active';
    this.logTransaction(row, 'ACTIVATE');
  }

  onDeprecate(row: any): void {
    row.status = 'Deprecated';
    this.logTransaction(row, 'DEPRECATE');
  }

  onViewLogs(row: any): void {
    console.log('Viewing graph logs for:', row);
  }

  onDelete(row: any): void {
    console.log('Delete requested for:', row);
    this.logTransaction(row, 'DELETE');
  }

  private logTransaction(row: any, action: string): void {
    this.eventService.publish('nf', 'execute_merge_query_with_context', {
      action: `LOG_${action}`,
      recordId: row.name || row.ruleName || row.versionTag || row.codeSystem,
      timestamp: new Date().toISOString(),
      status: row.status,
    });
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

  private loadAllData(): void {
    // 1. Models (35 entries)
    this.modelDataSource.data = Array.from({ length: 35 }, (_, i) => ({
      name: i === 0 ? 'Patient Golden Record' : `Clinical Model ${i + 1}`,
      type: i % 2 === 0 ? 'FHIR R4' : 'HL7 v2',
      status: i % 7 === 0 ? 'Draft' : 'Active',
      fields: 15 + (i % 20),
      dependencies: i % 4,
      lastModified: '2026-01-10',
    }));

    // 2. Mappings (35 entries)
    this.mappingDataSource.data = Array.from({ length: 35 }, (_, i) => ({
      source: i % 2 === 0 ? `PID-${i + 1}` : `OBX-${i + 1}`,
      target: i % 2 === 0 ? `Patient.identifier[${i}]` : `Observation.value[x]`,
      engine: i % 3 === 0 ? 'Jolt' : 'Liquid',
      status: 'Active',
      lastModified: `${i + 1}h ago`,
    }));

    // 3. Rules (35 entries)
    this.ruleDataSource.data = Array.from({ length: 35 }, (_, i) => ({
      ruleName: `Normalization_Rule_${100 + i}`,
      trigger: i % 2 === 0 ? 'On_Ingest' : 'On_Update',
      priority: i % 5 === 0 ? 'P1' : 'P2',
      status: i % 10 === 0 ? 'Draft' : 'Active',
    }));

    // 4. Versions (35 entries)
    this.versionDataSource.data = Array.from({ length: 35 }, (_, i) => ({
      versionTag: `v2.${i}.0-release`,
      releasedBy: i % 3 === 0 ? 'System' : 'Admin_User',
      status: 'Deployed',
      timestamp: `2026-01-${Math.min(31, i + 1)
        .toString()
        .padStart(2, '0')}`,
    }));

    // 5. Codes (35 entries across 5 categories)
    const systems = ['SNOMED', 'LOINC', 'ICD-10', 'OMOP', 'MEDDRA'];
    const standardTypes = ['Clinical', 'Lab', 'Diagnosis', 'Research', 'Safety'];

    this.codeDataSource.data = Array.from({ length: 35 }, (_, i) => {
      const sysIdx = Math.floor(i / 7); // 7 entries per category
      return {
        codeSystem: systems[sysIdx],
        standard: standardTypes[sysIdx],
        oid: `2.16.840.1.113883.6.${100 + i}`,
        status: 'Active',
      };
    });
  }

  ngOnDestroy(): void {
    if (this.eventSubs) {
      this.eventSubs.unsubscribe();
    }
  }
}
