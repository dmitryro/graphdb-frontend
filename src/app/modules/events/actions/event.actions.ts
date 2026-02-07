import { Action } from '@modules/events/interfaces/action.interface';

export enum EventActionTypes {
  ExecuteCodeSetAction = '[Event] Execute Code Set Action',
  OpenEditCodeSet = '[Event] Open Edit Code Set',
  CloseEditCodeSet = '[Event] Close Edit code Set',
  OpenMapCodeSet = '[Event] Open Map Code Set',
  CloseMapCodeSet = '[Event] Close Map Code Set',
  CodeMappingSaved = '[Event] Code Mapping Saved',
  OpenNewCodeSetValidationRuleModal = '[Event] Open New Code Set Validation Rule Modal',
  CloseNewCodeSetValidationRuleModal = '[Event] Close New Code Set Validation Rule Modal',
  OpenNewCodeSetMappingModal = '[Event] Open New Code Set Mapping Modal',
  CloseNewCodeSetMappingModal = '[Event] Close New Code Set Mapping Modal',
  CodeAddedToSet = '[Event] Code Added To Set',
  OpenAddNewCodeModal = '[Event] Open Add New Code Modal',
  CloseAddNewCodeModal = '[Event] Close Add New Code Modal',
  OpenNewNormalizationRuleModal = '[Event] Open New Normalization Rule Modal',
  CloseNewNormalizationRuleModal = '[Event] Close New Normalization Rule Modal',
  OpenNewRuleModal = '[Event] Open New Rule Modal',
  CloseNewRuleModal = '[Event] Close New RuleModal',
  OpenNewValueSetModal = '[Event] Open New Value Set Modal',
  CloseNewValueSetModal = '[Event] Close New Value Set Modal',
  ConfirmationDeleteConfirmed = '[Event] Confirmation Delete Confirmed',
  ConfirmationSaveConfirmed = '[Event] Confirmation Save Confirmed',
  ConfirmationConfirmConfirmed = '[Event] Confirmation Confirm Confirmed',
  ConfirmationDiscardConfirmed = '[Event] Confirmation Discard Confirmed',
  ConfirmationResetConfirmed = '[Event] Confirmation Reset Confirmed',
  PilotTermsAgreed = '[Event] Pilot Terms Agreed',
  PilotContactFormUpdated = '[Event] Pilot Contact Form Updated',
  ToggleHeader = '[Event] Toggle Header',
  ToggleDrawer = '[Event] Toggle Drawer',
  OpenConfirmationModal = '[Event] Open Confirmation Modal',
  OpenEditCode = '[Event] Open Edit Code',
  CloseEditCode = '[Event] Close Edit Code',
  OpenEditMapping = '[Event] Open Edit Mapping',
  CloseEditMapping = '[Event] Close Edit Mapping',
  OpenCodeSetEditMapping = '[Event] Open Code Set Edit Mapping',
  CloseCodeSetEditMapping = '[Event] Close Code Set Edit Mapping',
  OpenEditCodeSetMapping = '[Event] Open Edit Code Set Mapping',
  CloseEditCodeSetMapping = '[Event] Close Edit Code Set Mapping',
  OpenEditMixedMapping = '[Event] Open Edit Mixed Mapping',
  CloseEditMixedMapping = '[Event] Close Edit Mixed Mapping',
  OpenEditModel = '[Event] Open Edit Model',
  CloseEditModel = '[Event] Close Edit Model',
  OpenEditRule = '[Event] Oppen Edit Rule',
  CloseEditRule = '[Event] Close Edit Rule',
  OpenEditCodeSetRule = '[Event] Open Edit Code Set Rule',
  CloseEditCodeSetRule = '[Event] Close Edit Code Set Rule',
  OpenEditMappingRule = '[Event] Open Edit Mapping Rule',
  CloseEditMappingRule = '[Event] Close Edit Mapping Rule',
  OpenNewModelModal = '[Event] Open New Model Modal',
  CloseNewModelModal = '[Event] Close New Model Modal',
  OpenNewMappingModal = '[Event] Open New Mapping Modal',
  CloseNewMappingModal = '[Event] Close New Mapping Modal',
  ThemeChange = '[Event] Theme Change',
  NonHealthcareUser = '[Event] Non Healthcare User',
  OpenDrawer = '[Event] Open Drawer',
  CloseUsageImpactDrawer = '[Event] Close Usage Impact Drawer',
  OpenUsageImpactDrawer = '[Event] Open Usage Impact Drawer',
  CloseDrawer = '[Event] Close Drawer',
  OpenChat = '[Event] Open Chat',
  CloseChat = '[Event] Close Chat',
  OpenSearch = '[Event] Open Search',
  CloseSearch = '[Event] Close Search',
  OpenRegistrationModal = '[Event] Open Registration',
  CloseRegistrationModal = '[Event] Close Registration',
  InnerMenuItemSelected = '[Event] Inner Menu Item Selected',
  CloseLoginDialog = '[Event] Close Login Dialog',
  TwitterAuthSuccess = '[Event] Twitter Auth Success',
  TwitterAuthFailure = '[Event] Twitter Auth Faiure',
  GoogleAuthSuccess = '[Event] Google Auth Success',
  GoogleAuthFailure = '[Event] Google Auth Faiure',
  MSAuthSuccess = '[Event] MS Auth Success',
  MSAuthFailure = '[Event] MS Auth Faiure',
  TriggerLogout = '[Event] Trigger Logout',
  OpenUserOptionsMenu = '[Event] Open User Options Menu',
  CloseUserOptionsMenu = '[Event] Close User Options Menu',
  SucceededAuthentication = '[Event] Succeeded Authentication',
  FailedAuthentication = '[Event] Failed Authentication',
  SessionRestored = '[Event] Session Restored',
  ShowUserMenu = '[Event] Show User Menu',
  SessionCreated = '[Event] Session Created',
  LogoutUser = '[Event] Logout User',
  SetPickerDate = '[Event] Set Picker Date',
  OpenLoginModal = '[Event] Open Login Modal',
  OpenModal = '[Event] Open modal',
  CloseModal = '[Event] Close modal',
  OpenUserMenu = '[Event] OpenUserMenu',
  CloseUserMenu = '[Event] CloseUserMenu',
  OpenSideMenu = '[Event] OpenSideMenu',
  CloseSideMenu = '[Event] CloseSideMenu',
  OpenMobileMenu = '[Event] OpenMibleMenu',
  CloseMobileMenu = '[Event] CloseMobileMenu',
  UpdateMenuItem = '[Event] UpdateMenuItem',
  OptionSelected = '[Event] OptionSelected',
  RefreshHeader = '[Event] RefreshHeader',
  PageLoaded = '[Event] PageLoaded',
  MobileModeEntered = '[Event] Mobile Mode Entered',
  AddSource = '[Event] Add Source',
  EditSource = '[Event] Edit Source',
  DeleteSource = '[Event] Delete Source',
  InspectSource = '[Event] Inspect Source',
  SyncSource = '[Event] Sync Source',
  PauseIngestion = '[Event] Pause Ingestion',
  DownloadSchema = '[Event] Download Schema',
  ClearSourceCache = '[Event] Clear Source Cache',
  // NEW: Normalization signals for MPI Graph Traceability
  AddNormalizationModel = '[Event] Add Normalization Model',
  AddNormalizationMapping = '[Event] Add Normalization Mapping',
  AddNormalizationVersion = '[Event] Add Normalization Version',
  AddNormalizationRule = '[Event] Add Normalization Rule',
  AddNormalizationCode = '[Event] Add Normalization Code',
  AddRule = '[Event] Add Rule',
  DeleteRule = '[Event] Delete Rule',
  EditRule = '[Event] Edit Rule',
  UpdateBreadcrumb = '[Event] Update Breadcrumb',
  BreadcrumbNavigate = '[Event] Breadcrumb Navigate',
  ViewRelatedModel = '[Event] View Related Model',
}

