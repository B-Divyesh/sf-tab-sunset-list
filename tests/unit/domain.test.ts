import { describe, expect, it } from 'vitest';
import { addDaysInput, dateInputToIso, dueTabs, hostFromUrl, isTrackableUrl, localDateInput, markdownForSaved } from '../../src/lib/domain';
import type { SavedItem, TrackedTab } from '../../src/lib/types';

function tracked(id: string, expiresAt: string): TrackedTab {
  return { id, url: `https://example.com/${id}`, title: id, reason: '', decision: 'review', expiresAt, createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z' };
}

describe('date utilities', () => {
  it('formats a local date for the native date input', () => {
    expect(localDateInput(new Date(2026, 7, 27, 12))).toBe('2026-08-27');
    expect(addDaysInput(3, new Date(2026, 7, 27, 12))).toBe('2026-08-30');
  });

  it('stores an input date at the start of the local day so it is due that day', () => {
    const parsed = new Date(dateInputToIso('2026-08-27'));
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(7);
    expect(parsed.getDate()).toBe(27);
    expect(parsed.getHours()).toBe(0);
  });
});

describe('queue selection', () => {
  it('returns only due items in expiry order', () => {
    const items = [
      tracked('later', '2026-08-29T00:00:00.000Z'),
      tracked('second', '2026-08-27T11:00:00.000Z'),
      tracked('first', '2026-08-26T11:00:00.000Z'),
    ];
    expect(dueTabs(items, new Date('2026-08-27T12:00:00.000Z')).map(({ id }) => id)).toEqual(['first', 'second']);
  });
});

describe('portable outcomes', () => {
  it('exports preserved titles, links and rationale to Markdown', () => {
    const saved: SavedItem[] = [{ id: '1', title: '[Useful] page', url: 'https://example.com', reason: 'For the brief', outcome: 'kept', savedAt: '2026-08-27T10:00:00.000Z' }];
    const markdown = markdownForSaved(saved, new Date(2026, 7, 27));
    expect(markdown).toContain('[Useful page](https://example.com) — kept');
    expect(markdown).toContain('Why: For the brief');
  });
});

describe('browser URLs', () => {
  it('accepts user pages and rejects internal browser pages', () => {
    expect(isTrackableUrl('https://example.com')).toBe(true);
    expect(isTrackableUrl('file:///notes.html')).toBe(true);
    expect(isTrackableUrl('chrome://extensions')).toBe(false);
    expect(hostFromUrl('https://www.example.com/article')).toBe('example.com');
  });
});
