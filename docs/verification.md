# Local verification

Verified on 2026-11-09 with Node 22.14.0 and Chromium through Playwright.

| Check | Result |
| --- | --- |
| TypeScript typecheck | Passed |
| Unit, API, extraction and migration tests | 34 passed |
| Full web, API and extension build | Passed |
| Browser integration tests with the unpacked MV3 extension | 2 passed |
| Automatic side-panel opening from a store click | Passed |
| Inline install continuation after refresh | Passed |
| Mandatory/Optional toggles and weighted results | Passed |
| Clearing stale results on unsupported navigation | Passed |
| Comparison history, search, deletion and persistence | Passed |
| Live OpenAI structured conversation and analysis | Passed, gpt-4.1-mini |
| Final scoped implementation/UI review | Ship |

The final live API run created four criteria (two mandatory, two optional), produced 100% for fully evidenced product criteria, and 83% when an optional battery specification was missing. The product price of USD 129 was used; shipping/tax totals were ignored. API keys were checked for absence from client bundles.

Browser integration uses controlled marketplace documents with the real unpacked extension. It does not certify every current retailer DOM or every product. The service handles missing/blocked evidence with waiting, unknown and error states.

Local-only captures and detailed live responses are under ignored `artifacts/`. No API keys, environment files, browser profiles or test traces are intended for the repository.