export class ExecuteCodeSetAction implements Action {
  readonly type = EventActionTypes.ExecuteCodeSetAction;
}

export class CloseEditCodeSet implements Action {
  readonly type = EventActionTypes.CloseEditCodeSet;
}

export class OpenEditCodeSet implements Action {
  readonly type = EventActionTypes.OpenEditCodeSet;
}

export class CodeMappingSaved implements Action {
  readonly type = EventActionTypes.CodeMappingSaved;
  constructor(public payload: any) {}
}

export class OpenMapCodeSet implements Action {
  readonly type = EventActionTypes.OpenMapCodeSet;
  constructor(public payload: any) {}
}

export class CloseMapCodeSet implements Action {
  readonly type = EventActionTypes.CloseMapCodeSet;
  constructor(public payload: any) {}
}

export class OpenNewCodeSetMappingModal implements Action {
  readonly type = EventActionTypes.OpenNewCodeSetMappingModal;
  constructor(public payload: any) {}
}

export class CloseNewCodeSetMappingModal implements Action {
  readonly type = EventActionTypes.CloseNewCodeSetMappingModal;
  constructor(public payload: any) {}
}

export class OpenNewCodeSetValidationRuleModal implements Action {
  readonly type = EventActionTypes.OpenNewCodeSetValidationRuleModal;
  constructor(public payload: any) {}
}

