# fits

A local, working shopping assistant: define up to four criteria in an English conversation, open a marketplace from the chat, and check product pages with a Chrome side panel. Compared products are saved locally in the extension.

## Run locally

Requires Node.js 22.12+ and pnpm. Use Chrome 116+ for the extension.

```sh
pnpm install
test -f .env || cp .env.example .env
# Set OPENAI_API_KEY in .env. Keep this file private.
pnpm dev
```

Open **http://localhost:5173**. The API listens on **http://localhost:4317** and binds to the local machine only. The first `pnpm dev` builds the extension if it is missing.

`OPENAI_MODEL` defaults to `gpt-4.1-mini`. The model can be changed in `.env`. Restart the API after changing environment variables. There is no simulated AI fallback in the running service: a missing or invalid key produces a clear setup error.

## Load the Chrome extension

1. Run `pnpm build:extension`.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Select **Load unpacked**, then choose the repository’s **`dist/extension`** folder.
4. Pin fits in the Chrome toolbar and refresh the fits website.
5. Finish a conversation and click a store button. The extension receives the criteria, opens the store, and opens its side panel. If Chrome does not allow automatic opening, click the fits toolbar icon.

The web app also offers **Download extension** when it cannot detect the extension. Unzip that download before using **Load unpacked**. This is a local installation; no Chrome Web Store listing is published. Set `EXTENSION_STORE_URL` only after a real listing exists.

After editing extension code, run `pnpm build:extension`, click **Reload** on its entry in `chrome://extensions`, and refresh the web/store pages.

## Implemented flow

- Conversational criteria creation and revision, with a maximum of four criteria. Product price is always included. Each criterion is **Mandatory** or **Optional**, and its priority can be changed directly in the chat.
- Inline Amazon, AliExpress, eBay, and Rakuten buttons; extension installation guidance stays in the conversation.
- A website-to-extension handshake carrying the current shopping session and a local API pairing token.
- Product capture from supported detail-page URLs, JSON-LD Product metadata, and visible product DOM text.
- OpenAI structured analysis with literal evidence quotes. Unsupported quotes become **Unknown**. Numeric thresholds and listed-product-price comparisons are checked in application code.
- Weighted product-fit score: Mandatory criteria count twice, Optional criteria once. Missing information is not a match. A failed mandatory criterion marks the product **not a fit**, regardless of percentage; unknown mandatory information requires verification. Shipping and taxes never affect the score. Price uses the listed item price, and currencies are never silently converted.
- **Compared** view with search, current/all shopping-goal filters, recent/best-match sorting, saved evidence, removal, and reopening original product pages.
- Unrelated ad/recommendation updates do not restart a check. The same product/variant/price result is cached for up to 30 minutes; **Recheck this product** captures fresh evidence.
- Repeat checks update the same product/variant/criteria record. Changed criteria preserve a separate snapshot. Up to 100 results are stored in the browser.

## Commands

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Builds are written to `dist/web`, `dist/api`, and `dist/extension`. The extension ZIP is `dist/fits-extension.zip` and is copied into the web app’s download directory.

For the packaged API/web server, run `pnpm build && pnpm start`. It serves the built website at the API origin. To use that origin with the extension, set `WEB_ORIGIN=http://localhost:4317` before rebuilding the extension. The normal development setup uses port 5173.

## Project layout

| Location | Purpose |
| --- | --- |
| `apps/web` | React/Vite chat UI and installation flow |
| `apps/api` | Hono API, validation, pairing, rate limits, OpenAI provider |
| `apps/extension` | Manifest V3 background worker, bridge, page extraction, side panel and history |
| `packages/core` | Shared schemas, marketplace URLs, evidence checks, scoring and history identity |
| `packages/ui` | Figma assets, shared typography and UI components |
| `tests/e2e` | Chromium tests with the real unpacked extension and controlled storefront pages |
| `design` | Original mockup sources and Figma revision records |

## Data and limits

The OpenAI key remains on the API server. Chat messages and relevant product-page evidence are sent to OpenAI using `store: false`. Conversations are stored in website local storage; compared products and their criteria snapshots are stored in Chrome extension local storage. There are no accounts, server-side history database, cloud sync, payment actions, or automatic purchases.

Marketplace HTML changes, sign-in walls, blocked pages, and missing specifications can prevent reliable extraction. The panel reports waiting/error/unknown states instead of inventing values. Product detail-page analysis is supported for the listed marketplaces; fits focuses on product features and item price, and does not read checkout forms or evaluate shipping charges.

Automated browser tests use controlled product pages and a fixture AI provider enabled only by `NODE_ENV=test` plus `FITS_TEST_MODE=1`. They exercise real extension messaging, storage, page capture, UI, and API validation without making repeated paid AI requests. Live OpenAI verification is reported separately. With the local API running, `pnpm exec tsx scripts/verify-live.mts` makes three real, billable requests to verify conversation output, product-price handling and priority-weighted analysis.

## References

- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Chrome Side Panel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
- [Testing Chrome extensions with Playwright](https://playwright.dev/docs/chrome-extensions)
