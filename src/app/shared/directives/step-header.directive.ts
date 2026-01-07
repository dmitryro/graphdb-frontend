import { Directive, Input } from "@angular/core";

@Directive({
  standalone: false,
  selector: "[stepHeader]",
})
export class StepHeaderDirective {
  @Input() step: any;

  constructor() {}
}
