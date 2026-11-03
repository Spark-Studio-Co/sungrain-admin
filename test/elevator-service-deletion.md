# Elevator Deletion Browser Regression

Start the local frontend, then run with Playwright available in the test runtime:

```sh
TEST_BASE_URL=http://127.0.0.1:3035 npm run test:elevator-deletion
```

`PLAYWRIGHT_MODULE` can point to an existing Playwright package in an external
test runtime. `BROWSER_CHANNEL` defaults to `chrome`. Screenshots go to a unique
temporary directory unless `TEST_OUTPUT_DIR` is provided.

The script rejects remote frontend URLs and intercepts all API calls using
synthetic data. It does not log in to or mutate the real backend. It checks
desktop and mobile layouts, confirmation/cancel, error/retry, pending duplicate
protection, keyboard focus, archived rows, and catalogue/detail cache updates.
