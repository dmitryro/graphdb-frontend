import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

export interface SourceData {
  name: string;
  type: string;
  status: 'Healthy' | 'Warning' | 'Working...' | 'Error';
  recordsIngested: string;
  recordsIngestedValue: number; // For sorting
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
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: MatPaginatorIntl }],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class ListComponent implements AfterViewInit {
  displayedColumns: string[] = ['name', 'status', 'records', 'queue', 'health', 'actions'];
  dataSource = new MatTableDataSource<SourceData>(this.generateMockData(35));

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
}
