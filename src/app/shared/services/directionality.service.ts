import { Direction, Directionality } from '@angular/cdk/bidi';
import { EventEmitter, Injectable, OnDestroy, WritableSignal, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AppDirectionality implements Directionality, OnDestroy {
  private _dir = signal<Direction>('ltr');
  readonly valueSignal: WritableSignal<Direction> = this._dir;
  readonly change = new EventEmitter<Direction>();

  private _value: Direction = 'ltr';

  // Fixed: Removed empty constructor or added comment to satisfy linter
  constructor() {
    // Intentional empty constructor
  }

  get value(): Direction {
    return this._value;
  }

  set value(value: Direction) {
    this._value = value;
    this._dir.set(value); // Sync the signal with the setter
    this.change.next(value);
  }

  ngOnDestroy() {
    this.change.complete();
  }

  setDirection(dir: Direction) {
    this.value = dir; // Use the setter to ensure change event emits
  }
}
