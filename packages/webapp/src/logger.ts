// 参考 https://www.npmjs.com/package/log4js
export class Logger {
  _type: string;

  constructor(type: string) {
    this._type = type;
  }

  info(...args: any[]) {
    // eslint-disable-next-line no-console
    console.log(`[${this._type}]:`, ...args);
  }

  warn(...args: any[]) {
    // eslint-disable-next-line no-console
    console.warn(`[${this._type}]:`, ...args);
  }

  error(...args: any[]) {
    // eslint-disable-next-line no-console
    console.error(`[${this._type}]:`, ...args);
  }
}

export const logger = new Logger('DEBUG');
