import * as z from 'zod';

export const UpdateUserPolicySchema = z.object({
  policyIds: z.array(z.number()),
});

export type TUpdateUserPolicySchema = z.TypeOf<typeof UpdateUserPolicySchema>;
