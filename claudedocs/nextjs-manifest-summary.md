# Next.js Build Manifest Summary

**Project:** Next.js 15.5.4 with Turbopack
**Generated:** 2025-10-13
**Build Type:** Server-Side Rendering (SSR) / Static Generation (SSG)

---

## Build Output Structure

```
.next/                        (30MB total)
├── static/                   (11MB) ← CLIENT-SIDE (browser downloads)
│   ├── chunks/              (36 JS files)
│   └── media/               (optimized images)
├── server/                   (18MB) ← SERVER-ONLY (never sent to browser)
│   ├── app/                 (SSR page handlers)
│   └── pages-manifest.json
└── [manifest files]          (configuration & routing)

public/                       (20KB) ← STATIC ASSETS (served at root)
├── file.svg
├── globe.svg
├── next.svg
├── vercel.svg
└── window.svg
```

---

## Manifest Files Reference

### Core Manifests (Root Level)

| File | Purpose | When Used |
|------|---------|-----------|
| `build-manifest.json` | Maps pages to their JS chunks | Browser requests specific page |
| `required-server-files.json` | Server deployment config | Deployment platforms (Vercel, Docker) |
| `routes-manifest.json` | Routing rules (redirects, rewrites) | Request routing at server level |
| `app-build-manifest.json` | App Router page-to-chunk mapping | Client-side navigation |
| `prerender-manifest.json` | Static generation metadata | ISR/SSG caching strategies |
| `images-manifest.json` | Image optimization config | `next/image` component processing |
| `export-marker.json` | Static export indicator | Static HTML export builds |
| `package.json` | Build metadata marker | Identifies Next.js build output |
| `BUILD_ID` | Unique build identifier | Cache busting, deployment tracking |

### Server-Side Manifests

Located in `.next/server/`:

| File | Purpose |
|------|---------|
| `pages-manifest.json` | Server-side page module paths |
| `app-paths-manifest.json` | App Router path mappings |
| `server-reference-manifest.json` | Server Component references |
| `middleware-manifest.json` | Middleware configuration |
| `functions-config-manifest.json` | Serverless function settings |
| `next-font-manifest.json` | Font optimization metadata |

---

## URL Mapping & Serving Strategy

### How Files Are Served

```
Browser Request              →  Actual File Location
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET /                        →  SSR from .next/server/app/page.js
GET /_next/static/chunks/*.js →  .next/static/chunks/*.js
GET /file.svg                →  public/file.svg
GET /api/hello               →  .next/server/app/api/hello/route.js
```

### Path Prefix Rules

| Source | URL Prefix | Browser Accessible? |
|--------|------------|---------------------|
| `.next/static/` | `/_next/static/` | ✅ Yes (code-split chunks) |
| `public/` | `/` | ✅ Yes (direct access) |
| `.next/server/` | N/A | ❌ No (server-only) |

---

## Page Load Breakdown

### Main Page (`/`) - What Browser Downloads

From `app-build-manifest.json`, the `/page` route loads:

**Framework Chunks (Shared):**
- `turbopack-_2e1838c7._.js` - Build system runtime
- `f7813_next_dist_compiled_react-dom_8262c337._.js` - React DOM (75.3 KB)
- `f7813_next_dist_client_7d63aa88._.js` - Next.js client runtime
- `_a0ff3932._.js` - React core
- `69652_@swc_helpers_cjs_77b72907._.js` - Babel helpers

**Page-Specific Chunks:**
- `src_app_page_tsx_b4090435._.js` - Your page component code
- `src_app_layout_tsx_3c6291f6._.js` - Layout wrapper
- `[root-of-the-server]__0f0ba101._.css` - Global styles

**Development Tools (dev mode only):**
- `[turbopack]_browser_dev_hmr-client_hmr-client_ts_be2445a1._.js` - Hot reload
- `f7813_next_dist_compiled_next-devtools_index_a13d571c.js` - DevTools

