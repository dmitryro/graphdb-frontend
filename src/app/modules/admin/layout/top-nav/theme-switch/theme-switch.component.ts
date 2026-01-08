import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

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
})
export class ThemeSwitchComponent {
  private overlayContainer = inject(OverlayContainer);
  isDarkMode = signal<boolean>(localStorage.getItem('theme') === 'dark');

  constructor() {
    effect(() => {
      const mode = this.isDarkMode() ? 'dark' : 'light';
      const themeClass = `${mode}-theme`;

      // Update Body Class
      document.body.classList.remove('light-theme', 'dark-theme');
      document.body.classList.add(themeClass);

      // FIXED: Update Overlay Container (for Menus, Dropdowns, Dialogs)
      const containerElement = this.overlayContainer.getContainerElement();
      containerElement.classList.remove('light-theme', 'dark-theme');
      containerElement.classList.add(themeClass);

      localStorage.setItem('theme', mode);
    });
  }

  toggleTheme() {
    this.isDarkMode.update(v => !v);
  }
}
