import * as z from 'zod';

export const PkceCredentialsSchema = z.object({
  code: z.string(),
  tfaCode: z.string().optional(),
});

export type TPkceCredentialsSchema = z.TypeOf<typeof PkceCredentialsSchema>;
