import { REGEX_CONSTANTS } from 'src/shell/constants';
import z from 'zod';

export const SignUpSchema = z.object({
  email: z
    .string()
    .regex(REGEX_CONSTANTS.EMAIL, 'Invalid email format')
    .regex(REGEX_CONSTANTS.NO_SPACE_STRING, 'Invalid email format')
    .regex(REGEX_CONSTANTS.DOT, 'Invalid email format'),
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

export type TSignUpSchema = z.TypeOf<typeof SignUpSchema>;
