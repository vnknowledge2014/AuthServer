import { TfaStatusEnum } from '@prisma/client';
import * as z from 'zod';

export const TfaSettingSchema = z.object({
  tfa: z.enum([TfaStatusEnum.enable, TfaStatusEnum.disable]),
});

export type TTfaSettingSchema = z.TypeOf<typeof TfaSettingSchema>;
