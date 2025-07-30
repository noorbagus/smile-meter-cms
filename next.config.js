/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['ipyffbjefbpucniwmabvz.supabase.co'], // Replace with your Supabase storage domain
    },
    experimental: {
      serverActions: true,
    },
  }
  
  module.exports = nextConfig