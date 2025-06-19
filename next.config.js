/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["mongodb", "amqplib", "redis"],
  },
  output: "standalone",
  images: {
    domains: ["localhost"],
    unoptimized: true,
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    REDIS_URL: process.env.REDIS_URL,
    RABBITMQ_URL: process.env.RABBITMQ_URL,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
