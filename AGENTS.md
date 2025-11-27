# 🤖 AGENTS.md - AI Agent Governance

Welcome, AI agent. You are modifying the "Gold Standard Worker" template. Your goal is to maintain and extend this project while adhering to its strict architectural rules.

## 1. Core Architecture: SPA + API

This project is a **hybrid application**, not a monolith.
* **Frontend (SPA):** The `/src` directory. This is a Vite-built React app. All UI code (React components, pages, CSS) goes here.
* **Backend (API):** The `/worker` directory. This is a Hono API running on Cloudflare Workers. All backend logic (API endpoints, database queries, AI calls, DOs) goes here.

**Your primary rule: NEVER mix frontend and backend code.**
* Do not `import` from `/worker` into `/src`.
* Do not `import` from `/src` into `/worker`.
* The frontend (client) communicates with the backend (worker) *only* via `fetch` calls to its API (e.g., `/api/chat`).

## 2. Rules for Modifying the Backend (`/worker`)

1.  **Maintain Modularity:** All new API features must be encapsulated within a new directory in `/worker/modules/`.
    * **Bad:** Adding `app.get('/api/todos', ...)` directly to `worker/index.ts`.
    * **Good:** Creating `/worker/modules/todos/index.ts`, defining the route there, and mounting it in `worker/index.ts` (`app.route('/api/todos', todoApi)`).
2.  **Update Schemas:** After adding or modifying an API endpoint, you *must* update its Zod schema (`createRoute`) and ensure it has a unique `operationId`. This is required for the OpenAPI spec.
3.  **Update Health Checks:** If a new module adds a critical dependency (e.g., a new D1 database, a new AI provider), you *must* add a new check function to `/worker/modules/health/service.ts` and call it from `runAllHealthChecks`.
4.  **ORM Only (Drizzle + Kysely):** Never bypass the ORM.
    * **FORBIDDEN:** `env.DB.prepare(...)`, `env.DB.exec(...)`, raw SQL strings.
    * **REQUIRED:** Use the hybrid client from `initDb(env.DB)`.
    * Use `db.select()...` (Drizzle) for simple queries.
    * Use `kysely.selectFrom(...` (Kysely) for complex, dynamic queries.
    * All schema changes *must* be in `worker/db/schema.ts` and require a new migration (`bun run db:gen`).
5.  **Shadcn Fidelity:** All UI *must* look and feel exactly like Shadcn. Use the components from `/src/components/ui` for all elements. Do not use plain `<button>` or `<input>`. Ensure all fonts, themes, and Tailwind configs match the Shadcn defaults.

## 3. How to Add a New Page (Example: "Todos")

1.  **API First (Backend):**
    * Create `worker/db/schema.ts`: Add the `todos` table.
    * Run `bun run db:gen` to create the migration.
    * Create `worker/modules/todos/service.ts`: Write the Drizzle/Kysely logic to `getTodos()`, `createTodo()`, etc.
    * Create `worker/modules/todos/index.ts`: Define a new `Hono` app. Create Zod schemas and `.openapi` routes (e.g., `GET /api/todos`, `POST /api/todos`) that call your service.
    * Update `worker/index.ts`: Import `todoApi` and mount it: `app.route('/api/todos', todoApi)`.
2.  **UI Second (Frontend):**
    * Create `src/pages/todos.tsx`: Build the new React component.
    * Fetch data from the API: `fetch('/api/todos')`.
    * Use Shadcn components: `<Card>`, `<Input>`, `<Button>`, etc.
    * Update `src/App.tsx`:
        * Add `'todos'` to the `Page` type.
        * Add a new `<Button>` to the sidebar in `MainLayout`.
        * Add a `case 'todos': return <Todos />` to the `renderPage` switch.
3.  **Test:** Run `bun run dev` to verify HMR and API proxying work.
4.  **Add Tests (Required):** After creating a new page, you *must* add Playwright tests.
    * Create `tests/[page-name].spec.ts` with tests for navigation, API calls, and user interactions.
    * Add `data-testid` attributes to key UI elements for reliable testing.
    * Update `tests/navigation.spec.ts` to include the new route.
    * See **[tests/AGENTS.md](tests/AGENTS.md)** for detailed testing guidelines.

## 4. Testing Requirements

**CRITICAL:** Every new page or modified page *must* have corresponding Playwright tests.

### When You Add or Modify a Page:

1. **Create/Update Test File:** `tests/[page-name].spec.ts`
2. **Add data-testid Attributes:** Add to all interactive elements and key UI components
3. **Test Coverage Must Include:**
   * Page navigation and routing
   * API endpoint calls (success and error states)
   * User interactions (clicks, form submissions)
   * Data display and loading states
4. **Update Navigation Tests:** Add the new route to `tests/navigation.spec.ts`
5. **Run Tests Before Committing:** `npm test` must pass

### Testing Resources:

* **Detailed Guidelines:** [tests/AGENTS.md](tests/AGENTS.md) - Complete testing patterns and examples
* **Test Templates:** [tests/README.md](tests/README.md) - Setup and running tests
* **Documentation:** [docs/testing-instructions.md](docs/testing-instructions.md) - Quick reference

**Rule:** Do not consider a page "complete" until its tests are written and passing.
