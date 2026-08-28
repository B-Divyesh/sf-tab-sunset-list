# Tab Sunset List — repair handoff

## Release outcome: READY

Repair commit `236d405` (`fix: harden offline site release`) is pushed to
`main` and deployed as the same static-site/browser-extension artifact at
<https://tab-sunset-list.sociobot.in> on 2026-08-28 UTC.

## What changed

- Fixed the offline reload blocker. `scripts/build-service-worker.mjs` now
  derives a 12-character content hash for the cache name and writes the release
  service worker after Vite emits its hashed assets. The live release cache is
  `tab-sunset-list-63ce9fbff1f3` and precaches the app shell, privacy/terms,
  favicon, both hero images, and the exact hashed JavaScript and CSS files.
  The fallback is used only for navigation requests, so a missing asset can
  never receive HTML.
- Fixed service-worker updates. Activation removes only older
  `tab-sunset-list-*` caches, claims open clients, and keeps the active
  release-specific cache.
- Raised every visible landing-page link/button hit area at 390px to at least
  44 × 44 CSS px, including the skip link, top install action, inline actions,
  and footer/legal links.
- Added `public/site/staticwebapp.config.json` to preserve the static
  deployment class while setting a restrictive same-origin CSP,
  `X-Frame-Options: DENY`, `Permissions-Policy`, `nosniff`, and the existing
  referrer policy. `/assets/*` and `/downloads/*` now receive
  `Cache-Control: public, max-age=31536000, immutable`.
- Added exact Playwright regressions for all visible 390px target dimensions,
  release-versioned cache naming, hashed JS/CSS precaching, cleanup of a prior
  cache during an update, fresh-cache offline reload with no module/stylesheet
  MIME failure, and the static deployment response policy.

## Verification

From a clean install with Node 22.23.2:

```sh
npm ci
npm test
npm run test:e2e
npm run test:extension
npm run check
npm run build
npm audit --omit=dev
```

Results:

- `npm ci`: completed; audit reported 0 vulnerabilities.
- `npm test`: 5/5 Vitest unit tests passed.
- `npm run test:e2e`: 6/6 Chromium tests passed, including Axe serious/critical
  checks, desktop, 390px target sizing, keyboard skip-link focus, service-worker
  cache upgrade, fresh-cache offline reload, and response-policy coverage.
- `npm run test:extension`: 1/1 production-built MV3 Chromium workflow test
  passed (the established popup/review light, dark, reduced-motion Axe checks
  remain part of it).
- `npm run check`: TypeScript, the unit suite, and the exact production build
  passed. `npm run build` produces `dist/site`, the 18,008-byte Chrome ZIP, and
  `dist/extension`; the production site has 1,769-byte initial JS, 11,992-byte
  CSS, and an 83,086-byte largest image.
- Live `verify-url.sh` returned HTTPS 200 with valid certificate verification,
  title/lang/one h1/main/alt checks, and an empty browser error list. Live
  browser checks found zero serious/critical Axe violations, 0px mobile
  overflow, a focused skip link after the first Tab, and no undersized visible
  controls.
- Live offline verification: after the page was controlled, the ordinary HTTP
  cache was cleared, Chromium was taken offline, and reload retained the title
  and primary heading with no console/page or JS/CSS MIME errors. A synthetic
  prior release cache was removed on re-registration.
- Live identity: `index.html` SHA-256 is
  `a2b9eefa1513bf497b68e1431b4a1d7152b3281c2534a99e7c874ef7f980986a`
  locally and remotely; the downloaded ZIP is
  `ff82f56e3094d905b12643ff44d6f65574644ccf86bff3d3fccac49673f3e0e6`
  locally and remotely. `/privacy/`, `/terms/`, and `/sw.js` return 200;
  HTTP redirects to HTTPS. Live JS and ZIP return the immutable cache policy
  and CSP/frame/permissions headers.
- Lighthouse 12.8.2 against the live production URL: Performance 100,
  Accessibility 100, Best Practices 100, SEO 100; LCP 0.9 s, TBT 0 ms,
  CLS 0. The CLI printed a post-collection Chromium tab-crash warning, but the
  complete scored JSON report was written.

## Privacy and product scope

The original local-first extension behavior is unchanged. The extension still
uses only `tabs`, `storage`, `bookmarks`, and `alarms`, keeps data in
`chrome.storage.local`, and makes no network calls. The public site has no
third-party runtime, fonts, analytics, or tracking. The artifact remains a WXT
MV3 Chrome/Edge extension with its static install site, legal pages, and
developer-mode ZIP distribution.

## Known limits / next steps

- The ZIP remains a developer-mode installation until a browser-store listing
  is published; that is the documented v1 distribution model.
- Reopen can restore a URL but cannot recover page-local browser state such as
  unsaved forms or scroll position.
- A future content release should continue to run `npm run build`; it is the
  step that derives the new service-worker cache release from the emitted shell.
