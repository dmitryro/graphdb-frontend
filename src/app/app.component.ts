import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SettingsService } from './core/bootstrap/settings.service';

@Component({
  selector: 'app-root',
  template: `<router-outlet />`,
  imports: [RouterOutlet],
})
export class AppComponent implements OnInit {
  private readonly settings = inject(SettingsService);

  ngOnInit() {
    this.settings.setDirection();
    this.settings.setTheme();
  }
}
