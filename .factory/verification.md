# Independent verification — FAIL

**Work order:** `tab-sunset-list-verify-1`  
**Verified commit:** `62523cea1c644bf38c21d72abe0dcb42b7d62eb6` (`main` and `origin/main`)  
**Requested deployment:** `https://tab-sunset-list.sociobot.in`  
**Date:** 2026-08-27 UTC  
**Scope:** independent read-only product QA. No product code was changed.

## Verdict

**FAIL.** The local candidate builds and its principal extension workflow works,
but the requested public deployment is not serving it: normal HTTPS validation
fails and the endpoint returns an Azure `404 Site Not Found` page even with TLS
verification bypassed. The release therefore cannot be installed from, or
verified at, the stated product URL.

## Reproducible evidence

### Clean checkout and quality gates

Ran from a clean checkout at the verified SHA with Node 22.23.2:

```sh
npm ci
npm run check
npm run test:e2e
npm run test:extension
```

- `npm ci`: 265 packages installed; `npm audit` reported 0 vulnerabilities.
- `npm run check`: passed: `tsc --noEmit`, Vitest **5/5**, and the exact
  production command `npm run build`.
- `npm run test:e2e`: passed **4/4** Chromium tests (landing, legal pages,
  390px layout, Axe serious/critical check).
- `npm run test:extension`: passed **1/1** unpacked MV3 Chromium test,
  including light/dark/reduced-motion Axe serious/critical checks.
- Production build produced `dist/site`, `dist/site/downloads/tab-sunset-list-chrome.zip`
  (18,008 bytes), and `.output/chrome-mv3` (33.69 KB; the packaging script
  also copies the unpacked extension to `dist/extension`).

### Independent extension exercise

Using a fresh persistent Chromium profile with the production-built unpacked
extension:

- A normal active `https://example.com` tab appeared in the popup. Blank and
  past date values made the native form invalid; a valid date, `Close if
  unused`, and a rationale persisted to `chrome.storage.local`.
- Eight due entries displayed **7** entries, confirming the daily limit.
  `+7 days` rescheduled the earliest entry to `2026-09-03T00:00:00.000Z`, and
  next/previous keyboard navigation worked.
- Bookmark + close closed the matching regular tab, created a browser bookmark,
  preserved the saved decision, and produced
  `tab-sunset-list-2026-08-27.md`. Undo reopened the tab without re-tracking
  the bookmarked decision, as designed.
- Close closed the matching regular tab; Undo reopened it and restored its
  tracked item.
- At 390px, the review page had 0px horizontal overflow and its four decision
  buttons were 328x54px. Tab focus reached the skip link with a visible 3px
  outline. Local online-path console/page-error listeners remained clean.

### Accessibility, performance, privacy, and policy checks

- Existing Playwright Axe checks found no serious or critical violations on the
  landing, privacy, terms, popup, or review page (including dark and
  reduced-motion extension rendering).
- At 390px the landing page had 0px horizontal overflow. Its first Tab reaches
  the visible 3px-outlined skip link.
- Lighthouse 12.8.2 against the production build at localhost reported mobile
  scores Performance **100**, Accessibility **100**, Best Practices **100**,
  SEO **100**; LCP **1.1 s**, TBT **40 ms**, CLS **0**. Lighthouse emitted a
  post-collection Chromium tab-crash runtime warning, but wrote the complete
  result artifact; the scores and metrics above are from that artifact.
- Built payloads meet the stated budgets: initial JS 1,769 bytes, CSS 11,767
  bytes, largest image 83,086 bytes; no downloaded fonts.
- Static scan of authored sources and built manifest found no analytics,
  beacons, remote scripts, or extension network host permissions. The MV3
  manifest requests only `tabs`, `storage`, `bookmarks`, and `alarms`; data
  storage uses `chrome.storage.local`.
- The production-site service worker controls an online reload and the HTML is
  available after an offline reload, but the offline reload logs a module MIME
  error because its cached shell omits the hashed JS/CSS assets and its generic
  fallback returns `/` HTML for the missing module.

### Live deployment / response checks

Fresh requests on 2026-08-27 UTC:

```text
curl -I https://tab-sunset-list.sociobot.in
curl -I http://tab-sunset-list.sociobot.in
```

- HTTPS fails certificate validation: the presented certificate CN/SAN is
  `*.msha-slice-7-eus2-1-ase.p.azurewebsites.net`; it has no
  `tab-sunset-list.sociobot.in` SAN.
- `curl -k https://tab-sunset-list.sociobot.in/`, `/privacy/`, and
  `/downloads/tab-sunset-list-chrome.zip` each returned `HTTP/1.1 404 Site Not
  Found`, `Content-Type: text/html`, `Content-Length: 2667`.
- The forced download response had the same SHA-256 as that 404 body, not the
  built ZIP. The landing response SHA-256 was
  `1e0878f232e32cf44e87ba00bd6957c1ebdfc9bc7c1c0a1389f8c62e6ae3311a`;
  `dist/site/index.html` was
  `f06dafa22ce4838faf59bd45907fafcf3a8fd0c41ebac79cc0b947ef6b051db2`.
- Plain HTTP also returns `404 Site Not Found`, not a redirect to valid HTTPS.
  The only returned headers were basic 404 headers; no candidate cache or
  browser-security response policy can be confirmed from this failed endpoint.

## Defects

| Severity | Finding | Acceptance impact / reproduction |
| --- | --- | --- |
| Blocker | Requested deployment is absent and its TLS certificate is invalid for the product hostname. | A standard browser blocks the URL; bypassing TLS yields Azure 404 for landing, legal pages, and the extension ZIP. It cannot match or distribute this candidate. |
| Medium | Offline reload has a JavaScript module MIME error. | Visit the production-built local site once, wait for the service worker controller, set the browser offline, then reload. The cached document loads, but the uncached hashed module resolves to the `/` HTML fallback. This violates the required offline/PWA and no-console-error behavior. |
| Medium | Service-worker cache name is permanently `tab-sunset-list-v1`. | `public/site/sw.js` does not version the cache per asset release. A future service-worker update cannot reliably distinguish and remove an old shell cache; update behavior does not meet the required versioned-cache policy. |
| Low | Several mobile landing controls are below the 44x44px target contract. | At 390px: Get the extension is 135x35px; skip link 175x40px; inline install/privacy/footer links are 17–18px high. The extension review action buttons themselves pass. |

## Required next actions

1. Bind the requested hostname to the deployed static artifact and provision a
   certificate containing `tab-sunset-list.sociobot.in`; serve the built site,
   privacy/terms, and exact ZIP with valid HTTPS/redirect, cache, and security
   headers.
2. Fix the service worker to precache the hashed CSS/JS shell assets and avoid
   returning HTML for asset requests; use a release-versioned cache and verify
   offline reload plus an update from a previous cache.
3. Make the identified visible touch targets at least 44x44 CSS px.
4. Re-run this verification against the live URL after deployment is repaired.
