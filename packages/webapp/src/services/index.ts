import { randomStr } from '@mantou/gem';
import { SubscriptionClient } from 'subscriptions-transport-ws';

import { errorCodeMap, grapCommonErrorMap, graphqlErrorMap } from 'src/services/error';
import { configure } from 'src/configure';
import { logout, isExpiredProfile } from 'src/auth';
import { i18n } from 'src/i18n/basic';
import { logger } from 'src/logger';

const API_BASE = process.env.API_BASE || '/api';
const ENDPOINT = '/graphql';

interface Res<R> {
  errors?: Error[];
  data: R;
}

const jsonMessageReviver = (_: string, value: any) => (value === null ? undefined : value);

const checkUser = () => {
  const { profile } = configure;
  if (!profile || isExpiredProfile(profile)) {
    logout();
    throw null;
  }
  return profile;
};

export async function request<Result, InputVar>(
  query: string,
  variables: InputVar,
  options: { ignoreError?: boolean; signal?: AbortSignal; skipAuth?: boolean; endpoint?: string } = {},
) {
  if (!options.skipAuth) {
    checkUser();
  }

  // wrap error
  try {
    let res: Response;
    try {
      const endpoint = `${API_BASE}${options.endpoint || ENDPOINT}`;
      const url = `${endpoint}?operationName=${query.match(/(?:query|mutation)\s+(\w*)(\s|\()/)?.[1]}`;
      const headers = new Headers({
        'Content-Type': 'application/json',
        'X-Request-ID': crypto.randomUUID(),
      });
      if (configure.profile) {
        headers.set('Authorization', `Bearer ${configure.profile.token}`);
      }
      res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables: variables || {} }),
        signal: options.signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw null;
      } else {
        logger.error(err);
        // network error or sop/csp error
        throw new Error(i18n.get(errorCodeMap[0]!));
      }
    }

    if (res.status === 0) throw new Error(i18n.get(errorCodeMap[0]!));

    let result: Res<Result>;
    try {
      result = JSON.parse(await res.text(), jsonMessageReviver);
    } catch {
      throw new Error(i18n.get(errorCodeMap[500]!));
    }
    const { errors, data } = result;
    if (errors) {
      throw new AggregateError(
        errors.map((err) => {
          const { message, extensions } = err as Error & { extensions?: { code: number } };
          const i18nMsg = extensions && (graphqlErrorMap[extensions.code] || grapCommonErrorMap[extensions.code]);
          return new Error(i18nMsg ? i18n.get(i18nMsg) : message);
        }),
      );
    }
    if (res.status >= 400) {
      throw new Error(i18n.get(errorCodeMap[res.status] || errorCodeMap[res.status >= 500 ? 500 : 400]!));
    }
    return data;
  } catch (error) {
    throw options.ignoreError ? null : error;
  }
}

export function subscribe<Result, InputVar = Record<string, any>>(
  query: string,
  variables?: InputVar,
): AsyncIterableIterator<Result> {
  const client = new SubscriptionClient(
    `${new URL(API_BASE, location.origin).href.replace(/\/$/, '').replace('http', 'ws')}/subscriptions`,
    {
      reconnect: true,
      reconnectionAttempts: Infinity,
      connectionParams: {
        Authorization: `Bearer ${checkUser().token}`,
      },
    },
  );

  let deferred: {
    resolve: (done: boolean) => void;
    reject: (err: unknown) => void;
  } | null = null;
  const pending: Result[] = [];
  let throwMe: unknown = null,
    done = false;
  const observable = client.request({
    query,
    variables: variables || {},
  });

  const dispose = observable.subscribe({
    next: (msg) => {
      msg.data && pending.push(JSON.parse(JSON.stringify(msg.data), jsonMessageReviver) as Result);
      deferred?.resolve(false);
    },
    error: (err) => {
      throwMe = err;
      deferred?.reject(throwMe);
    },
    complete: () => {
      done = true;
      deferred?.resolve(true);
    },
  });

  return {
    [Symbol.asyncIterator]() {
      return this;
    },
    async next() {
      if (done) return { done: true, value: undefined };
      if (throwMe) throw throwMe;
      if (pending.length) return { value: pending.shift()! };
      return (await new Promise<boolean>((resolve, reject) => (deferred = { resolve, reject })))
        ? { done: true, value: undefined }
        : { value: pending.shift()! };
    },
    async return() {
      dispose.unsubscribe();
      client.close();
      return { done: true, value: undefined };
    },
  };
}
