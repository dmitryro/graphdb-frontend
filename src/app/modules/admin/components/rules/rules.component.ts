import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // Import this

@Component({
  selector: 'app-rules.component',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './rules.component.html',
  styleUrl: './rules.component.scss',
})
export class RulesComponent {}
