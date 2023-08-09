import { Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthType } from './enums';
import { Auth } from './decorators';
import { PermissionsType, Role } from '@prisma/client';
import { Roles, Permissions, Policies } from './iam/authorization/decorators';
import { cfnSetI18nFile } from 'src/shared';
import { EPermissionAction } from 'src/core/iam/authorization/constants';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Auth(AuthType.Bearer)
  @Get('auth')
  getHelloAuth(): string {
    return this.appService.getHello();
  }

  @Roles(Role.admin)
  @Auth(AuthType.Bearer)
  @Get('auth-role')
  getHelloAuthRole(): string {
    return this.appService.getHello();
  }

  @Permissions(PermissionsType.create_coffee)
  @Auth(AuthType.Bearer)
  @Get('auth-permission')
  getHelloAuthPermission(): string {
    return this.appService.getHello();
  }

  @Policies([EPermissionAction.GET, 'user'])
  @Auth(AuthType.Bearer)
  @Get('auth-policy-user/:userId')
  getUserAuthPermission(@Param('userId') user_id: string) {
    return this.appService.getUserTest(+user_id);
  }

  @Policies([EPermissionAction.GET, 'api_key'])
  @Auth(AuthType.Bearer)
  @Get('auth-policy-api-key/:apiKeyId')
  getApiKeyAuthPermission(@Param('apiKeyId') api_key_id: string) {
    return this.appService.getApiKeyTest(+api_key_id);
  }

  @Auth(AuthType.None)
  @Post('sync-i18n')
  async syncI18n() {
    await cfnSetI18nFile();
    return 'Ok';
  }

  @Auth(AuthType.ApiKey, AuthType.Bearer)
  @Get('auth-api-key')
  getHelloAuthApiKey(): string {
    return this.appService.getHello();
  }
}
