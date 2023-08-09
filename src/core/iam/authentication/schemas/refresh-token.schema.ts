import * as z from 'zod';

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export type TRefreshTokenSchema = z.TypeOf<typeof RefreshTokenSchema>;
