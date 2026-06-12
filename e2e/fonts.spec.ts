import { test, expect } from '@playwright/test'

test('no third-party font requests', async ({ page }) => {
  const blocked: string[] = []
  page.on('request', (req) => {
    const url = req.url()
    if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
      blocked.push(url)
    }
  })
  await page.goto('/')
  expect(blocked).toHaveLength(0)
})
