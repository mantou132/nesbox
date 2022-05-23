import 'dotenv/config';
import { resolve } from 'path';

import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
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
      emptyOutDir: true,
      sourcemap: true,
      brotliSize: false,
    },
    define: {
      'process.env.RELEASE': JSON.stringify(Date.now()),
      'process.env.COMMAND': JSON.stringify(command),
      'process.env.API_BASE': JSON.stringify(process.env.API_BASE),
    },
    plugins: [wasm({}), topLevelAwait()],
    server: {
      host: true,
      port: 3003,
      proxy: {
        '/api/subscriptions': {
          target: `http://localhost:8080`,
          changeOrigin: true,
          ws: true,
        },
        '/api': {
          target: `http://localhost:8080`,
          changeOrigin: true,
        },
      },
    },
  });
};

export default config;
