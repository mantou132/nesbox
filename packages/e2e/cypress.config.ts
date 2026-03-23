import { defineConfig } from 'cypress';
import dotenvPlugin from 'cypress-dotenv';

export default defineConfig({
  allowCypressEnv: false,

  e2e: {
    baseUrl: 'http://localhost:3003/',
    includeShadowDom: true,
    viewportWidth: 1024,
    viewportHeight: 640,
    setupNodeEvents(_on, config) {
      return dotenvPlugin(config);
    },
  },
});
