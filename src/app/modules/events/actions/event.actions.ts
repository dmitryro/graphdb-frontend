import { Action } from "@modules/events/interfaces/action.interface";
import { createAction, props } from "@ngrx/store";

export enum EventActionTypes {
  PilotTermsAgreed = "[Event] Pilot Terms Agreed",
  PilotContactFormUpdated = "[Event] Pilot Contact Form Updated",
  ToggleHeader = "[Event] Toggle Header",
  ToggleDrawer = "[Event] Toggle Drawer",
  NonHealthcareUser = "[Event] Non Healthcare User",
  OpenDrawer = "[Event] Open Drawer",
  CloseDrawer = "[Event] Close Drawer",
  OpenChat = "[Event] Open Chat",
  CloseChat = "[Event] Close Chat",
  OpenSearch = "[Event] Open Search",
  CloseSearch = "[Event] Close Search",
  OpenRegistrationModal = "[Event] Open Registration",
  CloseRegistrationModal = "[Event] Close Registration",
  InnerMenuItemSelected = "[Event] Inner Menu Item Selected",
  CloseLoginDialog = "[Event] Close Login Dialog",
  VKAuthSuccess = "[Event] VK Auth Success",
  VKAuthFailure = "[Event] VK Auth Failure",
  VKCodeReceived = "[Event] VK Code Received",
  TwitterAuthSuccess = "[Event] Twitter Auth Success",
  TwitterAuthFailure = "[Event] Twitter Auth Faiure",
  GoogleAuthSuccess = "[Event] Google Auth Success",
  GoogleAuthFailure = "[Event] Google Auth Faiure",
  MSAuthSuccess = "[Event] MS Auth Success",
  MSAuthFailure = "[Event] MS Auth Faiure",
  TriggerLogout = "[Event] Trigger Logout",
  OpenUserOptionsMenu = "[Event] Open User Options Menu",
  CloseUserOptionsMenu = "[Event] Close User Options Menu",
  SucceededAuthentication = "[Event] Succeeded Authentication",
  FailedAuthentication = "[Event] Failed Authentication",
  SessionRestored = "[Event] Session Restored",
  ShowUserMenu = "[Event] Show User Menu",
  SessionCreated = "[Event] Session Created",
  LogoutUser = "[Event] Logout User",
  SetPickerDate = "[Event] Set Picker Date",
  OpenLoginModal = "[Event] Open Login Modal",
  OpenModal = "[Event] Open modal",
  CloseModal = "[Event] Close modal",
  OpenUserMenu = "[Event] OpenUserMenu",
  CloseUserMenu = "[Event] CloseUserMenu",
  OpenSideMenu = "[Event] OpenSideMenu",
  CloseSideMenu = "[Event] CloseSideMenu",
  OpenMobileMenu = "[Event] OpenMibleMenu",
  CloseMobileMenu = "[Event] CloseMobileMenu",
  UpdateMenuItem = "[Event] UpdateMenuItem",
  OptionSelected = "[Event] OptionSelected",
  RefreshHeader = "[Event] RefreshHeader",
  PageLoaded = "[Event] PageLoaded",
  MobileModeEntered = "[Event] Mobile Mode Entered",
}

export class PilotContactFormUpdated implements Action {
  readonly type = EventActionTypes.PilotContactFormUpdated;
  constructor(public payload: any) {}
}

export class PilotTermsAgreed implements Action {
  readonly type = EventActionTypes.PilotTermsAgreed;
  constructor(public payload: any) {}
}

export class OpenRegistrationModal implements Action {
  readonly type = EventActionTypes.OpenRegistrationModal;
  constructor(public payload: any) {}
}

export class CloseRegistrationModal implements Action {
  readonly type = EventActionTypes.CloseRegistrationModal;
  constructor(public payload: any) {}
}

export class ToggleDrawer implements Action {
  readonly type = EventActionTypes.ToggleDrawer;
  constructor(public payload: any) {}
}

export class ToggleHeader implements Action {
  readonly type = EventActionTypes.ToggleHeader;
  constructor(public payload: any) {}
}

export class NonHealthcareUser implements Action {
  readonly type = EventActionTypes.NonHealthcareUser;
  constructor(public payload: any) {}
}

export class OpenDrawer implements Action {
  readonly type = EventActionTypes.OpenDrawer;
  constructor(public payload: any) {}
}

export class CloseDrawer implements Action {
  readonly type = EventActionTypes.CloseDrawer;
  constructor(public payload: any) {}
}

export class OpenSearch implements Action {
  readonly type = EventActionTypes.OpenSearch;
  constructor(public payload: any) {}
}

export class CloseSearch implements Action {
  readonly type = EventActionTypes.CloseSearch;
  constructor(public payload: any) {}
}

export class OpenChat implements Action {
  readonly type = EventActionTypes.OpenChat;
  constructor(public payload: any) {}
}

export class CloseChat implements Action {
  readonly type = EventActionTypes.CloseChat;
  constructor(public payload: any) {}
}

export class InnerMenuItemSelected implements Action {
  readonly type = EventActionTypes.InnerMenuItemSelected;
  constructor(public payload: any) {}
}

export class CloseLoginDialog implements Action {
  readonly type = EventActionTypes.CloseLoginDialog;
  constructor(public payload: any) {}
}

export class VKAuthSuccess implements Action {
  readonly type = EventActionTypes.VKAuthSuccess;
  constructor(public payload: any) {}
}

export class VKAuthFailure implements Action {
  readonly type = EventActionTypes.VKAuthFailure;
  constructor(public payload: any) {}
}

export class VKCodeReceived implements Action {
  readonly type = EventActionTypes.VKCodeReceived;
  constructor(public payload: any) {}
}

