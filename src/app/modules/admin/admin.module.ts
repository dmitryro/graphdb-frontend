import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
// Correct imports for angular-gridster2 v21 - note the component names
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatStepperModule } from '@angular/material/stepper';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SharedModule } from '@shared/shared.module';
import { Gridster, GridsterItem } from 'angular-gridster2';
import { AdminRoutingModule } from './admin-routing.module';
import * as fromComponents from './components';
import { LayoutComponent } from './layout/layout.component';
import { SideNavComponent } from './layout/side-nav/side-nav.component';
import { TopNavComponent } from './layout/top-nav/top-nav.component';

@NgModule({
  imports: [
    CommonModule,
    AdminRoutingModule,
    // Gridster standalone components - use Gridster and GridsterItem
    Gridster,
    GridsterItem,
    // Material Modules
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatStepperModule,
    MatCheckboxModule,
    MatSelectModule,
    MatCardModule,
    MatSidenavModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatListModule,
    SharedModule,
  ],
  declarations: [...fromComponents.components, LayoutComponent, TopNavComponent, SideNavComponent],
  exports: [...fromComponents.components],
})
export class AdminModule {}
