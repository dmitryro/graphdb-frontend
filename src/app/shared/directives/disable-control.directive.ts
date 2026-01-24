import { Directive, Input, OnChanges, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appDisableControl]', // Fixed: Prefix moved inside the brackets
  standalone: false,
})
export class DisableControlDirective implements OnChanges {
  private readonly ngControl = inject(NgControl, { optional: true });

  // Fixed: Input name should match the selector for easy usage
  @Input('appDisableControl') disableControl = false;

  ngOnChanges(): void {
    if (this.disableControl) {
      this.ngControl?.control?.disable();
    } else {
      this.ngControl?.control?.enable();
    }
  }
}
