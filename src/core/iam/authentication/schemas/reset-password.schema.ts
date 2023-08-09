import * as z from 'zod';
import { REGEX_CONSTANTS } from 'src/shell/constants';

export const ResetPassSchema = z.object({
  token: z.string(),
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

export type TResetPassSchema = z.TypeOf<typeof ResetPassSchema>;
