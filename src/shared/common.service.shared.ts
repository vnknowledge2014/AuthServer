import { BadRequestException } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import qs from 'querystring';
import { randomUUID } from 'crypto';
import { cfnInsertRedis } from './redis.shared';
import { ERedisPrefix } from './type.shared';
import { pfnEncrypt } from '.';

export async function cfnExecutePost(url: string) {
  const data = await axios
    .post(url, null, {
      headers: {
        Accept: 'application/json',
      },
    })
    .then((response) => {
      return response.data;
    });

  return data;
}

export async function cfnExecutePostData(url: string, data_post: any) {
  const data = await axios
    .post(url, qs.stringify(data_post), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    .then((response) => {
      return response.data;
    });

  return data;
}

export async function cfnPostRequest(
  url: string,
  body?: any,
  config?: AxiosRequestConfig<any>,
) {
  const data = await axios.post(url, body, config).then((response) => {
    return response.data;
  });
  return data;
}

export async function cfnFetchData(
  url: string,
  config?: AxiosRequestConfig<any>,
) {
  const data = await axios.get(url, config).then((response) => response.data);

  if (data.error) {
    throw new BadRequestException(data.error);
  }

  return data;
}

export function cfnGenRandomKey() {
  return randomUUID().split('-').join('');
}

export async function cfnGenSocialRandomKey(userCredentials: string) {
  const randomKey = randomUUID().split('-').join('');

  const encryptCredentials = pfnEncrypt(userCredentials);

  await cfnInsertRedis(
    `${ERedisPrefix.USER_CREDENTIALS}-${randomKey}`,
    encryptCredentials,
    +process.env.CREDENTIALS_CODE_TTL,
  );

  return randomKey;
}
