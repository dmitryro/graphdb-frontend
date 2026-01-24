import { AfterContentInit, ContentChildren, Directive, OnDestroy, QueryList } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { RouterTab } from './router-tab.directive';

@Directive({
  selector: '[appRouterTabs]', // Fixed: Added 'app' prefix to satisfy @angular-eslint/directive-selector
  standalone: false,
})
export class RouterTabs implements AfterContentInit, OnDestroy {
  private subscription = new Subscription();

  @ContentChildren(RouterTab) routerTabs!: QueryList<RouterTab>;

  constructor(
    private host: MatTabGroup,
    private router: Router,
  ) {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  ngAfterContentInit(): void {
    this.setIndex();
    this.subscription.add(
      this.router.events.subscribe(e => {
        if (e instanceof NavigationEnd) {
          this.setIndex();
        }
      }),
    );
    this.subscription.add(
      this.host.selectedTabChange.subscribe(() => {
        const tab = this.routerTabs.find(item => !!item.tab.isActive);
        if (tab) {
          this.router.navigateByUrl(tab.link.urlTree);
        }
      }),
    );
  }

  private setIndex() {
    // Replaced .find() with .forEach() or a proper check to avoid "unused expression" errors
    this.routerTabs.forEach((tab, i) => {
      const isActive = this.router.isActive(tab.link.urlTree, {
        paths: 'exact',
        queryParams: 'ignored',
        fragment: 'ignored',
        matrixParams: 'ignored',
      });

      if (isActive) {
        tab.tab.isActive = true;
        this.host.selectedIndex = i;
      }
    });
  }
}
