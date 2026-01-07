import { Component, OnInit } from '@angular/core';
import { GridsterConfig, GridsterItemConfig } from 'angular-gridster2';

interface LINTYLDashboardItem extends GridsterItemConfig {
  type: 'stat' | 'list' | 'timeline';
  title: string;
  icon?: string;
  metrics?: { label: string; value: string }[];
}

@Component({
  selector: 'app-overview',
  standalone: false,
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent implements OnInit {
  options!: GridsterConfig;
  dashboard!: LINTYLDashboardItem[];
  selectedWorkspace = 'Production';
  workspaces = ['Production', 'Staging', 'Development'];

  ngOnInit(): void {
    this.options = {
      gridType: 'fit', // CRITICAL: This makes the grid fit the screen width without scrolling
      displayGrid: 'none',
      pushItems: true,
      draggable: { enabled: true },
      resizable: { enabled: true },
      minCols: 12,
      maxCols: 12,
      margin: 16,
      outerMargin: true,
      // Removed fixedColWidth to allow 'fit' to work correctly
    };

    this.resetLayout();
  }

  resetLayout() {
    this.dashboard = [
      {
        cols: 4,
        rows: 3,
        y: 0,
        x: 0,
        type: 'stat',
        title: 'Global Truth Status',
        icon: 'favorite',
        metrics: [
          { label: 'Accuracy', value: '98%' },
          { label: 'Status', value: 'Nominal' },
        ],
      },
      {
        cols: 4,
        rows: 3,
        y: 0,
        x: 4,
        type: 'stat',
        title: 'Data Ingestion',
        icon: 'cloud_upload',
        metrics: [
          { label: 'Last Run', value: '5m ago' },
          { label: 'Records', value: '+1,200' },
        ],
      },
      {
        cols: 4,
        rows: 3,
        y: 0,
        x: 8,
        type: 'stat',
        title: 'Active Conflicts',
        icon: 'report_problem',
        metrics: [
          { label: 'High', value: '5' },
          { label: 'Low', value: '30' },
        ],
      },
      { cols: 6, rows: 4, y: 3, x: 0, type: 'list', title: 'Recent Activity' },
      { cols: 6, rows: 4, y: 3, x: 6, type: 'list', title: 'Open Issues' },
      { cols: 12, rows: 3, y: 7, x: 0, type: 'timeline', title: 'Snapshot History' },
    ];
  }
}
