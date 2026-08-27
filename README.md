# Tab Sunset List

Tab Sunset List is a local-first Chrome/Edge extension for knowledge workers
whose useful tabs slowly become an unreviewed pile. Give a tab an expiry date
and a short reason, then work through a daily queue of at most seven deliberate
keep, schedule, bookmark, or close decisions.

Live site: <https://tab-sunset-list.sociobot.in>

## What v1 includes

- Toolbar popup for tagging the active tab with a date, intent, and rationale.
- Due-count badge and a keyboard-friendly daily review (`Alt+Shift+S`).
- Keep, reschedule seven days, bookmark-and-close, and close outcomes.
- Immediate reopen for the last closed tab. Page-local state such as unfinished
  forms may not be recoverable.
- Browser-local saved list and Markdown export.
- Responsive install site plus privacy and terms pages with an offline cache.

There is no account, cloud sync, analytics, external script, or remote browsing
history. The extension requests only `tabs`, `storage`, `bookmarks`, and `alarms`.

## Develop

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev       # WXT extension development mode
npm run dev:site  # landing site at localhost
```

## Test and build

```sh
npm test               # domain unit tests
npm run test:e2e       # landing/legal pages + Axe accessibility
npm run test:extension # built MV3 extension smoke test + Axe, light/dark
npm run check          # typecheck, unit tests, production build
npm run build          # exact production build command
```

`npm run build` creates:

- `dist/site/index.html` and the complete deployable static site;
- `dist/site/downloads/tab-sunset-list-chrome.zip` for the download link;
- `dist/extension/` as an unpacked MV3 extension.

To install locally, build, visit `chrome://extensions` or `edge://extensions`,
enable Developer mode, choose **Load unpacked**, and select `dist/extension`.

## Project map

- `entrypoints/` — WXT background, popup, and review-page entrypoints.
- `src/lib/` — domain rules, local storage, and decision actions.
- `site/` — static landing, privacy, and terms pages.
- `assets/src/` — original generated artwork and its prompt provenance.
- `.factory/design.md` — product-specific visual system and motion policy.

## License

MIT. See [LICENSE](LICENSE).
