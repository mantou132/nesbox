import { logger } from 'src/logger';

export function wakeLock() {
  let wakeLockPromise: Promise<WakeLockSentinel> | null = null;

  const listener = () => {
    if (document.visibilityState === 'visible') {
      wakeLockPromise = navigator.wakeLock?.request('screen');

      // log
      wakeLockPromise?.then((wakeLock) => {
        logger.info('wake lock created!');
        wakeLock.addEventListener('release', () => {
          logger.info('wake lock released!');
        });
      });
    }
  };

  listener();

  // 当页面处于非活动状态时该锁自动失效
  document.addEventListener('visibilitychange', listener);
  return async () => {
    document.removeEventListener('visibilitychange', listener);

    (await wakeLockPromise)?.release();
  };
}
