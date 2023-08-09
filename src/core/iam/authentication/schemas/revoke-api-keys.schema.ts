import * as z from 'zod';

export const RevokeApiKeysSchema = z.object({
  apiKeys: z.array(z.string()),
});

export type TRevokeApiKeysSchema = z.TypeOf<typeof RevokeApiKeysSchema>;
