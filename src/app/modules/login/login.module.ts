import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { FlexLayoutModule } from "@angular/flex-layout";

import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatFormFieldModule } from "@angular/material/form-field";

import { LoginRoutingModule } from "./login-routing.module";
import { LoginComponent } from "./login/login.component";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    FlexLayoutModule,    // Now resolves correctly
    MatInputModule,
    MatFormFieldModule,  // Fixes 'mat-form-field' and 'mat-label' errors
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,       // Fixes 'mat-icon' error
    LoginRoutingModule,
  ],
  declarations: [LoginComponent],
})
export class LoginModule {}
