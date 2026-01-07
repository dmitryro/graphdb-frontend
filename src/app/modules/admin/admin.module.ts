import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatStepperModule } from "@angular/material/stepper";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSelectModule } from "@angular/material/select";
import { MatCardModule } from "@angular/material/card";
import * as fromComponents from "./components";
import { AdminRoutingModule } from "./admin-routing.module";
import { LayoutComponent } from "./layout/layout.component";
import { TopNavComponent } from "./layout/top-nav/top-nav.component";
import { SideNavComponent } from "./layout/side-nav/side-nav.component";
import { SharedModule } from "@shared/shared.module";

@NgModule({
  imports: [
    CommonModule,
    AdminRoutingModule,
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
  declarations: [
    ...fromComponents.components,
    LayoutComponent,
    TopNavComponent,
    SideNavComponent,
  ],
  exports: [...fromComponents.components],
})
export class AdminModule {}
