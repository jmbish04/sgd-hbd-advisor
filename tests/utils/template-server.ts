import { spawn, ChildProcess } from "child_process";
import { join } from "path";
import fetch from "node-fetch";

/**
 * Helper function to kill process tree cross-platform
 */
async function killProcessTree(pid: number): Promise<void> {
	if (process.platform === "win32") {
		// Windows
		spawn("taskkill", ["/pid", pid.toString(), "/T", "/F"], {
			stdio: "ignore",
		});
	} else {
		// Unix-like (macOS, Linux)
		try {
			process.kill(-pid, "SIGTERM");
			await new Promise((resolve) => setTimeout(resolve, 2000));
			process.kill(-pid, "SIGKILL");
		} catch (error) {
			// Process might already be dead
		}
	}
}

export interface Template {
	name: string;
	path: string;
	port: number;
	devCommand: string;
	framework: "vite" | "next" | "astro" | "remix" | "wrangler" | "react-router";
}

/**
 * Manages dev servers for templates during Playwright tests
 */
export class TemplateServerManager {
	private servers: Map<string, ChildProcess> = new Map();
	private templates: Template[] = [];
	private useLiveUrls: boolean = false;

	constructor() {
		// Check if we should use live URLs from environment variable
		this.useLiveUrls = process.env.PLAYWRIGHT_USE_LIVE === "true";
		this.discoverTemplates();
	}

	/**
	 * Discovers templates in the current directory or parent directories
	 */
	private discoverTemplates(): void {
		const fs = require("fs");
		const templatesRoot = process.cwd();

		// Check if current directory is a template
		const packageJsonPath = join(templatesRoot, "package.json");

		if (fs.existsSync(packageJsonPath)) {
			try {
				const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

				// For live tests, only include templates with cloudflare.publish === true
				if (this.useLiveUrls) {
					const cloudflareConfig = packageJson.cloudflare;
					if (!cloudflareConfig || cloudflareConfig.publish !== true) {
						console.warn(
							"Live URL mode enabled but template not configured for publishing",
						);
						return;
					}
				}

				const template = this.analyzeTemplate(
					packageJson.name || "default-template",
					templatesRoot,
					packageJson,
				);
				if (template) {
					this.templates.push(template);
					console.log(`Discovered template: ${template.name} (${template.framework})`);
				}
			} catch (error) {
				console.warn(`Failed to parse package.json:`, error);
			}
		}

		// Also try to discover multiple templates in subdirectories
		try {
			const entries = fs.readdirSync(templatesRoot, { withFileTypes: true });
			const templateDirs = entries
				.filter(
					(entry: any) =>
						entry.isDirectory() && entry.name.endsWith("-template"),
				)
				.map((entry: any) => entry.name);

			for (const templateDir of templateDirs) {
				const templatePath = join(templatesRoot, templateDir);
				const pkgPath = join(templatePath, "package.json");

				if (fs.existsSync(pkgPath)) {
					try {
						const packageJson = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

						if (this.useLiveUrls) {
							const cloudflareConfig = packageJson.cloudflare;
							if (!cloudflareConfig || cloudflareConfig.publish !== true) {
								continue;
							}
						}

						const template = this.analyzeTemplate(
							templateDir,
							templatePath,
							packageJson,
						);
						if (template) {
							this.templates.push(template);
							console.log(`Discovered template: ${template.name} (${template.framework})`);
						}
					} catch (error) {
						console.warn(
							`Failed to parse package.json for ${templateDir}:`,
							error,
						);
					}
				}
			}
		} catch (error) {
			// Not a directory with subdirectories, that's fine
		}
	}

	/**
	 * Analyzes a template to determine its framework and configuration
	 */
	private analyzeTemplate(
		name: string,
		path: string,
		packageJson: any,
	): Template | null {
		const scripts = packageJson.scripts || {};
		const dependencies = {
			...packageJson.dependencies,
			...packageJson.devDependencies,
		};

		if (!scripts.dev) {
			console.warn(`Template ${name} has no dev script, skipping`);
			return null;
		}

		// Determine framework and default port
		let framework: Template["framework"] = "wrangler";
		let port = 8787; // Default wrangler port

		if (dependencies["vite"] || scripts.dev.includes("vite")) {
			framework = "vite";
			port = 5173;
		} else if (dependencies["next"] || scripts.dev.includes("next")) {
			framework = "next";
			port = 3000;
		} else if (dependencies["astro"] || scripts.dev.includes("astro")) {
			framework = "astro";
			port = 4321;
		} else if (
			dependencies["@remix-run/dev"] ||
			scripts.dev.includes("remix")
		) {
			framework = "remix";
			port = 5173;
		} else if (
			dependencies["@react-router/dev"] ||
			scripts.dev.includes("react-router")
		) {
			framework = "react-router";
			port = 5173;
		}

		return {
			name,
			path,
			port,
			devCommand: scripts.dev,
			framework,
		};
	}

