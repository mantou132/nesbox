import { resolve } from 'path';

import { defineConfig } from 'vite';

const config = async () => {
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
    },
    server: {
      host: '0.0.0.0',
      port: 3004,
    },
  });
};

export default config;
