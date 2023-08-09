import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TSignInSchema } from 'src/core/iam/authentication/schemas';
import { cfnFindOneUser, cfnGetUserApiKey } from 'src/repositories';
import { pfnCompare, prisma_client } from 'src/shared';

const jwtService = new JwtService();

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

  async hasuraLogin(sign_in_schema: TSignInSchema) {
    const { email, password } = sign_in_schema;

    const user = await prisma_client.user.findFirst({
      where: { email },
    });

    const is_equal = await pfnCompare(password, user.password);

    if (!is_equal) {
      throw new BadRequestException('Incorrect password');
    }

    const hasuraToken = await jwtService.signAsync(
      {
        'https://hasura.io/jwt/claims': {
          'x-hasura-default-role': 'user',
          'x-hasura-allowed-roles': ['user'],
          'x-hasura-user-id': `${user.id}`,
        },
        sub: `${user.id}`,
        aud: ['https://fast-sole-54.hasura.app/v1/graphql'],
      },
      {
        algorithm: 'HS256',
        secret: '5d3b987ef76c4c30b914a2d45e0e9a7f',
        expiresIn: '3h',
      },
    );

    return hasuraToken;
  }
}
