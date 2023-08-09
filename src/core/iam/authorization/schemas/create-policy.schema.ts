import * as z from 'zod';
import { EPermissionAction } from '../constants';

export const CreatePolicySchema = z.object({
  name: z.string(),
  statement: z.object({
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
  }),
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

export type TCreatePolicySchema = z.TypeOf<typeof CreatePolicySchema>;
