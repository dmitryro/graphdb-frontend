import { ConfirmationModalComponent } from './confirmation-modal/confirmation-modal.component';
import { NewMappingModalComponent } from './new-mapping-modal/new-mapping-modal.component';
import { NormalizationModalComponent } from './normalization-modal/normalization-modal.component';
import { RuleModalComponent } from './rule-modal/rule-modal.component';
import { SearchComponent } from './search/search.component';
import { SourceModalComponent } from './source-modal/source-modal.component';
import { VersionHistoryModalComponent } from './version-history-modal/version-history-modal.component';

export const components: any[] = [
  RuleModalComponent,
  NewMappingModalComponent,
  SourceModalComponent,
  NormalizationModalComponent,
  SearchComponent,
  VersionHistoryModalComponent,
  ConfirmationModalComponent,
];

export * from './confirmation-modal/confirmation-modal.component';
export * from './new-mapping-modal/new-mapping-modal.component';
export * from './normalization-modal/normalization-modal.component';
export * from './rule-modal/rule-modal.component';
export * from './search/search.component';
export * from './source-modal/source-modal.component';
export * from './version-history-modal/version-history-modal.component';
