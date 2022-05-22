import { ElementOf } from 'duoyun-ui/lib/types';

import { createCacheStore } from 'src/utils';
import { GetGamesQuery } from 'src/generated/graphql';
import { localStorageKeys } from 'src/constants';
import { configure } from 'src/configure';

type Game = ElementOf<GetGamesQuery['games']>;

interface Store {
  games: Record<string, Game | undefined>;
  gameIds?: number[];
}

export const [store] = createCacheStore<Store>(
  localStorageKeys.STORE_LOCAL_STORAGE_KEY,
  {
    games: {},
  },
  {
    prefix: configure.profile!.username,
  },
);
