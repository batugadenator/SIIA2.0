import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  testMatch: "siagg-profile-integrated.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command:
        'powershell -NoProfile -ExecutionPolicy Bypass -Command "Set-Location ../siia-backend; $env:DB_USER=\"siia\"; $env:DB_PASSWORD=\"highlighter\"; $env:PGUSER=\"siia\"; $env:PGPASSWORD=\"highlighter\"; python manage.py runserver 127.0.0.1:8000"',
      url: "http://127.0.0.1:8000/api/usuarios/health/",
      reuseExistingServer: true,
      timeout: 180000,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 4173",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: true,
      timeout: 180000,
    },
  ],
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],
});
