import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  transpilePackages: ['@kandles/db', '@kandles/env', '@kandles/types'],
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT_ADMIN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: '/api/sentry-tunnel',
  sourcemaps: {
    filesToDeleteAfterUpload: ['.next/static/**/*.map'],
  },
  disableLogger: true,
  automaticVercelMonitors: false,
})
