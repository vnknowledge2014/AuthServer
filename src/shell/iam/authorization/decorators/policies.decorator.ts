import { SetMetadata } from '@nestjs/common';
import { EPermissionAction } from 'src/core/iam/authorization/constants';

export type TPermissionResource = any;

export type RequiredPermission = [EPermissionAction, TPermissionResource];

export const Policies = (...policies: RequiredPermission[]) =>
  SetMetadata('policies', policies);
