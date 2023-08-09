import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Auth } from '../decorators';
import { AuthType } from '../enums';
import { cfnCreateWebhook } from './webhooks.service';
import { Request } from 'express';

@Auth(AuthType.ApiKey)
@ApiBearerAuth()
@ApiTags('Webhook')
@Controller('webhook')
export class WebhookController {
  @HttpCode(HttpStatus.OK)
  @Post()
  async cfnCreateWebhook(@Req() request: Request, @Body() data: any) {
    const api_key = request.headers['apikey'].toString();
    return await cfnCreateWebhook(data, api_key);
  }
}
