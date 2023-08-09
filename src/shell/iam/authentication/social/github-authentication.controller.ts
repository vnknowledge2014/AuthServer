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
import { pfnGetGithubOAuthDialogUrl } from 'src/core';
import { Auth } from 'src/shell/decorators';
import { AuthType } from 'src/shell/enums';
import { cfnHandleGithubOAuthDialogUrl } from './github-authentication.service';

@ApiTags('Social Authentication')
@Auth(AuthType.None)
@Controller('authentication/github')
export class GithubAuthenticationController {
  @HttpCode(HttpStatus.OK)
  @Get('pkce')
  pfnGetGithubOAuthDialogUrl(@Res() res: Response) {
    return res.redirect(`${pfnGetGithubOAuthDialogUrl()}`);
  }

  @HttpCode(HttpStatus.OK)
  @Get('pkce/callback')
  async cfnHandleGithubOAuthDialogUrl(
    @Query() query: any,
    @Req() request: Request,
    @Res() res: Response,
  ) {
    const user_agent = request.headers['user-agent'];
    const redirect_link = await cfnHandleGithubOAuthDialogUrl(
      query.code,
      user_agent,
    );
    return res.redirect(redirect_link);
  }
}
