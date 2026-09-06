# Tab Sunset List

Tab Sunset List is a Chromium browser extension for knowledge workers with too
many stale tabs. Set a review date and note, then handle a daily queue of up to
seven items.

Live site: <https://tab-sunset-list.sociobot.in>

One-click sample: <https://tab-sunset-list.sociobot.in/demo/>

## What it does

- Tags the active tab with a review date, decision intent, and optional note.
- Shows the due count on its badge and limits each daily review to seven items.
- Supports arrow navigation and K, S, B, and C decision keys.
- Keeps a tab open, moves its date seven days, bookmarks and closes it, or closes it.
- Reopens the last closed URL. The website may not restore unfinished page state.
- Keeps saved decisions available after reload and exports them as Markdown.
- Deletes its local records on request without deleting browser bookmarks.

The extension stores tab data in `chrome.storage.local` and makes no web
requests. It requests `tabs`, `storage`, `bookmarks`, and `alarms`, with no site
access. The download and sample require no account or payment.

## Try the isolated sample

Open `/demo/` or choose **Try it with sample data** on the first screen. The
sample includes five realistic due tabs and one saved item. Demo changes use
only `demo:tab-sunset-list:v1`; they never read or write extension data.

Use **Reset demo** to restore the sample. **Start for real** clears the demo key
and returns to the install instructions. See [`.factory/demo.md`](.factory/demo.md)
for the full sandbox contract.

## Develop

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev       # WXT extension development mode
npm run dev:site  # static site at http://localhost:5173
```

## Test and build

```sh
npm test               # domain unit tests
npm run test:e2e       # site, demo, offline, 404, mobile, and Axe checks
npm run test:extension # production MV3 workflows, keyboard, privacy, and Axe
npm run test:claims    # every command declared in .factory/claims.json
npm run check          # typecheck, unit tests, and production build
npm run build          # exact production build command
```

`npm run build` creates the complete site under `dist/site`, including the
packaged ZIP at `dist/site/downloads/tab-sunset-list-chrome.zip`. It also copies
the unpacked extension to `dist/extension`.

To install locally, open `chrome://extensions`, enable Developer mode, choose
**Load unpacked**, and select `dist/extension`.

## Deploy

1. Run `npm ci`, every test command above, and `npm run build` from a clean checkout.
2. Publish the contents of `dist/site` through the product’s existing factory-managed static deployment.
3. Keep `staticwebapp.config.json` at the deployed root so headers, immutable assets, and the 404 response stay active.
4. Check `/`, `/demo/`, `/privacy/`, `/terms/`, one missing URL, and the ZIP over HTTPS.
5. Compare the live site files and unpacked ZIP contents with the tested build.

Do not deploy `dist/extension` separately. The downloadable ZIP already contains
that same production extension.

## Project map

- `entrypoints/` — background, popup, and review-page entrypoints.
- `src/lib/` — date rules, local storage, and decision actions.
- `site/` — landing, demo, privacy, terms, and designed 404 pages.
- `assets/src/` — original artwork and prompt provenance.
- `.factory/claims.json` — public claims and their exact sandbox commands.
- `.factory/design.md` — product-specific visual system and motion policy.

## License

MIT. See [LICENSE](LICENSE).
