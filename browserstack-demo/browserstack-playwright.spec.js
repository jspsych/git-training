import { test, expect, chromium } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import handler from 'serve-handler';
import BrowserStackLocal from 'browserstack-local';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');

let server;
let bsLocal;

// Helper to start a local HTTP server
function startHttpServer(port, rootDir) {
    return new Promise((resolve, reject) => {
        server = http.createServer((req, res) => {
            handler(req, res, {
                public: rootDir,
                cleanUrls: false,
            });
        });

        server.listen(port, 'localhost', () => {
            console.log(`Server running on http://localhost:${port}`);
            resolve();
        });

        server.on('error', reject);
    });
}

// Helper to stop the HTTP server
function stopHttpServer() {
    return new Promise((resolve, reject) => {
        if (server) {
            server.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        } else {
            resolve();
        }
    });
}

// Helper to start BrowserStack Local
function startBrowserStackLocal(username, accessKey, localIdentifier) {
    return new Promise((resolve, reject) => {
        bsLocal = new BrowserStackLocal.Local();
        const bsLocalArgs = {
            key: accessKey,
            localIdentifier: localIdentifier,
            forceLocal: true,
        };

        bsLocal.start(bsLocalArgs, (err) => {
            if (err) {
                reject(new Error(`Failed to start BrowserStack Local: ${err}`));
            } else {
                console.log('BrowserStack Local started');
                resolve();
            }
        });
    });
}

// Helper to stop BrowserStack Local
function stopBrowserStackLocal() {
    return new Promise((resolve) => {
        if (bsLocal && bsLocal.isRunning()) {
            bsLocal.stop(() => {
                console.log('BrowserStack Local stopped');
                resolve();
            });
        } else {
            resolve();
        }
    });
}

test.describe('BrowserStack Playwright Demo', () => {
    const username = process.env.BROWSERSTACK_USERNAME;
    const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
    const localIdentifier = `local-${Date.now()}`;
    const localPort = 8080;
    const exampleDir = path.join(repoRoot, 'packages', 'plugin-button-click-counter');

    test.beforeAll(async () => {
        if (!username || !accessKey) {
            throw new Error('BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables are required');
        }

        // Start local HTTP server
        await startHttpServer(localPort, exampleDir);

        // Start BrowserStack Local
        await startBrowserStackLocal(username, accessKey, localIdentifier);
    });

    test.afterAll(async () => {
        // Stop BrowserStack Local
        await stopBrowserStackLocal();

        // Stop HTTP server
        await stopHttpServer();
    });

    test('should load example page and interact with button', async () => {
        const clientPlaywrightVersion = execSync('npx playwright --version')
            .toString()
            .trim()
            .split(' ')[1];

        const capabilities = {
            browser: 'playwright-chromium',
            os: 'osx',
            os_version: 'sonoma',
            name: 'Plugin Button Click Counter Example',
            build: 'Training Repo Test',
            project: 'BrowserStack Playwright Demo',
            'browserstack.username': username,
            'browserstack.accessKey': accessKey,
            'browserstack.local': 'true',
            'browserstack.localIdentifier': localIdentifier,
            'client.playwrightVersion': clientPlaywrightVersion,
        };

        const wsEndpoint = `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(
            JSON.stringify(capabilities)
        )}`;

        console.log('BrowserStack capabilities:', {
            browser: capabilities.browser,
            os: capabilities.os,
            os_version: capabilities.os_version,
            name: capabilities.name,
            build: capabilities.build,
            project: capabilities.project,
            local: capabilities['browserstack.local'],
            localIdentifier: capabilities['browserstack.localIdentifier'],
            clientPlaywrightVersion: capabilities['client.playwrightVersion'],
            hasUsername: Boolean(capabilities['browserstack.username']),
            hasAccessKey: Boolean(capabilities['browserstack.accessKey']),
        });

        const browser = await chromium.connect({
            wsEndpoint,
        });

        const context = await browser.newContext();
        const page = await context.newPage();

        try {
            await page.goto(`http://localhost:${localPort}/examples/index.html`, {
                waitUntil: 'networkidle',
                timeout: 30000,
            });

            const body = page.locator('body');
            await expect(body).toBeVisible();

            // Wait for the click-counter button to appear
            const button = page.locator('button').first();
            await expect(button).toBeVisible({ timeout: 10000 });
            await expect(button).toBeEnabled();

            // Read the initial counter from the page text
            const initialBodyText = (await body.textContent())?.trim() ?? '';
            const initialMatch = initialBodyText.match(/Button clicks:\s*(\d+)/);

            if (!initialMatch) {
                throw new Error(`Could not find initial button click count in page text: "${initialBodyText}"`);
            }

            let previousCount = Number(initialMatch[1]);
            console.log(`Initial button click count: ${previousCount}`);

            // Click multiple times and verify the counter increments
            const clickAttempts = 3;

            for (let i = 1; i <= clickAttempts; i += 1) {
                await button.click();

                await expect
                    .poll(async () => {
                        const currentBodyText = (await body.textContent())?.trim() ?? '';
                        const currentMatch = currentBodyText.match(/Button clicks:\s*(\d+)/);
                        return currentMatch ? Number(currentMatch[1]) : null;
                    }, {
                        timeout: 5000,
                        message: `Expected counter to update after click ${i}`,
                    })
                    .toBe(previousCount + 1);

                previousCount += 1;
                console.log(`Counter after click ${i}: ${previousCount}`);

                await expect(button).toBeVisible();
                await expect(button).toBeEnabled();
            }

            // Final safety check: page did not crash and button remains usable
            await expect(body).toBeVisible();
            await expect(button).toBeVisible();
            await expect(button).toBeEnabled();

            console.log('Test passed: click-counter button appeared, incremented after repeated clicks, and remained usable');
        } finally {
            await context.close();
            await browser.close();
        }
    });
});
