# Review 1 — Decide what to do with stale browser tabs

**Work order:** `tab-sunset-list-review-1`  
**Date:** 2026-09-06 UTC  
**Live URL:** <https://tab-sunset-list.sociobot.in>  
**Implementation candidate:** `236d405e52788368f0904dec75d5f611e9024560`  
**Documentation commit reviewed:** `c07d3603e7d1edbeba9e4ae0cfae41822e93c82e`  
**Scope:** independent review. No product code was modified.

## Verdict: FAIL

**FAIL — 8 findings and 26 untested public claims.** Two findings are high,
four are medium, and two are low. A PASS requires zero findings at every
severity and zero untested claims.

The downloadable extension completes its core local-first workflow, and the
previous deployment, offline, cache, header, and landing touch-target defects
remain fixed. The release nevertheless fails the current contracts because it
has no one-click isolated sample, no claim manifest or claim-tagged tests, a
noncompliant first screen, missing 404 behavior, and accessibility gaps.

## Job, audience, and first action before scrolling

- **Job:** turn stale browser tabs into deliberate keep, reschedule, bookmark,
  or close decisions.
- **Audience:** knowledge workers with chronic browser-tab overload.
- **First action offered live:** “Download extension.” There is no “Try it with
  sample data” action.

In fresh 1440×900 desktop and 390×844 phone contexts, the first screen says
“Every tab gets a horizon.” This metaphor does not name the job, and the screen
does not name the audience. The primary action downloads the ZIP. The nearby
text does not explain a sample result, and the three required facts are merged
into one line.

## Findings

| ID | Severity | Finding | Evidence and impact |
| --- | --- | --- | --- |
| R1-01 | High | The required one-click sample sandbox does not exist. | Neither fresh first screen has “Try it with sample data.” `/demo` returns the ordinary landing page with HTTP 200. There is no persistent “Demo — sample data, nothing is saved” label, Reset demo, Start for real, separate demo storage namespace, or `.factory/demo.md`. The below-fold illustrative card only rotates four strings and is explicitly not the extension. The required realistic sample/reset/no-real-data path cannot be entered or verified. |
| R1-02 | High | Public claims are not registered or tested under the claims contract. | `.factory/claims.json` is absent and `rg '@claim'` finds no tagged tests. The landing site and README make 26 normalized claims listed below. Some behaviors passed unrelated tests or this manual audit, but none has the required one-to-one manifest entry and sandbox command. Untested claim count: **26**. |
| R1-03 | Medium | The first screen and supporting copy fail the plain-words contract. | The title and h1 use “every tab gets a horizon”; the audience is absent; the first action is a download; three facts are one sentence. Headings/labels including “One small ritual,” “Built for momentum,” “Private by architecture,” “Today’s horizon,” “Make the pile finite,” and “The horizon is clear” use metaphor or mood language. `.factory/copy-audit.md` is absent. |
| R1-04 | Medium | Review decisions are not announced and lose keyboard focus. | In the installed live artifact, focusing “Keep open” and pressing Enter changed Item 1 to Item 2, but `document.activeElement` became `<body>`. Neither the new item, queue count, nor position is in a changing live region. `renderQueue()` calls `focus()` on a non-focusable h2. A screen-reader user is not told what replaced the decided item. |
| R1-05 | Medium | The live landing page loses content at 200% text size. | At 390px with root text size raised to 200%, the document gains 42 CSS px of horizontal overflow. The wordmark collides with “Get the extension,” and the hero/instrument content is visibly clipped. Normal 390px size has no overflow. |
| R1-06 | Medium | Missing URLs do not produce the required designed 404. | `/definitely-missing-review-1` and `/404.html` both return HTTP 200 and the landing document byte-for-byte. There is no 404 page, no 404 title, and no explicit route back. This is an unexpected success response, not an acceptable deliberate HTTP 404. |
| R1-07 | Low | Required metadata and shared site chrome are incomplete. | All public pages lack a canonical link, Twitter card metadata, and apple-touch icon. The OG asset is 1536×1024 rather than 1200×630. Header navigation is inconsistent and has no Demo link. Footers omit “Built by Param Factory” and a version/build id. README documents build output but not a deployment procedure. |
| R1-08 | Low | Several extension interactive targets are below 44px. | Fresh installed-artifact measurements: popup skip link 34px high, wordmark 19px, and due button 34px; review skip link 34px, wordmark 19px, and populated saved-item links 14px. Decision buttons and radio-label hit areas meet the minimum. |

## Untested public claims

Because there is no claims manifest, each normalized landing/README claim below
has no required `@claim:<id>` test from the sample entry point:

1. Chrome support.
2. Edge support.
3. Tag the active tab with an expiry date.
4. Store a decision intent.
5. Store an optional rationale.
6. Show the number of due tabs on the badge.
7. Open review with `Alt+Shift+S`.
8. Limit the daily queue to seven items.
9. Keep a tab open and preserve its rationale.
10. Reschedule an item by seven days.
11. Create a bookmark and close the original tab.
12. Close the original tab.
13. Reopen the most recently closed tab.
14. Keep saved decisions retrievable.
15. Export saved decisions as Markdown.
16. Store extension state only in browser-local storage.
17. Send no tab URL or browsing-history data off device.
18. Make zero extension network requests.
19. Require no account.
20. Remain free.
21. Provide no cloud sync or remote history service.
22. Request only tabs, storage, bookmarks, and alarms permissions.
23. Use no website cookies, analytics, tracking, third-party scripts, or fonts.
24. Work offline after the first visit, including legal pages.
25. Install the packaged extension in about 60 seconds.
26. Provide a responsive install site.

