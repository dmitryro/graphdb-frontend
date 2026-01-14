import { IUser } from '@modules/users/models';

export type RuleSeverity = 'Critical' | 'Warning' | 'Info' | 'Low' | 'failing' | 'lo';
export type RuleStatus = 'Enabled' | 'Disabled' | 'Draft' | 'Archived';
export type RuleType = 'Structural' | 'Logical' | 'Constraint' | 'Validation' | 'Identity';

export interface IRuleProvenance {
  author: IUser | { name: string }; // Extended for mock data flexibility
  createdAt: string; // ISO format or Mar 29, 2024 format
  updatedAt: string; // ISO format
  lastExecuted?: string;
  versionTag?: string; // Links to IVersion.versionTag
  effectiveDate?: string;
}

export interface IRuleDefinition {
  logic: string; // The raw query or logic string (e.g., Cypher/SQL)
  description: string;
  threshold: string; // e.g., "> 0" or "≤ 5%"
  scope: string; // e.g., "Patient", "Encounter"
}

export interface IRule {
  id: string;
  name: string;
  type: RuleType;
  severity: RuleSeverity;
  status: RuleStatus;
  definition: IRuleDefinition;
  provenance: IRuleProvenance;
  conflictCount?: number;
}

/**
 * Specifically for the Rules & Conflicts table display
 * ensures alignment with mock data requirements and component logic.
 */
export interface IRuleRecord extends IRule {
  ownerName: string; // Flattened for easy mat-table binding
  created?: string; // Alias for provenance.createdAt
  effectiveDate?: string; // Alias for provenance.effectiveDate
  lastTested?: string; // Alias for provenance.lastExecuted
}
