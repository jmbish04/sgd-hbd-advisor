# 🧪 Testing Agent Guidelines

This document provides instructions for AI agents on maintaining and extending the Playwright test suite when frontend pages or API endpoints are added or modified.

## Core Testing Principles

1. **Every new page MUST have corresponding tests**
2. **Every modified page MUST have its tests reviewed and updated**
3. **Test coverage should include: navigation, API calls, user interactions, and error states**
4. **Tests should be independent and not rely on other tests**

---

## When to Add/Update Tests

### ✅ Add Tests When:

- A new page is added to `src/pages/`
- A new API endpoint is created in `worker/modules/`
- A new user interaction flow is implemented
- A new form or input is added

### ✅ Update Tests When:

- Page routes change
- UI elements are renamed or restructured
- API endpoints change (URL, request/response format)
- Page navigation patterns change

---

## How to Add Tests for a New Page

### Step 1: Identify the Page Type

Determine what kind of page you're testing:
- **Static page**: Landing, about, documentation
- **Interactive page**: Dashboard with forms, buttons
- **Data-driven page**: Lists, tables from API
- **Form page**: Login, signup, settings

### Step 2: Create Test File

Create a test file named after the page or feature:

```bash
tests/[page-name].spec.ts
```

**Naming Convention:**
- `tests/todos.spec.ts` for `src/pages/todos.tsx`
- `tests/profile.spec.ts` for `src/pages/profile.tsx`
- `tests/settings.spec.ts` for `src/pages/settings.tsx`

### Step 3: Write Tests Using Fixtures

Use the custom fixtures provided by the test framework:

```typescript
import { test, expect } from "./fixtures";

test.describe("Todos Page", () => {
  test("should load todos page", async ({ page, templateUrl }) => {
    await page.goto(`${templateUrl}/todos`);

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Verify we're on the correct page
    expect(page.url()).toContain("/todos");
  });

  test("should display todos from API", async ({ page, templateUrl }) => {
    await page.goto(`${templateUrl}/todos`);

    // Wait for API call to complete
    await page.waitForResponse(response =>
      response.url().includes("/api/todos") && response.status() === 200
    );

    // Verify todos are displayed
    await expect(page.locator('[data-testid="todo-list"]')).toBeVisible();
  });

  test("should create a new todo", async ({ page, templateUrl }) => {
    await page.goto(`${templateUrl}/todos`);

    // Fill in the form
    await page.fill('[data-testid="todo-input"]', "New todo item");
    await page.click('[data-testid="add-todo-button"]');

    // Verify the todo was added
    await expect(page.locator('text=New todo item')).toBeVisible();
  });
});
```

### Step 4: Add data-testid Attributes

When creating UI components, add `data-testid` attributes for reliable testing:

```tsx
// ✅ Good - in src/pages/todos.tsx
<input
  data-testid="todo-input"
  type="text"
  placeholder="What needs to be done?"
/>

<Button data-testid="add-todo-button" onClick={handleAdd}>
  Add Todo
</Button>

<ul data-testid="todo-list">
  {todos.map(todo => (
    <li key={todo.id} data-testid={`todo-${todo.id}`}>
      {todo.text}
    </li>
  ))}
</ul>
```

### Step 5: Test the API Endpoint

If your page uses an API endpoint, test it directly:

```typescript
test("should respond to /api/todos", async ({ page, templateUrl }) => {
  const response = await page.request.get(`${templateUrl}/api/todos`);

  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);

  const data = await response.json();
  expect(Array.isArray(data)).toBe(true);
});

test("should create todo via API", async ({ page, templateUrl }) => {
  const response = await page.request.post(`${templateUrl}/api/todos`, {
    data: {
      text: "Test todo",
      completed: false
    }
  });

  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data).toHaveProperty("id");
});
```

---

## Test Structure Template

Here's a complete template for a new page test:

```typescript
import { test, expect } from "./fixtures";

test.describe("Page Name", () => {
  // Setup - runs before each test
  test.beforeEach(async ({ page, templateUrl }) => {
    await page.goto(`${templateUrl}/page-route`);
    await page.waitForLoadState("networkidle");
  });

  // Test 1: Basic page load
  test("should load and display page", async ({ page }) => {
    expect(page.url()).toContain("/page-route");
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
  });

  // Test 2: Navigation
  test("should navigate from another page", async ({ page, templateUrl }) => {
    await page.goto(templateUrl);
    await page.click('[data-testid="nav-link-page"]');
    expect(page.url()).toContain("/page-route");
  });

  // Test 3: API interaction
  test("should fetch data from API", async ({ page, templateUrl }) => {
    const response = await page.request.get(`${templateUrl}/api/endpoint`);
    expect(response.ok()).toBeTruthy();
  });

  // Test 4: User interaction
  test("should handle user input", async ({ page }) => {
    await page.fill('[data-testid="input-field"]', "test value");
    await page.click('[data-testid="submit-button"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
  });

  // Test 5: Error handling
  test("should display error on API failure", async ({ page, templateUrl }) => {
    // Mock API failure
    await page.route(`${templateUrl}/api/endpoint`, route =>
      route.fulfill({ status: 500 })
    );

    await page.reload();
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});
```

---

## Updating Existing Tests

### When Routes Change

