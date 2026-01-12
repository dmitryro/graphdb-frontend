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
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { Store } from '@ngrx/store';
import * as d3 from 'd3';

import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';

@Component({
  selector: 'app-validation',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSlideToggleModule,
  ],
  templateUrl: './validation.component.html',
  styleUrl: './validation.component.scss',
})
export class ValidationComponent implements OnInit, AfterViewInit {
  @ViewChild('trendChart') private chartContainer!: ElementRef;

  // State Management
  activeTabIndex = signal(0);
  selectedEnv = signal('Production');
  showComparison = signal(false);

  // Data Sources
  activeFailuresDS = new MatTableDataSource<any>([]);
  bySourceDS = new MatTableDataSource<any>([]);

  columnsActive = ['rule', 'source', 'severity', 'count', 'firstSeen', 'status'];
  columnsSource = ['source', 'errors', 'critical', 'high', 'medium', 'low', 'trend', 'actions'];

  constructor(
    private eventService: EventService,
    private eventStore: Store<{ nf: EventState }>,
  ) {
    /** * MPI Requirement: Log UI state transitions into the graph of events.
     * Uses execute_merge_query_with_context to ensure transactions are logged
     * and related to patient golden records where applicable. [Ref: 2026-01-01]
     */
    effect(() => {
      this.executeMergeQuery('UI_STATE_CHANGE', {
        currentTab: this.activeTabIndex(),
        environment: this.selectedEnv(),
        comparisonView: this.showComparison(),
      });

      if (this.activeTabIndex() === 1 && this.chartContainer) {
        // Trigger re-render when comparison toggle or tab changes
        this.renderTrendChart();
      }
    });
  }

  ngOnInit(): void {
    this.loadDiverseData();
  }

  ngAfterViewInit(): void {
    if (this.activeTabIndex() === 1) {
      this.renderTrendChart();
    }
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.activeTabIndex.set(event.index);
    if (event.index === 1) {
      // Small timeout to allow the tab animation to finish and container to have width
      setTimeout(() => this.renderTrendChart(), 50);
    }
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

    // Scale Definitions
    const x = d3
      .scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear().domain([0, 200]).range([height, 0]);

    // 1. Comparison Line (Dashed Ghost)
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

    // 2. Stacked Area
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

    // 3. Tooltip and Interaction Logic
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

    // 4. Axes
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'axis-gray')
      .call(d3.axisBottom(x).ticks(7));
    svg.append('g').attr('class', 'axis-gray').call(d3.axisLeft(y).ticks(5));
  }

  private executeMergeQuery(action: string, metadata: any): void {
    /** * Method execute_merge_query_with_context
     * Ensures all MPI transactions are logged into the graph of events [Ref: 2025-12-20]
     */
    this.eventService.publish('nf', 'execute_merge_query_with_context', {
      transactionType: 'VALIDATION_AUDIT',
      action,
      ...metadata,
      timestamp: new Date().toISOString(),
    });
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
    this.activeFailuresDS.data = [
      {
        rule: 'Required Field Missing',
        detail: 'for patient_id',
        source: 'Epic Health',
        severity: 'Critical',
        count: 52,
        firstSeen: '5h ago',
        status: 'Active',
      },
      {
        rule: 'Patient Age Out of Range',
        detail: 'Enforce standard limits',
        source: 'QuestLab',
        severity: 'Critical',
        count: 47,
        firstSeen: '1d ago',
        status: 'Active',
      },
      {
        rule: 'Invalid ICD-10 Code',
        detail: 'Look up network',
        source: 'Epic Health',
        severity: 'High',
        count: 28,
        firstSeen: '3d ago',
        status: 'Active',
      },
      {
        rule: 'Missing Encounter Date',
        detail: 'Provider out dataset',
        source: 'MediBridge',
        severity: 'Medium',
        count: 18,
        firstSeen: '5d ago',
        status: 'Active',
      },
      {
        rule: 'Value Mismatch',
        detail: 'for lab_results_value',
        source: 'Epic Health',
        severity: 'Medium',
        count: 14,
        firstSeen: '6h ago',
        status: 'Active',
      },
    ];

    this.bySourceDS.data = [
      {
        source: 'Epic Health Network',
        type: 'EHR / EMR',
        errors: 143,
        critical: 52,
        high: 28,
        medium: 43,
        low: 20,
        trend: 'up',
      },
      {
        source: 'QuestLab Systems',
        type: 'EHR / EMR',
        errors: 92,
        critical: 47,
        high: 14,
        medium: 20,
        low: 11,
        trend: 'up',
      },
      {
        source: 'MediBridge Clinic',
        type: 'EHR / EMR',
        errors: 64,
        critical: 0,
        high: 20,
        medium: 44,
        low: 20,
        trend: 'stable',
      },
      {
        source: 'Cognita Billing',
        type: 'Billing',
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