export class CloseNewCodeSetValidationRuleModal implements Action {
  readonly type = EventActionTypes.CloseNewCodeSetValidationRuleModal;
  constructor(public payload: any) {}
}

export class CodeAddedToSet implements Action {
  readonly type = EventActionTypes.CodeAddedToSet;
  constructor(public payload: any) {}
}

export class OpenAddNewCodeModal implements Action {
  readonly type = EventActionTypes.OpenAddNewCodeModal;
  constructor(public payload: any) {}
}

export class CloseAddNewCodeModal implements Action {
  readonly type = EventActionTypes.CloseAddNewCodeModal;
  constructor(public payload: any) {}
}

export class OpenNewNormalizationRuleModal implements Action {
  readonly type = EventActionTypes.OpenNewNormalizationRuleModal;
  constructor(public payload: any) {}
}

export class CloseNewNormalizationRuleModal implements Action {
  readonly type = EventActionTypes.CloseNewNormalizationRuleModal;
  constructor(public payload: any) {}
}

export class OpenNewRuleModal implements Action {
  readonly type = EventActionTypes.OpenNewRuleModal;
  constructor(public payload: any) {}
}

export class CloseNewRuleModal implements Action {
  readonly type = EventActionTypes.CloseNewRuleModal;
  constructor(public payload: any) {}
}

export class OpenNewValueSetModal implements Action {
  readonly type = EventActionTypes.OpenNewValueSetModal;
  constructor(public payload: any) {}
}

export class CloseNewValueSetModal implements Action {
  readonly type = EventActionTypes.CloseNewValueSetModal;
  constructor(public payload: any) {}
}

export class ConfirmationDiscardConfirmed implements Action {
  readonly type = EventActionTypes.ConfirmationDeleteConfirmed;
  constructor(public payload: any) {}
}

export class ConfirmationDeleteConfirmed implements Action {
  readonly type = EventActionTypes.ConfirmationDeleteConfirmed;
  constructor(public payload: any) {}
}

export class ConfirmationSaveConfirmed implements Action {
  readonly type = EventActionTypes.ConfirmationSaveConfirmed;
  constructor(public payload: any) {}
}

export class ConfirmationConfirmConfirmed implements Action {
  readonly type = EventActionTypes.ConfirmationConfirmConfirmed;
  constructor(public payload: any) {}
}

export class ConfirmationResetConfirmed implements Action {
  readonly type = EventActionTypes.ConfirmationResetConfirmed;
  constructor(public payload: any) {}
}

export class OpenConfirmationModal implements Action {
  readonly type = EventActionTypes.OpenConfirmationModal;
  constructor(public payload: any) {}
}

export class OpenUsageImpactDrawer implements Action {
  readonly type = EventActionTypes.OpenUsageImpactDrawer;
  constructor(public payload: any) {}
}

export class ViewRelatedModel implements Action {
  readonly type = EventActionTypes.ViewRelatedModel;
  constructor(public payload: any) {}
}

export class CloseUsageImpactDrawer implements Action {
  readonly type = EventActionTypes.CloseUsageImpactDrawer;
  constructor(public payload: any) {}
}

export class OpenEditCode implements Action {
  readonly type = EventActionTypes.OpenEditCode;
  constructor(public payload: any) {}
}

