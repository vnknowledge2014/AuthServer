import { Injectable } from '@nestjs/common';
import { cfnFindOneUser, cfnGetUserApiKey } from 'src/repositories';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async getUserTest(user_id: number) {
    return cfnFindOneUser({ id: user_id });
  }

  async getApiKeyTest(api_key_id: number) {
    return cfnGetUserApiKey({ id: api_key_id });
  }
}
