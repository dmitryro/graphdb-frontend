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
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

export interface SourceData {
  name: string;
  type: string;
  status: 'Healthy' | 'Warning' | 'Working...' | 'Error';
  recordsIngested: string;
  recordsIngestedValue: number;
  queueDepth: string;
  lastIngest: string;
  healthValue: number;
}

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatMenuModule,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: MatPaginatorIntl }, EventService],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent implements OnInit, AfterViewInit, OnDestroy {
  eventSubs?: Subscription;
  displayedColumns: string[] = ['name', 'status', 'records', 'queue', 'health', 'actions'];
  dataSource = new MatTableDataSource<SourceData>(this.generateMockData(35));
  searchTerm = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    protected eventService: EventService,
    protected eventStore: Store<{ nf: EventState }>,
  ) {}

  ngOnInit(): void {
    this.eventService.publish('ListComponent', 'page_loaded', { module: 'admin-sources' });
    this.subscribeEvents();
  }

  subscribeEvents(): void {
    this.eventSubs = this.eventStore.select('nf').subscribe(state => {
      console.log('[ListComponent] NgRx Store Update received:', state);
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'records':
          return item.recordsIngestedValue;
        case 'health':
          return item.healthValue;
        default:
          return (item as any)[property];
      }
    };
    this.dataSource.filterPredicate = (data: SourceData, filter: string) => {
      const searchStr = filter.toLowerCase();
      return (
        data.name.toLowerCase().includes(searchStr) || data.type.toLowerCase().includes(searchStr)
      );
    };
  }

  private getActiveTheme(): 'light' | 'dark' {
    const isDark =
      document.body.classList.contains('dark-theme') ||
      document.body.classList.contains('dark-mode') ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    return isDark ? 'dark' : 'light';
  }

  applyFilter() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilter();
  }

  addSource() {
    console.log('[ListComponent] Action: addSource triggered');
    this.eventService.publish('global', 'add_source', {
      action: 'add_source',
      theme: this.getActiveTheme(),
      timestamp: new Date().toISOString(),
    });
  }

  editSource(s: SourceData) {
    console.log('[ListComponent] Action: editSource triggered for:', s.name);
    this.eventService.publish(s.name, 'edit_source', {
      ...s,
      action: 'edit_source',
      theme: this.getActiveTheme(),
    });
  }

  inspectSource(s: SourceData) {
    console.log('[ListComponent] Action: inspectSource triggered for:', s.name);
    this.eventService.publish(s.name, 'inspect_source', { ...s, action: 'inspect_source' });
  }

  viewLogs(s: SourceData) {
    console.log('[ListComponent] Action: viewLogs triggered for:', s.name);
    this.eventService.publish(s.name, 'option_selected', { action: 'view_logs', source: s });
  }

  syncNow(s: SourceData) {
    console.log('[ListComponent] Action: syncNow triggered for:', s.name);
    this.eventService.publish(s.name, 'sync_source', { ...s, action: 'sync_source' });
  }

  pauseIngestion(s: SourceData) {
    console.log('[ListComponent] Action: pauseIngestion triggered for:', s.name);
    this.eventService.publish(s.name, 'pause_ingestion', { ...s, action: 'pause_ingestion' });
  }

  downloadSchema(s: SourceData) {
    console.log('[ListComponent] Action: downloadSchema triggered for:', s.name);
    this.eventService.publish(s.name, 'download_schema', { ...s, action: 'download_schema' });
  }

  clearCache(s: SourceData) {
    console.log('[ListComponent] Action: clearCache triggered for:', s.name);
    this.eventService.publish(s.name, 'clear_source_cache', { ...s, action: 'clear_source_cache' });
  }

  removeSource(s: SourceData) {
    console.log('[ListComponent] Action: removeSource triggered for:', s.name);
    this.eventService.publish(s.name, 'delete_source', { ...s, action: 'delete_source' });
  }

  ngOnDestroy(): void {
    if (this.eventSubs) {
      this.eventSubs.unsubscribe();
    }
  }

  private generateMockData(count: number): SourceData[] {
    const types = ['API', 'SQL', 'FHIR', 'Kafka', 'S3', 'HL7'];
    const statuses: any[] = ['Healthy', 'Warning', 'Working...', 'Healthy'];
    return Array.from({ length: count }, (_, i) => {
      const recordValue = Math.floor(Math.random() * 900);
      return {
        name: `Source ${i + 1}`,
        type: types[i % types.length],
        status: statuses[i % statuses.length],
        recordsIngested: `${recordValue}K`,
        recordsIngestedValue: recordValue,
        queueDepth: i % 3 === 0 ? `${Math.floor(Math.random() * 5)}m` : '-',
        lastIngest: '2m ago',
        healthValue: Math.floor(Math.random() * 40) + 60,
      };
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Healthy':
        return 'status-healthy';
      case 'Warning':
        return 'status-warning';
      case 'Working...':
        return 'status-working';
      default:
        return 'status-error';
    }
  }
}
