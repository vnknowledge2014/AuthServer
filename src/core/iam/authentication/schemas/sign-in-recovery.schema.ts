import z from 'zod';
import { SignUpSchema } from '.';

export const SignInRecoverySchema = SignUpSchema.extend({
  recoveryCode: z.number(),
});

export type TSignInRecoverySchema = z.TypeOf<typeof SignInRecoverySchema>;
