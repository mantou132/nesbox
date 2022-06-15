import { execSync } from 'child_process';

export const agentFetch = async (url: string) => {
  try {
    return execSync(
      `curl "${url}" -s -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:103.0) Gecko/20100101 Firefox/103.0' -H 'Accept: text/html'`,
      { maxBuffer: 5 * 1024 * 1024 },
    ).toString();
  } catch (err) {
    console.log(url);
    throw err;
  }
};
