import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_USER_KEY } from '../constants/iam.constant';
import { IActiveUserData } from '../interfaces';
// import { REQUEST_USER_KEY } from './../iam.constants';

export const ActiveUser = createParamDecorator(
  (field: keyof IActiveUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: IActiveUserData | undefined = request[REQUEST_USER_KEY];

    return field ? user?.[field] : user;
  },
);
