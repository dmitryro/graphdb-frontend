import { Directive, Input } from '@angular/core';

@Directive({
  standalone: false,
  selector: '[appStepHeader]', // Changed to include 'app' prefix
})
export class StepHeaderDirective {
  // Replace 'any' with a proper type/interface if possible,
  // or use 'unknown' for better type safety.
  @Input() step: unknown;

  constructor() {
    // Intentional empty constructor
  }
}