If a page route changes from `/todos` to `/tasks`:

```typescript
// ❌ Before
await page.goto(`${templateUrl}/todos`);

// ✅ After
await page.goto(`${templateUrl}/tasks`);
```

Update ALL occurrences in:
- Navigation tests (`tests/navigation.spec.ts`)
- Page-specific tests (`tests/todos.spec.ts` → rename to `tests/tasks.spec.ts`)

### When UI Elements Change

If a button text or selector changes:

```typescript
// ❌ Before
await page.click('button:has-text("Add Todo")');

// ✅ After - use data-testid
await page.click('[data-testid="add-todo-button"]');
```

### When API Endpoints Change

Update both:
1. Direct API tests
2. Tests that wait for API responses

```typescript
// ❌ Before
await page.waitForResponse(response =>
  response.url().includes("/api/todos")
);

// ✅ After
await page.waitForResponse(response =>
  response.url().includes("/api/v2/tasks")
);
```

---

## Navigation Test Updates

When adding a new page, **always update** `tests/navigation.spec.ts`:

```typescript
test("should navigate to [new page]", async ({ page, templateUrl }) => {
  await page.goto(`${templateUrl}/new-page`);
  await page.waitForLoadState("networkidle");
  expect(page.url()).toContain("/new-page");
});
```

---

## Best Practices

### ✅ DO:

- Use `data-testid` attributes for reliable selectors
- Wait for `networkidle` before making assertions
- Test both success and error states
- Keep tests independent (no shared state)
- Use meaningful test descriptions
- Test API endpoints directly
- Mock API failures for error testing

### ❌ DON'T:

- Use brittle selectors (text content, CSS classes)
- Make assumptions about timing (use waitFor methods)
- Rely on execution order between tests
- Test implementation details
- Hardcode URLs (use `templateUrl` fixture)
- Skip testing error states

---

## Running Tests

### During Development

```bash
# Run tests for specific file
npm test tests/todos.spec.ts

# Run in UI mode (recommended for debugging)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed
```

### Before Committing

```bash
# Run all tests
npm test

# Check for failures
npm run test:report
```

---

## Troubleshooting

### Test Fails After Page Change

1. Check if selectors still match elements
2. Verify routes haven't changed
3. Ensure API endpoints are correct
4. Check if timing has changed (add waits)

### Test is Flaky

1. Add proper wait conditions
2. Use `page.waitForLoadState("networkidle")`
3. Use `page.waitForResponse()` for API calls
4. Avoid hardcoded timeouts

### Can't Find Element

1. Add `data-testid` to the element
2. Use Playwright Inspector: `npm run test:debug`
3. Take screenshot: `await page.screenshot({ path: "debug.png" })`

---

## Checklist for Adding a New Page

- [ ] Create `tests/[page-name].spec.ts`
- [ ] Add basic page load test
- [ ] Add navigation test
- [ ] Add API interaction tests (if applicable)
- [ ] Add user interaction tests
- [ ] Add error handling tests
- [ ] Update `tests/navigation.spec.ts`
- [ ] Add `data-testid` attributes to key elements
- [ ] Test API endpoint directly (if applicable)
- [ ] Run all tests to ensure nothing broke
- [ ] Update test documentation if needed

---

## Examples by Page Type

### Static Page (Landing)

```typescript
test.describe("Landing Page", () => {
  test("should display hero section", async ({ page, templateUrl }) => {
    await page.goto(templateUrl);
    await expect(page.locator('[data-testid="hero"]')).toBeVisible();
  });

  test("should have working CTA button", async ({ page, templateUrl }) => {
    await page.goto(templateUrl);
    await page.click('[data-testid="cta-button"]');
    expect(page.url()).toContain("/signup");
  });
});
```

### Form Page (Login)

```typescript
test.describe("Login Page", () => {
  test("should submit login form", async ({ page, templateUrl }) => {
    await page.goto(`${templateUrl}/login`);

    await page.fill('[data-testid="email-input"]', "user@example.com");
    await page.fill('[data-testid="password-input"]', "password123");
    await page.click('[data-testid="login-button"]');

    await page.waitForResponse(response =>
      response.url().includes("/api/auth/login")
    );

    expect(page.url()).toContain("/dashboard");
  });

  test("should show validation errors", async ({ page, templateUrl }) => {
    await page.goto(`${templateUrl}/login`);

    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
  });
});
```

### Data Page (Dashboard)

```typescript
test.describe("Dashboard Page", () => {
  test("should load and display data", async ({ page, templateUrl }) => {
    await page.goto(`${templateUrl}/dashboard`);

    await page.waitForResponse(response =>
      response.url().includes("/api/dashboard") && response.status() === 200
    );

    await expect(page.locator('[data-testid="stats-grid"]')).toBeVisible();
  });

  test("should refresh data on button click", async ({ page, templateUrl }) => {
    await page.goto(`${templateUrl}/dashboard`);

    const responsePromise = page.waitForResponse(
      response => response.url().includes("/api/dashboard")
    );

    await page.click('[data-testid="refresh-button"]');
    await responsePromise;

    await expect(page.locator('[data-testid="last-updated"]')).toBeVisible();
  });
});
```

---

**Remember:** Tests are documentation. They show how your app should behave. Keep them clear, focused, and maintainable.
