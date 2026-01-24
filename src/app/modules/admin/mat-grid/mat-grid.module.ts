import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { GridComponent } from './grid/grid.component';
import { MatGridRoutingModule } from './mat-grid-routing.module';

@NgModule({
  imports: [CommonModule, MatGridRoutingModule, MatCardModule, MatButtonModule],
  declarations: [GridComponent],
})
export class MatGridModule {}
