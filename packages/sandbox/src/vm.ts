let iframe = document.createElement('iframe');

// https://github.com/ambit-tsai/shadowrealm-api/blob/6d550297c2/src/helpers.ts
const defaultExposeAPIs = [
  // The global properties of ECMAScript 2022
  'globalThis',
  'Infinity',
  'NaN',
  'undefined',
  'eval',
  'isFinite',
  'isNaN',
  'parseFloat',
  'parseInt',
  'decodeURI',
  'decodeURIComponent',
  'encodeURI',
  'encodeURIComponent',
  'AggregateError',
  'Array',
  'ArrayBuffer',
  'Atomics',
  'BigInt',
  'BigInt64Array',
  'BigUint64Array',
  'Boolean',
  'DataView',
  'Date',
  'Error',
  'EvalError',
  'FinalizationRegistry',
  'Float32Array',
  'Float64Array',
  'Function',
  'Int8Array',
  'Int16Array',
  'Int32Array',
  'Map',
  'Number',
  'Object',
  'Promise',
  'Proxy',
  'RangeError',
  'ReferenceError',
  'RegExp',
  'Set',
  'SharedArrayBuffer',
  'String',
  'Symbol',
  'SyntaxError',
  'TypeError',
  'Uint8Array',
  'Uint8ClampedArray',
  'Uint16Array',
  'Uint32Array',
  'URIError',
  'WeakMap',
  'WeakRef',
  'WeakSet',
  'Atomics',
  'JSON',
  'Math',
  'Reflect',

  // Easy to debug
  'console',
];

type GlobalObject = Omit<typeof window, 'globalThis'> & {
  globalThis: GlobalObject;
};

type ExposeAPI = {
  [s: string]: ExposeAPI | boolean;
};

type VMOptions = {
  handleError?: (err: any) => void;
  exposeAPIs?: ExposeAPI;
};

function genGlobal(options: VMOptions = {}, defaultExposeAPIs: Set<string>) {
  addEventListener('error', (err: ErrorEvent) => {
    options.handleError?.(err.error);
  });

  addEventListener('unhandledrejection', ({ reason }: PromiseRejectionEvent) => {
    if (reason) {
      const errors = reason.errors || reason;
      if (Array.isArray(errors)) {
        errors.forEach((err) => options.handleError?.(err));
      } else {
        options.handleError?.(reason.reason || reason);
      }
    }
  });

  const mapProp = (result: Record<string, any> = {}, origin: Record<string, any> = {}, map: ExposeAPI) => {
    for (const [k, v] of Object.entries(map)) {
      if (v === true) {
        if (typeof origin[k] === 'function') {
          result[k] = origin[k].bind(origin);
        } else {
          result[k] = origin[k];
        }
      } else if (v) {
        result[k] = mapProp(result[k], origin[k], v);
      }
    }
    return result;
  };

  const globalObject = {
    ...Object.getOwnPropertyNames(window).reduce((p, c) => {
      const v = options.exposeAPIs?.[c];
      if (defaultExposeAPIs.has(c) || v === true) {
        p[c] = window[c as keyof Window];
      } else if (v) {
        p[c] = mapProp(p[c], window[c as keyof Window], v);
      } else if (Object.getOwnPropertyDescriptor(window, c)?.configurable) {
        delete window[c as keyof Window];
      } else {
        p[c] = undefined;
      }
      return p;
    }, {} as Record<string, any>),
  } as unknown as GlobalObject;

  globalObject.globalThis = globalObject;

  globalObject.Function = function (...args: string[]) {
    const sourceCode = args.pop();
    return new Function(...args, 'with(this){' + sourceCode + '}').bind(globalObject);
  } as any;

  let isInnerCall = false;
  Object.defineProperty(globalObject, 'eval', {
    get() {
      if (isInnerCall) {
        isInnerCall = false;
        return eval;
      }
      return (sourceCode: string) => {
        isInnerCall = true;
        // 用户代码里面的 eval 应该被包装
        // 这里的 eval 应该使用原生 eval
        return new Function('with(this)return eval(arguments[0])').apply(globalObject, [sourceCode]);
      };
    },
  });

  return globalObject;
}

export class VM {
  #global: ReturnType<typeof genGlobal>;

  constructor(options: VMOptions = {}) {
    iframe.remove();
    iframe = document.createElement('iframe');
    iframe.hidden = true;
    document.body.append(iframe);
    this.#global = (iframe.contentWindow as unknown as any)
      .Function(`return (${genGlobal.toString()})(...arguments);`)
      .apply(null, [options, new Set(defaultExposeAPIs)]);
  }

  evaluate(sourceText: string) {
    return this.#global.eval(sourceText);
  }

  async importValue(specifier: string, bindingName: string) {
    const res = await fetch(specifier);
    const text = await res.text();
    return this.evaluate(`${text.replaceAll('export ', '')}; ${bindingName}`);
  }
}
