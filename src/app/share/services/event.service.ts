import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import { EventState } from "@modules/events/states/event.state";
import {
  EventActionTypes,
  EventActions,
} from "@modules/events/actions/event.actions";
import { IEvent } from "@modules/events/interfaces/event.interface";

@Injectable({
  providedIn: "root",
})
export class EventService {
  constructor(protected eventStore: Store<{ es: EventState }>) {}

  publish(event: any, payload: any): void {
    var m = new Map();
    m.set("open_modal", EventActionTypes.OpenModal);
    m.set("close_modal", EventActionTypes.CloseModal);
    m.set("open_user_menu", EventActionTypes.OpenUserMenu);
    m.set("close_user_menu", EventActionTypes.CloseUserMenu);
    m.set("open_side_menu", EventActionTypes.OpenSideMenu);
    m.set("close_side_menu", EventActionTypes.CloseSideMenu);
    m.set("open_mobile_menu", EventActionTypes.OpenMobileMenu);
    m.set("close_mobile_menu", EventActionTypes.CloseMobileMenu);
    this.eventStore.dispatch({ type: m.get(event), payload: payload });
  }
}
