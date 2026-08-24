/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: { unoptimized: true },

  // Keep Node database drivers external to Next's server compiler. OpenNext
  // bundles the pure-JS pg driver for Cloudflare during its final Worker build.
  serverExternalPackages: ['better-sqlite3', 'pg'],
};
