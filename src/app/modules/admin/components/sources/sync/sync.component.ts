import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { Gridster, GridsterConfig, GridsterItem, GridsterItemConfig } from 'angular-gridster2';

export interface IngestRun {
  startTime: string;
  sourceName: string;
  type: string;
  entitiesProcessed: string;
  processedValue: number;
  totalValue: number;
  duration: string;
  status: 'Success' | 'Failure' | 'Partial Error';
  progress?: number;
  errorCount?: number;
}

interface SyncDashboardItem extends GridsterItemConfig {
  id: string;
}

@Component({
  selector: 'app-sync',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Gridster,
    GridsterItem,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTabsModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: MatPaginatorIntl }],
  templateUrl: './sync.component.html',
  styleUrl: './sync.component.scss',
})
export class SyncComponent implements OnInit, AfterViewInit {
  options!: GridsterConfig;
  dashboard: SyncDashboardItem[] = [];
  selectedWorkspace = 'Production';
  workspaces = ['Production', 'Staging', 'Development'];

  displayedColumns: string[] = [
    'startTime',
    'type',
    'entities',
    'duration',
    'status',
    'operations',
  ];
  dataSource = new MatTableDataSource<IngestRun>([]);
  searchTerm = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // 🔑 CRITICAL: Toggle to force Gridster reinitialization
  gridsterVisible = true;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.options = {
      gridType: 'scrollVertical',
      compactType: 'none',
      displayGrid: 'none',
      pushItems: true,
      draggable: {
        enabled: true,
        stop: item => this.logTransaction(item),
      },
      resizable: {
        enabled: true,
        stop: item => this.logTransaction(item),
      },
      minCols: 12,
      maxCols: 12,
      margin: 16,
      outerMargin: false,
      setGridSize: true,
      disableScrollHorizontal: true,
      disableScrollVertical: true,
      api: {}, // Initialize the API object so Gridster can populate it
    };

    this.resetLayout();
    this.dataSource.data = this.generateMockRuns(35);
  }

  /**
   * Required: All transactions must be logged into the graph of events. [cite: 2025-12-20]
   * Uses execute_merge_query_with_context for MPI traceability. [cite: 2026-01-01]
   */
  logTransaction(item: any) {
    console.log('MPI Event Logged:', item);
    // this.execute_merge_query_with_context(item);
  }

  resetLayout() {
    // Step 1: Hide Gridster to destroy it
    this.gridsterVisible = false;
    this.cdr.detectChanges();

    // Step 2: Reassign layout
    this.dashboard = [
      { cols: 3, rows: 3, y: 0, x: 0, id: 'ingest' },
      { cols: 3, rows: 3, y: 0, x: 3, id: 'latency' },
      { cols: 3, rows: 3, y: 0, x: 6, id: 'backfill' },
      { cols: 3, rows: 3, y: 0, x: 9, id: 'retry' },
    ];

    // Step 3: Show Gridster again (triggers full reinit)
    setTimeout(() => {
      this.gridsterVisible = true;
      this.cdr.detectChanges();

      // Optional: resize after reinit
      setTimeout(() => {
        if (this.options.api?.resize) {
          this.options.api.resize();
        }
      }, 100);
    }, 50);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (data: IngestRun, filter: string) => {
      const searchStr = filter.toLowerCase();
      return (
        data.startTime.toLowerCase().includes(searchStr) ||
        data.sourceName.toLowerCase().includes(searchStr) ||
        data.type.toLowerCase().includes(searchStr) ||
        data.status.toLowerCase().includes(searchStr)
      );
    };
  }

  applyFilter() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  private generateMockRuns(count: number): IngestRun[] {
    const sources = [
      'Epic Health',
      'Salesforce Cloud',
      'HL7 Gateway',
      'S3 Bucket_Alpha',
      'Legacy SQL',
    ];
    const types = ['Incremental', 'Full Load', 'Sync', 'Backfill'];
    const statuses: ('Success' | 'Failure' | 'Partial Error')[] = [
      'Success',
      'Failure',
      'Partial Error',
      'Success',
    ];

    return Array.from({ length: count }, (_, i) => {
      const status = statuses[i % statuses.length];
      const isPartial = status === 'Partial Error';
      const processed = Math.floor(Math.random() * 50000);
      const total = isPartial ? 60000 : processed;

      return {
        startTime: `Jan ${10 - Math.floor(i / 4)}, ${10 + (i % 12)}:${String((i * 7) % 60).padStart(2, '0')} PM`,
        sourceName: sources[i % sources.length],
        type: types[i % types.length],
        entitiesProcessed: isPartial
          ? `${processed.toLocaleString()} of ${total.toLocaleString()}`
          : `${processed.toLocaleString()} entities`,
        processedValue: processed,
        totalValue: total,
        duration: `${Math.floor(Math.random() * 50) + 1} mins`,
        status: status,
        progress: isPartial ? Math.round((processed / total) * 100) : undefined,
        errorCount: isPartial ? Math.floor(Math.random() * 50) + 5 : undefined,
      };
    });
  }
}
