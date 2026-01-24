import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { HomeComponent } from './home/home.component';
import { StatComponent } from './stat/stat.component';

@NgModule({
  imports: [
    CommonModule,
    DashboardRoutingModule,
    MatGridListModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
  ],
  declarations: [HomeComponent, StatComponent],
})
export class DashboardModule {}
