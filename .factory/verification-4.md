# Verification 4 — Decide what to do with stale tabs

**Work order:** `tab-sunset-list-verify-4`  
**Date:** 2026-09-06 UTC  
**Live URL:** <https://tab-sunset-list.sociobot.in>  
**Implementation reviewed:** `9a672cf36a7025b11d96f05c63e819c3ce822807`  
**Documentation baseline:** `f3d19eb1d4bc874fa7887d6cd6ba55739bfa930b`  
**Scope:** independent QA. No product code was modified.

## Verdict: PASS

**PASS — zero findings and zero untested claims.** There are no blocker,
critical, high, medium, or low findings. All 19 declared public claims passed
from a clean detached checkout, and the live files match the tested build.

## Job, audience, and first action

- **Job:** decide what to do with stale tabs.
- **Audience:** knowledge workers whose useful browser tabs become an
  unreviewed pile.
- **First action:** “Try it with sample data.”

Fresh 1440×900 desktop and 390×844 phone contexts showed all three before any
scrolling, alongside the three product facts. The first action was completely
inside both viewports.

## Live sample result

The first action opened `/demo/` in one click. Both fresh contexts showed five
realistic tabs: a service-worker guide, train options, a CSS reference, a
research paper, and a monitor-arm comparison. One realistic saved decision was
already present.

Keyboard-only review moved with Right Arrow and chose Keep with `K`. The page
announced the result and focused the next item heading. Keep, reschedule,
bookmark, close, and undo produced three saved items, one rescheduled tab, and
two remaining queue items. The label “Demo — sample data, nothing is saved”
remained visible after scrolling.

Reset restored five queue items and one saved item. Start for real deleted
`demo:tab-sunset-list:v1` and returned to the install section. A separate
`tab-sunset-list:real` sentinel remained unchanged throughout on desktop and
phone. The contexts set no cookies, contacted only the product origin, and
reported no console or page errors.

Evidence: `/work/.evidence/verification-4/live-demo-manual.json`, the four
`live-*-first-screen.png` and `live-*-demo-output.png` screenshots, and
`live-browser-check.json`.

## Declared claims

Every exact command in `.factory/claims.json` ran from a detached clean checkout
at the documentation baseline after `npm ci`.

| Claim | Result | Observable evidence |
| --- | --- | --- |
| `one-click-demo` | PASS | One action opened five sample tabs and saved output. |
| `demo-isolation-reset` | PASS | Reset restored the seed; exit cleared only demo storage. |
| `free-no-account` | PASS | A decision and ZIP download completed without sign-in or checkout. |
| `site-private` | PASS | Full sample flow had no cookies or cross-origin requests. |
| `offline-site` | PASS | Home, demo, privacy, and terms reopened offline. |
| `chromium-load` | PASS | Production MV3 build loaded in a fresh Chromium profile. |
| `tag-tab` | PASS | Date, intent, and note persisted for the active tab. |
| `due-badge` | PASS | Two due items produced badge and popup count 2. |
| `seven-item-queue` | PASS | Eight due items produced a seven-item daily queue. |
| `keyboard-review` | PASS | Arrows and K/S/B/C operated review with focus and announcement. |
| `keep-rationale` | PASS | Keep left the matching tab open and saved its note. |
| `reschedule-seven` | PASS | Reschedule persisted a date seven days later. |
| `bookmark-close` | PASS | Bookmark was created, tab closed, and outcome saved. |
| `close-undo` | PASS | Close removed the tab; Undo reopened and retracked it. |
| `saved-retrievable` | PASS | Saved decision and note remained after reload. |
| `markdown-export` | PASS | Download contained every URL, outcome, and note. |
| `local-data-no-network` | PASS | State persisted locally with no extension web request. |
| `least-permissions` | PASS | Manifest has only tabs, storage, bookmarks, and alarms; no site access. |
| `delete-local-data` | PASS | Confirmed deletion cleared extension state but kept browser bookmarks. |

Complete command output: `/work/.evidence/verification-4/claims-clean.log`.
A cross-check of the landing page, demo, legal pages, and README found no
additional unlisted public claim. Untested claim count: **0**.

## Clean checkout checks

The clean checkout used Node 22.23.2 and npm 10.9.8. `npm ci` installed 265
packages with zero audit vulnerabilities. The detached worktree remained clean.

| Command | Result |
| --- | --- |
| `npm test` | PASS — 5/5 unit tests |
| `npm run test:e2e` | PASS — 13/13 site tests |
| `npm run test:extension` | PASS — 16/16 extension tests |
| `npm run test:claims` | PASS — 19/19 declared claim commands |
| `npm run check` | PASS — typecheck, unit tests, production build |
| `npm run build` | PASS — `dist/site`, `dist/extension`, and ZIP produced |
| `npm audit --omit=dev` | PASS — zero vulnerabilities |

Logs are under `/work/.evidence/verification-4/`.

## Normal, invalid, boundary, and recovery paths

