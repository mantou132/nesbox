// https://stackoverflow.com/a/71499332/7167456
// https://bugzilla.mozilla.org/show_bug.cgi?id=1247687

import { events } from 'src/constants';

const portSet = new Set<MessagePort>();

self.addEventListener('connect', (e: MessageEvent) => {
  const port = e.ports[0];
  portSet.add(port);

  port.addEventListener('message', (e) => {
    portSet.forEach((p) => {
      if (p !== port) {
        console.log(e.data);
        p.postMessage(e.data);
      }
    });
  });

  port.start();
});
