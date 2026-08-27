import { updateBadge } from '../src/lib/store';
import { defineBackground } from 'wxt/utils/define-background';

export default defineBackground(() => {
  const refresh = () => updateBadge().catch(() => undefined);

  chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('sunset-badge', { periodInMinutes: 60 });
    refresh();
  });
  chrome.runtime.onStartup.addListener(refresh);
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'sunset-badge') refresh();
  });
  chrome.storage.onChanged.addListener(refresh);
  chrome.commands.onCommand.addListener((command) => {
    if (command === 'open_review') chrome.tabs.create({ url: chrome.runtime.getURL('/review.html') });
  });
});
