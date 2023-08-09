import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { pfnGetMicrosoftAuthUrl } from 'src/core';
import { Auth } from 'src/shell/decorators';
import { AuthType } from 'src/shell/enums';
import { cfnHandleMicrosoftCallback } from './microsoft-authentication.service';

@ApiTags('Social Authentication')
@Auth(AuthType.None)
@Controller('authentication/microsoft')
export class MicrosoftAuthenticationController {
  @HttpCode(HttpStatus.OK)
  @Get('pkce')
  pfnGetMicrosoftOAuthDialogUrl(@Res() res: Response) {
    return res.redirect(`${pfnGetMicrosoftAuthUrl()}`);
  }

  @HttpCode(HttpStatus.OK)
  @Get('pkce/callback')
  async cfnHandleMicrosoftOAuthDialogUrl(
    @Query() query: any,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    const redirect_link = await cfnHandleMicrosoftCallback(
      query.code,
      request.headers['user-agent'],
    );
    return res.redirect(redirect_link);
  }
}
