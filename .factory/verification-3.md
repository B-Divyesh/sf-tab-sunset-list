# Independent verification 3 — PASS

**Work order:** `tab-sunset-list-verify-3`  
**Candidate:** `fd77d770d578faae98b934594dfcf8536caa8d00`  
**Live URL:** <https://tab-sunset-list.sociobot.in>  
**Date:** 2026-08-28 UTC  
**Scope:** clean-candidate, read-only product QA. No product source was changed.

## Verdict

**PASS.** Fresh evidence confirms the earlier deployment-only and offline-shell
failures are repaired. The live static site serves the candidate's HTML and
service worker byte-for-byte; the downloaded extension has identical unpacked
entry content to the candidate's production ZIP. The local-first extension
completes the specified decision workflow, and the live site, legal pages,
mobile layout, response policy, offline reload, accessibility smoke checks,
and performance budget all pass.

## Clean checkout and repository gates

Started from a clean checkout at the candidate SHA (Node 22.23.2):

```sh
npm ci
npm test
npm run test:e2e
npm run test:extension
npm run check
npm run build
npm audit --omit=dev
```

- `npm ci`: 265 packages; 0 vulnerabilities.
- `npm test`: **5/5** Vitest tests passed.
- `npm run test:e2e`: **6/6** Chromium site tests passed, including Axe,
  390px sizing, offline reload, cache-upgrade, and deploy-config coverage.
- `npm run test:extension`: **1/1** production MV3 Chromium test passed.
- `npm run check`: TypeScript `--noEmit`, unit tests, and the exact production
  build passed. The separately rerun exact `npm run build` passed.
- No lint command is defined; TypeScript is the available static check.
  `npm audit --omit=dev` reported 0 vulnerabilities.

The built initial JS is 1,769 bytes, CSS 11,992 bytes, largest image 83,086
bytes, unpacked extension 33,693 bytes, and ZIP 18,008 bytes. No webfont files
ship.

## Independent end-to-end extension exercise

With a fresh persistent Chromium profile and exact production-built unpacked
MV3 artifact, I seeded browser-local state and exercised the rendered UI
against real browser tabs/bookmarks:

- Eight due items rendered a daily queue of **7**. Right Arrow advanced from
  `1 of 7` to `2 of 7`; `S` rescheduled the selected item; `K` saved a kept
  decision.
- `C` closed a matching real tab and showed Undo. Undo reopened it and restored
  its tracked record.
- `B` created the `Tab Sunset List` bookmark, closed its matching tab, and Undo
  reopened the tab without re-tracking the bookmarked decision.
- Markdown export produced `tab-sunset-list-2026-08-28.md`.
- The popup on a non-trackable extension page hid its form and gave recovery
  guidance. Native date validation and normal tagging logic are covered by the
  built extension/unit suites.
- Console, page, and service-worker error listeners remained empty.

At 390px the review had 0px overflow and all four actions measured 328x54px.
First Tab reached the designed 3px focus outline. Axe found zero
serious/critical findings. In dark + reduced-motion emulation, dark tokens were
active and transitions were reduced to `0.01ms`.

## Live deployment, privacy, and browser evidence

- HTTPS returns 200 for `/`, legal pages, `/sw.js`, assets, and ZIP; HTTP is a
  301 to HTTPS.
- Candidate/live `index.html` SHA-256:
  `a2b9eefa1513bf497b68e1431b4a1d7152b3281c2534a99e7c874ef7f980986a`.
  Candidate/live `sw.js` SHA-256:
  `9cb150c5f9a2d477c4b3fdffac5a5c4c3c6966295cb9450f508733ff573600c5`.
  ZIP container hashes differ only from archive timestamps; every file path and
  decompressed file SHA-256 matches.
- Headers include HSTS, `nosniff`, strict-origin referrer policy,
  `X-Frame-Options: DENY`, restrictive same-origin CSP, Permissions-Policy,
  and immutable one-year `/assets/*` and `/downloads/*` caching.
- The fresh live service-worker cache is `tab-sunset-list-63ce9fbff1f3` and
  includes hashed JS/CSS. After clearing HTTP cache, offline reload rendered
  the title and heading with no MIME, console, or page errors.
- Live desktop/390px Axe had zero serious/critical findings; no overflow or
  visible targets below 44px. First Tab exposed the skip-link focus ring.
  `/privacy/` and `/terms/` each have `lang=en`, one `<h1>`, one `<main>`,
  clean consoles, and zero serious/critical Axe findings.
- Browser capture contacted only the product origin. Static scan found no
  analytics, tracking, beacons, CDN fonts/scripts, or extension network API.
  The MV3 manifest has only `tabs`, `storage`, `bookmarks`, and `alarms`, no
  host permissions/content scripts, and data uses `chrome.storage.local`.

Lighthouse 13.4.1 on the live mobile URL scored **100 Performance, 100
Accessibility, 100 Best Practices, 100 SEO**; LCP 916ms, TBT 47.5ms, CLS 0.
The CLI printed a post-report Chromium-tab-crash warning after writing the
complete scored JSON; it exited successfully and the report contains those
scores.

## Defects

No blocker, critical, high, medium, or low release defects found.

## Known limits

- The ZIP remains a developer-mode installation until a browser-store listing.
- Reopen restores a URL, not page-local form/scroll state.
- `verify-url.sh` is not present in this repository; equivalent semantic,
  console, and browser checks were run directly.
