/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Derleme sırasında ESLint hatalarını görmezden gel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Derleme sırasında TypeScript hatalarını görmezden gel
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Derleme sırasında API rotalarını statik olarak oluşturma
    outputStandalone: true,
    // Derleme sırasında API rotalarını atla
    esmExternals: "loose",
  },
}

module.exports = nextConfig