export class MSAuthFailure implements Action {
  readonly type = EventActionTypes.MSAuthFailure;
  constructor(public payload: any) {}
}

export class MSAuthSuccess implements Action {
  readonly type = EventActionTypes.MSAuthSuccess;
  constructor(public payload: any) {}
}

export class GoogleAuthFailure implements Action {
  readonly type = EventActionTypes.GoogleAuthFailure;
  constructor(public payload: any) {}
}

export class GoogleAuthSuccess implements Action {
  readonly type = EventActionTypes.GoogleAuthSuccess;
  constructor(public payload: any) {}
}

export class TwitterAuthFailure implements Action {
  readonly type = EventActionTypes.TwitterAuthFailure;
  constructor(public payload: any) {}
}

export class TwitterAuthSuccess implements Action {
  readonly type = EventActionTypes.TwitterAuthSuccess;
  constructor(public payload: any) {}
}

export class TriggerLogout implements Action {
  readonly type = EventActionTypes.TriggerLogout;
  constructor(public payload: any) {}
}

export class CloseUserOptionsMenu implements Action {
  readonly type = EventActionTypes.CloseUserOptionsMenu;
  constructor(public payload: any) {}
}

export class OpenUserOptionsMenu implements Action {
  readonly type = EventActionTypes.OpenUserOptionsMenu;
  constructor(public payload: any) {}
}

export class SucceededAuthentication implements Action {
  readonly type = EventActionTypes.SucceededAuthentication;
  constructor(public payload: any) {}
}

export class FailedAuthentication implements Action {
  readonly type = EventActionTypes.FailedAuthentication;
  constructor(public payload: any) {}
}

export class SessionRestored implements Action {
  readonly type = EventActionTypes.SessionRestored;
  constructor(public payload: any) {}
}

export class ShowUserMenu implements Action {
  readonly type = EventActionTypes.ShowUserMenu;
  constructor(public payload: any) {}
}

export class SessionCreated implements Action {
  readonly type = EventActionTypes.SessionCreated;
  constructor(public payload: any) {}
}

export class LogoutUser implements Action {
  readonly type = EventActionTypes.LogoutUser;
  constructor(public payload: any) {}
}

export class SetPickerDate implements Action {
  readonly type = EventActionTypes.SetPickerDate;
  constructor(public payload: any) {}
}

export class OpenLoginModal implements Action {
  readonly type = EventActionTypes.OpenLoginModal;
  constructor(public payload: any) {}
}

export class MobileModeEntered implements Action {
  readonly type = EventActionTypes.MobileModeEntered;
  constructor(public payload: any) {}
}

export class PageLoaded implements Action {
  readonly type = EventActionTypes.PageLoaded;
  constructor(public payload: any) {}
}

export class RefreshHeader implements Action {
  readonly type = EventActionTypes.RefreshHeader;
  constructor(public payload: any) {}
}

export class OptionSelected implements Action {
  readonly type = EventActionTypes.OptionSelected;
  constructor(public payload: any) {}
}

export class UpdateMenuItem implements Action {
  readonly type = EventActionTypes.UpdateMenuItem;
  constructor(public payload: any) {}
}

export class OpenMobileMenu implements Action {
  readonly type = EventActionTypes.OpenMobileMenu;
  constructor(public payload: any) {}
}

export class CloseMobileMenu implements Action {
  readonly type = EventActionTypes.CloseMobileMenu;
  constructor(public payload: any) {}
}

export class OpenModal implements Action {
  readonly type = EventActionTypes.OpenModal;
  constructor(public payload: any) {}
}

export class CloseModal implements Action {
  readonly type = EventActionTypes.CloseModal;
  constructor(public payload: any) {}
}

export class OpenSideMenu implements Action {
  readonly type = EventActionTypes.OpenSideMenu;
  constructor(public payload: any) {}
}

export class CloseSideMenu implements Action {
  readonly type = EventActionTypes.CloseSideMenu;
  constructor(public payload: any) {}
}

export class OpenUserMenu implements Action {
  readonly type = EventActionTypes.OpenUserMenu;
  constructor(public payload: any) {}
}

export class CloseUserMenu implements Action {
  readonly type = EventActionTypes.CloseUserMenu;
  constructor(public payload: any) {}
}

export type EventActions =
  | OpenModal
  | CloseModal
  | OpenUserMenu
  | CloseUserMenu
  | OpenSideMenu
  | CloseSideMenu
  | OpenMobileMenu
  | CloseMobileMenu
  | UpdateMenuItem
  | OptionSelected
  | PilotContactFormUpdated
  | PilotTermsAgreed
  | RefreshHeader
  | PageLoaded
  | MobileModeEntered
  | OpenLoginModal
  | OpenChat
  | CloseChat
  | ToggleDrawer
  | ToggleHeader
  | NonHealthcareUser
  | OpenDrawer
  | CloseDrawer
  | OpenSearch
  | CloseSearch
  | OpenRegistrationModal
  | CloseRegistrationModal
  | SetPickerDate
  | LogoutUser
  | SessionCreated
  | ShowUserMenu
  | SessionRestored
  | FailedAuthentication
  | SucceededAuthentication
  | CloseUserOptionsMenu
  | OpenUserOptionsMenu
  | TriggerLogout
  | TwitterAuthSuccess
  | TwitterAuthFailure
  | GoogleAuthSuccess
  | GoogleAuthFailure
  | MSAuthSuccess
  | MSAuthFailure
  | VKCodeReceived
  | VKAuthSuccess
  | VKAuthFailure
  | InnerMenuItemSelected
  | CloseLoginDialog;
