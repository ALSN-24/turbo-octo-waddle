/**
 * next.config.mjs — Next.js configuration
 *
 * serverExternalPackages:
 *   Tells Next.js NOT to bundle mysql2 and bcryptjs into the server bundle.
 *   Both packages use native Node.js bindings and cannot be bundled for the
 *   edge runtime or processed by the webpack/esbuild bundler. Without this
 *   setting, the build fails with a cryptic "Cannot find module" error at
 *   runtime. jose is intentionally excluded here — it is pure ESM and works
 *   in both the edge runtime (middleware.ts) and Node.js runtime (API routes).
 *
 * images.unoptimized:
 *   Disables Next.js Image Optimization. This project does not use <Image>
 *   components — all icons are SVG or lucide-react. Setting this to true
 *   avoids the need for a Sharp installation in the deployment environment.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['mysql2', 'bcryptjs', 'pino'],
}

export default nextConfig
