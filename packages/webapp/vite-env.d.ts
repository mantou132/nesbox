/// <reference types="vite/client" />

import type * as app from '@tauri-apps/api/app';
import type * as os from '@tauri-apps/api/os';
import type * as window from '@tauri-apps/api/window';

declare global {
  interface Window {
    __TAURI__?: {
      app: typeof app;
      os: typeof os;
      window: typeof window;
    };
  }
}
