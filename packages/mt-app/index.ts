const MT_APP_BRIDGE_NAME = Object.getOwnPropertyNames(window).find((e) => e.startsWith('__MT__APP__BRIDGE')) as any;
export const isMtApp = !!MT_APP_BRIDGE_NAME;
// export const isMtApp = true;

type Type = 'open' | 'statusbarstyle' | 'orientation' | 'battery' | 'close' | 'playsound';

const bridgePostMessage = (message: { type: Type; data?: any }) => {
  const submitMessage = { id: Date.now(), ...message };
  window[MT_APP_BRIDGE_NAME]?.postMessage(JSON.stringify(submitMessage));
  return submitMessage;
};

export const mtApp = {
  call<P = any, T = any>(type: Type, data?: P) {
    const { id } = bridgePostMessage({ type, data });
    let resolve = (_: unknown) => {
      //
    };
    let reject = (_: unknown) => {
      //
    };
    const handle = ({ detail }: CustomEvent) => resolve(detail);
    addEventListener(`mtappmessage${id}`, handle, { once: true });
    setTimeout(() => {
      removeEventListener(`mtappmessage${id}`, handle);
      reject(new Error(`mtApp:${type} call timeout`));
    }, 3_000);
    return new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
  },

  async setStatusBarStyle(style: 'none' | 'light' | 'dark') {
    return await this.call('statusbarstyle', style);
  },

  async playSound(kind: 'click' | 'alert') {
    return await this.call('playsound', kind);
  },

  async setOrientation(orientation: 'landscape' | 'portrait' | 'default') {
    return await this.call('orientation', orientation);
  },
};

// https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/236/files
declare global {
  interface Navigator {
    getBattery(): Promise<BatteryManager>;
  }
}

interface BatteryManagerEventTargetEventMap {
  chargingchange: Event;
  chargingtimechange: Event;
  dischargingtimechange: Event;
  levelchange: Event;
}

class BatteryManager extends EventTarget {
  onchargingchange: null | ((this: BatteryManager, ev: Event) => any);
  onlevelchange: null | ((this: BatteryManager, ev: Event) => any);
  onchargingtimechange: null | ((this: BatteryManager, ev: Event) => any);
  ondischargingtimechange: null | ((this: BatteryManager, ev: Event) => any);
  addEventListener<K extends keyof BatteryManagerEventTargetEventMap>(
    type: K,
    listener: (this: BatteryManager, ev: BatteryManagerEventTargetEventMap[K]) => any,
    useCapture?: boolean,
  ): void {
    super.addEventListener(type, listener, useCapture);
  }

  readonly charging = false;
  readonly chargingTime = Infinity;
  readonly dischargingTime = Infinity;
  readonly level = 0;

  constructor() {
    super();
    setInterval(async () => {
      const { level, charging } = await mtApp.call('battery');
      if (charging !== this.charging) {
        const event = new CustomEvent('chargingchange');
        this.dispatchEvent(event);
        this.onchargingchange?.(event);
      }
      if (level !== this.level) {
        const event = new CustomEvent('levelchange');
        this.dispatchEvent(event);
        this.onchargingchange?.(event);
      }
      Object.assign(this, { level, charging });
    }, 15000);
  }
}

if (MT_APP_BRIDGE_NAME && window === window.top) {
  if (!navigator.getBattery) {
    let batteryManager: null | BatteryManager = null;
    navigator.getBattery = async () => {
      if (!batteryManager) {
        batteryManager = new BatteryManager();
        Object.assign(batteryManager, await mtApp.call('battery'));
      }
      return batteryManager;
    };
  }

  window.open = (url, _target, _) => {
    bridgePostMessage({ type: 'open', data: url });
    return window;
  };

  window.close = () => {
    bridgePostMessage({ type: 'close' });
  };

  Object.defineProperty(navigator, 'standalone', {
    value: true,
  });

  Object.defineProperty(window, 'mtApp', {
    value: mtApp,
  });

  const data = MT_APP_BRIDGE_NAME.split('____')[1];
  if (data) {
    const { notch } = JSON.parse(window.atob(data));

    // init notch area
    if (notch) {
      const styleEle = document.createElement('style');
      styleEle.innerText = `
        :root {
          --mt-app-safe-area-inset-top: ${notch.top}px;
          --mt-app-safe-area-inset-left: ${notch.left}px;
          --mt-app-safe-area-inset-right: ${notch.right}px;
          --mt-app-safe-area-inset-bottom: ${notch.bottom}px;
        }
      `;
      document.head.append(styleEle);
    }
  }
}
