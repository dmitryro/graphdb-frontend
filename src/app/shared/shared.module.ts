import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as fromComponents from './components';
import { StepHeaderDirective } from './directives/step-header.directive';

// Existing Imports
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion'; // Add this import
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree'; // <--- ADD THIS
// MISSING IMPORTS RESTORED
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio'; // 1. Import the module
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe'; // adjust path
import { AngularSplitModule } from 'angular-split'; // Change SplitComponent to the Module

@NgModule({
  declarations: [...fromComponents.components, StepHeaderDirective],
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    ReactiveFormsModule,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatStepperModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
    MatCheckboxModule,
    MatTreeModule,
    MatIconModule, // Restored
    MatChipsModule, // Restored
    MatSlideToggleModule, // Restored
    MatButtonToggleModule,
    MatExpansionModule,
    MatTooltipModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    AngularSplitModule,
    SafeHtmlPipe,
  ],
  exports: [
    ...fromComponents.components,
    StepHeaderDirective,
    // --- ADD THESE EXPORTS ---
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
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatButtonToggleModule,
    MatRadioModule,
    MatTreeModule,
    AngularSplitModule,
    DragDropModule,
    SafeHtmlPipe,
  ],
})
export class SharedModule {}
