import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: '.',
  outDir: '.output',
  publicDir: 'extension-public',
  manifest: {
    name: 'Tab Sunset List',
    description: 'Give tabs a date, then make one deliberate decision when it arrives.',
    version: '1.0.0',
    permissions: ['tabs', 'storage', 'bookmarks', 'alarms'],
    action: {
      default_title: 'Set a sunset for this tab',
    },
    commands: {
      open_review: {
        suggested_key: { default: 'Alt+Shift+S', mac: 'Alt+Shift+S' },
        description: 'Open today’s sunset review',
      },
    },
  },
});
