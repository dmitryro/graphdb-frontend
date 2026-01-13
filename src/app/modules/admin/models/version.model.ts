import { IUser } from '@modules/users/models';

export type VersionActionType = 'Added' | 'Edited' | 'Removed' | 'Deprecated';
export type VersionScope = 'Field-level' | 'System' | 'Record-level';

export interface IVersionChange {
  action: VersionActionType;
  icon: string; // e.g., 'add_box', 'edit', 'delete'
  description: string; // e.g., "Required Field Missing (v4)"
  scopeChange?: string; // e.g., "Field-level -> System"
  details?: string; // e.g., "Field count: 28 -> 30"
  timestamp: string; // Relative time like "5 days ago"
}

export interface IVersion {
  id: string; // Hex hash like "f8947fd"
  versionTag: string;
  author: IUser; // Link to the user golden record
  mainTimestamp: string; // e.g., "April 22, 2024 11:29 AM"
  relativeTime: string; // e.g., "2 days ago"
  status: 'Deployed' | 'Draft' | 'Archived';
  changes: IVersionChange[];
}

export interface IVersionEvent {
  action: 'Added' | 'Edited' | 'Removed';
  subject: string;
  version: string;
  secondaryAction?: string;
  scopeChange?: string;
  meta?: string;
  type: 'Rule' | 'Mapping' | 'Model' | 'Critical';
  timestamp: string;
  statusIcon?: string; // 'check_circle' or 'info_outline'
  nested?: {
    title: string;
    tag: string;
    time: string;
  };
}

export interface IVersionCommit {
  id: string;
  hash: string;
  author: { name: string; avatar: string };
  relativeTime: string;
  absoluteTime: string;
  events: IVersionEvent[];
}
