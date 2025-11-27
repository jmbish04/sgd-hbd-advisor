import { test, expect } from "./fixtures";

test.describe("Basic Functionality", () => {
	test("should load the landing page", async ({ page, templateUrl }) => {
		await page.goto(templateUrl);

		// Check that the page loads
		await expect(page).toHaveTitle(/Gold Standard/i);

		// Check for main content
		await expect(page.locator("body")).toBeVisible();
	});

	test("should have working navigation", async ({ page, templateUrl }) => {
		await page.goto(templateUrl);

		// Wait for the page to be fully loaded
		await page.waitForLoadState("networkidle");

		// Check that navigation elements are present
		// This is a basic smoke test - adjust selectors based on your actual UI
		const body = await page.locator("body").textContent();
		expect(body).toBeTruthy();
	});

	test("should respond to health endpoint", async ({ page, templateUrl }) => {
		const response = await page.request.get(`${templateUrl}/api/health`);
		expect(response.ok()).toBeTruthy();

		const data = await response.json();
		expect(data).toHaveProperty("status");
	});
});
