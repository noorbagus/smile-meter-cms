/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : 'qjcfuvpbslazeewqcxte.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Fallback domains
    domains: ['qjcfuvpbslazeewqcxte.supabase.co'],
  },
  experimental: {
    // serverActions: true, // Removed as it's default now
  },
}

module.exports = nextConfig