**Total:** ~120 KB (production) | ~11 MB available (only downloads what's needed)

---

## Configuration Deep Dive

From `required-server-files.json`:

### Key Settings

```json
{
  "distDir": ".next",
  "assetPrefix": "",
  "basePath": "",
  "trailingSlash": false,
  "compress": true,
  "poweredByHeader": true
}
```

**Deployment Implications:**
- `distDir: .next` - Build output location (standard)
- `assetPrefix: ""` - No CDN prefix (can configure for CloudFront/CDN)
- `basePath: ""` - Served at root (not a subdirectory)
- `compress: true` - Server-side gzip enabled

### Image Optimization

```json
{
  "path": "/_next/image",
  "deviceSizes": [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  "formats": ["image/webp"],
  "minimumCacheTTL": 60
}
```

Images served through `/_next/image` API are automatically optimized for device size.

---

## Artifact Creation for Deployment

### What to Include in Build Artifact

**Required Files:**
```bash
tar -czf nextjs-artifact.tar.gz \
  .next/                      # All build output (30MB)
  public/                     # Static assets (20KB)
  package.json                # Dependencies list
  pnpm-lock.yaml             # Lockfile
  next.config.js             # Configuration
```

**Optional (for standalone builds):**
```bash
  node_modules/              # If not using layer/cache
  .env.production           # Production environment variables
```

### Vercel Deployment

Vercel's `--prebuilt` flag expects:
```
.next/
├── required-server-files.json  ← Vercel reads this
├── static/                     ← Served via CDN
└── server/                     ← Deployed to serverless functions
```

**Key:** `required-server-files.json` tells Vercel:
- Which files are needed
- Runtime configuration
- Routing rules
- Serverless function configuration

---

## Routing Configuration

From `routes-manifest.json`:

```json
{
  "redirects": [
    {
      "source": "/:path+/",
      "destination": "/:path+",
      "permanent": true
    }
  ],
  "rewrites": {
    "beforeFiles": [],
    "afterFiles": [],
    "fallback": []
  }
}
```

**Default Behavior:**
- Trailing slashes removed (SEO-friendly)
- No custom rewrites configured
- No custom redirects (beyond trailing slash)

---

## Build Size Analysis

| Component | Size | Files | Purpose |
|-----------|------|-------|---------|
| Client chunks | 11MB | 36 | Code-split JS bundles |
| Server code | 18MB | N/A | SSR handlers, API routes |
| Static assets | 20KB | 5 SVGs | Public files |
| **Total build** | **30MB** | - | Development build with source maps |

**Production Optimization:**
```
Development: 30MB (.next folder)
Production:  ~5-8MB (.next folder, minified, no source maps)
User downloads: ~120KB (per page, gzipped)
```

---

## Sigstore Signing Recommendations

### Option 1: Sign Complete Artifact (Recommended)

```bash
# Create deployment package
tar -czf deployment.tar.gz .next/ public/ package.json pnpm-lock.yaml

# Sign with Sigstore
cosign sign-blob --bundle deployment.bundle deployment.tar.gz
```

**Verifies:** Entire build output integrity

### Option 2: Sign Critical Components

```bash
# Sign client-side code only
tar -czf client.tar.gz .next/static/ public/
cosign sign-blob --bundle client.bundle client.tar.gz

# Sign server-side code separately
tar -czf server.tar.gz .next/server/
cosign sign-blob --bundle server.bundle server.tar.gz
```

**Verifies:** Client and server code independently

### Option 3: Sign Manifests Only

```bash
# Sign key configuration files
cosign sign-blob --bundle manifest.bundle .next/required-server-files.json
cosign sign-blob --bundle package.bundle package.json
```

**Verifies:** Deployment configuration integrity (lightweight)

---

## Key Insights

### 1. Split Architecture
- **Client** (`.next/static/`): Code-split JS chunks served at `/_next/static/`
- **Server** (`.next/server/`): SSR handlers, never sent to browser
- **Public** (`public/`): Static assets served at root `/`

### 2. Manifest-Driven
Next.js uses manifests for everything:
- `build-manifest.json` - What chunks to load
- `routes-manifest.json` - How to route requests
- `required-server-files.json` - How to deploy

### 3. Code Splitting Efficiency
- 36 chunk files available
- Browser downloads ~5-8 chunks per page
- Shared framework code cached across pages

### 4. Deployment Flexibility
The `required-server-files.json` makes Next.js portable:
- Works on Vercel, Docker, Node.js server
- Contains all config needed for runtime
- No dependency on source code at runtime

---

## Customization Options

### Asset Prefix (CDN Integration)

In `next.config.js`:
```javascript
module.exports = {
  assetPrefix: 'https://cdn.example.com',
}
```

**Result:** Static assets served from `https://cdn.example.com/_next/static/...`

### Base Path (Subdirectory Deployment)

```javascript
module.exports = {
  basePath: '/docs',
}
```

**Result:** App served at `/docs` instead of `/`

### Custom Routing

```javascript
module.exports = {
  async redirects() {
    return [
      { source: '/old', destination: '/new', permanent: true }
    ]
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'https://api.example.com/:path*' }
    ]
  }
}
```

**Result:** Rules written to `routes-manifest.json`

---

## Verification Commands

```bash
# Check manifest files
ls -lh .next/*.json

# Inspect page chunk mapping
cat .next/app-build-manifest.json | jq '.pages."/page"'

# View deployment config
cat .next/required-server-files.json | jq '.config | {distDir, assetPrefix, basePath}'

# Analyze build size
du -sh .next/static/ .next/server/ public/

# List all chunks
ls -lh .next/static/chunks/*.js

# Check routes configuration
cat .next/routes-manifest.json | jq '.redirects, .rewrites'
```

---

## Summary

Next.js build output is **manifest-driven and split architecture**:

✅ **Manifests control everything** - routing, chunks, deployment
✅ **Three-tier structure** - client (11MB), server (18MB), public (20KB)
✅ **Efficient delivery** - Code splitting means users download ~120KB, not 30MB
✅ **Deployment portable** - `required-server-files.json` contains all runtime config
✅ **Sigstore-ready** - Sign entire artifact or individual components as needed

**Key File for Deployment:** `.next/required-server-files.json` - This is your deployment blueprint.
