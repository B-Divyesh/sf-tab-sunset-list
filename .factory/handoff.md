# Tab Sunset List — repair 2 handoff

## Outcome

The eight findings from review 1 are repaired. The tested and deployed product
implementation is `9a672cf36a7025b11d96f05c63e819c3ce822807`. Any commit after
that SHA in this handoff sequence changes verification documentation only.

Live site: <https://tab-sunset-list.sociobot.in>

Demo: <https://tab-sunset-list.sociobot.in/demo/>

The extension remains free. There is no paid offer or external billing
dependency, so no billing registration metadata applies.

## What changed

- Added the one-click `/demo/` sandbox with five realistic due tabs, one saved
  item, all four decisions, keyboard controls, undo, live output, Reset demo,
  and Start for real.
- Kept demo state under `demo:tab-sunset-list:v1`. Automated and live checks
  prove that a separate real-data sentinel is not read, changed, or removed.
- Added `.factory/claims.json` with 19 public claims and exactly one tagged,
  outcome-based browser test for each claim.
- Rewrote the first screen and remaining interface headings in plain words.
  It now names the stale-tab job, knowledge-worker audience, sample action, and
  three product facts before scrolling. `.factory/copy-audit.md` records every
  landing-page line and word count.
- Fixed review accessibility. New items receive keyboard focus, decisions and
  navigation update a polite live region, the delete confirmation manages
  focus, and all popup/review interactive targets meet 44×44px.
- Fixed the 390px layout at 200% text size. Desktop and phone checks report no
  horizontal overflow or clipped controls.
- Added an actual designed 404 response, complete route metadata, 1200×630
  social art, an Apple touch icon, consistent Demo navigation, Param Factory
  credit, and version text.
- Added a confirmed Delete local data action. It clears the queue, saved items,
  and undo state without deleting browser bookmarks.
- Expanded README setup, claims, demo, install, test, build, and static deploy
  instructions. Updated the visual thesis with demo, 404, and social-art use.

## Review 1 disposition

| Finding | Disposition and proof |
| --- | --- |
| R1-01 demo missing | Fixed. `/demo/` is populated in one click, visibly labelled, isolated, resettable, and has a Start for real exit. |
| R1-02 claims missing | Fixed. Nineteen current public claims are declared; `npm run test:claims` runs every exact command and passes 19/19. |
| R1-03 unclear copy | Fixed. The first-screen headline is “Decide what to do with stale tabs”; the audience and first action sit beside it. All audited copy is at most 22 words. |
| R1-04 lost focus/live feedback | Fixed. An acted-on item is announced and the replacement heading receives focus; keyboard-only regression passes. |
| R1-05 200% overflow | Fixed. Fresh desktop and 390px live checks report zero horizontal overflow at 200% root text size. |
| R1-06 missing 404 | Fixed. An unknown live path returns HTTP 404 with the styled 404 title, heading, and home action. |
| R1-07 metadata/chrome/docs | Fixed. Every public route has canonical, Open Graph, Twitter, icon, shared header/footer, factory credit, version, and documented deployment steps. |
| R1-08 extension targets | Fixed. Automated popup and populated-review measurements find no visible link or button below 44×44px. |

Earlier TLS/deployment, service-worker shell, versioned-cache, landing target,
immutable-cache, and security-header fixes remain in place. Live HTTP redirects
to HTTPS, the cache is release-versioned, and hardened headers remain active.

## Verification

The documented prerequisite was installed with `npm ci` (265 packages, zero
audit vulnerabilities). The main worktree then passed:

```text
npm test                5/5 passed
npm run test:e2e        13/13 passed
npm run test:extension  16/16 passed
npm run test:claims     19/19 declared claim commands passed
npm run check           passed typecheck, unit tests, and production build
npm run build           produced dist/site, dist/extension, and the ZIP
npm audit --omit=dev    0 vulnerabilities
```

The claim suite was repeated after `npm ci` in a detached clean checkout at
`9a672cf`; all 19 manifest commands passed there as well.

The Playwright Axe integration found no serious or critical issue on the home,
demo, privacy, terms, designed 404, popup, or review page. It also covered dark
mode and reduced motion in the extension. Site reduced motion, focus, keyboard,
mobile, 200% text, touch targets, offline reload, and cache replacement have
dedicated browser checks.

Live Lighthouse 13 produced a complete scored report:

- Performance 100
- Accessibility 100
- Best Practices 100
- SEO 100
- LCP 928ms, TBT 0ms, CLS 0

The CLI emitted its known Chromium tab-crash message after writing the complete
report. The scored JSON is `/work/.evidence/lighthouse-live.json`.

Built budgets: home JavaScript 1.13KB plus shared loading overhead, demo
JavaScript 5.78KB, CSS 18.68KB, largest image 83.09KB, social image 37.73KB,
and extension ZIP 18.67KB.

## Live verification

- Deployment completed successfully through the existing
  `sf-tab-sunset-list` Azure Static Web App in `eastus2`.
- `/`, `/demo/`, `/privacy/`, `/terms/`, the ZIP, and assets return 200 over
  HTTPS. HTTP redirects to HTTPS.
- `/definitely-missing-repair-2` returns HTTP 404 and the designed page.
- Fresh 1440×900 and 390×844 contexts both show the job, audience, sample
  action, and three facts before scrolling.
- Both contexts entered the demo, produced a saved result, kept the demo label
  pinned after scrolling, reset to five tabs, and left the real-data sentinel
  unchanged. They set no cookies and contacted only the product origin.
- Live offline checks reopened home, demo, privacy, and terms from the current
  `tab-sunset-list-4d12a0a40b64` cache and removed a synthetic old cache.
- `verify-url.sh` passed in 630ms with one h1, `lang=en`, a main landmark, image
  alt text, labelled controls, and no console errors.
- Local and live `index.html` SHA-256 are both
  `b01e51c4f2c1f2916436a50996d480881c53280c3c7af1e5750f435a1137c044`.
  Every path and decompressed file in the live ZIP matches the tested build.

Live evidence is under `/work/.evidence/live/`. The catalog description is
copied to `/work/.evidence/catalog-description.txt`.

## Known limits and next steps

- Installation still uses Chromium developer mode until a browser-store
  listing is available.
- Undo restores the URL. Websites may not restore unsaved forms, scroll
  position, media position, or session state.
- No cloud sync is included by design. The researched brief names it as a
  non-goal.

No unresolved release defect remains. A browser-store listing is the only
future distribution dependency.