export class CloseEditCode implements Action {
  readonly type = EventActionTypes.CloseEditCode;
  constructor(public payload: any) {}
}

export class OpenEditMapping implements Action {
  readonly type = EventActionTypes.OpenEditMapping;
  constructor(public payload: any) {}
}

export class CloseEditMapping implements Action {
  readonly type = EventActionTypes.CloseEditMapping;
  constructor(public payload: any) {}
}

export class OpenEditModel implements Action {
  readonly type = EventActionTypes.OpenEditModel;
  constructor(public payload: any) {}
}

export class CloseEditModel implements Action {
  readonly type = EventActionTypes.CloseEditModel;
  constructor(public payload: any) {}
}

export class OpenCodeSetEditMapping implements Action {
  readonly type = EventActionTypes.OpenCodeSetEditMapping;
  constructor(public payload: any) {}
}

export class CloseCodeSetEditMapping implements Action {
  readonly type = EventActionTypes.CloseCodeSetEditMapping;
  constructor(public payload: any) {}
}

export class OpenEditCodeSetMapping implements Action {
  readonly type = EventActionTypes.OpenEditCodeSetMapping;
  constructor(public payload: any) {}
}

export class CloseEditCodeSetMapping implements Action {
  readonly type = EventActionTypes.CloseEditCodeSetMapping;
  constructor(public payload: any) {}
}

export class OpenEditMixedMapping implements Action {
  readonly type = EventActionTypes.OpenEditMixedMapping;
  constructor(public payload: any) {}
}

export class CloseEditMixedMapping implements Action {
  readonly type = EventActionTypes.CloseEditMixedMapping;
  constructor(public payload: any) {}
}

export class OpenEditRule implements Action {
  readonly type = EventActionTypes.OpenEditRule;
  constructor(public payload: any) {}
}

export class CloseEditRule implements Action {
  readonly type = EventActionTypes.CloseEditRule;
  constructor(public payload: any) {}
}

export class OpenEditCodeSetRule implements Action {
  readonly type = EventActionTypes.OpenEditCodeSetRule;
  constructor(public payload: any) {}
}

export class CloseEditCodeSetRule implements Action {
  readonly type = EventActionTypes.CloseEditCodeSetRule;
  constructor(public payload: any) {}
}

export class OpenEditMappingRule implements Action {
  readonly type = EventActionTypes.OpenEditMappingRule;
  constructor(public payload: any) {}
}

export class CloseEditMappingRule implements Action {
  readonly type = EventActionTypes.CloseEditMappingRule;
  constructor(public payload: any) {}
}

export class OpenNewMappingModal implements Action {
  readonly type = EventActionTypes.OpenNewMappingModal;
  constructor(public payload: any) {}
}

export class CloseNewMappingModal implements Action {
  readonly type = EventActionTypes.CloseNewMappingModal;
  constructor(public payload: any) {}
}

export class OpenNewModelModal implements Action {
  readonly type = EventActionTypes.OpenNewModelModal;
  constructor(public payload: any) {}
}

export class CloseNewModelModal implements Action {
  readonly type = EventActionTypes.CloseNewModelModal;
  constructor(public payload: any) {}
}

export class UpdateBreadcrumb implements Action {
  readonly type = EventActionTypes.UpdateBreadcrumb;
  constructor(public payload: any) {}
}

export class BreadcrumbNavigate implements Action {
  readonly type = EventActionTypes.BreadcrumbNavigate;
  constructor(public payload: any) {}
}

export class ThemeChange implements Action {
  readonly type = EventActionTypes.ThemeChange;
  constructor(public payload: any) {}
}

export class AddRule implements Action {
  readonly type = EventActionTypes.AddRule;
  constructor(public payload: any) {}
}

export class DeleteRule implements Action {
  readonly type = EventActionTypes.DeleteRule;
  constructor(public payload: any) {}
}

export class EditRule implements Action {
  readonly type = EventActionTypes.EditRule;
  constructor(public payload: any) {}
}

export class AddNormalizationModel implements Action {
  readonly type = EventActionTypes.AddNormalizationModel;
  constructor(public payload: any) {}
}

