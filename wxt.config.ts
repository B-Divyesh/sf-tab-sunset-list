import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: '.',
  outDir: '.output',
  publicDir: 'extension-public',
  manifest: {
    name: 'Tab Sunset List',
    description: 'Set review dates for stale tabs, then keep, reschedule, bookmark, or close them.',
    version: '1.1.0',
    permissions: ['tabs', 'storage', 'bookmarks', 'alarms'],
    action: {
      default_title: 'Set a review date for this tab',
    },
    commands: {
      open_review: {
        suggested_key: { default: 'Alt+Shift+S', mac: 'Alt+Shift+S' },
        description: 'Open the due-tab review',
      },
    },
  },
});
