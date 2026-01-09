import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';

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
  providers: [{ provide: MatPaginatorIntl, useClass: MatPaginatorIntl }],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent implements AfterViewInit {
  displayedColumns: string[] = ['name', 'status', 'records', 'queue', 'health', 'actions'];
  dataSource = new MatTableDataSource<SourceData>(this.generateMockData(35));
  searchTerm = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Custom sorting for numeric columns
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

    // Custom filter predicate for multi-field search
    this.dataSource.filterPredicate = (data: SourceData, filter: string) => {
      const searchStr = filter.toLowerCase();
      return (
        data.name.toLowerCase().includes(searchStr) ||
        data.type.toLowerCase().includes(searchStr) ||
        data.status.toLowerCase().includes(searchStr) ||
        data.recordsIngested.toLowerCase().includes(searchStr) ||
        data.queueDepth.toLowerCase().includes(searchStr)
      );
    };
  }

  applyFilter() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();

    // Reset to first page when filtering
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearSearch() {
    this.searchTerm = '';
    this.applyFilter();
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
        queueDepth:
          i % 3 === 0
            ? `${Math.floor(Math.random() * 5)}m ${Math.floor(Math.random() * 59)}s`
            : '-',
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

  // Action Handlers
  editSource(s: SourceData) { console.log('Edit Source', s); }
  inspectSource(s: SourceData) { console.log('Inspect Source', s); }
  viewLogs(s: SourceData) { console.log('View Logs', s); }
  syncNow(s: SourceData) { console.log('Syncing', s); }
  pauseIngestion(s: SourceData) { console.log('Pause Ingestion', s); }
  downloadSchema(s: SourceData) { console.log('Download Schema', s); }
  clearCache(s: SourceData) { console.log('Clear Cache', s); }
  removeSource(s: SourceData) { console.log('Remove Source', s); }
}