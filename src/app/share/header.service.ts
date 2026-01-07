import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({ providedIn: "root" })
export class HeaderService {
  private _isExpanded = new BehaviorSubject<boolean>(false);
  isExpanded$ = this._isExpanded.asObservable();

  toggleHeader() {
    console.log("==> Toggled Header");
    this._isExpanded.next(!this._isExpanded.value);
  }

  setHeaderState(isExpanded: boolean) {
    this._isExpanded.next(isExpanded);
  }
}
