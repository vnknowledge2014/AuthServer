import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { AuthType } from '../enums';
export const AUTH_TYPE_KEY = 'authType';

export const Auth = (...authType: AuthType[]) => {
  return applyDecorators(
    SetMetadata(AUTH_TYPE_KEY, authType),
    ApiHeader({
      name: 'sessionId',
      description: 'SessionId',
      required: false,
    }),
  );
};
