import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

// Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginator, MatPaginatorIntl, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';

// NgRx & Events
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';
import * as d3 from 'd3';

@Component({
  selector: 'app-validation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  providers: [{ provide: MatPaginatorIntl, useClass: MatPaginatorIntl }, EventService],
  templateUrl: './validation.component.html',
  styleUrl: './validation.component.scss',
})
export class ValidationComponent implements OnInit, AfterViewInit {
  @ViewChild('trendChart') private chartContainer!: ElementRef;

  // Specific ViewChild references for Active Failures (Tab 0)
  @ViewChild('paginatorActive') paginatorActive!: MatPaginator;
  @ViewChild('sortActive') sortActive!: MatSort;

  // Specific ViewChild references for By Source (Tab 2)
  @ViewChild('paginatorSource') paginatorSource!: MatPaginator;
  @ViewChild('sortSource') sortSource!: MatSort;

  activeTabIndex = signal(0);
  selectedEnv = signal('Production');
  showComparison = signal(false);

  // DataSources initialized immediately
  activeFailuresDS = new MatTableDataSource<any>([]);
  bySourceDS = new MatTableDataSource<any>([]);

  columnsActive = ['rule', 'source', 'severity', 'count', 'firstSeen', 'status', 'actions'];
  columnsSource = ['source', 'errors', 'critical', 'high', 'medium', 'low', 'trend', 'actions'];

  filterValues = {
    search: '',
    severity: '',
    source: '',
  };

  constructor(
    private eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
  ) {
    // Re-render chart when tab 1 is active or comparison toggle changes
    effect(() => {
      if (this.activeTabIndex() === 1 && this.chartContainer) {
        this.renderTrendChart();
      }
    });
  }

  ngOnInit(): void {
    this.loadDiverseData();
    this.setupFilterPredicate();
  }

  ngAfterViewInit(): void {
    // Correctly link paginators to their respective DataSources
    this.activeFailuresDS.paginator = this.paginatorActive;
    this.activeFailuresDS.sort = this.sortActive;

    this.bySourceDS.paginator = this.paginatorSource;
    this.bySourceDS.sort = this.sortSource;

    if (this.activeTabIndex() === 1) {
      this.renderTrendChart();
    }
  }

  private setupFilterPredicate() {
    this.activeFailuresDS.filterPredicate = (data, filter) => {
      const searchTerms = JSON.parse(filter);
      const searchLower = searchTerms.search.toLowerCase();

      const searchMatch =
        data.rule.toLowerCase().includes(searchLower) ||
        data.detail.toLowerCase().includes(searchLower) ||
        data.severity.toLowerCase().includes(searchLower) ||
        data.source.toLowerCase().includes(searchLower);

      const severityMatch = searchTerms.severity ? data.severity === searchTerms.severity : true;
      const sourceMatch = searchTerms.source ? data.source === searchTerms.source : true;

      return searchMatch && severityMatch && sourceMatch;
    };
  }

  applyFilter(
    event: Event | string,
    source: 'search' | 'severity' | 'source' | 'table-source',
  ): void {
    if (source === 'table-source') {
      const filterValue = (event as Event).target as HTMLInputElement;
      this.bySourceDS.filter = filterValue.value.trim().toLowerCase();

      if (this.bySourceDS.paginator) {
        this.bySourceDS.paginator.firstPage();
      }
      return;
    }

    if (source === 'search') {
      this.filterValues.search = ((event as Event).target as HTMLInputElement).value;
    } else if (source === 'severity' || source === 'source') {
      this.filterValues[source] = event as string;
    }

    this.activeFailuresDS.filter = JSON.stringify(this.filterValues);

    if (this.activeFailuresDS.paginator) {
      this.activeFailuresDS.paginator.firstPage();
    }
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.activeTabIndex.set(event.index);
    if (event.index === 1) {
      setTimeout(() => this.renderTrendChart(), 50);
    }
  }

  /**
   * MPI Logging Wrappers
   * Every transaction is logged into the graph of events/changes
   */
  onView(item: any) {
    console.log('Viewing record for Golden Record relation:', item);
  }

  onResolve(item: any) {
    console.log('Opening resolution workflow. Context: Graph of Changes.', item);
    // execute_merge_query_with_context logic would be triggered here to relate to Golden Records
  }

  onMarkAsResolved(item: any) {
    console.log('Transaction logged to MPI Event Graph as RESOLVED:', item);
  }

  onArchive(item: any) {
    console.log('Archiving transaction and updating Golden Record lineage:', item);
  }

  onDelete(item: any) {
    console.log('CRITICAL: Deleting record from MPI. Transaction logged for audit trail.', item);
  }

