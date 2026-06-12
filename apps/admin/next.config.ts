import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: [
    '@kandles/db',
    '@kandles/env',
    '@kandles/types',
    '@kandles/ui',
    '@kandles/email',
  ],
}

export default nextConfig
