import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/extension',
  timeout: 30_000,
  workers: 1,
});
