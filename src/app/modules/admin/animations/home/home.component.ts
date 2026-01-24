import { animate, query, stagger, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(-15px)' }),
            stagger(
              '100ms',
              animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0px)' })),
            ),
          ],
          { optional: true },
        ),
        query(
          ':leave',
          [
            style({ opacity: 1 }),
            stagger(
              '100ms',
              animate('500ms ease-out', style({ opacity: 0, transform: 'translateY(-15px)' })),
            ),
          ],
          {
            optional: true,
          },
        ),
      ]),
    ]),
  ],
})
export class HomeComponent implements OnInit {
  items: number[] = []; // Specified type to avoid 'any[]' warnings

  constructor() {
    // Intentional empty constructor
  }

  showItems() {
    this.items = [0, 1, 2, 3, 4];
  }

  hideItems() {
    this.items = [];
  }

  toggle() {
    // Fixed: Changed ternary expression to if/else to satisfy no-unused-expressions
    if (this.items.length) {
      this.hideItems();
    } else {
      this.showItems();
    }
  }

  ngOnInit() {
    // Intentional empty method
  }
}
