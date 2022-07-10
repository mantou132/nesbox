import 'dotenv/config';
import { resolve } from 'path';

import { defineConfig } from 'vite';

const config = async ({ command }: any) => {
  return defineConfig({
    root: 'src',
    base: '/',
    publicDir: resolve(process.cwd(), 'public'),
    resolve: {
      alias: {
        src: '',
      },
      dedupe: ['@mantou/gem'],
    },
    build: {
      outDir: resolve(process.cwd(), 'dist'),
      emptyOutDir: false,
      sourcemap: true,
      brotliSize: false,
    },
    define: {
      'process.env.RELEASE': JSON.stringify(Date.now()),
      'process.env.COMMAND': JSON.stringify(command),
      'process.env.API_BASE': JSON.stringify(process.env.API_BASE),
    },
    server: {
      host: '0.0.0.0',
      port: 3003,
    },
  });
};

export default config;