  private renderTrendChart(): void {
    if (!this.chartContainer) return;
    const element = this.chartContainer.nativeElement;
    d3.select(element).selectAll('*').remove();

    const data = this.getTrendData();
    const margin = { top: 30, right: 30, bottom: 40, left: 50 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const svg = d3
      .select(element)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear().domain([0, 200]).range([height, 0]);

    if (this.showComparison()) {
      const line = d3
        .line<any>()
        .x(d => x(d.date))
        .y(d => y(d.prevTotal))
        .curve(d3.curveMonotoneX);

      svg
        .append('path')
        .datum(data)
        .attr('class', 'comparison-path')
        .attr('d', line)
        .style('fill', 'none')
        .style('stroke', '#cbd5e1')
        .style('stroke-width', 2)
        .style('stroke-dasharray', '5,5');
    }

    const stack = d3.stack().keys(['low', 'medium', 'high', 'critical']);
    const layers = stack(data as any);
    const colors = ['#dbeafe', '#fde68a', '#fbbf24', '#ef4444'];

    const area = d3
      .area<any>()
      .x(d => x(d.data.date))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveMonotoneX);

    svg
      .selectAll('.layer')
      .data(layers)
      .enter()
      .append('path')
      .attr('d', area)
      .style('fill', (d, i) => colors[i])
      .style('opacity', 0.8);

    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0);

    const mouseG = svg.append('g').attr('class', 'mouse-over-effects');
    mouseG
      .append('path')
      .attr('class', 'mouse-line')
      .style('stroke', '#94a3b8')
      .style('stroke-width', '1px')
      .style('opacity', '0');

    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
        d3.select('.mouse-line').style('opacity', 0);
      })
      .on('mousemove', event => {
        const [mouseX] = d3.pointer(event);
        const date = x.invert(mouseX);
        const bisect = d3.bisector((d: any) => d.date).left;
        const i = bisect(data, date);
        const d = data[i];

        if (d) {
          d3.select('.mouse-line')
            .attr('d', `M${x(d.date)},${height} ${x(d.date)},0`)
            .style('opacity', 1);

          tooltip
            .style('opacity', 1)
            .html(
              `
              <div class="tooltip-title">${d3.timeFormat('%B %d, %Y')(d.date)}</div>
              <div class="tooltip-item"><span class="dot crit"></span> Critical: ${Math.round(d.critical)}</div>
              <div class="tooltip-item"><span class="dot high"></span> High: ${Math.round(d.high)}</div>
              <div class="total">Total Errors: ${Math.round(d.low + d.medium + d.high + d.critical)}</div>
            `,
            )
            .style('left', event.pageX + 15 + 'px')
            .style('top', event.pageY - 28 + 'px');
        }
      });

    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'axis-gray')
      .call(d3.axisBottom(x).ticks(7));

    svg.append('g').attr('class', 'axis-gray').call(d3.axisLeft(y).ticks(5));
  }

  private getTrendData() {
    return Array.from({ length: 14 }, (_, i) => ({
      date: new Date(2026, 0, 11 + i),
      low: 10 + Math.random() * 20,
      medium: 15 + Math.random() * 20,
      high: 5 + Math.random() * 30,
      critical: 2 + Math.random() * 40,
      prevTotal: 50 + Math.random() * 100,
    }));
  }

  private loadDiverseData(): void {
    const severities = ['Critical', 'High', 'Medium', 'Low'];
    const sources = ['Epic Health', 'QuestLab', 'MediBridge', 'Cognita Billing', 'LabCorp'];
    const rules = [
      { rule: 'Required Field Missing', detail: 'for patient_id' },
      { rule: 'Patient Age Out of Range', detail: 'Enforce standard limits' },
      { rule: 'Invalid ICD-10 Code', detail: 'Look up network' },
      { rule: 'Missing Encounter Date', detail: 'Provider out dataset' },
      { rule: 'Value Mismatch', detail: 'for lab_results_value' },
      { rule: 'Duplicate Record Found', detail: 'External identifier clash' },
      { rule: 'Invalid NPI Number', detail: 'Provider registry check' },
    ];

    const activeData = [];
    for (let i = 0; i < 35; i++) {
      const ruleTemplate = rules[i % rules.length];
      activeData.push({
        rule: ruleTemplate.rule,
        detail: ruleTemplate.detail,
        source: sources[i % sources.length],
        severity: severities[i % severities.length],
        count: Math.floor(Math.random() * 100) + 1,
        firstSeen: `${(i % 5) + 1}h ago`,
        status: 'Active',
      });
    }

    this.activeFailuresDS.data = activeData;

    // Fixed spacing in the type field for clear vertical separation in the UI
    this.bySourceDS.data = [
      {
        source: 'Epic Health Network',
        type: ' EHR / EMR ',
        errors: 143,
        critical: 52,
        high: 28,
        medium: 43,
        low: 20,
        trend: 'up',
      },
      {
        source: 'QuestLab Systems',
        type: ' EHR / EMR ',
        errors: 92,
        critical: 47,
        high: 14,
        medium: 20,
        low: 11,
        trend: 'up',
      },
      {
        source: 'MediBridge Clinic',
        type: ' EHR / EMR ',
        errors: 64,
        critical: 0,
        high: 20,
        medium: 44,
        low: 20,
        trend: 'stable',
      },
      {
        source: 'Cognita Billing',
        type: ' Billing ',
        errors: 14,
        critical: 11,
        high: 0,
        medium: 3,
        low: 0,
        trend: 'down',
      },
    ];
  }
}
