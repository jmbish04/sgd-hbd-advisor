import { test, expect } from "./fixtures";

test.describe("Health Dashboard", () => {
	test("should display health dashboard", async ({ page, templateUrl }) => {
		await page.goto(`${templateUrl}/health`);

		// Wait for the page to load
		await page.waitForLoadState("networkidle");

		// The health page should be visible
		await expect(page.locator("body")).toBeVisible();
	});

	test("should call health API endpoint", async ({ page, templateUrl }) => {
		// Make a direct API call to the health endpoint
		const response = await page.request.get(`${templateUrl}/api/health`);

		expect(response.ok()).toBeTruthy();

		const data = await response.json();

		// Verify response structure
		expect(data).toHaveProperty("status");
		expect(data.status).toBe("ok");
	});

	test("should display system information", async ({ page, templateUrl }) => {
		await page.goto(`${templateUrl}/health`);

		// Wait for the page to load
		await page.waitForLoadState("networkidle");

		// Check that some content is rendered
		const body = page.locator("body");
		await expect(body).toBeVisible();

		// The page should have loaded successfully
		const content = await body.textContent();
		expect(content).toBeTruthy();
		expect(content!.length).toBeGreaterThan(0);
	});
});