- Normal tagging stored the active tab’s date, intent, and note.
- Blank dates and unavailable browser pages explained the problem and did not
  change storage.
- Eight due tabs were limited to seven; a future item was excluded from the due
  count.
- All four decisions, keyboard navigation, reload persistence, Markdown export,
  and local-data deletion passed in a fresh installed-extension profile.
- Close and bookmark-close affected matching real browser tabs. Undo restored
  the URL with the documented limit that page-local state may not return.
- Empty and unavailable states gave a next action. Reset, offline reload, cache
  replacement, and local-data deletion covered recovery paths.

This is a static site and local browser extension. It has no backend, tenant,
database, health endpoint, or request-rate API, so tenant isolation, restart
persistence, and 429 checks do not apply.

## Accessibility, layout, privacy, and performance

- Home, demo, privacy, terms, 404, popup, and review have `lang`, titles, one
  h1, main landmarks, ordered headings, labelled controls, and alt text.
- Axe found zero serious or critical issues. Keyboard focus, live announcements,
  dialog focus, 44px targets, dark extension mode, and reduced motion passed.
- Desktop and phone layouts had no horizontal overflow at normal size or 200%
  text. Visual inspection found no clipping or obscured action.
- The site made only same-origin requests and set no cookies. The extension has
  no host permissions or content scripts and uses browser-local storage.
- Fresh Lighthouse 13.4.1: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; LCP 931ms, TBT 27ms, CLS 0.
- Built site assets: home JavaScript 1.13KB including shared loading code, demo
  JavaScript 5.78KB, CSS 18.68KB, largest image 83.09KB, ZIP 18.67KB.

Evidence: `/work/.evidence/verification-4/lighthouse-live.json`, `verify.json`,
desktop and phone screenshots, and the clean build logs.

## Routes, links, offline use, and deployment match

- `/`, `/demo/`, `/privacy/`, `/terms/`, the extension ZIP, `robots.txt`, and
  `sitemap.xml` return 200 over HTTPS. HTTP redirects to HTTPS.
- Every internal and product-repository link returned 200. Each public route has
  its own title, canonical URL, social metadata, favicon, shared header/footer,
  factory credit, and version.
- An unknown route returns HTTP 404 with “Page not found — Tab Sunset List,” one
  h1, and a home link. This deliberate 404 is expected behavior.
- Home, demo, privacy, and terms reopened offline after a first visit. The cache
  is release-versioned and removed a synthetic prior cache. Reduced motion
  changed transitions to 0.01ms and scrolling to `auto`.
- Restrictive CSP, frame denial, permissions policy, nosniff, referrer policy,
  HSTS, and one-year immutable ZIP caching are live.
- Live home, demo, privacy, terms, 404, and service-worker hashes exactly match
  the clean build. Every unpacked file in the live ZIP matches
  `dist/extension`.

Implementation `9a672cf` and documentation `f3d19eb` differ only in the handoff
and live-verification helper after the implementation change. Product output has
no diff, so `9a672cf36a7025b11d96f05c63e819c3ce822807` is the implementation
candidate reviewed.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Missing or invalid live deployment and TLS | Fixed — valid HTTPS serves the tested candidate; HTTP redirects. |
| Broken offline shell | Fixed — all promised routes reopen offline without console errors. |
| Fixed cache name and stale cache handling | Fixed — release-versioned cache replaces a synthetic old cache. |
| Small mobile targets | Fixed — site, popup, and review checks find none below 44×44px. |
| Missing immutable caching | Fixed — `/assets/*` and `/downloads/*` use one-year immutable caching. |
| Missing security headers | Fixed — CSP, frame, permissions, nosniff, referrer, and HSTS policies are live. |
| R1-01 missing demo | Fixed — one-click populated, labelled, isolated, resettable sample passed live. |
| R1-02 missing declared claims | Fixed — 19/19 declared commands passed; no unlisted claim found. |
| R1-03 unclear or metaphorical copy | Fixed — first screen plainly names the job, audience, action, and facts. |
| R1-04 lost focus and missing announcement | Fixed — keyboard decision announces the result and focuses the next heading. |
| R1-05 200% text overflow | Fixed — desktop and 390px checks have zero horizontal overflow. |
| R1-06 missing 404 | Fixed — unknown addresses return the designed HTTP 404 page. |
| R1-07 incomplete metadata, chrome, and docs | Fixed — route metadata, shared chrome, version, credit, and deployment docs pass. |
| R1-08 undersized extension targets | Fixed — populated popup and review targets meet 44×44px. |

Verification 3 had no findings. Its covered behavior remains passing under the
new clean and live checks.

## Findings and limits

No release findings. Finding count: **0**. Untested claim count: **0**.

Developer-mode installation remains necessary until a browser-store listing is
available. Undo restores a URL, not unsaved form, scroll, media, or session
state. Cloud sync remains an explicit non-goal. These documented limits do not
contradict a public claim.
