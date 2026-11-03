# Elevator Directory Checks

With a local Next frontend running:

```sh
TEST_BASE_URL=http://127.0.0.1:3035 npm run test:elevator-directory
TEST_BASE_URL=http://127.0.0.1:3035 npm run test:elevator-actions
```

Playwright must be available in the test runtime. `PLAYWRIGHT_MODULE` may point
to an existing installation; `BROWSER_CHANNEL` defaults to `chrome`.
`TEST_OUTPUT_DIR` overrides the default temporary screenshot directory.
All API calls are intercepted with synthetic data. The browser checks desktop,
tablet and mobile layouts, long names, filtering, empty/error/retry states,
cached data during a failed refresh, creation modal and detail navigation.

Optional local visual preview, using synthetic data in memory only:

```sh
node test/elevator-directory-fixture.cjs
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3036/api NEXT_PUBLIC_AUTH_BYPASS=true npm run dev -- --port 3035 --hostname 127.0.0.1
```

Open `http://127.0.0.1:3035/admin/elevators`. The fixture supports only the
directory, reading details and creating/editing/deleting synthetic elevators. No real database
or customer records are used. Auth bypass is local-only and must not be enabled
for production builds or deployment. Never run this preview against production.
