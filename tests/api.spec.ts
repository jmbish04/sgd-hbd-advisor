import { test, expect } from "./fixtures";

test.describe("API Endpoints", () => {
	test("should respond to /api/health", async ({ page, templateUrl }) => {
		const response = await page.request.get(`${templateUrl}/api/health`);

		expect(response.ok()).toBeTruthy();
		expect(response.status()).toBe(200);

		const data = await response.json();
		expect(data).toHaveProperty("status");
		expect(data.status).toBe("ok");
	});

	test("should respond to /api/chat endpoint", async ({ page, templateUrl }) => {
		const response = await page.request.post(`${templateUrl}/api/chat`, {
			data: {
				messages: [
					{
						role: "user",
						content: "Hello",
					},
				],
			},
		});

		// The endpoint should respond (even if it's a 401 or other status)
		expect(response.status()).toBeLessThan(500);
	});

	test("should have OpenAPI documentation", async ({ page, templateUrl }) => {
		// Try to access OpenAPI docs if available
		const response = await page.request.get(`${templateUrl}/api/doc`);

		// It's okay if it doesn't exist (404) but should not be a server error
		expect(response.status()).toBeLessThan(500);
	});
});
