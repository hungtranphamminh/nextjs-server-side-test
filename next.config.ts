import type { NextConfig } from "next";
import { withCryptoGuardManifest } from "@cmdoss/cryptoguard-manifest-nextjs";

/**
 * CryptoGuard Manifest Generation - Next.js Configuration
 *
 * This config demonstrates environment variable support for dynamic manifest generation.
 *
 * Usage examples:
 * - Default build: npm run build
 * - Custom base path: NEXT_PUBLIC_BASE_PATH="/docs" npm run build
 * - Custom dist dir: CUSTOM_DIST_DIR="build" npm run build
 * - Verbose mode: MANIFEST_VERBOSE=true npm run build
 * - Disable manifest: MANIFEST_DISABLED=true npm run build
 * - Combined: NEXT_PUBLIC_BASE_PATH="/app" CUSTOM_DIST_DIR="dist" MANIFEST_VERBOSE=true npm run build
 */

const nextConfig: NextConfig = {
  // Environment-driven configuration (supports runtime values)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  distDir: process.env.CUSTOM_DIST_DIR || undefined,

  // SSR mode (default) - supports API routes and dynamic rendering
  // For static export, set NEXT_OUTPUT_MODE=export (removes API routes support)
  ...(process.env.NEXT_OUTPUT_MODE === "export" && { output: "export" }),

  // Other Next.js configuration
  reactStrictMode: true,
};

// CryptoGuard manifest options (can also use environment variables)
const manifestOptions = {
  verbose: process.env.MANIFEST_VERBOSE === "true",
  disabled: process.env.MANIFEST_DISABLED === "true",
};

export default withCryptoGuardManifest(nextConfig, manifestOptions);
