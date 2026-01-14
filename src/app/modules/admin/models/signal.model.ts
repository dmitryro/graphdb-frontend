// src/app/modules/admin/models/signal.model.ts
import { ISODateString, UUID } from './common.types';

export enum SignalType {
  Anomaly = 'Anomaly',
  Conflict = 'Conflict',
  Violation = 'Violation',
  Insight = 'Insight',
  Metric = 'Metric',
  Prediction = 'Prediction',
  Alert = 'Alert',
  Warning = 'Warning',
  Info = 'Info',
  Critical = 'Critical',
}

export interface ISignal {
  id: string;
  type: SignalType;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  emittedAt?: ISODateString;
  ruleId?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  relatedRuleId?: UUID;
  message: string;
  confidence?: number; // 0..1
  createdAt: ISODateString;

  acknowledged?: boolean;
  acknowledgedBy?: string;
}
