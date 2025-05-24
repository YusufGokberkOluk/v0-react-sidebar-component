/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // MongoDB binary dosyalarını webpack'ten hariç tut
      config.externals.push({
        "@napi-rs/snappy-linux-x64-gnu": "commonjs @napi-rs/snappy-linux-x64-gnu",
        "@napi-rs/snappy-linux-x64-musl": "commonjs @napi-rs/snappy-linux-x64-musl",
        "@napi-rs/snappy-darwin-x64": "commonjs @napi-rs/snappy-darwin-x64",
        "@napi-rs/snappy-win32-x64-msvc": "commonjs @napi-rs/snappy-win32-x64-msvc",
        snappy: "commonjs snappy",
        "mongodb-client-encryption": "commonjs mongodb-client-encryption",
        aws4: "commonjs aws4",
        kerberos: "commonjs kerberos",
        "@mongodb-js/zstd": "commonjs @mongodb-js/zstd",
        "bson-ext": "commonjs bson-ext",
      })
    }
    return config
  },
}

module.exports = nextConfig
