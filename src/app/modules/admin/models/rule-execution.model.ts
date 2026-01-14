import { ISODateString, UUID } from './common.types';

export enum RuleExecutionStatus {
  Success = 'Success',
  Failed = 'Failed',
  PartiallySucceeded = 'PartiallySucceeded',
  Skipped = 'Skipped',
}

export interface IRuleExecution {
  id: UUID;
  ruleId: UUID;
  startedAt: ISODateString;
  completedAt?: ISODateString;
  status: RuleExecutionStatus;
  failureReason?: string;
  affectedEntities?: UUID[];
}
