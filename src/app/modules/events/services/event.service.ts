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

  publish(id: string, event: any, payload: any): void {
    var m = new Map();
    m.set("open_modal", EventActionTypes.OpenModal);
    m.set("close_modal", EventActionTypes.CloseModal);
    m.set("open_user_menu", EventActionTypes.OpenUserMenu);
    m.set("close_user_menu", EventActionTypes.CloseUserMenu);
    m.set("open_side_menu", EventActionTypes.OpenSideMenu);
    m.set("close_side_menu", EventActionTypes.CloseSideMenu);
    m.set("open_mobile_menu", EventActionTypes.OpenMobileMenu);
    m.set("close_mobile_menu", EventActionTypes.CloseMobileMenu);
    m.set("update_menu_item", EventActionTypes.UpdateMenuItem);
    m.set("option_selected", EventActionTypes.OptionSelected);
    m.set("refresh_header", EventActionTypes.RefreshHeader);
    m.set("page_loaded", EventActionTypes.PageLoaded);
    m.set("mobile_mode_entered", EventActionTypes.MobileModeEntered);
    m.set("open_login_modal", EventActionTypes.OpenLoginModal);
    m.set("set_picker_date", EventActionTypes.SetPickerDate);
    m.set("logout_user", EventActionTypes.LogoutUser);
    m.set("session_created", EventActionTypes.SessionCreated);
    m.set("show_user_menu", EventActionTypes.ShowUserMenu);
    m.set("session_restored", EventActionTypes.SessionRestored);
    m.set("failed_authentication", EventActionTypes.FailedAuthentication);
    m.set("succeeded_authentication", EventActionTypes.SucceededAuthentication);
    m.set("open_user_options_menu", EventActionTypes.OpenUserOptionsMenu);
    m.set("close_user_options_menu", EventActionTypes.CloseUserOptionsMenu);
    m.set("trigger_logout", EventActionTypes.TriggerLogout);
    m.set("twitter_auth_success", EventActionTypes.TwitterAuthSuccess);
    m.set("twitter_auth_failure", EventActionTypes.TwitterAuthFailure);
    m.set("google_auth_success", EventActionTypes.GoogleAuthSuccess);
    m.set("google_auth_failure", EventActionTypes.GoogleAuthFailure);
    m.set("ms_auth_success", EventActionTypes.MSAuthSuccess);
    m.set("ms_auth_failure", EventActionTypes.MSAuthFailure);
    m.set("vk_code_received", EventActionTypes.VKCodeReceived);
    m.set("vk_auth_success", EventActionTypes.VKAuthSuccess);
    m.set("vk_auth_failure", EventActionTypes.VKAuthFailure);
    m.set("close_login_dialog", EventActionTypes.CloseLoginDialog);
    m.set("inner_menu_item_selected", EventActionTypes.InnerMenuItemSelected);
    m.set("open_chat", EventActionTypes.OpenChat);
    m.set("close_chat", EventActionTypes.CloseChat);
    m.set("open_drawer", EventActionTypes.OpenDrawer);
    m.set("close_drawer", EventActionTypes.CloseDrawer);
    m.set("toggle_drawer", EventActionTypes.ToggleDrawer);
    m.set("toggle_header", EventActionTypes.ToggleHeader);
    m.set(
      "pilot_contact_form_updated",
      EventActionTypes.PilotContactFormUpdated,
    );
    m.set("pilot_terms_agreed", EventActionTypes.PilotTermsAgreed);
    m.set("non_healthcare_user", EventActionTypes.NonHealthcareUser);
    m.set("open_search", EventActionTypes.OpenSearch);
    m.set("close_search", EventActionTypes.CloseSearch);
    m.set("open_registration", EventActionTypes.OpenRegistrationModal);
    m.set("close_registration", EventActionTypes.CloseRegistrationModal);
    this.eventStore.dispatch({
      type: m.get(event),
      payload: { id: id, event: event, payload: payload },
    });
  }
}
