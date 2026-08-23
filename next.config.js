/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: { unoptimized: true },
  experimental: {
    // Both DB drivers are Node-only; keep them out of the client bundle.
    serverComponentsExternalPackages: ['better-sqlite3', 'pg'],
  },
};
