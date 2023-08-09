import z from 'zod';

export const FacebookTokenSchema = z.object({
  token: z.string(),
  tfaCode: z.string().optional(),
});

export type TFacebookTokenSchema = z.TypeOf<typeof FacebookTokenSchema>;
