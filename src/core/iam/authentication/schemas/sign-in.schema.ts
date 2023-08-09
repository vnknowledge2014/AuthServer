import z from 'zod';
import { SignUpSchema } from '.';

export const SignInSchema = SignUpSchema.extend({
  tfaCode: z.string().optional(),
  rememberMe: z.boolean().optional(),
  recaptchaToken: z.string().optional(),
});

export type TSignInSchema = z.TypeOf<typeof SignInSchema>;
