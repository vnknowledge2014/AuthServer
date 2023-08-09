import * as z from 'zod';

export const SessionApiKeySchema = z.object({
  apiKey: z.string(),
});

export type TSessionApiKeySchema = z.TypeOf<typeof SessionApiKeySchema>;
