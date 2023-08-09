import { NestFactory } from '@nestjs/core';
import { cfnSetEnviroments, cfnSetI18nFile, cfnConnectAll } from 'src/shared';
import { AppModule } from './app.module';
import { CustomErrorFilter } from './filters';
import { CustomResponseInterceptor } from './interceptors';
import { cfnSetJwtConfig } from './iam/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await cfnSetEnviroments();
  await cfnConnectAll();
  await cfnSetI18nFile();
  await cfnSetJwtConfig();

  app.useGlobalInterceptors(new CustomResponseInterceptor());
  app.useGlobalFilters(new CustomErrorFilter());

  await app.listen(3000);
}
bootstrap();
