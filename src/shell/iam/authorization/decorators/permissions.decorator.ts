import { SetMetadata } from '@nestjs/common';
import { PermissionsType } from '@prisma/client';

export const Permissions = (...permissions: PermissionsType[]) =>
  SetMetadata('permissions', permissions);
