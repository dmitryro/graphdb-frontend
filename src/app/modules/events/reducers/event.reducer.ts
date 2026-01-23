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
    case EventActionTypes.VKCodeReceived: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.VKAuthSuccess: {
      return { modal: true, items: action.payload };
    }
    case EventActionTypes.VKAuthFailure: {
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
    default:
      return state;
  }
}
