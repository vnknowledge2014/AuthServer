import {
  Injectable,
  ExecutionContext,
  NestInterceptor,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { prisma_client } from 'src/shared';
import {
  AbilityBuilder,
  ConditionsMatcher,
  createMongoAbility,
  PureAbility,
  subject,
} from '@casl/ability';
import { PrismaQuery, Subjects } from '@casl/prisma';
import { policy as policyModel, user as UserModel } from '@prisma/client';
import {
  $in,
  within,
  $eq,
  eq,
  $lte,
  lte,
  $and,
  and,
  createFactory,
} from '@ucast/mongo2js';
import { map, Observable } from 'rxjs';

type AppAbility = PureAbility<
  [string, Subjects<{ user: UserModel; otherModel: any }>],
  PrismaQuery
>;

const conditions_matcher: ConditionsMatcher<any> = createFactory(
  { $in, $eq, $lte, $and },
  { in: within, eq, lte, and },
);

@Injectable()
export class PoliciesInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const required_policies = this.reflector.getAllAndOverride<string[]>(
      'policies',
      [context.getHandler(), context.getClass()],
    );

    if (!required_policies) {
      return next.handle();
    }

    const response_resource = required_policies[0][1];

    const { user } = context.switchToHttp().getRequest();

    const policy_ids = (
      await prisma_client.user_policy.findMany({
        where: { userId: user.sub },
        select: { policyId: true },
      })
    ).map((item) => item.policyId);

    const user_policies = (
      await prisma_client.policy.findMany({ where: { id: { in: policy_ids } } })
    )
      .filter((item) => isActiveEvent(item))
      .map((item) => item.statement);

    const { request_ability, response_ability } = defineAbilityFor(
      user_policies,
      response_resource,
    );

    const is_request_pass = required_policies.some((value) =>
      request_ability.can(value[0], subject(value[1], { ...user })),
    );

    if (is_request_pass) {
      return next
        .handle()
        .pipe(
          map((data) =>
            response_ability
              ? processDataWithPolicies(
                  data,
                  response_ability,
                  required_policies,
                )
              : data,
          ),
        );
    }

    throw new ForbiddenException('Forbidden resources');
  }
}

function defineAbilityFor(user_policies: any[], response_resource: string) {
  const request_ability = new AbilityBuilder<AppAbility>(createMongoAbility);
  const response_ability = new AbilityBuilder<AppAbility>(createMongoAbility);

  user_policies.map((p) => {
    request_ability.can(p['Actions'], p['Resources'], p['Conditions']);

    if (p['ResourceConditions']) {
      const value = p['ResourceConditions'][response_resource];
      response_ability.can(p['Actions'], response_resource, value);
    }
  });

  return {
    request_ability: request_ability.build({
      conditionsMatcher: conditions_matcher,
    }),
    response_ability:
      response_ability.rules.length > 0
        ? response_ability.build({ conditionsMatcher: conditions_matcher })
        : null,
  };
}

function processDataWithPolicies(
  input: any,
  response_ability: AppAbility,
  required_policies: string[],
) {
  const { data } = input;

  const checked_data = Array.isArray(data) ? data : [data];

  checked_data.map((item: any) => {
    if (item) {
      const is_data_pass = required_policies.some((value) =>
        response_ability.can(value[0], subject(value[1], { ...item })),
      );

      if (!is_data_pass) {
        throw new ForbiddenException('Forbidden resources');
      }
    }
  });

  return input;
}

function isActiveEvent(item: policyModel, currentTime = new Date()) {
  const is_active =
    (!item.startTime ||
      new Date(item.startTime).getTime() <= currentTime.getTime()) &&
    (!item.endTime || new Date(item.endTime).getTime() > currentTime.getTime());

  return is_active;
}
