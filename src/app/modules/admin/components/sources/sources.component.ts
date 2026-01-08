import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // Import this

@Component({
  selector: 'app-sources.component',
  standalone: true,
  imports: [RouterModule], // Add this here
  templateUrl: './sources.component.html',
  styleUrl: './sources.component.scss',
})
export class SourcesComponent {}
