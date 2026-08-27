import type { SavedItem, TrackedTab } from './types';

export function localDateInput(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateInputToIso(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toISOString();
}

export function addDaysInput(days: number, from = new Date()): string {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return localDateInput(next);
}

export function dueTabs(items: TrackedTab[], now = new Date()): TrackedTab[] {
  const time = now.getTime();
  return items
    .filter((item) => new Date(item.expiresAt).getTime() <= time)
    .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt) || a.createdAt.localeCompare(b.createdAt));
}

export function markdownForSaved(items: SavedItem[], exportedAt = new Date()): string {
  const lines = [
    '# Tab Sunset List',
    '',
    `Exported ${localDateInput(exportedAt)} · ${items.length} saved ${items.length === 1 ? 'item' : 'items'}`,
    '',
  ];

  for (const item of [...items].sort((a, b) => b.savedAt.localeCompare(a.savedAt))) {
    const safeTitle = item.title.replace(/[\[\]]/g, '').trim() || item.url;
    lines.push(`- [${safeTitle}](${item.url}) — ${item.outcome}`);
    if (item.reason.trim()) lines.push(`  - Why: ${item.reason.trim()}`);
  }

  if (!items.length) lines.push('_No kept items yet._');
  lines.push('');
  return lines.join('\n');
}

export function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '') || 'Local page';
  } catch {
    return 'Browser page';
  }
}

export function isTrackableUrl(url?: string): url is string {
  if (!url) return false;
  return /^(https?|file):/.test(url);
}
