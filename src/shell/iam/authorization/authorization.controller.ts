import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ActiveUser, Auth } from 'src/shell/decorators';
import { AuthType } from 'src/shell/enums';
import { IActiveUserData } from 'src/shell/interfaces';
import { CustomValidation } from 'src/shell/pipes';
import {
  cfnCreatePolicy,
  cfnUpdatePolicy,
  cfnGetPolicy,
  cfnGetUserPolicies,
  cfnCreateUserPolicies,
} from './authorization.service';
import { Roles } from './decorators';
import {
  CreatePolicySchema,
  TCreatePolicySchema,
  UpdatePolicySchema,
  TUpdatePolicySchema,
  UpdateUserPolicySchema,
  TUpdateUserPolicySchema,
} from 'src/core/iam/authorization/schemas';

@Auth(AuthType.Bearer)
@ApiBearerAuth()
@ApiTags('Authorization')
@Controller('authorization')
export class AuthorizationController {
  @HttpCode(HttpStatus.OK)
  @Post('/policies')
  async cfnCreatePolicy(
    @ActiveUser() active_user: IActiveUserData,
    @Body(new CustomValidation(CreatePolicySchema))
    create_policy_schema: TCreatePolicySchema,
  ) {
    return await cfnCreatePolicy(active_user.sub, create_policy_schema);
  }

  @HttpCode(HttpStatus.OK)
  @Roles(Role.admin)
  @Auth(AuthType.Bearer)
  @Get('policies/:policyId')
  async cfnGetPolicies(
    @Param('policyId') policy_id: string,
    @ActiveUser() active_user: IActiveUserData,
  ) {
    return await cfnGetPolicy(+policy_id, active_user.sub);
  }

  @HttpCode(HttpStatus.OK)
  @Roles(Role.admin)
  @Auth(AuthType.Bearer)
  @Put('policies/:policyId')
  async cfnUpdatePolicy(
    @Param('policyId') policy_id: string,
    @ActiveUser() active_user: IActiveUserData,
    @Body(new CustomValidation(UpdatePolicySchema))
    update_policy_schema: TUpdatePolicySchema,
  ) {
    return await cfnUpdatePolicy(
      +policy_id,
      active_user.sub,
      update_policy_schema,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Roles(Role.admin)
  @Auth(AuthType.Bearer)
  @Get('/users/:userId/policies')
  async cfnGetUserPolicies(@ActiveUser() active_user: IActiveUserData) {
    return await cfnGetUserPolicies(active_user.sub);
  }

  @HttpCode(HttpStatus.OK)
  @Roles(Role.admin)
  @Auth(AuthType.Bearer)
  @Post('/users/:userId/policies')
  async cfnCreateUserPolicies(
    @Param('userId') user_id: string,
    @Body(new CustomValidation(UpdateUserPolicySchema))
    update_user_policy_schema: TUpdateUserPolicySchema,
  ) {
    return await cfnCreateUserPolicies(
      +user_id,
      update_user_policy_schema.policyIds,
    );
  }
}
