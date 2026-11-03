import { defineConfig, devices } from '@playwright/test';

// Tests laufen immer zur Mittagszeit (Ortszeit des Testbrowsers), sonst lösen „Früher Vogel“ (vor 7 Uhr)
// bzw. „Nachteule“ (nach 22 Uhr) ein Belohnungsfenster aus, das Klicks abfängt.
const versatz = (((12 - new Date().getUTCHours()) % 24) + 24) % 24;
const stunden = versatz > 12 ? versatz - 24 : versatz;
const timezoneId =
  stunden === 0 ? 'Etc/UTC' : `Etc/GMT${stunden > 0 ? '-' : '+'}${Math.abs(stunden)}`;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/rw-lernapp/',
    timezoneId,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // Eigener Test-Build (dist-test) mit lokalem Abgleich-Dienst – der veröffentlichte Build in dist bleibt unberührt.
  webServer: [
    {
      command: 'npm --prefix sync-worker run dev',
      url: 'http://127.0.0.1:8787/',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { WRANGLER_SEND_METRICS: 'false' },
    },
    {
      command:
        'npx vite build --outDir dist-test && npx vite preview --outDir dist-test --port 4173 --strictPort',
      url: 'http://localhost:4173/rw-lernapp/',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: { VITE_SYNC_URL: 'http://127.0.0.1:8787' },
    },
  ],
  projects: [
    { name: 'handy', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    {
      name: 'laptop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 860 } },
    },
  ],
});
