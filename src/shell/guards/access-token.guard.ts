import { JwtService } from '@nestjs/jwt';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { REQUEST_USER_KEY } from '../constants/iam.constant';
import { jwt_configuration } from '../iam/config/jwt.config';
import { cfnGetRedis } from 'src/shared';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    const sessionId = request.headers?.sessionid;

    if (!token || !sessionId) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        jwt_configuration,
      );

      const getAccessToken = (
        await cfnGetRedis(`user-${payload.sub}-${sessionId}`)
      ).split(';')[1];

      if (getAccessToken != token) throw new UnauthorizedException();

      request[REQUEST_USER_KEY] = payload;
    } catch (error) {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
