import { IUser } from '@modules/users/models';
import { ISODateString, UUID } from './common.types';

export interface IAuditRecord {
  id: UUID;
  entityType: 'Rule' | 'Action' | 'Trigger';
  entityId: UUID;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'EXECUTE';
  performedBy: IUser | 'SYSTEM';
  timestamp: ISODateString;
  diff?: object;
}
