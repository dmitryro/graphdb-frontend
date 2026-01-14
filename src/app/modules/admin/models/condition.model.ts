import { ComparisonOperator, EntityScope, JSONValue, LogicalOperator } from './common.types';

export interface ICondition {
  field: string;
  operator: ComparisonOperator;
  value?: JSONValue;
  scope: EntityScope;
}

export interface IConditionGroup {
  operator: LogicalOperator;
  conditions: (ICondition | IConditionGroup)[];
}
