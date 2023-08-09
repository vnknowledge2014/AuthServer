import * as z from 'zod';
import { EPermissionAction } from '../constants';

export const UpdatePolicySchema = z.object({
  name: z.string().optional(),
  statement: z
    .object({
      Actions: z.array(
        z.enum([
          EPermissionAction.CREATE,
          EPermissionAction.GET,
          EPermissionAction.UPDATE,
          EPermissionAction.DELETE,
          EPermissionAction.LIST,
          EPermissionAction.MANAGE,
        ]),
      ),
      Resources: z.array(z.string()),
      Conditions: z.any().optional(),
      ResourceConditions: z.any().optional(),
    })
    .optional(),
  startTime: z
    .string()
    .transform((arg) => new Date(arg))
    .nullable()
    .optional(),
  endTime: z
    .string()
    .transform((arg) => new Date(arg))
    .nullable()
    .optional(),
});

export type TUpdatePolicySchema = z.TypeOf<typeof UpdatePolicySchema>;
