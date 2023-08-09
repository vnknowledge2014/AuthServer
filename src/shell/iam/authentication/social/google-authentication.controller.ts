import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { pfnGetGoogleOAuthDialogUrl } from 'src/core';
import {
  GoogleTokenSchema,
  TGoogleTokenSchema,
} from 'src/core/iam/authentication/schemas';
import { Auth } from 'src/shell/decorators';
import { AuthType } from 'src/shell/enums';
import { CustomValidation } from 'src/shell/pipes';
import {
  cfnGgAuthenticate,
  cfnHandleGoogleOAuthDialogUrl,
} from './google-authentication.service';

@ApiTags('Social Authentication')
@Auth(AuthType.None)
@Controller('authentication/google')
export class GoogleAuthenticationController {
  @HttpCode(HttpStatus.OK)
  @Post()
  async cfnGgAuthenticate(
    @Req() request: Request,
    @Body(new CustomValidation(GoogleTokenSchema))
    googleTokenSchema: TGoogleTokenSchema,
  ) {
    const userAgent = request.headers['user-agent'];
    const { token, tfaCode } = googleTokenSchema;
    return await cfnGgAuthenticate(token, tfaCode, userAgent);
  }

  @HttpCode(HttpStatus.OK)
  @Get('pkce')
  pfnGetGoogleOAuthDialogUrl(@Res() res: Response) {
    return res.redirect(`${pfnGetGoogleOAuthDialogUrl()}`);
  }

  @HttpCode(HttpStatus.OK)
  @Get('pkce/callback')
  async cfnHandleGoogleOAuthDialogUrl(
    @Query() query: any,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    const userAgent = request.headers['user-agent'];
    const redirectLink = await cfnHandleGoogleOAuthDialogUrl(
      query.code,
      userAgent,
    );

    return res.redirect(redirectLink);
  }
}
