# Tab Sunset List — review 1 handoff

## Outcome: FAIL

Review 1 found **8 findings and 26 untested public claims**. The reviewed
implementation is `236d405e52788368f0904dec75d5f611e9024560`; the documentation
SHA before this report was `c07d3603e7d1edbeba9e4ae0cfae41822e93c82e`.

No product code was changed. The complete evidence, severities, claim inventory,
and earlier-finding disposition are in `.factory/review-1.md`.

## What was verified

From a clean detached checkout with Node 22.23.2:

```sh
npm ci
npm test
npm run test:e2e
npm run test:extension
npm run check
npm run build
npm audit --omit=dev
```

All declared commands passed: unit 5/5, site 6/6, extension 1/1, type/build,
standalone build, and audit with 0 vulnerabilities. No claim commands exist
because `.factory/claims.json` is missing.

Fresh live desktop and phone browsers covered first-screen copy, links, route
titles, Axe, focus, touch targets, 200% text, reduced motion, request origins,
offline reload, and service-worker update. A fresh consumer profile loaded the
live ZIP and exercised valid/invalid tagging, persistence, the seven-item
boundary, K/S/B/C, close/reopen, bookmarks, Markdown export, empty/error states,
dark mode, reduced motion, and accessibility. The live artifact matches the
clean implementation candidate file-for-file after ZIP extraction.

Live Lighthouse: Performance 100, Accessibility 100, Best Practices 100, SEO
100; LCP 913ms, TBT 0ms, CLS 0. The report was written before a post-collection
Chromium tab-crash warning. `verify-url.sh` passed with no console errors.

## What remains

- Build the required isolated one-click sample with its persistent label,
  reset, start-real action, separate storage namespace, and `.factory/demo.md`.
- Add `.factory/claims.json` and one tagged sandbox test for every public claim.
- Replace metaphor/mood copy, state audience and job before scrolling, and add
  `.factory/copy-audit.md`.
- Announce review item changes and retain useful keyboard focus.
- Fix 200% text reflow and undersized extension targets.
- Add a designed HTTP 404 plus missing metadata, consistent navigation/footer,
  and deployment instructions.

The prior TLS/deployment, offline shell, versioned cache, landing touch-target,
immutable-cache, and response-header findings remain fixed. A new review is
required after the findings above are repaired.
