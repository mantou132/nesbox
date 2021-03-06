import { LocaleKey } from 'src/i18n';

export const errorCodeMap: Record<string, LocaleKey | undefined> = {
  0: 'code0',
  400: 'code400',
  401: 'code401',
  403: 'code403',
  404: 'code404',
  409: 'code409',
  500: 'code500',
  501: 'code501',
  504: 'code504',
};

// https://github.com/grpc/grpc/blob/master/doc/statuscodes.md
export const grapCommonErrorMap: Record<string, LocaleKey | undefined> = {
  2: errorCodeMap[500],
  3: errorCodeMap[400],
  4: errorCodeMap[504],
  5: errorCodeMap[404],
  6: errorCodeMap[409],
  7: errorCodeMap[403],
  8: errorCodeMap[403],
  9: errorCodeMap[500],
  10: errorCodeMap[500],
  11: errorCodeMap[500],
  12: errorCodeMap[501],
  13: errorCodeMap[500],
  14: errorCodeMap[500],
  15: errorCodeMap[500],
  16: errorCodeMap[401],
};

export const graphqlErrorMap: Record<string, LocaleKey | undefined> = {
  400000: errorCodeMap[400],
  403000: errorCodeMap[403],
  500000: errorCodeMap[500],

  404001: 'code404001',
  404002: 'code404002',
};
