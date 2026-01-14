import { EntityScope, ISODateString, JSONValue, UUID } from './common.types';

export enum EventType {
  Clinical = 'Clinical',
  Data = 'Data',
  Schema = 'Schema',
  System = 'System',
  Security = 'Security',
  Operational = 'Operational',
}

export enum ClinicalEventSubtype {
  Admission = 'Admission',
  Discharge = 'Discharge',
  LabResult = 'LabResult',
  MedicationOrder = 'MedicationOrder',
  AllergyUpdate = 'AllergyUpdate',
}

export enum DataEventSubtype {
  Ingest = 'Ingest',
  Update = 'Update',
  Delete = 'Delete',
  LateArrival = 'LateArrival',
}

export interface IEvent {
  id: UUID;
  name: string;
  type: EventType;
  subtype?: string;
  scope: EntityScope;
  sourceId?: UUID; // Data Source / System
  payloadSchemaRef?: string;
  description?: string;
}

export interface IEventInstance {
  eventId: UUID;
  occurredAt: ISODateString;
  entityId?: UUID;
  payload?: JSONValue;
}
