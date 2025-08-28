/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Image optimization for Supabase storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qjcfuvpbslazeewqcxte.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    domains: ['qjcfuvpbslazeewqcxte.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // API security headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? process.env.ALLOWED_ORIGINS || '*'
              : '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
        ]
      }
    ];
  },
  
  // Route redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false,
      }
    ];
  },
  
  // Webpack optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Split chunks for better caching
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        supabase: {
          test: /[\\/]node_modules[\\/]@supabase[\\/]/,
          name: 'supabase',
          priority: 10,
          chunks: 'all'
        }
      }
    };
    
    return config;
  },
  
  // Production optimizations
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // Build output
  output: 'standalone',
};

// Validate Supabase environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.warn(`Warning: Missing environment variable ${envVar}`);
  }
});

module.exports = nextConfig;