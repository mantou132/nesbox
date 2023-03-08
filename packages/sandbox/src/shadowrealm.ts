const iframe = document.createElement('iframe');
iframe.hidden = true;
document.body.append(iframe);

// https://github.com/ambit-tsai/shadowrealm-api/blob/6d550297c2/src/helpers.ts
const globalReservedProps = [
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

function genGlobal(context: Record<string, any>, reservedProps: Set<string>) {
  const globalObject = {
    ...Object.getOwnPropertyNames(window).reduce((p, c) => {
      p[c] = reservedProps.has(c) ? window[c as keyof Window] : undefined;
      return p;
    }, {} as Record<string, any>),
    ...context,
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

export default class ShadowRealm {
  #global: ReturnType<typeof genGlobal>;

  constructor(context: Record<string, any> = {}) {
    this.#global = (iframe.contentWindow as unknown as any)
      .Function(`return (${genGlobal.toString()})(...arguments);`)
      .apply(null, [context, new Set(globalReservedProps)]);
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
