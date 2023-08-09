import { Module } from '@nestjs/common';
import { AuthenticationController } from './authentication/authentication.controller';
import { FacebookAuthenticationController } from './authentication/social/facebook-authentication.controller';
import { GithubAuthenticationController } from './authentication/social/github-authentication.controller';
import { GoogleAuthenticationController } from './authentication/social/google-authentication.controller';
import { MicrosoftAuthenticationController } from './authentication/social/microsoft-authentication.controller';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthenticationGuard } from '../guards/authentication.guard';
import { AccessTokenGuard } from '../guards/access-token.guard';
import { JwtModule } from '@nestjs/jwt';
import { PermissionsGuard, RolesGuard } from './authorization/guards';
import { PoliciesInterceptor } from './authorization/guards/policies.guard';
import { AuthorizationController } from './authorization/authorization.controller';
import { ApiKeyGuard } from '../guards/api-key.guard';

@Module({
  imports: [JwtModule.register({ global: true })],
  controllers: [
    MicrosoftAuthenticationController,
    FacebookAuthenticationController,
    GithubAuthenticationController,
    GoogleAuthenticationController,
    AuthenticationController,
    AuthorizationController,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PoliciesInterceptor,
    },
    AccessTokenGuard,
    ApiKeyGuard,
  ],
  exports: [],
})
export class IamModule {}
