import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { cfnGetUserApiKey } from 'src/repositories';
import { cfnCheckExistRedis } from 'src/shared';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const api_key = request.headers?.apikey;
    const session_id = request.headers?.sessionid;

    if (!api_key || !session_id) {
      throw new UnauthorizedException();
    }

    const user_api_key = await cfnGetUserApiKey({ key: api_key });
    const user = user_api_key.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    const exist_redis = await cfnCheckExistRedis(
      `user-${user.id}-${session_id}`,
    );

    if (exist_redis != 1) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