export class AddNormalizationMapping implements Action {
  readonly type = EventActionTypes.AddNormalizationMapping;
  constructor(public payload: any) {}
}

export class AddNormalizationRule implements Action {
  readonly type = EventActionTypes.AddNormalizationRule;
  constructor(public payload: any) {}
}

export class AddNormalizationVersion implements Action {
  readonly type = EventActionTypes.AddNormalizationVersion;
  constructor(public payload: any) {}
}

export class AddNormalizationCode implements Action {
  readonly type = EventActionTypes.AddNormalizationCode;
  constructor(public payload: any) {}
}

export class AddSource implements Action {
  readonly type = EventActionTypes.AddSource;
  constructor(public payload: any) {}
}

export class EditSource implements Action {
  readonly type = EventActionTypes.EditSource;
  constructor(public payload: any) {}
}

export class DeleteSource implements Action {
  readonly type = EventActionTypes.DeleteSource;
  constructor(public payload: any) {}
}

export class InspectSource implements Action {
  readonly type = EventActionTypes.InspectSource;
  constructor(public payload: any) {}
}

export class SyncSource implements Action {
  readonly type = EventActionTypes.SyncSource;
  constructor(public payload: any) {}
}

export class PauseIngestion implements Action {
  readonly type = EventActionTypes.PauseIngestion;
  constructor(public payload: any) {}
}

export class DownloadSchema implements Action {
  readonly type = EventActionTypes.DownloadSchema;
  constructor(public payload: any) {}
}

export class ClearSourceCache implements Action {
  readonly type = EventActionTypes.ClearSourceCache;
  constructor(public payload: any) {}
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
  | CloseEditMapping
  | OpenEditMapping
  | CloseEditModel
  | OpenEditModel
  | CloseEditRule
  | OpenCodeSetEditMapping
  | CloseCodeSetEditMapping
  | OpenEditCodeSetMapping
  | CloseEditCodeSetMapping
  | OpenEditMixedMapping
  | CloseEditMixedMapping
  | OpenEditRule
  | OpenEditCodeSetRule
  | CloseEditCodeSetRule
  | OpenEditMappingRule
  | CloseEditMappingRule
  | CloseEditCode
  | OpenEditCode
  | CloseSearch
  | ConfirmationDeleteConfirmed
  | ConfirmationSaveConfirmed
  | ConfirmationConfirmConfirmed
  | ConfirmationDiscardConfirmed
  | ConfirmationResetConfirmed
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
  | ThemeChange
  | UpdateBreadcrumb
  | BreadcrumbNavigate
  | TriggerLogout
  | TwitterAuthSuccess
  | TwitterAuthFailure
  | GoogleAuthSuccess
  | GoogleAuthFailure
  | MSAuthSuccess
  | MSAuthFailure
  | InnerMenuItemSelected
  | CloseLoginDialog
  | AddNormalizationModel
  | AddNormalizationMapping
  | AddNormalizationRule
  | AddNormalizationCode
  | AddNormalizationVersion
  | AddSource
  | EditSource
  | DeleteSource
  | AddRule
  | DeleteRule
  | EditRule
  | InspectSource
  | SyncSource
  | CodeAddedToSet
  | OpenNewRuleModal
  | CloseNewRuleModal
  | OpenNewValueSetModal
  | CloseNewValueSetModal
  | OpenUsageImpactDrawer
  | ViewRelatedModel
  | CloseUsageImpactDrawer
  | PauseIngestion
  | DownloadSchema
  | ExecuteCodeSetAction
  | CloseNewMappingModal
  | OpenNewMappingModal
  | CloseNewNormalizationRuleModal
  | OpenNewNormalizationRuleModal
  | CloseAddNewCodeModal
  | OpenAddNewCodeModal
  | CloseNewModelModal
  | OpenNewModelModal
  | OpenMapCodeSet
  | CloseMapCodeSet
  | OpenEditCodeSet
  | CloseEditCodeSet
  | OpenConfirmationModal
  | OpenNewCodeSetMappingModal
  | CloseNewCodeSetMappingModal
  | OpenNewCodeSetValidationRuleModal
  | CloseNewCodeSetValidationRuleModal
  | CodeMappingSaved
  | ClearSourceCache;
