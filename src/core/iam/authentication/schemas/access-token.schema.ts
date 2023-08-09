import * as z from 'zod';

export const AccessTokenSchema = z.object({
  accessToken: z.string(),
});

export type TAccessTokenSchema = z.TypeOf<typeof AccessTokenSchema>;
