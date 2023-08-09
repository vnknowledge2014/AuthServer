import z from 'zod';
import { FacebookTokenSchema } from '.';

export const GoogleTokenSchema = FacebookTokenSchema.extend({});

export type TGoogleTokenSchema = z.TypeOf<typeof GoogleTokenSchema>;
