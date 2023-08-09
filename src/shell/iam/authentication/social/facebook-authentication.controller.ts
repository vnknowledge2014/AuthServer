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
import { Auth } from 'src/shell/decorators';
import {
  cfnFbAuthenticate,
  cfnHandleFacebookOAuthDialogUrl,
} from './facebook-authentication.service';
import { pfnGetFacebookOAuthDialogUrl } from 'src/core';
import { AuthType } from 'src/shell/enums';
import { CustomValidation } from 'src/shell/pipes';
import {
  FacebookTokenSchema,
  TFacebookTokenSchema,
} from 'src/core/iam/authentication/schemas';

@ApiTags('Social Authentication')
@Auth(AuthType.None)
@Controller('authentication/facebook')
export class FacebookAuthenticationController {
  @HttpCode(HttpStatus.OK)
  @Post()
  async cfnFbAuthenticate(
    @Req() request: Request,
    @Body(new CustomValidation(FacebookTokenSchema))
    facebook_token_schema: TFacebookTokenSchema,
  ) {
    const user_agent = request.headers['user-agent'];
    const { token } = facebook_token_schema;
    const tfa_code = facebook_token_schema.tfaCode;

    return await cfnFbAuthenticate(token, tfa_code, user_agent);
  }

  @HttpCode(HttpStatus.OK)
  @Get('pkce')
  pfnGetFacebookOAuthDialogUrl(@Res() res: Response) {
    return res.redirect(`${pfnGetFacebookOAuthDialogUrl()}`);
  }

  @HttpCode(HttpStatus.OK)
  @Get('pkce/callback')
  async cfnHandleFacebookOAuthDialogUrl(
    @Query() query: any,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    const user_agent = request.headers['user-agent'];
    const redirect_link = await cfnHandleFacebookOAuthDialogUrl(
      query.code,
      user_agent,
    );

    return res.redirect(redirect_link);
  }
}
