# Review 2 — Decide what to do with stale tabs

**Work order:** tab-sunset-list-review-2  
**Date:** 2026-09-06 UTC  
**Live URL:** <https://tab-sunset-list.sociobot.in>  
**Implementation candidate:** 9a672cf36a7025b11d96f05c63e819c3ce822807  
**Documentation/review baseline:** 2c54f5e75d55b24432066979438f9667cbd77692

## Verdict: PASS

**PASS — zero findings and zero untested claims.** Finding count: **0**.
Untested claim count: **0**. The later baseline changes reports and a
verification helper only. The live product output matches the implementation
candidate.

## Job, audience, and first action

- **Job:** decide what to do with stale tabs.
- **Audience:** knowledge workers whose useful browser tabs become an unreviewed pile.
- **First action:** “Try it with sample data.”

Fresh live Chromium contexts at 1440×900 and 390×844 showed these items and the
three product facts before scrolling. The action was inside both viewports.
Visual inspection found readable screens with no clipping or horizontal overflow.

## Live product check

The one-click action opened a populated /demo/ queue with five realistic tabs
(a service-worker guide, train options, a CSS reference, a research paper, and a
monitor-arm comparison) and one saved result. A keep decision produced four
remaining items and two saved results. “Demo — sample data, nothing is saved”
remained visible after scrolling. Reset restored five queue items and one saved
item. A separate tab-sunset-list:real sentinel was unchanged through demo
entry, action, reset, and exit; demo state uses demo:tab-sunset-list:v1.

Both fresh contexts had no console or page errors, no cookies, and only
same-origin requests. The local fresh-profile suite covered all four decisions,
undo, keyboard controls, invalid date, empty and unavailable states, the
seven-item boundary, reload persistence, Markdown export, local-data deletion,
dark mode, reduced motion, and focus/live announcements.

The live home, demo, privacy, and terms pages reopened offline after one visit.
An unknown address returned HTTP 404 with the designed “This page does not
exist” page and a home link. All checked product and repository links returned
200. There is no backend or tenant API, so tenant isolation, restart, health,
and 429 checks do not apply.

Evidence: /work/.evidence/review-2/live-browser-check.json, screenshots in
that directory, and /work/.evidence/review-2/lighthouse-live.json.

## Claims and clean checkout

A detached clean checkout at the review baseline used Node 22.23.2 and npm
10.9.8. After npm ci (265 packages; zero production audit vulnerabilities),
npm run test:claims ran every exact command in .factory/claims.json.

| Claim IDs | Result |
| --- | --- |
| one-click-demo, demo-isolation-reset, free-no-account, site-private, offline-site | PASS |
| chromium-load, tag-tab, due-badge, seven-item-queue, keyboard-review | PASS |
| keep-rationale, reschedule-seven, bookmark-close, close-undo, saved-retrievable | PASS |
| markdown-export, local-data-no-network, least-permissions, delete-local-data | PASS |

The landing page, demo, legal pages, README, and extension UI were cross-checked
against the manifest. Every visitor-relevant behavior is represented by one of
the 19 tested claims; no extra unlisted public claim was found.

| Command | Result |
| --- | --- |
| npm test | PASS — 5/5 unit tests |
| npm run test:e2e | PASS — 13/13 site tests |
| npm run test:extension | PASS — 16/16 fresh-profile MV3 tests |
| npm run test:claims | PASS — 19/19 declared claim commands |
| npm run check | PASS — typecheck, unit tests, and production build |
| npm run build | PASS — dist/site, dist/extension, and ZIP produced |
| npm audit --omit=dev | PASS — 0 vulnerabilities |

## Accessibility, privacy, routes, and performance

The Playwright Axe integration found no serious or critical issues on home, demo,
privacy, terms, 404, popup, or review. It covers focus recovery, dialog focus,
44px targets, dark mode, and reduced motion. The live browser check also found
zero serious or critical Axe issues, zero 200% text overflow, and reduced motion
set transition duration to 1e-05s with automatic scrolling.

Every public route has its own title, one h1, main landmark, canonical URL,
social metadata, favicon, shared chrome, legal links, factory credit, and
version. Live HTTPS has restrictive CSP, frame denial, permissions policy,
nosniff, referrer, HSTS, and immutable ZIP caching. Live index.html SHA-256
b01e51c4f2c1f2916436a50996d480881c53280c3c7af1e5750f435a1137c044 equals
the clean build. The ZIP archive timestamps differ, but all 13 unpacked files
are byte-for-byte equal.

Fresh live Lighthouse: **100** Performance, **100** Accessibility, **100** Best
Practices, and **100** SEO (LCP 919ms, TBT 47ms, CLS 0).

## Earlier findings

| Earlier finding | Current disposition and proof |
| --- | --- |
| Initial absent/invalid HTTPS deployment | Fixed — live HTTPS serves the candidate and checked product routes return 200. |
| Broken offline shell and fixed service-worker cache | Fixed — four routes reopened offline without errors; release cache replaced a synthetic old cache. |
| Small mobile site controls and non-immutable assets | Fixed — current site/popup/review target tests pass; live assets and ZIP are immutable. |
| Missing CSP, frame, and permissions headers | Fixed — checked live headers are restrictive and present. |
| R1-01 missing one-click demo | Fixed — live sample is populated, labelled, isolated, resettable, and exits to real use. |
| R1-02 unregistered/untested public claims | Fixed — 19 exact commands passed and no unlisted claim remains. |
| R1-03 unclear first screen and metaphorical copy | Fixed — both fresh viewports show job, audience, action, and facts first. |
| R1-04 missing announcement/focus recovery | Fixed — keyboard review test proves announcement and focus on the replacement heading. |
| R1-05 200% text overflow | Fixed — desktop and phone checks report zero overflow. |
| R1-06 missing designed 404 | Fixed — missing live path returns designed HTTP 404. |
| R1-07 incomplete metadata, chrome, and docs | Fixed — route metadata, shared chrome, credit, version, README, privacy, and terms pass. |
| R1-08 undersized extension targets | Fixed — fresh packaged popup and review measurements meet the 44px minimum. |
| Verification 3 and Verification 4 PASS results | Still passing — covered paths were repeated in this review. |

## Limits

Developer-mode installation remains necessary until a browser-store listing is
available. Undo restores a URL but cannot restore unsaved page state. Cloud sync
is intentionally absent. These are documented limits, not failed claims.