	/**
	 * Starts a dev server for the specified template
	 */
	async startServer(templateName: string): Promise<string> {
		const template = this.templates.find((t) => t.name === templateName);
		if (!template) {
			// If no template name matches, try to start the first/only template
			if (this.templates.length === 1) {
				return this.startServer(this.templates[0].name);
			}
			throw new Error(
				`Template ${templateName} not found. Available: ${this.templates.map((t) => t.name).join(", ")}`,
			);
		}

		// If using live URLs, return the live URL directly
		if (this.useLiveUrls) {
			const liveUrl = this.getLiveUrl(templateName);
			console.log(`Using live URL for ${templateName}: ${liveUrl}`);
			return liveUrl;
		}

		if (this.servers.has(templateName)) {
			console.log(`Server for ${templateName} already running`);
			return `http://localhost:${template.port}`;
		}

		console.log(
			`Starting server for ${template.name} on port ${template.port}...`,
		);

		const server = spawn("npm", ["run", "dev"], {
			cwd: template.path,
			stdio: "pipe",
			shell: true,
			detached: true, // Create a new process group
		});

		this.servers.set(templateName, server);

		// Log server output for debugging
		server.stdout?.on("data", (data) => {
			console.log(`[${template.name}] ${data.toString().trim()}`);
		});

		server.stderr?.on("data", (data) => {
			console.error(`[${template.name}] ${data.toString().trim()}`);
		});

		// Wait for server to be ready
		const baseUrl = `http://localhost:${template.port}`;
		await this.waitForServer(baseUrl, 30000); // 30 second timeout

		console.log(`Server for ${template.name} ready at ${baseUrl}`);
		return baseUrl;
	}

	/**
	 * Gets the live/production URL for a template
	 */
	private getLiveUrl(templateName: string): string {
		const fs = require("fs");
		const template = this.templates.find((t) => t.name === templateName);
		if (!template) {
			throw new Error(`Template ${templateName} not found`);
		}

		try {
			const wranglerPath = join(template.path, "wrangler.json");
			const wranglerJsoncPath = join(template.path, "wrangler.jsonc");
			const wranglerTomlPath = join(template.path, "wrangler.toml");

			let wranglerName: string | undefined;

			// Try JSON config first
			if (fs.existsSync(wranglerPath)) {
				const wranglerConfig = JSON.parse(fs.readFileSync(wranglerPath, "utf8"));
				wranglerName = wranglerConfig.name;
			} else if (fs.existsSync(wranglerJsoncPath)) {
				// Simple JSONC parser - remove comments and parse
				const content = fs.readFileSync(wranglerJsoncPath, "utf8");
				const jsonContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
				const wranglerConfig = JSON.parse(jsonContent);
				wranglerName = wranglerConfig.name;
			} else if (fs.existsSync(wranglerTomlPath)) {
				// Simple TOML parser for name field
				const content = fs.readFileSync(wranglerTomlPath, "utf8");
				const nameMatch = content.match(/^name\s*=\s*["']([^"']+)["']/m);
				if (nameMatch) {
					wranglerName = nameMatch[1];
				}
			}

			if (!wranglerName) {
				throw new Error(`No name found in wrangler config for ${templateName}`);
			}

			return `https://${wranglerName}.workers.dev`;
		} catch (error) {
			console.warn(
				`Could not determine live URL for ${templateName}, falling back to template name`,
			);
			return `https://${templateName}.workers.dev`;
		}
	}

	/**
	 * Stops the dev server for the specified template
	 */
	async stopServer(templateName: string): Promise<void> {
		// If using live URLs, no need to stop anything
		if (this.useLiveUrls) {
			return;
		}

		const server = this.servers.get(templateName);
		if (server && server.pid) {
			console.log(
				`Stopping server for ${templateName} (PID: ${server.pid})...`,
			);

			// Kill the entire process tree
			await killProcessTree(server.pid);

			this.servers.delete(templateName);

			// Give it a moment to fully clean up
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	/**
	 * Stops all running dev servers
	 */
	async stopAllServers(): Promise<void> {
		const promises = Array.from(this.servers.keys()).map((name) =>
			this.stopServer(name),
		);
		await Promise.all(promises);
	}

	/**
	 * Waits for a server to become responsive
	 */
	private async waitForServer(url: string, timeout: number): Promise<void> {
		const start = Date.now();

		while (Date.now() - start < timeout) {
			try {
				const response = await fetch(url);
				if (response.status < 500) {
					return; // Server is responding
				}
			} catch (error) {
				// Server not ready yet
			}

			await new Promise((resolve) => setTimeout(resolve, 500));
		}

		throw new Error(
			`Server at ${url} did not become ready within ${timeout}ms`,
		);
	}

	/**
	 * Gets all discovered templates
	 */
	getTemplates(): Template[] {
		return [...this.templates];
	}

	/**
	 * Gets a specific template by name
	 */
	getTemplate(name: string): Template | undefined {
		return this.templates.find((t) => t.name === name);
	}
}

// Global instance
export const templateServerManager = new TemplateServerManager();
