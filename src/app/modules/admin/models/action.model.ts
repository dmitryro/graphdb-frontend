// src/app/modules/admin/models/action.model.ts

/** * Define UUID as a string type or import from a library.
 * Using string is the standard approach in TypeScript for UUIDs.
 */
export type UUID = string;

/**
 * Execution modes for specific actions
 */
export enum ExecutionMode {
  Sync = 'Sync',
  Async = 'Async',
  Scheduled = 'Scheduled',
}

export enum ActionType {
  CreateTask = 'CreateTask',
  SendSignal = 'SendSignal',
  BlockPipeline = 'BlockPipeline',
  AnnotateRecord = 'AnnotateRecord',
  Escalate = 'Escalate',
  AutoRemediate = 'AutoRemediate',
  AnnotateGraph = 'AnnotateGraph',
  BlockOperation = 'BlockOperation',
  EmitEvent = 'EmitEvent',
  Notify = 'Notify',
  // REMOVED: Duplicate CreateTask
  Snapshot = 'Snapshot',
  Webhook = 'Webhook',
}

/**
 * Single IAction interface.
 * Merged the properties from the two duplicate declarations.
 */
export interface IAction {
  id: UUID;
  name: string;
  type: ActionType;
  executionMode: ExecutionMode;
  description?: string;
  parameters?: Record<string, any>;
  enabled: boolean;
  retryPolicy?: {
    retries: number;
    backoffSeconds: number;
  };
  onFailure?: 'Continue' | 'AbortRule' | 'Escalate';
}
