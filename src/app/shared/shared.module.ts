import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import * as fromComponents from "./components";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { StepHeaderDirective } from "./directives/step-header.directive";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatStepperModule } from "@angular/material/stepper";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSelectModule } from "@angular/material/select";
import { MatCardModule } from "@angular/material/card";

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
  ],
  exports: [...fromComponents.components],
})
export class SharedModule {}
