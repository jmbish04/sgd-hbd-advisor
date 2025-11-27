# Playwright Tests

End-to-end testing suite for the Gold Standard Worker Template using Playwright.

## Overview

This test suite provides comprehensive end-to-end testing for your Cloudflare Worker template. It includes:

- **Automatic server management**: Starts and stops dev servers automatically
- **Custom fixtures**: Provides `templateUrl` and `template` fixtures for easy testing
- **Multiple test suites**: Basic functionality, navigation, health checks, and API tests
- **Live URL support**: Can test against deployed production URLs

## Setup

### Install Dependencies

```bash
npm install
# or
bun install
```

### Install Playwright Browsers

```bash
npx playwright install
```

## Running Tests

### Run all tests

```bash
npm test
# or
bun test
```

### Run tests in UI mode (interactive)

```bash
npm run test:ui
```

### Run tests in headed mode (see browser)

```bash
npm run test:headed
```

### Debug tests

```bash
npm run test:debug
```

### View test report

```bash
npm run test:report
```

## Test Structure

```
tests/
├── README.md                    # This file
├── playwright.config.ts         # Playwright configuration
├── fixtures.ts                  # Custom test fixtures
├── utils/
│   └── template-server.ts       # Server management utility
├── basic.spec.ts                # Basic functionality tests
├── navigation.spec.ts           # Navigation tests
├── health.spec.ts               # Health dashboard tests
└── api.spec.ts                  # API endpoint tests
```

## Test Suites

### Basic Tests (`basic.spec.ts`)

Tests fundamental functionality:
- Landing page loads correctly
- Navigation works
- Health endpoint responds

### Navigation Tests (`navigation.spec.ts`)

Tests client-side routing:
- All routes are accessible
- URLs update correctly
- Pages load without errors

### Health Tests (`health.spec.ts`)

Tests health monitoring:
- Health dashboard displays
- Health API returns correct data
- System information is visible

### API Tests (`api.spec.ts`)

Tests backend endpoints:
- `/api/health` responds correctly
- `/api/chat` endpoint is accessible
- OpenAPI documentation is available

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from "./fixtures";

test.describe("My Test Suite", () => {
  test("should do something", async ({ page, templateUrl }) => {
    await page.goto(templateUrl);

    // Your test code here
    await expect(page.locator("h1")).toBeVisible();
  });
});
```

### Using Fixtures

The test suite provides two custom fixtures:

#### `templateUrl`

The URL where the dev server is running (e.g., `http://localhost:5173`).

```typescript
test("example", async ({ page, templateUrl }) => {
  await page.goto(templateUrl);
  // Test code...
});
```

#### `template`

Metadata about the template being tested.

```typescript
test("example", async ({ template }) => {
  console.log(`Testing ${template.name} on port ${template.port}`);
  console.log(`Framework: ${template.framework}`);
});
```

## Server Management

The test suite automatically manages dev servers:

1. **Auto-start**: Starts the dev server before tests run
2. **Auto-stop**: Stops the server when tests complete
3. **Port management**: Ensures ports are properly released
4. **Single instance**: Only one server runs at a time to avoid port conflicts

### How It Works

The `TemplateServerManager` class:
- Discovers templates by reading `package.json`
- Determines the framework (Vite, Next.js, etc.)
- Starts the dev server with `npm run dev`
- Waits for the server to be ready
- Provides the URL to tests via fixtures
- Cleans up on exit

## Testing Against Live URLs

You can test against deployed production URLs instead of local dev servers:

```bash
PLAYWRIGHT_USE_LIVE=true npm test
```

This will:
- Skip starting local dev servers
- Use production URLs from `wrangler.jsonc`
- Run tests against your deployed Workers

**Note**: For live testing to work, your template must have `cloudflare.publish = true` in `package.json`.

## Configuration

### Playwright Config (`playwright.config.ts`)

Key settings:
- **Workers**: Set to `1` for sequential test execution
- **Parallel**: Disabled to manage server lifecycle
- **Retries**: Enabled on CI, disabled locally
- **Reporter**: HTML report locally, GitHub Actions on CI

### Environment Variables

- `PLAYWRIGHT_USE_LIVE`: Set to `"true"` to test against live URLs
- `CI`: Automatically detected; enables retries and GitHub reporter

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Playwright Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npm test

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Debugging Tips

### View Browser While Testing

```bash
npm run test:headed
```

### Debug Mode

```bash
npm run test:debug
```

This opens Playwright Inspector where you can:
- Step through tests
- Inspect elements
- View console logs
- See network requests

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots (saved to `test-results/`)
- Traces (viewable with `npx playwright show-trace`)

### Server Logs

The template server manager logs output from dev servers:

```
[template-name] Server started on port 5173
[template-name] Ready in 842ms
```

Check console output for any server errors.

## Troubleshooting

### Port Already in Use

If you see port conflicts:

```bash
# Kill any processes on port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port in vite.config.ts
```

### Server Doesn't Start

Check that:
1. `npm run dev` works manually
2. Dependencies are installed
3. No other process is using the port

### Tests Timing Out

Increase timeout in `playwright.config.ts`:

```typescript
use: {
  timeout: 60000, // 60 seconds
},
```

## Best Practices

1. **Use data-testid attributes** for reliable selectors:
   ```typescript
   await page.getByTestId('submit-button').click();
   ```

2. **Wait for network idle** before assertions:
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

3. **Use expect assertions** rather than conditional logic:
   ```typescript
   // Good
   await expect(page.locator('h1')).toBeVisible();

   // Avoid
   const isVisible = await page.locator('h1').isVisible();
   if (!isVisible) throw new Error('Not visible');
   ```

4. **Clean up side effects** in test cleanup:
   ```typescript
   test.afterEach(async ({ page }) => {
     // Clear storage, cookies, etc.
   });
   ```

5. **Keep tests independent** - don't rely on state from previous tests

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-test)
- [Debugging Guide](https://playwright.dev/docs/debug)
