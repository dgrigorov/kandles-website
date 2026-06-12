import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.STOREFRONT_URL || 'http://localhost:4321',
  },
  projects: [
    {
      name: 'chromium',
    },
  ],
})
