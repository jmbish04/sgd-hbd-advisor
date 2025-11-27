# Testing Instructions - Quick Reference

This is a quick reference guide for testing the Gold Standard Worker Template. For comprehensive guidelines, see [tests/AGENTS.md](../tests/AGENTS.md).

## 📋 Quick Checklist

When adding or modifying a page:

- [ ] Create/update test file: `tests/[page-name].spec.ts`
- [ ] Add `data-testid` attributes to interactive elements
- [ ] Test navigation to the page
- [ ] Test API endpoints (if applicable)
- [ ] Test user interactions
- [ ] Test error states
- [ ] Update `tests/navigation.spec.ts`
- [ ] Run `npm test` before committing

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/todos.spec.ts

# Interactive UI mode (recommended for development)
npm run test:ui

# Watch mode with browser visible
npm run test:headed

# Debug mode with Playwright Inspector
npm run test:debug

# View test report
npm run test:report
```

## 📝 Basic Test Template

```typescript
import { test, expect } from "./fixtures";

test.describe("Page Name", () => {
  test("should load page", async ({ page, templateUrl }) => {
    await page.goto(`${templateUrl}/page-route`);
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/page-route");
  });

  test("should interact with UI", async ({ page, templateUrl }) => {
    await page.goto(`${templateUrl}/page-route`);

    // Fill form
    await page.fill('[data-testid="input"]', "value");

    // Click button
    await page.click('[data-testid="submit"]');

    // Verify result
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });

  test("should call API", async ({ page, templateUrl }) => {
    const response = await page.request.get(`${templateUrl}/api/endpoint`);
    expect(response.ok()).toBeTruthy();
  });
});
```

## 🎯 Adding data-testid to Components

```tsx
// In your React component
<div data-testid="main-content">
  <input
    data-testid="email-input"
    type="email"
    placeholder="Email"
  />
  <Button data-testid="submit-button">
    Submit
  </Button>
  <div data-testid="result-message">
    {message}
  </div>
</div>
```

## 🔍 Common Selectors

```typescript
// By data-testid (preferred)
page.locator('[data-testid="element-id"]')

// By role (accessible)
page.getByRole('button', { name: 'Submit' })

// By text
page.locator('text=Hello World')

// By placeholder
page.getByPlaceholder('Enter email')

// By label
page.getByLabel('Email address')
```

## ⏱️ Waiting for Elements

```typescript
// Wait for page load
await page.waitForLoadState("networkidle");

// Wait for element
await page.waitForSelector('[data-testid="element"]');

// Wait for API response
await page.waitForResponse(response =>
  response.url().includes("/api/endpoint") && response.status() === 200
);

// Wait for element to be visible
await expect(page.locator('[data-testid="element"]')).toBeVisible();
```

## 🧪 Testing API Endpoints

```typescript
test("should call API endpoint", async ({ page, templateUrl }) => {
  // GET request
  const getResponse = await page.request.get(`${templateUrl}/api/todos`);
  expect(getResponse.ok()).toBeTruthy();
  const data = await getResponse.json();
  expect(Array.isArray(data)).toBe(true);

  // POST request
  const postResponse = await page.request.post(`${templateUrl}/api/todos`, {
    data: {
      text: "New todo",
      completed: false
    }
  });
  expect(postResponse.ok()).toBeTruthy();

  // PUT request
  const putResponse = await page.request.put(`${templateUrl}/api/todos/1`, {
    data: {
      text: "Updated todo",
      completed: true
    }
  });
  expect(putResponse.ok()).toBeTruthy();

  // DELETE request
  const deleteResponse = await page.request.delete(`${templateUrl}/api/todos/1`);
  expect(deleteResponse.ok()).toBeTruthy();
});
```

## 🎭 Mocking API Responses

```typescript
test("should handle API error", async ({ page, templateUrl }) => {
  // Mock API to return error
  await page.route(`${templateUrl}/api/todos`, route =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal server error' })
    })
  );

  await page.goto(`${templateUrl}/todos`);

  // Verify error is displayed
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
});
```

## 📸 Debugging Tips

```typescript
// Take screenshot
await page.screenshot({ path: 'debug.png' });

// Pause execution (use with test:debug)
await page.pause();

// Log page content
console.log(await page.content());

// Log console messages
page.on('console', msg => console.log('PAGE LOG:', msg.text()));

// Log network requests
page.on('request', request => console.log('REQUEST:', request.url()));
page.on('response', response => console.log('RESPONSE:', response.url(), response.status()));
```

## ❌ Common Pitfalls

### ❌ Don't do this:

```typescript
// Hardcoded URLs
await page.goto('http://localhost:5173/todos');

// Brittle text selectors
await page.click('button:has-text("Submit")');

// No waiting
await page.goto(templateUrl);
expect(await page.locator('h1').textContent()).toBe('Welcome'); // May fail

// Hardcoded timeouts
await page.waitForTimeout(5000);
```

### ✅ Do this instead:

```typescript
// Use templateUrl fixture
await page.goto(`${templateUrl}/todos`);

// Use data-testid
await page.click('[data-testid="submit-button"]');

// Proper waiting
await page.goto(templateUrl);
await page.waitForLoadState("networkidle");
await expect(page.locator('h1')).toHaveText('Welcome');

// Condition-based waiting
await page.waitForSelector('[data-testid="loaded"]');
```

## 📚 File Organization

```
tests/
├── AGENTS.md                  # Detailed agent guidelines
├── README.md                  # Setup and documentation
├── fixtures.ts                # Custom test fixtures
├── utils/
│   └── template-server.ts     # Server management
├── basic.spec.ts              # Basic tests
├── navigation.spec.ts         # Navigation tests
├── health.spec.ts             # Health tests
├── api.spec.ts                # API tests
└── [your-page].spec.ts        # Your page tests
```

## 🔗 Resources

- **Detailed Guidelines**: [tests/AGENTS.md](../tests/AGENTS.md)
- **Test Setup**: [tests/README.md](../tests/README.md)
- **Playwright Docs**: https://playwright.dev
- **Best Practices**: https://playwright.dev/docs/best-practices

## 🆘 Getting Help

If tests are failing:

1. Run in UI mode: `npm run test:ui`
2. Check the test output for specific errors
3. Use Playwright Inspector: `npm run test:debug`
4. Take screenshots: `await page.screenshot({ path: 'debug.png' })`
5. Check server logs in console
6. Verify `npm run dev` works manually

## 📊 Test Coverage Goals

Aim for these coverage areas:

- ✅ **Navigation**: All routes are accessible
- ✅ **API**: All endpoints respond correctly
- ✅ **Interactions**: Forms, buttons, inputs work
- ✅ **Data**: API data is fetched and displayed
- ✅ **Errors**: Error states are handled gracefully
- ✅ **Loading**: Loading states are shown appropriately

---

**Remember**: Tests are not optional. They are part of the definition of "done" for any feature.
