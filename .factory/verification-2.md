# Independent verification 2 — FAIL

**Work order:** `tab-sunset-list-verify-2`  
**Candidate:** `62523cea1c644bf38c21d72abe0dcb42b7d62eb6`  
**Live URL:** <https://tab-sunset-list.sociobot.in>  
**Date:** 2026-08-28 UTC  
**Scope:** clean-checkout, read-only product QA. Product source was not changed.

## Verdict

**FAIL.** The prior deployment blocker is resolved: the live site and its
downloaded extension are the tested candidate. The core local-first extension
workflow also works. However, this is still not releasable against the supplied
contract because a fresh offline reload produces JavaScript and stylesheet MIME
errors, the service-worker cache is not release-versioned, and multiple mobile
controls miss the required 44px minimum touch target.

## Clean candidate and local gates

Created a clean detached worktree at the exact candidate, ran `npm ci` (265
packages; audit reported 0 vulnerabilities), then ran:

```sh
npm test
npm run test:e2e
npm run test:extension
npm run check
npm run build
```

All commands passed. Results: Vitest **5/5**, landing/legal Playwright **4/4**,
and built-extension Playwright **1/1**. `npm run check` passed `tsc --noEmit`,
the unit suite, and the exact production build. The production output contains
`dist/site`, `dist/site/downloads/tab-sunset-list-chrome.zip` (18,008 bytes),
and `dist/extension` (33.69 KB total).

Lighthouse 12.8.2 against the production preview produced Performance **100**,
Accessibility **100**, Best Practices **100**, SEO **100**; LCP **0.2 s**, TBT
**0 ms**, CLS **0**. Lighthouse printed a post-collection Chromium tab-crash
warning, but wrote the complete scored JSON artifact.

Built payloads meet the stated budgets: initial JavaScript 1,769 bytes, CSS
11,767 bytes, largest hero 83,086 bytes, and no downloaded font files.

## Product exercise

Fresh persistent Chromium profiles loaded the production unpacked MV3 artifact.

- Seeded eight due tabs: the review showed **7**, confirming the daily cap.
- Keyboard Right moved from item 0 to item 1; `S` rescheduled item 1 and
  advanced to item 2.
- Bookmark + close created the browser bookmark, saved the `bookmarked`
  outcome, closed the matching tab, and Undo reopened without re-tracking that
  bookmarked item. Export generated `tab-sunset-list-2026-08-28.md`.
- `C` close followed by Undo reopened the matching normal tab and restored its
  tracked record; the reopened tab was backgrounded as documented.
- The popup's non-trackable extension-page state correctly hides the form and
  explains why it cannot safely tag that page. Its native required date field
  rejects blank input.
- Browser listeners recorded no console errors or page errors during the
  exercised extension paths. Existing tests also ran Axe serious/critical
  checks for popup/review light, dark, and reduced-motion modes with none found.

At live 390px, there is no horizontal overflow, there is exactly one `<h1>` and
one `<main>`, and Axe found zero serious/critical findings. Tab reaches the
visible skip-link focus ring (`rgb(198, 64, 45) solid 3px`). The landing page
made requests only to its own origin and had no console/page errors online.

## Privacy, deployment, and policy evidence

- The downloaded ZIP's content hashes match every corresponding file in the
  locally built unpacked extension. The outer ZIP SHA differs because ZIP entry
  timestamps differ.
- Live `/`, `/privacy/`, `/terms/`, `/sw.js`, site JS/CSS/art, and the ZIP are
  byte-identical to the clean candidate's production build (apart from that
  ZIP timestamp container difference). The previous Azure 404/TLS failure is
  no longer present.
- The MV3 manifest has only `tabs`, `storage`, `bookmarks`, and `alarms`; it
  declares no host permissions. Storage is `chrome.storage.local`.
- Static scan and browser network capture found no analytics, third-party
  scripts/fonts, beacons, or extension network calls. The site's only normal
  runtime origin is `https://tab-sunset-list.sociobot.in`.
- Live HTTPS responses are 200 with HSTS, `strict-origin-when-cross-origin`,
  and `nosniff`. They do not send CSP, `X-Frame-Options`, or
  `Permissions-Policy` headers. Every tested asset, including hashed JS/CSS,
  has only `Cache-Control: public, must-revalidate, max-age=30`, not immutable
  long-lived cache policy.

## Defects

| Severity | Finding | Fresh reproduction / impact |
| --- | --- | --- |
| Medium | A fresh offline reload is broken. | Visit once, wait for the service worker, clear the ordinary browser HTTP cache, go offline, and reload. `/sw.js` precaches only HTML/art/favicon, not hashed JS/CSS; its generic `/` fallback is returned for those assets. Chromium reports `Expected a JavaScript-or-Wasm module script ... MIME type text/html` and `Refused to apply style ... MIME type text/html`. This contradicts “Works offline after first visit” and violates the no-console-error/PWA acceptance requirement. Reproduced on both the production preview and live URL. |
| Medium | Service-worker cache/update policy is not release-versioned. | `public/site/sw.js` fixes the cache key at `tab-sunset-list-v1`; an online `registration.update()` leaves that sole fixed cache. The contract requires versioned service-worker caches. The static cache also retains stale old hashed assets rather than cleanly separating releases. |
| Low | Mobile touch targets are below the supplied 44px minimum. | At 390px live: “Get the extension” is 135x35px; skip link 175x40px; several visible inline legal/install/footer links are only 15–18px high. This fails the stated mobile/touch target contract, although the review decision controls are 54px high. |
| Low | Hashed static assets are not long-lived immutable cached. | Live JS, CSS, WebP, and ZIP all return `max-age=30` rather than immutable long-lived caching required by the performance policy. |
| Low | Response-policy hardening is incomplete. | Live responses omit CSP, frame-embedding protection, and Permissions-Policy. This is not the cause of the functional failure, but should be addressed before release. |

## Required next actions

1. Precache the hashed JS/CSS shell assets, return the app shell only for
   navigation requests, and test an offline reload after clearing HTTP cache.
2. Derive/version the service-worker cache name per release and verify an
   upgrade from an old cache to a new build.
3. Raise all visible mobile interactive targets to at least 44x44 CSS px.
4. Configure immutable cache headers for hashed static files and add an
   appropriate CSP/frame/permissions response policy at deployment.
5. Re-run independent QA after these changes. The live deployment matching
   evidence means no deployment-only repair is currently needed.
