# Implementation

## Runtime

- React/Vite website: http://localhost:5173.
- Hono/Node API: http://localhost:4317, bound to loopback.
- Chrome Manifest V3 extension: service worker, app bridge, marketplace capture, side panel and local comparison history.
- OpenAI Responses structured outputs, server-side key, configurable model, `store: false`.

## Shopping flow

An English conversation produces up to four criteria, always including product price. Each criterion has a Mandatory or Optional priority that the user can change in chat. Inline marketplace buttons pass the shopping session to the extension and open the selected store. Missing-extension setup stays in the conversation and preserves the pending store across refresh.

The content script extracts current product metadata and visible product text. The displayed variant price takes precedence over structured metadata. The API validates evidence quotes, recomputes numeric thresholds and product-price checks, and returns results to the panel. Unknown information stays unknown.

## Fit policy

Mandatory criteria have weight 2 and Optional criteria weight 1. The percentage is matched weight divided by total weight. A failed mandatory criterion marks the product not a fit; an unverified mandatory criterion requires checking. Shipping and taxes do not contribute to product fit. Currencies are not converted without evidence.

Compared results include the product URL, variant, evidence, criteria snapshot and scoring method. Repeat checks for the same product/variant/criteria update one record; changed criteria remain separate. Older records are retained with their original scores and marked as using an earlier method. Current-item analysis clears on unsupported tabs/navigation while history remains available.

## Local data and boundaries

Conversations are saved in website local storage. Up to 100 comparisons are saved in Chrome local storage, restricted to trusted extension contexts. The web and extension communicate through a configured-origin bridge; model requests require a short-lived local pairing token. The OpenAI key never enters the client build. The server validates origins, bodies, supported marketplace hosts and unique criteria, with rate limiting.

This version runs locally. Accounts, cloud sync, hosted deployment, Chrome Web Store publication, checkout automation and purchasing are not implemented.

## Validation

See `docs/verification.md` for the completed checks and `README.md` for installation and commands. Controlled storefronts and the deterministic test provider are isolated to the test workflow. Live OpenAI verification is separate.
