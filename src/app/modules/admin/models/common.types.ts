export type UUID = string;
export type ISODateString = string;
export type JSONValue = string | number | boolean | null | object | any[];

export type EntityScope =
  | 'Patient'
  | 'Encounter'
  | 'Observation'
  | 'Procedure'
  | 'Medication'
  | 'Claim'
  | 'Document'
  | 'System'
  | 'Dataset';

export type ComparisonOperator =
  | 'EQ'
  | 'NEQ'
  | 'GT'
  | 'GTE'
  | 'LT'
  | 'LTE'
  | 'IN'
  | 'NOT_IN'
  | 'EXISTS'
  | 'NOT_EXISTS'
  | 'MATCHES_REGEX';

export type LogicalOperator = 'AND' | 'OR' | 'NOT';

export type ExecutionMode = 'SYNC' | 'ASYNC' | 'SCHEDULED';
