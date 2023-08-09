import { Module } from '@nestjs/common';
import { WebhookController } from './webhooks.controller';

@Module({
  imports: [],
  controllers: [WebhookController],
  providers: [],
  exports: [],
})
export class WebhooksModule {}
