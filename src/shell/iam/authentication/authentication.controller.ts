import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Body,
  Req,
  Put,
  Get,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ActiveUser, Auth } from 'src/shell/decorators';
import { AuthType } from 'src/shell/enums';
import { CustomValidation } from 'src/shell/pipes';
import {
  cfnSignUp,
  cfnSignIn,
  cfnRefreshTokens,
  cfnChangePassword,
  cfnForgotPassword,
  cfnResetPassword,
  cfnGetConfig,
  cfnLogOut,
  cfnGenerateQrCode,
  cfnGenerateRecoveryCode,
  cfnSignInRecovery,
  cfnGetDevices,
  cfnGetPkceCredentials,
  cfnVerifyTfa,
  cfnGetSession,
  cfnCreateApiKey,
  cfnGetApiKeys,
  cfnRevokeApiKey,
} from './authentication.service';
import {
  SignUpSchema,
  TSignUpSchema,
  SignInSchema,
  TSignInSchema,
  RefreshTokenSchema,
  TRefreshTokenSchema,
  ChangePasswordSchema,
  TChangePasswordSchema,
  ForgotPasswordSchema,
  TForgotPasswordSchema,
  ResetPassSchema,
  TResetPassSchema,
  AccessTokenSchema,
  TAccessTokenSchema,
  TfaSettingSchema,
  TTfaSettingSchema,
  SignInRecoverySchema,
  TSignInRecoverySchema,
  PkceCredentialsSchema,
  TPkceCredentialsSchema,
  VerifyTfaSchema,
  TVerifyTfaSchema,
  SessionApiKeySchema,
  TSessionApiKeySchema,
  RevokeApiKeysSchema,
  TRevokeApiKeysSchema,
} from '../../../core/iam/authentication/schemas';
import { Request } from 'express';
import { IActiveUserData } from 'src/shell/interfaces';

