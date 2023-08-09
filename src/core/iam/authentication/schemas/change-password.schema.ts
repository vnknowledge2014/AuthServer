import { REGEX_CONSTANTS } from 'src/shell/constants';
import * as z from 'zod';

export const ChangePasswordSchema = z.object({
  password: z
    .string()
    .regex(
      REGEX_CONSTANTS.STRONG_PASSWORD,
      'Password need to include a mixture of upper and lower case letters, numbers, and symbols',
    )
    .regex(
      REGEX_CONSTANTS.ENGLISH_STRING,
      'Password need to include a mixture of upper and lower case letters, numbers, and symbols',
    )
    .regex(
      REGEX_CONSTANTS.NO_SPACE_STRING,
      'Password need to include a mixture of upper and lower case letters, numbers',
    ),
});

export type TChangePasswordSchema = z.TypeOf<typeof ChangePasswordSchema>;
