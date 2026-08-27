import { defineConfig, devices } from '@playwright/test';

// Overridable so parallel checkouts (worktrees, second sessions) can run
// e2e without colliding with a dev server already on 3000 — with
// reuseExistingServer, colliding means silently testing the wrong code.
const port = Number(process.env.PORT ?? 3000);

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: `http://localhost:${port}`,
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'pnpm dev',
        url: `http://localhost:${port}`,
        reuseExistingServer: !process.env.CI,
    },
});
