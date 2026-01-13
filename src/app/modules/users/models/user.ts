/**
 * Role Model Enum
 * Defines the access levels for the MPI platform.
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  COORDINATOR = 'COORDINATOR',
  VIEWER = 'VIEWER',
  SYSTEM = 'SYSTEM',
  GUEST = 'GUEST',
}

/**
 * User Model Interface
 * Represents a user within the MPI ecosystem.
 */
export interface IUser {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatar: string;
  password?: string; // Optional depending on whether it's for create or display
  date_registered: Date;
  date_updated: Date;
  role: UserRole;
}
