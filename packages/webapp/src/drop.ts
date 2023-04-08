import { history } from '@mantou/gem';
import { createPath } from 'duoyun-ui/elements/route';
import { routes } from 'src/routes';

import { isValidGameFile, matchRoute } from 'src/utils/common';
import { setNesFile } from 'src/configure';

window.launchQueue?.setConsumer(async (launchParams: any) => {
  if (!launchParams.files.length) return;

  // https://github.com/WICG/file-system-access/blob/master/EXPLAINER.md#example-code
  const files = await Promise.all(launchParams.files.map((h: any) => h.getFile()));
  dropHandler(files);
});

export const dropHandler = (files: File[]) => {
  if (!matchRoute(routes.emulator)) {
    history.replace({ path: createPath(routes.emulator) });
  }
  setNesFile(files.find((e) => isValidGameFile(e.name)));
};
