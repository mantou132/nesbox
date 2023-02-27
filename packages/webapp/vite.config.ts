import 'dotenv/config';
import { resolve } from 'path';

import { Plugin, ResolvedConfig, defineConfig } from 'vite';

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
    },
    plugins: [VitePluginPrefetchAll()],
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

function VitePluginPrefetchAll(): Plugin {
  let viteConfig: ResolvedConfig;
  return {
    name: 'vite:vite-plugin-prefetch',
    configResolved(config) {
      viteConfig = config;
    },
    transformIndexHtml(html, ctx) {
      if (!ctx.bundle) return html;

      return Object.values(ctx.bundle)
        .map((bundle) => `${viteConfig.server.base ?? ''}/${bundle.fileName}`)
        .map((href) => ({
          tag: 'link',
          attrs: { rel: 'prefetch', href },
          injectTo: 'head',
        }));
    },
  };
}