The manual review proved many of these outcomes, but that does not replace the
required declared, one-claim-per-test automation. The shortcut was present in
the manifest; a headless keypress did not open review, so that behavior remains
unproven rather than classified as false.

## Clean checkout and declared commands

A detached worktree at documentation SHA `c07d360` used Node 22.23.2 and npm
10.9.8. The documented prerequisite was installed with `npm ci` (265 packages,
0 vulnerabilities), then every documented gate ran:

| Command | Result |
| --- | --- |
| `npm test` | PASS — 5/5 Vitest tests |
| `npm run test:e2e` | PASS — 6/6 Chromium site tests |
| `npm run test:extension` | PASS — 1/1 built MV3 test |
| `npm run check` | PASS — TypeScript, unit tests, production build |
| `npm run build` | PASS — `dist/site`, ZIP, and unpacked extension produced |
| `npm audit --omit=dev` | PASS — 0 vulnerabilities |

There were no claim commands to run because `.factory/claims.json` does not
exist. The existing tests contain no `@claim:` tags.

## Live and installed-artifact exercise

The live landing page was opened in separate fresh desktop and phone browser
contexts before scrolling. The downloaded ZIP was then unpacked and loaded in
a fresh Chromium consumer profile.

Passed observations:

- Blank and past dates were rejected without changing extension storage; a
  valid date, decision, and rationale persisted across reload.
- Eight due items produced a seven-item populated queue. Arrow navigation and
  K/S/B/C actions worked. S moved the item to 2026-09-13, B created a bookmark
  and closed its matching tab, C closed its tab, and both undo paths reopened
  the URL with the intended tracking behavior.
- Markdown export contained all four saved items, links, outcomes, and reasons.
  Empty, untrackable-page, and injected storage-error states gave recovery
  guidance. No console, page, or extension-worker errors appeared.
- Axe reported zero violations on live desktop/phone, popup, review, and dark +
  reduced-motion review. First Tab reached a visible 3px skip-link outline.
  Reduced motion computed to 0.01ms. The issues in R1-04, R1-05, and R1-08 are
  manual accessibility failures not detected by Axe.
- The live site contacted only its own origin. The extension manifest has no
  host permissions and requests only `tabs`, `storage`, `bookmarks`, and
  `alarms`. Local data deletion is documented through browser uninstall;
  bookmarks remain user-controlled. No backend, tenant, rate-limit, or restart
  checks apply to this browser-extension artifact.
- All crawled internal and GitHub links resolved. `/privacy/` and `/terms/`
  return 200 with their own correct titles. HTTP redirects to HTTPS.
- Fresh offline reload retained the title and h1 with no errors. A synthetic
  old service-worker cache was removed on re-registration. Live security and
  immutable asset headers remain present.

## Candidate identity and performance

`236d405` is the last implementation change. `fd77d77` and `c07d360` only
changed review/handoff documentation, so the implementation and documentation
SHAs differ.

- Local/live `index.html` SHA-256:
  `a2b9eefa1513bf497b68e1431b4a1d7152b3281c2534a99e7c874ef7f980986a`.
- Local/live `sw.js` SHA-256:
  `9cb150c5f9a2d477c4b3fdffac5a5c4c3c6966295cb9450f508733ff573600c5`.
- The live and clean-built ZIP containers differ only in archive timestamps;
  every unpacked path and byte matched.
- Built initial JS is 1,769 bytes, CSS 11,992 bytes, largest image 83,086
  bytes, and ZIP 18,008 bytes.
- Fresh live Lighthouse 13.4.1 wrote a complete report before its known
  post-collection tab-crash warning: Performance 100, Accessibility 100, Best
  Practices 100, SEO 100; LCP 913ms, TBT 0ms, CLS 0.
- `verify-url.sh` passed: HTTPS 200, 894ms network-idle load, title/lang/one h1/
  main/alt checks present, and no console errors.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Invalid TLS / absent deployment | Fixed: HTTPS 200 with valid certificate; HTTP 301 to HTTPS. |
| Offline reload returned HTML for JS/CSS | Fixed: live fresh-cache offline reload has no MIME, console, or page errors. |
| Fixed service-worker cache name | Fixed: `tab-sunset-list-63ce9fbff1f3`; synthetic prior cache removed. |
| Landing mobile controls below 44px | Fixed at normal 390px: no visible landing links/buttons below 44px. R1-08 concerns separate extension controls. |
| Assets lacked immutable caching | Fixed: live `/assets/*` and `/downloads/*` use one-year immutable caching. |
| Missing CSP/frame/permissions headers | Fixed: restrictive CSP, frame denial, Permissions-Policy, nosniff, referrer policy, and HSTS are live. |
| Verification 3 reported no defects | Its tested behaviors still pass. This review adds stricter demo, claims, copy, 404, text-resize, and screen-reader checks. |

## Required next steps

1. Add the isolated one-click sample and its documented reset/start-real flow.
2. Inventory public claims in `.factory/claims.json` and add one tagged sandbox
   test per claim; remove claims that cannot be proved.
3. Rewrite the first screen/title/headings in plain words and add the copy audit.
4. Repair screen-reader transition feedback, 200% text reflow, and all 44px
   extension targets.
5. Add the designed 404, complete route metadata/site chrome, and rerun this
   full independent review.
