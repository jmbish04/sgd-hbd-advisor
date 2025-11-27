import { test, expect } from "./fixtures";

test.describe("Navigation", () => {
	test.beforeEach(async ({ page, templateUrl }) => {
		await page.goto(templateUrl);
	});

	test("should navigate to health page", async ({ page, templateUrl }) => {
		// Navigate to health page
		await page.goto(`${templateUrl}/health`);

		// Wait for content to load
		await page.waitForLoadState("networkidle");

		// Verify we're on the health page
		expect(page.url()).toContain("/health");
	});

	test("should navigate to dashboard page", async ({ page, templateUrl }) => {
		// Navigate to dashboard page
		await page.goto(`${templateUrl}/dashboard`);

		// Wait for content to load
		await page.waitForLoadState("networkidle");

		// Verify we're on the dashboard page
		expect(page.url()).toContain("/dashboard");
	});

	test("should navigate to chat page", async ({ page, templateUrl }) => {
		// Navigate to chat page
		await page.goto(`${templateUrl}/chat`);

		// Wait for content to load
		await page.waitForLoadState("networkidle");

		// Verify we're on the chat page
		expect(page.url()).toContain("/chat");
	});

	test("should navigate to login page", async ({ page, templateUrl }) => {
		// Navigate to login page
		await page.goto(`${templateUrl}/login`);

		// Wait for content to load
		await page.waitForLoadState("networkidle");

		// Verify we're on the login page
		expect(page.url()).toContain("/login");
	});

	test("should navigate to signup page", async ({ page, templateUrl }) => {
		// Navigate to signup page
		await page.goto(`${templateUrl}/signup`);

		// Wait for content to load
		await page.waitForLoadState("networkidle");

		// Verify we're on the signup page
		expect(page.url()).toContain("/signup");
	});
});
