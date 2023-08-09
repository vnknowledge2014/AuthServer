import { Role, PermissionsType } from '@prisma/client';

export interface IActiveUserData {
  sub: number;
  email: string;
  role: Role;
  permissions: PermissionsType[];
  isFirstLogin: boolean;
}
