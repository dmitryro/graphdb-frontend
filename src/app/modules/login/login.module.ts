import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login/login.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule, // Now resolves correctly
    MatInputModule,
    MatFormFieldModule, // Fixes 'mat-form-field' and 'mat-label' errors
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule, // Fixes 'mat-icon' error
    LoginRoutingModule,
  ],
  declarations: [LoginComponent],
})
export class LoginModule {}
