export const RELEASE = Number(process.env.RELEASE);
// https://vitejs.dev/guide/api-javascript.html#resolveconfig
export const COMMAND = process.env.COMMAND as 'serve' | 'build';

export const paramKeys = {};

export const queryKeys = {
  REDIRECT_URI: 'redirect_uri',
};

// clean outdate cache data
[].forEach((key) => localStorage.removeItem(key));
export const localStorageKeys = {
  CONFIGURE_LOCAL_STORAGE_KEY: 'configure_v1',
  STORE_LOCAL_STORAGE_KEY: 'store_v2',
  ROUTES_LOCAL_STORAGE_KEY: 'routes_v1',
};

export const messageChannels = {
  BROADCAST: 'app_state_channel',
};

export const messageTypes = {
  LOGOUT: 'logout',
  LOGIN: 'login',
};
