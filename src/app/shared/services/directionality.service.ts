import { Direction, Directionality } from "@angular/cdk/bidi";
import { EventEmitter, Injectable, OnDestroy } from "@angular/core";
import { WritableSignal, signal, effect } from '@angular/core';

@Injectable({
  providedIn: "root",
})
export class AppDirectionality implements Directionality, OnDestroy {
  private _dir = signal<Direction>('ltr'); // or fetch from your logic
  readonly valueSignal: WritableSignal<Direction> = this._dir;
  readonly change = new EventEmitter<Direction>();
  constructor() {
  }

  get value(): Direction {
    return this._value;
  }
  set value(value: Direction) {
    this._value = value;
    this.change.next(value);
  }
  private _value: Direction = "ltr";

  ngOnDestroy() {
    this.change.complete();
  }

  setDirection(dir: Direction) {
    this._dir.set(dir);
  }
}

