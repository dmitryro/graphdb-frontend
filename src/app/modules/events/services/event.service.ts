import { Injectable } from '@angular/core';
import { EventActionTypes } from '@modules/events/actions/event.actions';
import { EventState } from '@modules/events/states/event.state';
import { Store } from '@ngrx/store';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  constructor(protected eventStore: Store<{ es: EventState }>) {}

  publish(id: string, event: string, payload: any): void {
    const m = new Map();
    m.set('open_modal', EventActionTypes.OpenModal);
    m.set('confirmation_delete_confirmed', EventActionTypes.ConfirmationDeleteConfirmed);
    m.set('confirmation_save_confirmed', EventActionTypes.ConfirmationSaveConfirmed);
    m.set('confirmation_confirm_confirmed', EventActionTypes.ConfirmationConfirmConfirmed);
    m.set('confirmation_reset_confirmed', EventActionTypes.ConfirmationResetConfirmed);
    m.set('open_confirmation_modal', EventActionTypes.OpenConfirmationModal);
    m.set('theme_change', EventActionTypes.ThemeChange);
    m.set('update_breadcrumb', EventActionTypes.UpdateBreadcrumb);
    m.set('open_usage_impact_drawer', EventActionTypes.OpenUsageImpactDrawer);
    m.set('close_usage_impact_drawer', EventActionTypes.CloseUsageImpactDrawer);
    m.set('close_edit_mapping', EventActionTypes.CloseEditMapping);
    m.set('open_edit_mapping', EventActionTypes.OpenEditMapping);
    m.set('close_edit_model', EventActionTypes.CloseEditModel);
    m.set('open_edit_model', EventActionTypes.OpenEditModel);
    m.set('view_related_model', EventActionTypes.ViewRelatedModel);
    m.set('open_new_mapping_modal', EventActionTypes.OpenNewMappingModal);
    m.set('close_new_mapping_modal', EventActionTypes.CloseNewMappingModal);
    m.set('breadcrumb_navigate', EventActionTypes.BreadcrumbNavigate);
    m.set('close_modal', EventActionTypes.CloseModal);
    m.set('open_user_menu', EventActionTypes.OpenUserMenu);
    m.set('close_user_menu', EventActionTypes.CloseUserMenu);
    m.set('open_side_menu', EventActionTypes.OpenSideMenu);
    m.set('close_side_menu', EventActionTypes.CloseSideMenu);
    m.set('open_mobile_menu', EventActionTypes.OpenMobileMenu);
    m.set('close_mobile_menu', EventActionTypes.CloseMobileMenu);
    m.set('update_menu_item', EventActionTypes.UpdateMenuItem);
    m.set('option_selected', EventActionTypes.OptionSelected);
    m.set('refresh_header', EventActionTypes.RefreshHeader);
    m.set('page_loaded', EventActionTypes.PageLoaded);
    m.set('mobile_mode_entered', EventActionTypes.MobileModeEntered);
    m.set('open_login_modal', EventActionTypes.OpenLoginModal);
    m.set('set_picker_date', EventActionTypes.SetPickerDate);
    m.set('logout_user', EventActionTypes.LogoutUser);
    m.set('session_created', EventActionTypes.SessionCreated);
    m.set('show_user_menu', EventActionTypes.ShowUserMenu);
    m.set('session_restored', EventActionTypes.SessionRestored);
    m.set('failed_authentication', EventActionTypes.FailedAuthentication);
    m.set('succeeded_authentication', EventActionTypes.SucceededAuthentication);
    m.set('open_user_options_menu', EventActionTypes.OpenUserOptionsMenu);
    m.set('close_user_options_menu', EventActionTypes.CloseUserOptionsMenu);
    m.set('trigger_logout', EventActionTypes.TriggerLogout);
    m.set('twitter_auth_success', EventActionTypes.TwitterAuthSuccess);
    m.set('twitter_auth_failure', EventActionTypes.TwitterAuthFailure);
    m.set('google_auth_success', EventActionTypes.GoogleAuthSuccess);
    m.set('google_auth_failure', EventActionTypes.GoogleAuthFailure);
    m.set('ms_auth_success', EventActionTypes.MSAuthSuccess);
    m.set('ms_auth_failure', EventActionTypes.MSAuthFailure);
    m.set('close_login_dialog', EventActionTypes.CloseLoginDialog);
    m.set('inner_menu_item_selected', EventActionTypes.InnerMenuItemSelected);
    m.set('open_chat', EventActionTypes.OpenChat);
    m.set('close_chat', EventActionTypes.CloseChat);
    m.set('open_drawer', EventActionTypes.OpenDrawer);
    m.set('close_drawer', EventActionTypes.CloseDrawer);
    m.set('toggle_drawer', EventActionTypes.ToggleDrawer);
    m.set('toggle_header', EventActionTypes.ToggleHeader);
    m.set('pilot_contact_form_updated', EventActionTypes.PilotContactFormUpdated);
    m.set('pilot_terms_agreed', EventActionTypes.PilotTermsAgreed);
    m.set('non_healthcare_user', EventActionTypes.NonHealthcareUser);
    m.set('open_search', EventActionTypes.OpenSearch);
    m.set('close_search', EventActionTypes.CloseSearch);
    m.set('open_registration', EventActionTypes.OpenRegistrationModal);
    m.set('close_registration', EventActionTypes.CloseRegistrationModal);

    m.set('add_rule', EventActionTypes.AddRule);
    m.set('edit_rule', EventActionTypes.EditRule);
    m.set('delete_rule', EventActionTypes.DeleteRule);
    // Source signals
    m.set('add_source', EventActionTypes.AddSource);
    m.set('edit_source', EventActionTypes.EditSource);
    m.set('delete_source', EventActionTypes.DeleteSource);
    m.set('inspect_source', EventActionTypes.InspectSource);
    m.set('sync_source', EventActionTypes.SyncSource);
    m.set('pause_ingestion', EventActionTypes.PauseIngestion);
    m.set('download_schema', EventActionTypes.DownloadSchema);
    m.set('clear_source_cache', EventActionTypes.ClearSourceCache);

    // NEW: Normalization Signal for MPI Event Graph logging
    m.set('add_normalization_model', EventActionTypes.AddNormalizationModel);
    m.set('add_normalization_rule', EventActionTypes.AddNormalizationRule);
    m.set('add_normalization_mapping', EventActionTypes.AddNormalizationMapping);
    m.set('add_normalization_code', EventActionTypes.AddNormalizationCode);
    m.set('add_normalization_version', EventActionTypes.AddNormalizationVersion);
    const actionType = m.get(event);

    if (actionType) {
      this.eventStore.dispatch({
        type: actionType,
        payload: { id: id, event: event, payload: payload },
      });
    } else {
      console.warn(`[EventService] No mapping found for event: ${event}`);
    }
  }
}
