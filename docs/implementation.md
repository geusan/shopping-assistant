# Implementation checkpoint

User requested the actual local web service and Chrome extension after the Figma mockups, including a page of previously compared products. They chose OpenAI API and local execution (no deployment). Keep all product UI in English and USD examples, fits deep green, minimal chat, inline marketplace buttons, in-chat extension install instructions.

Architecture: root TypeScript project, React/Vite web (localhost:5173), Hono/Node API (localhost:4317), Chrome MV3 side panel. Shared contracts and conservative score computation in packages/core. OpenAI Responses structured outputs are server-only, store:false; default model gpt-4.1-mini, configurable. API key is not present in the environment and must be provided in root .env; never expose it to frontend/extension. Test provider is explicitly gated by NODE_ENV=test and FITS_TEST_MODE=1, never a production fallback.

Runtime flow: web chat returns max four typed criteria → bridge detects extension → inline store click pairs session + local API capability token → extension opens side panel and selected marketplace → content script extracts actual Product JSON-LD, relevant DOM text and visible metadata → server checks evidence, returns grounded findings → deterministic matched/total percentage → browser-local deduplicated compared history with original URLs and criteria snapshots.

Implemented so far: package/tooling, core schemas/store URLs/scoring/history, API/provider, extraction, extension bridge/service worker/storage/build script. Remaining: React web UI, side panel + history UI, tests/fixtures, build/typecheck fixes, browser E2E with unpacked Chromium extension and controlled marketplace network fixtures, README and final verified running local handoff.

Design source: design/figma-state.json latestRevision, chat frame 32:218, result frame 19:2, local sources design/build_mockup.py + design/chat_html.py. Figma chat code context was retrieved and screenshot viewed; SVGs downloaded to packages/ui/assets, fonts copied to packages/ui/fonts. Use these exact static assets where applicable. No history Figma frame was created before the user switched to implementation; implement the feature in the actual extension.

References used: https://developers.openai.com/api/docs/guides/structured-outputs ; https://developers.openai.com/api/docs/models/gpt-4.1-mini ; https://developer.chrome.com/docs/extensions/reference/api/sidePanel ; https://playwright.dev/docs/chrome-extensions .
