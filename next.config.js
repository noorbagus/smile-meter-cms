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
    domains: ['ipyffbjefbpucniwmabvz.supabase.co'],
  },
  experimental: {
    // serverActions: true, // Removed as it's default now
  },
}

module.exports = nextConfig