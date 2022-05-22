import { updateStore } from '@mantou/gem';

import { Event, EventSubscription } from 'src/generated/graphql';
import { store } from 'src/store';
import { subscribe } from 'src/services';

export const subscribeEvent = () => {
  const subscription = subscribe<EventSubscription>(Event);
  (async function () {
    for await (const { event } of subscription) {
      if (event.deleteGame) {
        delete store.games[event.deleteGame];
        updateStore(store, { gameIds: store.gameIds?.filter((id) => id !== event.deleteGame) });
      }
    }
  })();
  return subscription;
};
