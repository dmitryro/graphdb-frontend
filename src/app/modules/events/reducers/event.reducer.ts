import { EventActionTypes, EventActions } from '@modules/events/actions/event.actions';
import { Action } from '@modules/events/interfaces/action.interface';
import { EventState, initialState } from '@modules/events/states/event.state';

export function eventReducer(
  state: EventState | undefined = initialState,
  action: EventActions | Action,
): EventState {
  switch (action.type) {
    case EventActionTypes.OpenModal: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.CloseModal: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.OpenUserMenu: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.CloseUserMenu: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.OpenSideMenu: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.CloseSideMenu: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.OpenMobileMenu: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.CloseMobileMenu: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.UpdateMenuItem: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.OptionSelected: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.RefreshHeader: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.PageLoaded: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.MobileModeEntered: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.OpenLoginModal: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.SetPickerDate: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.LogoutUser: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.SessionCreated: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.ShowUserMenu: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.SessionRestored: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.FailedAuthentication: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.SucceededAuthentication: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.OpenUserOptionsMenu: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.CloseUserOptionsMenu: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.TriggerLogout: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.TwitterAuthSuccess: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.TwitterAuthFailure: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.GoogleAuthSuccess: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.GoogleAuthFailure: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.InnerMenuItemSelected: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.MSAuthSuccess: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.MSAuthFailure: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.CloseLoginDialog: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.CloseDrawer: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.OpenDrawer: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.ToggleDrawer: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.ToggleHeader: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.CloseChat: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.OpenChat: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.CloseSearch: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.OpenSearch: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.CloseRegistrationModal: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.OpenRegistrationModal: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.NonHealthcareUser: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.PilotContactFormUpdated: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.PilotTermsAgreed: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.AddSource: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.EditSource: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.DeleteSource: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.InspectSource: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.SyncSource: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.PauseIngestion: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.DownloadSchema: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.ClearSourceCache: {
      return { ...state, modal: true, items: action.payload };
    }
    // NEW: Normalization case for tracking transactions in the event graph [cite: 2026-01-01]
    case EventActionTypes.AddNormalizationModel: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenEditMapping: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseEditMapping: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenCodeSetEditMapping: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseCodeSetEditMapping: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenEditCodeSetMapping: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseEditCodeSetMapping: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenEditMixedMapping: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseEditMixedMapping: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenEditCode: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseEditCode: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenEditModel: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseEditModel: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenEditRule: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseEditRule: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenEditCodeSetRule: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseEditCodeSetRule: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenEditMappingRule: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseEditMappingRule: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.AddNormalizationMapping: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.ThemeChange: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.UpdateBreadcrumb: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.BreadcrumbNavigate: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.AddNormalizationRule: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.AddNormalizationCode: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.AddNormalizationVersion: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.AddRule: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.EditRule: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.DeleteRule: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenUsageImpactDrawer: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseUsageImpactDrawer: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenNewMappingModal: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseNewMappingModal: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenNewModelModal: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseNewModelModal: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.ViewRelatedModel: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenConfirmationModal: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.ConfirmationDiscardConfirmed: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.ConfirmationDeleteConfirmed: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.ConfirmationSaveConfirmed: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.ConfirmationConfirmConfirmed: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.ConfirmationResetConfirmed: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenNewValueSetModal: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseNewValueSetModal: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenNewRuleModal: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseNewRuleModal: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenNewNormalizationRuleModal: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseNewNormalizationRuleModal: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenAddNewCodeModal: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseAddNewCodeModal: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CodeAddedToSet: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenNewCodeSetMappingModal: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseNewCodeSetMappingModal: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenNewCodeSetValidationRuleModal: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseNewCodeSetValidationRuleModal: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenMapCodeSet: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseMapCodeSet: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CodeMappingSaved: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.CloseEditCodeSet: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.OpenEditCodeSet: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    case EventActionTypes.ExecuteCodeSetAction: {
      return {
        ...state,
        items: (action as any).payload,
      };
    }
    default:
      return state;
  }
}
