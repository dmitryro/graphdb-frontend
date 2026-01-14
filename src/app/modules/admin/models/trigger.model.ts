import { UUID } from './common.types';
import { EventType } from './event.model';

export enum TriggerType {
  OnEvent = 'OnEvent',
  Scheduled = 'Scheduled',
  ThresholdBreach = 'ThresholdBreach',
  Manual = 'Manual',
  Composite = 'Composite',
  Immediate = 'Immediate',
  External = 'External',
  TemporalWindow = 'TemporalWindow',
}

export interface ITrigger {
  id: UUID;
  name: string;
  type: TriggerType;
  enabled: boolean;
}

export interface IEventTrigger extends ITrigger {
  type: TriggerType.OnEvent;
  eventTypes: EventType[];
  debounceSeconds?: number;
}

export interface IScheduledTrigger extends ITrigger {
  type: TriggerType.Scheduled;
  cron: string;
  timezone: string;
}

export interface ICompositeTrigger extends ITrigger {
  type: TriggerType.Composite;
  triggerIds: UUID[];
  operator: 'AND' | 'OR';
}
