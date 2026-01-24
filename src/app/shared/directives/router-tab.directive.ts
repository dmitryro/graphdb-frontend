import { Directive } from '@angular/core';
import { MatTab } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'mat-tab[routerLink]',
  standalone: false,
})
export class RouterTab {
  constructor(
    public tab: MatTab,
    public link: RouterLink,
  ) {
    // Intentional empty constructor
  }
}
