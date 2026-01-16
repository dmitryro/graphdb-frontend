import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

// Event Service & NgRx Store Imports
import { EventService } from '@modules/events/services/event.service';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-theme-switch',
  template: `
    <button
      mat-icon-button
      (click)="toggleTheme()"
      [matTooltip]="isDarkMode() ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
      <mat-icon>{{ isDarkMode() ? 'dark_mode' : 'light_mode' }}</mat-icon>
    </button>
  `,
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  providers: [EventService], // Providing EventService as seen in ListComponent
})
export class ThemeSwitchComponent {
  private overlayContainer = inject(OverlayContainer);

  // Setup the theme signal from localStorage
  isDarkMode = signal<boolean>(localStorage.getItem('theme') === 'dark');

  constructor(
    protected eventService: EventService,
    protected eventStore: Store<{ nf: EventState }>,
  ) {
    effect(() => {
      const mode = this.isDarkMode() ? 'dark' : 'light';
      const themeClass = `${mode}-theme`;

      // 1. Update DOM Body Class
      document.body.classList.remove('light-theme', 'dark-theme');
      document.body.classList.add(themeClass);

      // 2. Update Overlay Container for Material Dialogs/Menus/Popups
      const containerElement = this.overlayContainer.getContainerElement();
      containerElement.classList.remove('light-theme', 'dark-theme');
      containerElement.classList.add(themeClass);

      // 3. Persist selection to local storage
      localStorage.setItem('theme', mode);

      // 4. Publish the theme_change signal via EventService
      // Matching the pattern used in ListComponent for global notification
      this.eventService.publish('ThemeSwitchComponent', 'theme_change', {
        action: 'theme_update',
        theme: mode,
        timestamp: new Date().toISOString(),
      });

      console.log(`[ThemeSwitchComponent] Theme changed to: ${mode}`);
    });
  }

  /**
   * Toggles the signal state, which triggers the effect above
   */
  toggleTheme(): void {
    this.isDarkMode.update(v => !v);
  }

  /**
   * Helper to determine current active theme state
   */
  private getActiveTheme(): 'light' | 'dark' {
    return this.isDarkMode() ? 'dark' : 'light';
  }
}
