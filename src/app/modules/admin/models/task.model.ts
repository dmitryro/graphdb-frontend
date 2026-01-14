// src/app/modules/admin/models/task.model.ts

export enum TaskType {
  ClinicalReview = 'ClinicalReview',
  EMPIReview = 'EMPIReview',
  ComplianceReview = 'ComplianceReview',
  DataStewardship = 'DataStewardship',
  ManualResolution = 'ManualResolution',
  HumanReview = 'HumanReview',
  SystemJob = 'SystemJob',
  ExternalWebhook = 'ExternalWebhook',
  DataCorrection = 'DataCorrection',
}

export enum TaskStatus {
  Open = 'Open',
  InProgress = 'InProgress',
  Blocked = 'Blocked',
  Resolved = 'Resolved',
  Dismissed = 'Dismissed',
}

export interface ITask {
  id: UUID;
  type: TaskType;
  status: TaskStatus;
  assignedToRole?: 'ADMIN' | 'COORDINATOR' | 'SYSTEM';

  title: string;
  description?: string;
  slaHours?: number;
  instructions?: string;
  assignedTo?: string;
  createdAt?: string;
  dueAt?: string;

  relatedRuleId?: string;
  relatedSignalId?: string;
}