@Auth(AuthType.None)
@ApiBearerAuth()
@ApiTags('Authentication')
@Controller('authentication')
export class AuthenticationController {
  @HttpCode(HttpStatus.OK)
  @Post('sign-up')
  async cfnSignUp(
    @Body(new CustomValidation(SignUpSchema)) sign_up_schema: TSignUpSchema,
  ) {
    return await cfnSignUp(sign_up_schema);
  }

  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  async cfnSignIn(
    @Req() request: Request,
    @Body(new CustomValidation(SignInSchema)) sign_in_schema: TSignInSchema,
  ) {
    const user_agent = request.headers['user-agent'];
    return await cfnSignIn(sign_in_schema, user_agent);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh-tokens')
  async cfnRefreshTokens(
    @Req() request: Request,
    @Body(new CustomValidation(RefreshTokenSchema))
    refresh_token_schema: TRefreshTokenSchema,
  ) {
    const session_id = request.headers?.sessionid?.toString() ?? null;
    const user_agent = request.headers['user-agent'];
    return await cfnRefreshTokens(
      refresh_token_schema.refreshToken,
      session_id,
      user_agent,
    );
  }

  @Auth(AuthType.Bearer)
  @HttpCode(HttpStatus.OK)
  @Put('/change-password')
  async changePassword(
    @ActiveUser() active_user: IActiveUserData,
    @Body(new CustomValidation(ChangePasswordSchema))
    change_password_schema: TChangePasswordSchema,
  ) {
    return await cfnChangePassword(
      active_user.email,
      change_password_schema.password,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(
    @Body(new CustomValidation(ForgotPasswordSchema))
    forgotPasswordSchema: TForgotPasswordSchema,
  ) {
    return await cfnForgotPassword(forgotPasswordSchema.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(
    @Body(new CustomValidation(ResetPassSchema))
    reset_pass_schema: TResetPassSchema,
  ) {
    return await cfnResetPassword(reset_pass_schema);
  }

  @HttpCode(HttpStatus.OK)
  @Get('config')
  async cfnGetConfig() {
    return cfnGetConfig();
  }

  @HttpCode(HttpStatus.OK)
  @Post('/log-out')
  async cfnLogOut(
    @Req() request: Request,
    @Body(new CustomValidation(AccessTokenSchema))
    access_token_schema: TAccessTokenSchema,
  ) {
    const session_id = request.headers?.sessionid?.toString() ?? null;
    return await cfnLogOut(access_token_schema.accessToken, session_id);
  }

  @Auth(AuthType.Bearer)
  @HttpCode(HttpStatus.OK)
  @Post('tfa/setting')
  async cfnGenerateQrCode(
    @ActiveUser() active_user: IActiveUserData,
    @Body(new CustomValidation(TfaSettingSchema))
    tfa_setting_schema: TTfaSettingSchema,
  ) {
    return await cfnGenerateQrCode(active_user.email, tfa_setting_schema.tfa);
  }

  @Auth(AuthType.Bearer)
  @HttpCode(HttpStatus.OK)
  @Post('generate-recovery')
  async cfnGenerateRecoveryCode(@ActiveUser() active_user: IActiveUserData) {
    return await cfnGenerateRecoveryCode(active_user.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('sign-in/recovery')
  async cfnSignInRecovery(
    @Req() request: Request,
    @Body(new CustomValidation(SignInRecoverySchema))
    sign_in_recovery_schema: TSignInRecoverySchema,
  ) {
    const user_agent = request.headers['user-agent'];
    return await cfnSignInRecovery(sign_in_recovery_schema, user_agent);
  }

  @Auth(AuthType.Bearer)
  @HttpCode(HttpStatus.OK)
  @Get('devices')
  async cfnGetDevices(@ActiveUser() active_user: IActiveUserData) {
    return await cfnGetDevices(active_user.sub);
  }

  @HttpCode(HttpStatus.OK)
  @Post('pkce/credentials')
  async cfnGetPkceCredentials(
    @Req() request: Request,
    @Body(new CustomValidation(PkceCredentialsSchema))
    pkceCredentialsSchema: TPkceCredentialsSchema,
  ) {
    const user_agent = request.headers['user-agent'];
    return await cfnGetPkceCredentials(
      pkceCredentialsSchema.code,
      pkceCredentialsSchema.tfaCode,
      user_agent,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('verify-tfa')
  async verifyTfa(
    @Body(new CustomValidation(VerifyTfaSchema))
    verify_tfa_schema: TVerifyTfaSchema,
  ) {
    return await cfnVerifyTfa(
      verify_tfa_schema.email,
      verify_tfa_schema.tfaCode,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('/api-key/session')
  async cfnGetSession(
    @Req() request: Request,
    @Body(new CustomValidation(SessionApiKeySchema))
    session_api_key_schema: TSessionApiKeySchema,
  ) {
    const user_agent = request.headers['user-agent'];
    return await cfnGetSession(session_api_key_schema.apiKey, user_agent);
  }

  @Auth(AuthType.Bearer)
  @HttpCode(HttpStatus.OK)
  @Post('/api-key')
  async cfnCreateApiKey(@ActiveUser() active_user: IActiveUserData) {
    return await cfnCreateApiKey(active_user.email);
  }

  @Auth(AuthType.Bearer)
  @HttpCode(HttpStatus.OK)
  @Get('/api-key')
  async cfnGetApiKeys(@ActiveUser() active_user: IActiveUserData) {
    return await cfnGetApiKeys(active_user.sub);
  }

  @Auth(AuthType.Bearer)
  @HttpCode(HttpStatus.OK)
  @Delete('/api-key/revoke')
  async cfnRevokeApiKey(
    @ActiveUser() active_user: IActiveUserData,
    @Body(new CustomValidation(RevokeApiKeysSchema))
    revoke_api_keys_schema: TRevokeApiKeysSchema,
  ) {
    return await cfnRevokeApiKey(
      active_user.sub,
      revoke_api_keys_schema.apiKeys,
    );
  }
}
