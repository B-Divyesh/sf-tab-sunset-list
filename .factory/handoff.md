# Tab Sunset List — verification handoff

## Verification outcome: **FAIL** (updated 2026-08-28 UTC)

Independent QA re-tested candidate `62523cea1c644bf38c21d72abe0dcb42b7d62eb6`
from a clean checkout and at <https://tab-sunset-list.sociobot.in>. The prior
deployment/TLS failure is fixed: live HTML, assets, legal pages, service worker,
and downloadable extension match the candidate. The local typecheck, unit
tests (5/5), site E2E/Axe tests (4/4), extension E2E/Axe test (1/1), exact
production build, and core review/bookmark/export/close/undo workflows pass.

**The release is still FAIL.** Do not mark it ready until the defects in
`.factory/verification-2.md` are resolved: clearing the ordinary HTTP cache,
then reloading offline, makes the service worker return HTML for uncached hashed
JS/CSS and emits MIME errors. Its cache is fixed at `tab-sunset-list-v1` instead
of being release-versioned. The mobile landing also has sub-44px touch targets;
deployed hashed assets receive only 30-second caching and response policy
hardening is incomplete.

Re-verify after fixes with `npm ci`, `npm run check`, `npm run test:e2e`,
`npm run test:extension`, and `npm run build`, plus a fresh-cache offline reload
and a service-worker upgrade test. See `.factory/verification-2.md` for exact
commands, hashes, response headers, and reproduction evidence.

## Builder handoff (historical; superseded by the verification outcome above)

## Shipped

- WXT + TypeScript Manifest V3 extension for Chrome/Edge.
- Active-tab sunset tagging with date, intent, and optional rationale.
- Hourly due-count badge and `Alt+Shift+S` review shortcut.
- Daily review queue capped at seven, with keyboard shortcuts for keep,
  reschedule, bookmark-and-close, and close.
- Safe close targeting (the live tab URL is rechecked before removal), immediate
  reopen, browser bookmarks, retrievable local outcomes, and Markdown export.
- First-class loading, empty, unavailable-page, and in-context error states.
- Responsive landing page, privacy policy, terms, and versioned offline cache.
- Original generated hero artwork plus hand-authored product mark and icons.

All tab details and notes stay in `chrome.storage.local`. The extension makes no
network calls and the static site includes no analytics or third-party runtime.

## Build and verify

Use Node.js 20+ from a clean checkout:

```sh
npm ci
npm run check
npm run test:e2e
npm run test:extension
```

The exact production command is `npm run build`. It writes the deploy root to
`dist/site` (including `index.html` and the extension ZIP) and the unpacked
extension to `dist/extension`.

Verification on 2026-08-27:

- `npx tsc --noEmit`: passed.
- `npm test`: 5/5 unit tests passed.
- `npm run test:e2e`: 4/4 Chromium tests passed; Axe found no serious or
  critical issues; 390px layout has no horizontal overflow; no console errors.
- `npm run test:extension`: unpacked MV3 extension loaded in Chromium, a seeded
  due tab completed the keep flow, and Axe found no serious or critical issues
  in light, dark, and reduced-motion modes.
- Mobile Lighthouse: performance 100, accessibility 100, best practices 100,
  SEO 100; LCP 1.1 s, total blocking time 0 ms, CLS 0. Values were gathered
  against the production build with Chromium 145.
- Built site payload: 1.8 KB JavaScript, 11.8 KB CSS, 83.1 KB largest hero;
  built extension total: about 34 KB. All are within factory budgets.
- `npm audit --omit=dev`: no production dependencies/vulnerabilities.

## Known limits

- Distribution is a developer-mode ZIP until the factory publishes a browser
  store listing. Firefox packaging is a possible follow-up, not part of v1.
- Reopen restores a URL in a background tab; browsers cannot guarantee recovery
  of scroll position, unsaved forms, media position, or authenticated state.
- Data is intentionally device-local. Cross-browser export/sync is a stated
  future possibility, not present in this release.

## Suggested next steps

Run a four-week pilot and measure median open-tab reduction plus saved-item
retrievability. If the workflow earns repeat use, add Firefox packaging and an
optional import/export bridge without introducing an account requirement.
