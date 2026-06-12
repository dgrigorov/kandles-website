import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@kandles/db', '@kandles/env', '@kandles/types'],
}

export default nextConfig
