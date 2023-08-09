import { NotFoundException } from '@nestjs/common';
import { pipe } from 'fp-ts/lib/function';
import {
  match as TE_match,
  chain as TE_chain,
  right as TE_right,
  left as TE_left,
} from 'fp-ts/TaskEither';
import {
  TCreatePolicySchema,
  TUpdatePolicySchema,
} from 'src/core/iam/authorization/schemas';
import {
  cfnTECreatePolicy,
  cfnTEFindOnePolicy,
  cfnTEGetUserPolicies,
  cfnTEUpdatePolicy,
  cfnTEFindOneUser,
  cfnTEFindPolicies,
  cfnTEDeleteUserPolicies,
  cfnTECreateUserPolicy,
} from 'src/repositories';

export async function cfnCreatePolicy(
  user_id: number,
  create_policy_schema: TCreatePolicySchema,
) {
  const { name, statement, startTime, endTime } = create_policy_schema;

  return await pipe(
    cfnTECreatePolicy({
      name,
      statement,
      startTime,
      endTime,
      createdBy: user_id,
    }),
    TE_match(
      (err) => {
        throw err;
      },
      () => null,
    ),
  )();
}

export async function cfnGetPolicy(policyId: number, userId: number) {
  return await pipe(
    cfnTEFindOnePolicy({ id: policyId, createdBy: userId }),
    TE_chain((policy) =>
      policy
        ? TE_right(policy)
        : TE_left(new NotFoundException('Policy is not found')),
    ),
    TE_match(
      (err) => {
        throw err;
      },
      (val) => val,
    ),
  )();
}

export async function cfnUpdatePolicy(
  policy_id: number,
  user_id: number,
  update_policy_schema: TUpdatePolicySchema,
) {
  const { name, statement, startTime, endTime } = update_policy_schema;

  return await pipe(
    cfnTEFindOnePolicy({ id: policy_id, createdBy: user_id }),
    TE_chain((policy) =>
      policy
        ? TE_right(policy)
        : TE_left(new NotFoundException('Policy is not found')),
    ),
    TE_chain(() =>
      cfnTEUpdatePolicy(
        { id: policy_id, createdBy: user_id },
        { name, statement, startTime, endTime },
      ),
    ),
    TE_match(
      (err) => {
        throw err;
      },
      (val) => val,
    ),
  )();
}

export async function cfnGetUserPolicies(user_id: number) {
  return await pipe(
    cfnTEGetUserPolicies({ userId: user_id }),
    TE_match(
      (err) => {
        throw err;
      },
      (val) => val,
    ),
  )();
}

export async function cfnCreateUserPolicies(
  user_id: number,
  policy_ids: number[],
) {
  return await pipe(
    cfnTEFindOneUser({ id: user_id }),
    TE_chain((user) =>
      user
        ? TE_right(null)
        : TE_left(new NotFoundException('User is not found')),
    ),
    TE_chain(() => cfnTEFindPolicies({ id: { in: policy_ids } })),
    TE_chain((policies) =>
      policies.length === policy_ids.length
        ? TE_right(null)
        : TE_left(new NotFoundException('Policy is not found')),
    ),
    TE_chain(() =>
      cfnTEDeleteUserPolicies({
        userId: user_id,
        policyId: { in: policy_ids },
      }),
    ),
    TE_chain(() =>
      TE_right(
        policy_ids.map((item) => {
          return { userId: user_id, policyId: item };
        }),
      ),
    ),
    TE_chain((user_policies) => cfnTECreateUserPolicy(user_policies)),
    TE_match(
      (err) => {
        throw err;
      },
      (val) => val,
    ),
  )();
}
