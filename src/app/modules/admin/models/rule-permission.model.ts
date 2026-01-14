import { UserRole } from '@modules/users/models/user';

export interface IRulePermissions {
  canView: UserRole[];
  canEdit: UserRole[];
  canActivate: UserRole[];
  canDelete: UserRole[];
}
