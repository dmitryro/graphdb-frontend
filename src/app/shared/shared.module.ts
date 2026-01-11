import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as fromComponents from './components';
import { StepHeaderDirective } from './directives/step-header.directive';

// Existing Imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';

// MISSING IMPORTS RESTORED
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@NgModule({
  declarations: [...fromComponents.components, StepHeaderDirective],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatStepperModule,
    MatButtonModule,
    MatListModule,
    MatCheckboxModule,
    MatIconModule, // Restored
    MatChipsModule, // Restored
    MatProgressSpinnerModule, // Restored
    MatSlideToggleModule, // Restored
  ],
  exports: [...fromComponents.components, StepHeaderDirective],
})
export class SharedModule {}
