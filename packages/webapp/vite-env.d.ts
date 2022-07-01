/// <reference types="vite/client" />

import type * as window from '@tauri-apps/api/window';
import type * as shell from '@tauri-apps/api/shell';
import type * as tauri from '@tauri-apps/api/tauri';

declare global {
  interface Window {
    __TAURI__?: {
      window: typeof window;
      shell: typeof shell;
      tauri: typeof tauri;
    };
    launchQueue?: any;
  }

  interface Navigator {
    // https://w3c.github.io/badging
    setAppBadge?: (badge?: number) => void;
  }
}
