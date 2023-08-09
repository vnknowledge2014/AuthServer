import * as z from 'zod';
import { REGEX_CONSTANTS } from 'src/shell/constants';

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .regex(REGEX_CONSTANTS.EMAIL, 'Invalid email format')
    .regex(REGEX_CONSTANTS.NO_SPACE_STRING, 'Invalid email format')
    .regex(REGEX_CONSTANTS.DOT, 'Invalid email format'),
});

export type TForgotPasswordSchema = z.TypeOf<typeof ForgotPasswordSchema>;
